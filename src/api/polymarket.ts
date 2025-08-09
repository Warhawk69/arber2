// Polymarket API integration
import { 
  PolymarketMarket, 
  PolymarketBookResponse, 
  CommonMarket, 
  Condition, 
  ApiResponse, 
  ApiError, 
  ApiConfig 
} from './types';

const DEFAULT_CONFIG: ApiConfig = {
  kalshiBaseUrl: 'https://trading-api.kalshi.com/trade-api/v2',
  polymarketBaseUrl: 'https://clob.polymarket.com',
  gammaMarketsUrl: 'https://gamma-api.polymarket.com',
  clobApiUrl: 'https://clob.polymarket.com',
  pollIntervalMs: {
    kalshi: 5000, // 5 seconds
    polymarket: 2500, // 2.5 seconds
  }
};

export class PolymarketApi {
  private config: ApiConfig;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private async request<T>(baseUrl: string, endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: {
            message: `Polymarket API error: ${response.status} ${response.statusText}`,
            code: response.status.toString(),
            details: errorText,
          }
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: {
          message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
        }
      };
    }
  }

  async getMarkets(): Promise<ApiResponse<PolymarketMarket[]>> {
    // Use Gamma API for market data
    const params = new URLSearchParams({
      closed: 'false',
      active: 'true',
      limit: '100',
    });
    
    return this.request<PolymarketMarket[]>(
      this.config.gammaMarketsUrl, 
      `/markets?${params}`
    );
  }

  async getMarket(marketId: string): Promise<ApiResponse<PolymarketMarket>> {
    return this.request<PolymarketMarket>(
      this.config.gammaMarketsUrl, 
      `/markets/${marketId}`
    );
  }

  async getOrderbook(tokenId: string): Promise<ApiResponse<PolymarketBookResponse>> {
    const params = new URLSearchParams({
      token_id: tokenId,
    });
    
    return this.request<PolymarketBookResponse>(
      this.config.clobApiUrl, 
      `/book?${params}`
    );
  }

  async getPrice(tokenId: string): Promise<ApiResponse<{ price: string }>> {
    const params = new URLSearchParams({
      token_id: tokenId,
    });
    
    return this.request<{ price: string }>(
      this.config.clobApiUrl, 
      `/price?${params}`
    );
  }

  normalizeMarket(market: PolymarketMarket, orderbooks?: Map<string, PolymarketBookResponse>): CommonMarket {
    const conditions: Condition[] = [];

    if (market.tokens && market.tokens.length > 0) {
      // Multi-outcome market
      for (const token of market.tokens) {
        const orderbook = orderbooks?.get(token.token_id);
        let yesPrice = parseFloat(token.price || '0.5');
        let yesAsk: number | undefined;
        let yesBid: number | undefined;
        let noAsk: number | undefined;
        let noBid: number | undefined;

        if (orderbook) {
          const prices = this.getBestPrices(orderbook);
          yesAsk = prices.yesAsk;
          yesBid = prices.yesBid;
          yesPrice = yesAsk || yesPrice;
        }

        // For Polymarket, NO price is typically 1 - YES price for binary outcomes
        const noPrice = 1 - yesPrice;

        conditions.push({
          id: token.token_id,
          name: token.outcome,
          yesPrice,
          yesAsk,
          yesBid,
          noPrice,
          noAsk,
          noBid,
          volume: market.volume ? parseFloat(market.volume) : undefined,
          liquidity: market.liquidity ? parseFloat(market.liquidity) : undefined,
        });
      }
    } else if (market.clobTokenIds && market.clobTokenIds.length >= 2) {
      // Binary market with clobTokenIds
      for (let i = 0; i < market.clobTokenIds.length; i++) {
        const tokenId = market.clobTokenIds[i];
        const orderbook = orderbooks?.get(tokenId);
        
        let yesPrice = 0.5;
        let yesAsk: number | undefined;
        let yesBid: number | undefined;

        if (orderbook) {
          const prices = this.getBestPrices(orderbook);
          yesAsk = prices.yesAsk;
          yesBid = prices.yesBid;
          yesPrice = yesAsk || yesPrice;
        }

        const outcomeName = i === 0 ? 'Yes' : 'No';
        const noPrice = 1 - yesPrice;

        conditions.push({
          id: tokenId,
          name: outcomeName,
          yesPrice,
          yesAsk,
          yesBid,
          noPrice,
          volume: market.volume ? parseFloat(market.volume) : undefined,
          liquidity: market.liquidity ? parseFloat(market.liquidity) : undefined,
        });
      }
    } else {
      // Default binary market
      conditions.push({
        id: `${market.id}-yes`,
        name: 'Yes',
        yesPrice: 0.5,
        noPrice: 0.5,
        volume: market.volume ? parseFloat(market.volume) : undefined,
        liquidity: market.liquidity ? parseFloat(market.liquidity) : undefined,
      });
    }

    return {
      id: market.id,
      platform: 'polymarket',
      title: market.question,
      subtitle: market.description,
      category: market.category || 'Unknown',
      closeTime: new Date(market.end_date_iso),
      volume: market.volume ? parseFloat(market.volume) : undefined,
      liquidity: market.liquidity ? parseFloat(market.liquidity) : undefined,
      status: market.closed ? 'closed' : 'open',
      conditions,
    };
  }

  async getMarketsWithOrderbooks(): Promise<ApiResponse<CommonMarket[]>> {
    try {
      // First get all markets
      const marketsResponse = await this.getMarkets();
      if (marketsResponse.error) {
        return marketsResponse;
      }

      const markets = marketsResponse.data || [];
      const normalizedMarkets: CommonMarket[] = [];
      const errors: ApiError[] = [];

      // Process each market
      for (let i = 0; i < markets.length; i++) {
        const market = markets[i];
        
        try {
          const orderbookMap = new Map<string, PolymarketBookResponse>();
          
          // Get orderbooks for all tokens in this market
          if (market.tokens) {
            for (const token of market.tokens) {
              try {
                const orderbookResponse = await this.getOrderbook(token.token_id);
                if (orderbookResponse.data) {
                  orderbookMap.set(token.token_id, orderbookResponse.data);
                }
              } catch (error) {
                console.warn(`Failed to get orderbook for token ${token.token_id}:`, error);
              }
            }
          } else if (market.clobTokenIds) {
            for (const tokenId of market.clobTokenIds) {
              try {
                const orderbookResponse = await this.getOrderbook(tokenId);
                if (orderbookResponse.data) {
                  orderbookMap.set(tokenId, orderbookResponse.data);
                }
              } catch (error) {
                console.warn(`Failed to get orderbook for token ${tokenId}:`, error);
              }
            }
          }

          normalizedMarkets.push(this.normalizeMarket(market, orderbookMap));
        } catch (error) {
          console.warn(`Error processing market ${market.id}:`, error);
          normalizedMarkets.push(this.normalizeMarket(market));
          errors.push({
            message: `Failed to process market ${market.id}`,
            details: error,
          });
        }

        // Small delay to avoid rate limiting
        if (i < markets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }

      return { 
        data: normalizedMarkets,
        error: errors.length > 0 ? errors[0] : undefined,
      };
    } catch (error) {
      return {
        error: {
          message: `Failed to fetch Polymarket markets: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
        }
      };
    }
  }

  // Get best ask (lowest price to buy) and bid (highest price to sell)
  getBestPrices(orderbook: PolymarketBookResponse): {
    yesAsk: number | null;
    yesBid: number | null;
    noAsk: number | null;
    noBid: number | null;
  } {
    // In Polymarket orderbook:
    // - asks = people selling (you can buy from them)
    // - bids = people buying (you can sell to them)
    
    const yesAsk = orderbook.asks?.[0]?.price ? parseFloat(orderbook.asks[0].price) : null;
    const yesBid = orderbook.bids?.[0]?.price ? parseFloat(orderbook.bids[0].price) : null;
    
    // For NO prices, we calculate as 1 - opposite side
    const noAsk = yesBid ? 1 - yesBid : null;
    const noBid = yesAsk ? 1 - yesAsk : null;

    return { yesAsk, yesBid, noAsk, noBid };
  }

  // For multi-outcome markets, calculate NO price by summing other outcomes
  calculateNoPrice(yesPrice: number, allOutcomePrices: number[]): number {
    // For multi-outcome markets, NO = 1 - YES is not always accurate
    // Better to use the sum of all other outcomes
    const otherOutcomesSum = allOutcomePrices
      .filter(price => price !== yesPrice)
      .reduce((sum, price) => sum + price, 0);
    
    return Math.min(1, otherOutcomesSum);
  }

  // Check if this is a binary YES/NO market (suitable for arbitrage)
  isBinaryMarket(market: PolymarketMarket): boolean {
    if (market.tokens) {
      return market.tokens.length === 2;
    }
    if (market.clobTokenIds) {
      return market.clobTokenIds.length === 2;
    }
    return false;
  }

  // Filter markets suitable for arbitrage (binary YES/NO markets)
  async getBinaryMarkets(): Promise<ApiResponse<CommonMarket[]>> {
    const marketsResponse = await this.getMarketsWithOrderbooks();
    
    if (marketsResponse.error) {
      return marketsResponse;
    }

    const binaryMarkets = (marketsResponse.data || []).filter(market => {
      return market.conditions.length <= 2; // Only binary or simple markets
    });

    return { data: binaryMarkets };
  }
}

export const polymarketApi = new PolymarketApi();