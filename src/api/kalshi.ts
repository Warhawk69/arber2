// Kalshi API integration
import { 
  KalshiMarket, 
  KalshiOrderbook, 
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

export class KalshiApi {
  private config: ApiConfig;
  private apiKey?: string;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.apiKey = config.kalshiApiKey || process.env.KALSHI_API_KEY;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options.headers as Record<string, string>) || {}),
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(`${this.config.kalshiBaseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          error: {
            message: `Kalshi API error: ${response.status} ${response.statusText}`,
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

  async getMarkets(status: string = 'open'): Promise<ApiResponse<KalshiMarket[]>> {
    const params = new URLSearchParams({ status });
    return this.request<{ markets: KalshiMarket[] }>(`/markets?${params}`)
      .then(response => {
        if (response.data) {
          return { data: response.data.markets };
        }
        return response;
      });
  }

  async getOrderbook(ticker: string): Promise<ApiResponse<KalshiOrderbook>> {
    return this.request<KalshiOrderbook>(`/markets/${ticker}/orderbook`);
  }

  async getMarket(ticker: string): Promise<ApiResponse<KalshiMarket>> {
    return this.request<{ market: KalshiMarket }>(`/markets/${ticker}`)
      .then(response => {
        if (response.data) {
          return { data: response.data.market };
        }
        return response;
      });
  }

  normalizeMarket(market: KalshiMarket, orderbook?: KalshiOrderbook): CommonMarket {
    // Extract conditions from Kalshi market
    // For Kalshi, each market typically has YES/NO conditions
    const conditions: Condition[] = [];

    if (orderbook) {
      // If we have orderbook data, use it for pricing
      const yesAsk = orderbook.yes?.[0]?.price; // Best ask (lowest price to buy)
      const yesBid = orderbook.yes?.[orderbook.yes.length - 1]?.price; // Best bid
      const noAsk = orderbook.no?.[0]?.price;
      const noBid = orderbook.no?.[orderbook.no.length - 1]?.price;

      conditions.push({
        id: `${market.ticker}-yes`,
        name: 'Yes',
        yesPrice: yesAsk || 0.5,
        yesAsk,
        yesBid,
        noPrice: noAsk || 0.5,
        noAsk,
        noBid,
        volume: market.volume,
        liquidity: market.liquidity,
      });
    } else {
      // Default pricing when no orderbook available
      conditions.push({
        id: `${market.ticker}-yes`,
        name: 'Yes',
        yesPrice: 0.5,
        noPrice: 0.5,
        volume: market.volume,
        liquidity: market.liquidity,
      });
    }

    return {
      id: market.ticker,
      platform: 'kalshi',
      title: market.title,
      subtitle: market.subtitle,
      category: market.category,
      closeTime: new Date(market.close_time),
      volume: market.volume,
      liquidity: market.liquidity,
      status: market.status === 'open' ? 'open' : 'closed',
      settlementSource: market.settlement_source,
      rules: market.rules,
      conditions,
    };
  }

  async getMarketsWithOrderbooks(): Promise<ApiResponse<CommonMarket[]>> {
    try {
      // First get all markets
      const marketsResponse = await this.getMarkets('open');
      if (marketsResponse.error) {
        return marketsResponse;
      }

      const markets = marketsResponse.data || [];
      const normalizedMarkets: CommonMarket[] = [];
      const errors: ApiError[] = [];

      // Get orderbook for each market (with some rate limiting)
      for (let i = 0; i < markets.length; i++) {
        const market = markets[i];
        
        try {
          const orderbookResponse = await this.getOrderbook(market.ticker);
          
          if (orderbookResponse.error) {
            // If orderbook fails, still include market with default pricing
            console.warn(`Failed to get orderbook for ${market.ticker}:`, orderbookResponse.error);
            normalizedMarkets.push(this.normalizeMarket(market));
            errors.push(orderbookResponse.error);
          } else {
            normalizedMarkets.push(this.normalizeMarket(market, orderbookResponse.data));
          }
        } catch (error) {
          console.warn(`Error processing market ${market.ticker}:`, error);
          normalizedMarkets.push(this.normalizeMarket(market));
          errors.push({
            message: `Failed to process market ${market.ticker}`,
            details: error,
          });
        }

        // Small delay to avoid rate limiting
        if (i < markets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return { 
        data: normalizedMarkets,
        error: errors.length > 0 ? errors[0] : undefined, // Return first error as primary
      };
    } catch (error) {
      return {
        error: {
          message: `Failed to fetch Kalshi markets: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
        }
      };
    }
  }

  // Calculate NO price from YES price for Kalshi (since they're complementary)
  calculateNoPrice(yesPrice: number): number {
    return 1 - yesPrice;
  }

  // Get best ask (lowest price to buy) and bid (highest price to sell)
  getBestPrices(orderbook: KalshiOrderbook): {
    yesAsk: number | null;
    yesBid: number | null;
    noAsk: number | null;
    noBid: number | null;
  } {
    const yesAsk = orderbook.yes?.[0]?.price || null;
    const yesBid = orderbook.yes?.[orderbook.yes.length - 1]?.price || null;
    const noAsk = orderbook.no?.[0]?.price || null;
    const noBid = orderbook.no?.[orderbook.no.length - 1]?.price || null;

    return { yesAsk, yesBid, noAsk, noBid };
  }
}

export const kalshiApi = new KalshiApi();