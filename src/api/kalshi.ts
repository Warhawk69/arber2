// Kalshi API integration
import { CommonMarket, KalshiMarket, KalshiOrderbook, ApiError, Condition } from './types';

const KALSHI_BASE_URL = process.env.KALSHI_API_URL || 'https://trading-api.kalshi.com/trade-api/v2';
const KALSHI_API_KEY = process.env.KALSHI_API_KEY;

class KalshiApiError extends Error implements ApiError {
  constructor(
    message: string,
    public status?: number,
    public platform: string = 'Kalshi'
  ) {
    super(message);
    this.name = 'KalshiApiError';
  }
}

/**
 * Fetch markets from Kalshi API
 * @param status Filter by market status (default: 'open')
 * @param category Optional category filter
 * @returns Promise<KalshiMarket[]>
 */
export async function fetchKalshiMarkets(
  status: string = 'open',
  category?: string
): Promise<KalshiMarket[]> {
  try {
    const params = new URLSearchParams({
      status,
      limit: '100'
    });
    
    if (category) {
      params.append('category', category);
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add API key if available
    if (KALSHI_API_KEY) {
      headers['Authorization'] = `Bearer ${KALSHI_API_KEY}`;
    }

    const response = await fetch(`${KALSHI_BASE_URL}/markets?${params}`, {
      headers,
    });

    if (!response.ok) {
      throw new KalshiApiError(
        `Failed to fetch Kalshi markets: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data.markets || [];
  } catch (error) {
    if (error instanceof KalshiApiError) {
      throw error;
    }
    throw new KalshiApiError(`Network error fetching Kalshi markets: ${error.message}`);
  }
}

/**
 * Fetch orderbook for a specific Kalshi market
 * @param ticker Market ticker
 * @returns Promise<KalshiOrderbook>
 */
export async function fetchKalshiOrderbook(ticker: string): Promise<KalshiOrderbook> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (KALSHI_API_KEY) {
      headers['Authorization'] = `Bearer ${KALSHI_API_KEY}`;
    }

    const response = await fetch(`${KALSHI_BASE_URL}/markets/${ticker}/orderbook`, {
      headers,
    });

    if (!response.ok) {
      throw new KalshiApiError(
        `Failed to fetch Kalshi orderbook for ${ticker}: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data.orderbook || { yes: [], no: [] };
  } catch (error) {
    if (error instanceof KalshiApiError) {
      throw error;
    }
    throw new KalshiApiError(`Network error fetching Kalshi orderbook: ${error.message}`);
  }
}

/**
 * Convert Kalshi market to CommonMarket format
 * @param kalshiMarket Raw Kalshi market data
 * @param orderbook Optional orderbook data
 * @returns CommonMarket
 */
export function normalizeKalshiMarket(
  kalshiMarket: KalshiMarket,
  orderbook?: KalshiOrderbook
): CommonMarket {
  // Calculate yes/no prices from orderbook or fallback to market data
  let yesAsk = kalshiMarket.yes_ask;
  let yesBid = kalshiMarket.yes_bid;
  let noAsk = kalshiMarket.no_ask;
  let noBid = kalshiMarket.no_bid;

  if (orderbook) {
    // Use best prices from orderbook
    yesAsk = orderbook.yes.length > 0 ? orderbook.yes[0].price : yesAsk;
    noAsk = orderbook.no.length > 0 ? orderbook.no[0].price : noAsk;
    
    // For bids, we want the highest price (last in sorted order)
    yesBid = orderbook.yes.length > 0 ? orderbook.yes[orderbook.yes.length - 1].price : yesBid;
    noBid = orderbook.no.length > 0 ? orderbook.no[orderbook.no.length - 1].price : noBid;
  }

  // For Kalshi, calculate No prices as complement if not available
  if (!noAsk && yesAsk) {
    noAsk = 1 - yesAsk;
  }
  if (!noBid && yesBid) {
    noBid = 1 - yesBid;
  }

  // Create conditions based on market type
  const conditions: Condition[] = [];
  
  // Binary market (Yes/No)
  if (yesAsk !== undefined && noAsk !== undefined) {
    conditions.push(
      {
        name: 'Yes',
        yesPrice: yesAsk,
        noPrice: 1 - yesAsk,
        volume: kalshiMarket.volume
      },
      {
        name: 'No',
        yesPrice: noAsk,
        noPrice: 1 - noAsk,
        volume: 0 // Kalshi doesn't provide per-condition volume
      }
    );
  }

  return {
    id: kalshiMarket.ticker,
    platform: 'Kalshi',
    title: kalshiMarket.title,
    subtitle: kalshiMarket.subtitle,
    category: kalshiMarket.category,
    closeTime: new Date(kalshiMarket.close_time),
    volume: kalshiMarket.volume,
    liquidity: kalshiMarket.liquidity,
    conditions,
    yesBid,
    yesAsk,
    noBid,
    noAsk,
  };
}

/**
 * Fetch normalized markets from Kalshi with optional orderbook data
 * @param includeOrderbooks Whether to fetch orderbook data for each market
 * @param status Market status filter
 * @param category Optional category filter
 * @returns Promise<CommonMarket[]>
 */
export async function fetchNormalizedKalshiMarkets(
  includeOrderbooks: boolean = false,
  status: string = 'open',
  category?: string
): Promise<CommonMarket[]> {
  try {
    const markets = await fetchKalshiMarkets(status, category);
    
    if (!includeOrderbooks) {
      return markets.map(market => normalizeKalshiMarket(market));
    }

    // Fetch orderbooks for each market (with rate limiting consideration)
    const normalizedMarkets: CommonMarket[] = [];
    
    for (const market of markets) {
      try {
        const orderbook = await fetchKalshiOrderbook(market.ticker);
        normalizedMarkets.push(normalizeKalshiMarket(market, orderbook));
        
        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Failed to fetch orderbook for ${market.ticker}:`, error.message);
        // Include market without orderbook data
        normalizedMarkets.push(normalizeKalshiMarket(market));
      }
    }

    return normalizedMarkets;
  } catch (error) {
    throw error;
  }
}

/**
 * Get best prices for a specific condition in a Kalshi market
 * @param ticker Market ticker
 * @param side 'yes' or 'no'
 * @returns Promise<{bid: number, ask: number} | null>
 */
export async function getKalshiBestPrices(
  ticker: string, 
  side: 'yes' | 'no'
): Promise<{ bid: number; ask: number } | null> {
  try {
    const orderbook = await fetchKalshiOrderbook(ticker);
    const book = side === 'yes' ? orderbook.yes : orderbook.no;
    
    if (book.length === 0) {
      return null;
    }

    // Assuming orderbook is sorted by price
    const bestAsk = book[0].price; // Lowest ask
    const bestBid = book[book.length - 1].price; // Highest bid

    return { bid: bestBid, ask: bestAsk };
  } catch (error) {
    console.error(`Error fetching Kalshi prices for ${ticker}:`, error);
    return null;
  }
}