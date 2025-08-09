// Polymarket API integration layer
import {
  PolymarketMarket,
  PolymarketOrderbook,
  CommonMarket,
  MarketCondition,
  ApiResponse,
  EnvironmentConfig
} from './types';

// Environment configuration (imported from kalshi.ts pattern)
const config: EnvironmentConfig = {
  KALSHI_API_KEY: process.env.KALSHI_API_KEY,
  KALSHI_BASE_URL: process.env.KALSHI_BASE_URL || 'https://trading-api.kalshi.com',
  POLYMARKET_GAMMA_URL: process.env.POLYMARKET_GAMMA_URL || 'https://gamma-api.polymarket.com',
  POLYMARKET_CLOB_URL: process.env.POLYMARKET_CLOB_URL || 'https://clob.polymarket.com',
  POLYMARKET_PRICE_URL: process.env.POLYMARKET_PRICE_URL || 'https://strapi-matic.poly.market',
};

/**
 * Fetch active markets from Polymarket Gamma API
 */
export async function fetchPolymarketMarkets(): Promise<ApiResponse<PolymarketMarket[]>> {
  try {
    // Fetch from Gamma API - get active markets
    const url = `${config.POLYMARKET_GAMMA_URL}/markets?active=true&limit=100`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket Gamma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const markets = data.data || data.markets || data;

    return {
      success: true,
      data: Array.isArray(markets) ? markets : [],
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

/**
 * Fetch orderbook/price data for specific Polymarket token
 */
export async function fetchPolymarketOrderbook(tokenId: string): Promise<ApiResponse<PolymarketOrderbook>> {
  try {
    // Try CLOB API first
    const clobUrl = `${config.POLYMARKET_CLOB_URL}/book?token_id=${tokenId}`;
    
    const response = await fetch(clobUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        data: {
          market: tokenId,
          asset_id: tokenId,
          bids: data.bids || [],
          asks: data.asks || [],
        },
        timestamp: new Date(),
      };
    }

    // Fallback to price API if CLOB fails
    const priceUrl = `${config.POLYMARKET_PRICE_URL}/markets/${tokenId}/price`;
    const priceResponse = await fetch(priceUrl);
    
    if (priceResponse.ok) {
      const priceData = await priceResponse.json();
      // Convert price data to orderbook format
      return {
        success: true,
        data: {
          market: tokenId,
          asset_id: tokenId,
          bids: [{ price: priceData.price || 0.5, size: 1 }],
          asks: [{ price: priceData.price || 0.5, size: 1 }],
        },
        timestamp: new Date(),
      };
    }

    throw new Error('Both CLOB and price APIs failed');
  } catch (error) {
    console.error(`Error fetching Polymarket orderbook for ${tokenId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

/**
 * Fetch price data for multiple Polymarket tokens
 */
export async function fetchPolymarketPrices(tokenIds: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  
  // Batch fetch prices with rate limiting
  const promises = tokenIds.map(async (tokenId, index) => {
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, index * 50));
    
    const response = await fetchPolymarketOrderbook(tokenId);
    if (response.success && response.data) {
      const orderbook = response.data;
      // Use mid price from best bid/ask
      const bestBid = orderbook.bids[0]?.price || 0;
      const bestAsk = orderbook.asks[0]?.price || 1;
      const midPrice = (bestBid + bestAsk) / 2;
      prices.set(tokenId, midPrice);
    }
  });

  await Promise.allSettled(promises);
  return prices;
}

/**
 * Convert Polymarket market to CommonMarket format
 */
export function normalizePolymarketMarket(
  market: PolymarketMarket, 
  priceData?: Map<string, PolymarketOrderbook>
): CommonMarket {
  const outcomes: MarketCondition[] = [];

  // Handle binary markets (2 outcomes)
  if (market.outcomes.length === 2 && market.clobTokenIds.length >= 2) {
    market.outcomes.forEach((outcomeName, index) => {
      const tokenId = market.clobTokenIds[index];
      const orderbook = priceData?.get(tokenId);

      let yesPrice = 0.5; // Default mid price
      let noPrice = 0.5;

      if (orderbook) {
        const bestBid = orderbook.bids[0]?.price || 0;
        const bestAsk = orderbook.asks[0]?.price || 1;
        yesPrice = bestAsk; // Price to buy YES
        noPrice = 1 - bestBid; // Price to buy NO (complement)
      }

      outcomes.push({
        id: tokenId,
        name: outcomeName,
        yesPrice,
        noPrice,
        clobTokenId: tokenId,
      });
    });
  } 
  // Handle multi-outcome markets (>2 outcomes)
  else if (market.outcomes.length > 2) {
    market.outcomes.forEach((outcomeName, index) => {
      const tokenId = market.clobTokenIds[index];
      const orderbook = priceData?.get(tokenId);

      let yesPrice = 1 / market.outcomes.length; // Equal probability default
      let noPrice = 1 - yesPrice;

      if (orderbook) {
        const bestBid = orderbook.bids[0]?.price || 0;
        const bestAsk = orderbook.asks[0]?.price || 1;
        yesPrice = bestAsk;
        // For multi-outcome, "no" price is more complex - use complement for now
        noPrice = 1 - bestBid;
      }

      outcomes.push({
        id: tokenId,
        name: outcomeName,
        yesPrice,
        noPrice,
        clobTokenId: tokenId,
      });
    });
  }

  // Calculate overall market prices for binary markets
  let yesBid, yesAsk, noBid, noAsk;
  if (outcomes.length === 2) {
    const yesOutcome = outcomes[0];
    const noOutcome = outcomes[1];
    
    yesAsk = yesOutcome.yesPrice;
    noAsk = noOutcome.yesPrice;
    yesBid = 1 - noOutcome.yesPrice;
    noBid = 1 - yesOutcome.yesPrice;
  }

  return {
    id: market.conditionId,
    platform: 'polymarket',
    title: market.question,
    subtitle: market.description,
    category: market.category || 'Unknown',
    closeTime: new Date(market.endDate),
    volume: market.volume,
    settlementSource: market.resolutionSource,
    yesBid,
    yesAsk,
    noBid,
    noAsk,
    outcomes,
  };
}

/**
 * Fetch and normalize all Polymarket markets
 */
export async function fetchNormalizedPolymarketMarkets(): Promise<ApiResponse<CommonMarket[]>> {
  const marketsResponse = await fetchPolymarketMarkets();
  
  if (!marketsResponse.success || !marketsResponse.data) {
    return marketsResponse as ApiResponse<CommonMarket[]>;
  }

  try {
    // Collect all token IDs for price fetching
    const allTokenIds: string[] = [];
    marketsResponse.data.forEach(market => {
      allTokenIds.push(...market.clobTokenIds);
    });

    // Fetch prices for all tokens
    const priceMap = new Map<string, PolymarketOrderbook>();
    
    // Convert price data to orderbook format for normalization
    const prices = await fetchPolymarketPrices(allTokenIds.slice(0, 50)); // Limit for initial load
    prices.forEach((price, tokenId) => {
      priceMap.set(tokenId, {
        market: tokenId,
        asset_id: tokenId,
        bids: [{ price: price * 0.95, size: 1 }], // Approximate spread
        asks: [{ price: price * 1.05, size: 1 }],
      });
    });

    // Normalize markets with price data
    const normalizedMarkets: CommonMarket[] = marketsResponse.data
      .filter(market => market.active && market.clobTokenIds.length > 0)
      .map(market => normalizePolymarketMarket(market, priceMap));

    return {
      success: true,
      data: normalizedMarkets,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error normalizing Polymarket markets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error normalizing markets',
      timestamp: new Date(),
    };
  }
}

/**
 * Check if Polymarket APIs are accessible (health check)
 */
export async function checkPolymarketConnection(): Promise<{ gamma: boolean; clob: boolean }> {
  const results = { gamma: false, clob: false };

  try {
    // Check Gamma API
    const gammaResponse = await fetch(`${config.POLYMARKET_GAMMA_URL}/markets?limit=1`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });
    results.gamma = gammaResponse.ok;
  } catch (error) {
    console.warn('Polymarket Gamma API connection check failed:', error);
  }

  try {
    // Check CLOB API with a known endpoint
    const clobResponse = await fetch(`${config.POLYMARKET_CLOB_URL}/ping`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    results.clob = clobResponse.ok;
  } catch (error) {
    console.warn('Polymarket CLOB API connection check failed:', error);
  }

  return results;
}

/**
 * Get real-time price updates for specific tokens (for SSE/polling)
 */
export async function getPolymarketLivePrices(tokenIds: string[]): Promise<Map<string, { price: number; timestamp: Date }>> {
  const livePrices = new Map<string, { price: number; timestamp: Date }>();
  
  try {
    const prices = await fetchPolymarketPrices(tokenIds);
    const timestamp = new Date();
    
    prices.forEach((price, tokenId) => {
      livePrices.set(tokenId, { price, timestamp });
    });
  } catch (error) {
    console.error('Error fetching live Polymarket prices:', error);
  }

  return livePrices;
}