// Kalshi API integration layer
import { 
  KalshiMarket, 
  KalshiOrderbook, 
  CommonMarket, 
  MarketCondition, 
  ApiResponse,
  EnvironmentConfig 
} from './types';

// Environment configuration with defaults
const config: EnvironmentConfig = {
  KALSHI_API_KEY: process.env.KALSHI_API_KEY,
  KALSHI_BASE_URL: process.env.KALSHI_BASE_URL || 'https://trading-api.kalshi.com',
  POLYMARKET_GAMMA_URL: process.env.POLYMARKET_GAMMA_URL || 'https://gamma-api.polymarket.com',
  POLYMARKET_CLOB_URL: process.env.POLYMARKET_CLOB_URL || 'https://clob.polymarket.com',
  POLYMARKET_PRICE_URL: process.env.POLYMARKET_PRICE_URL || 'https://strapi-matic.poly.market',
};

/**
 * Fetch open/active markets from Kalshi
 */
export async function fetchKalshiMarkets(): Promise<ApiResponse<KalshiMarket[]>> {
  try {
    const url = `${config.KALSHI_BASE_URL}/v1/markets?status=open&limit=100`;
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    // Add API key if available
    if (config.KALSHI_API_KEY) {
      headers['Authorization'] = `Bearer ${config.KALSHI_API_KEY}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const markets = data.markets || data.data || [];

    return {
      success: true,
      data: markets,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching Kalshi markets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

/**
 * Fetch orderbook for a specific Kalshi market
 */
export async function fetchKalshiOrderbook(ticker: string): Promise<ApiResponse<KalshiOrderbook>> {
  try {
    const url = `${config.KALSHI_BASE_URL}/v1/markets/${ticker}/orderbook`;
    const headers: HeadersInit = {
      'Accept': 'application/json',
    };

    if (config.KALSHI_API_KEY) {
      headers['Authorization'] = `Bearer ${config.KALSHI_API_KEY}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Kalshi orderbook API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data.orderbook || data,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(`Error fetching Kalshi orderbook for ${ticker}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

/**
 * Convert Kalshi market to CommonMarket format
 */
export function normalizeKalshiMarket(market: KalshiMarket, orderbook?: KalshiOrderbook): CommonMarket {
  // Extract pricing from orderbook if available, otherwise use market data
  let yesBid = market.yes_bid;
  let yesAsk = market.yes_ask;
  let noBid = market.no_bid;
  let noAsk = market.no_ask;

  if (orderbook) {
    if (orderbook.yes && orderbook.yes.length > 0) {
      yesBid = orderbook.yes[0].price; // Best bid
      yesAsk = orderbook.yes.find(order => order.size > 0)?.price;
    }
    if (orderbook.no && orderbook.no.length > 0) {
      noBid = orderbook.no[0].price; // Best bid
      noAsk = orderbook.no.find(order => order.size > 0)?.price;
    }
  }

  // For Kalshi, calculate No prices as 1 - opposite side when needed
  if (yesBid && !noBid) {
    noBid = 1 - yesBid;
  }
  if (yesAsk && !noAsk) {
    noAsk = 1 - yesAsk;
  }
  if (noBid && !yesBid) {
    yesBid = 1 - noBid;
  }
  if (noAsk && !yesAsk) {
    yesAsk = 1 - noAsk;
  }

  // Create outcomes for binary markets
  const outcomes: MarketCondition[] = [];

  if (yesBid !== undefined && yesAsk !== undefined) {
    outcomes.push({
      id: `${market.ticker}-yes`,
      name: 'Yes',
      yesPrice: yesAsk, // Ask price to buy YES
      noPrice: noBid || (1 - yesAsk), // Bid price to buy NO (or calculated)
      volume: market.volume,
    });
  }

  if (noBid !== undefined && noAsk !== undefined) {
    outcomes.push({
      id: `${market.ticker}-no`,
      name: 'No',
      yesPrice: noAsk, // Ask price to buy NO
      noPrice: yesBid || (1 - noAsk), // Bid price to buy YES (or calculated)
      volume: market.volume,
    });
  }

  return {
    id: market.ticker,
    platform: 'kalshi',
    title: market.title,
    subtitle: market.subtitle,
    category: market.category || 'Unknown',
    closeTime: new Date(market.close_time),
    volume: market.dollar_volume || market.volume,
    liquidity: market.open_interest,
    yesBid,
    yesAsk,
    noBid,
    noAsk,
    outcomes,
  };
}

/**
 * Fetch and normalize all Kalshi markets
 */
export async function fetchNormalizedKalshiMarkets(): Promise<ApiResponse<CommonMarket[]>> {
  const marketsResponse = await fetchKalshiMarkets();
  
  if (!marketsResponse.success || !marketsResponse.data) {
    return marketsResponse as ApiResponse<CommonMarket[]>;
  }

  try {
    // Normalize markets, optionally with orderbook data
    const normalizedMarkets: CommonMarket[] = marketsResponse.data.map(market => {
      return normalizeKalshiMarket(market);
    });

    return {
      success: true,
      data: normalizedMarkets,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error normalizing Kalshi markets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error normalizing markets',
      timestamp: new Date(),
    };
  }
}

/**
 * Fetch orderbooks for multiple markets (for live pricing updates)
 */
export async function fetchKalshiOrderbooks(tickers: string[]): Promise<Map<string, KalshiOrderbook>> {
  const orderbooks = new Map<string, KalshiOrderbook>();
  
  // Fetch orderbooks in parallel with reasonable rate limiting
  const promises = tickers.map(async (ticker, index) => {
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, index * 100));
    
    const response = await fetchKalshiOrderbook(ticker);
    if (response.success && response.data) {
      orderbooks.set(ticker, response.data);
    }
  });

  await Promise.allSettled(promises);
  return orderbooks;
}

/**
 * Check if Kalshi API is accessible (health check)
 */
export async function checkKalshiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${config.KALSHI_BASE_URL}/v1/status`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    return response.ok;
  } catch (error) {
    console.warn('Kalshi API connection check failed:', error);
    return false;
  }
}