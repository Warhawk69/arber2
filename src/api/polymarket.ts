// Polymarket API integration
import { CommonMarket, PolymarketMarket, PolymarketBook, ApiError, Condition } from './types';

const GAMMA_BASE_URL = process.env.POLYMARKET_GAMMA_URL || 'https://gamma-api.polymarket.com';
const CLOB_BASE_URL = process.env.POLYMARKET_CLOB_URL || 'https://clob.polymarket.com';

class PolymarketApiError extends Error implements ApiError {
  constructor(
    message: string,
    public status?: number,
    public platform: string = 'Polymarket'
  ) {
    super(message);
    this.name = 'PolymarketApiError';
  }
}

/**
 * Fetch active markets from Polymarket Gamma API
 * @param category Optional category filter
 * @param limit Number of markets to fetch
 * @returns Promise<PolymarketMarket[]>
 */
export async function fetchPolymarketMarkets(
  category?: string,
  limit: number = 100
): Promise<PolymarketMarket[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      active: 'true',
      closed: 'false'
    });

    if (category) {
      params.append('category', category);
    }

    const response = await fetch(`${GAMMA_BASE_URL}/markets?${params}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new PolymarketApiError(
        `Failed to fetch Polymarket markets: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    if (error instanceof PolymarketApiError) {
      throw error;
    }
    throw new PolymarketApiError(`Network error fetching Polymarket markets: ${error.message}`);
  }
}

/**
 * Fetch orderbook for a specific Polymarket token from CLOB API
 * @param tokenId CLOB token ID
 * @returns Promise<PolymarketBook>
 */
export async function fetchPolymarketOrderbook(tokenId: string): Promise<PolymarketBook> {
  try {
    const response = await fetch(`${CLOB_BASE_URL}/book?token_id=${tokenId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new PolymarketApiError(
        `Failed to fetch Polymarket orderbook for ${tokenId}: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data || { market: '', asset_id: tokenId, bids: [], asks: [] };
  } catch (error) {
    if (error instanceof PolymarketApiError) {
      throw error;
    }
    throw new PolymarketApiError(`Network error fetching Polymarket orderbook: ${error.message}`);
  }
}

/**
 * Fetch price for a specific Polymarket token (fallback if orderbook fails)
 * @param tokenId CLOB token ID
 * @returns Promise<number | null>
 */
export async function fetchPolymarketPrice(tokenId: string): Promise<number | null> {
  try {
    const response = await fetch(`${CLOB_BASE_URL}/price?token_id=${tokenId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null; // Price endpoint failure is not critical
    }

    const data = await response.json();
    return data.price ? parseFloat(data.price) : null;
  } catch (error) {
    console.warn(`Failed to fetch price for token ${tokenId}:`, error.message);
    return null;
  }
}

/**
 * Convert Polymarket market to CommonMarket format
 * @param polyMarket Raw Polymarket market data
 * @param orderbooks Optional orderbook data for each token
 * @returns CommonMarket
 */
export function normalizePolymarketMarket(
  polyMarket: PolymarketMarket,
  orderbooks?: Record<string, PolymarketBook>
): CommonMarket {
  const conditions: Condition[] = [];

  // Process each outcome
  for (let i = 0; i < polyMarket.outcomes.length; i++) {
    const outcome = polyMarket.outcomes[i];
    const tokenId = polyMarket.clobTokenIds[i];
    
    let yesPrice = 0.5; // Default fallback
    let noPrice = 0.5;

    if (orderbooks && orderbooks[tokenId]) {
      const book = orderbooks[tokenId];
      
      // Get best ask (lowest price to buy YES)
      if (book.asks.length > 0) {
        yesPrice = parseFloat(book.asks[0].price);
      }
      
      // For NO price, we use 1 - yesPrice for binary markets
      // For multi-outcome markets, this gets more complex
      noPrice = 1 - yesPrice;
    }

    conditions.push({
      name: outcome,
      yesPrice,
      noPrice,
      volume: polyMarket.volume / polyMarket.outcomes.length, // Estimate
      clobTokenId: tokenId
    });
  }

  return {
    id: polyMarket.id,
    platform: 'Polymarket',
    title: polyMarket.question,
    category: polyMarket.category,
    closeTime: new Date(polyMarket.endDate),
    volume: polyMarket.volume,
    liquidity: polyMarket.liquidity,
    conditions,
  };
}

/**
 * Fetch normalized markets from Polymarket with optional orderbook data
 * @param includeOrderbooks Whether to fetch orderbook data for each market
 * @param category Optional category filter
 * @param limit Number of markets to fetch
 * @returns Promise<CommonMarket[]>
 */
export async function fetchNormalizedPolymarketMarkets(
  includeOrderbooks: boolean = false,
  category?: string,
  limit: number = 100
): Promise<CommonMarket[]> {
  try {
    const markets = await fetchPolymarketMarkets(category, limit);
    
    if (!includeOrderbooks) {
      return markets.map(market => normalizePolymarketMarket(market));
    }

    // Fetch orderbooks for each market's tokens
    const normalizedMarkets: CommonMarket[] = [];
    
    for (const market of markets) {
      try {
        const orderbooks: Record<string, PolymarketBook> = {};
        
        // Fetch orderbook for each outcome token
        for (const tokenId of market.clobTokenIds) {
          try {
            const book = await fetchPolymarketOrderbook(tokenId);
            orderbooks[tokenId] = book;
            
            // Small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.warn(`Failed to fetch orderbook for token ${tokenId}:`, error.message);
            
            // Try price fallback
            const price = await fetchPolymarketPrice(tokenId);
            if (price !== null) {
              orderbooks[tokenId] = {
                market: market.id,
                asset_id: tokenId,
                bids: [{ price: (price - 0.01).toString(), size: '1' }],
                asks: [{ price: price.toString(), size: '1' }]
              };
            }
          }
        }

        normalizedMarkets.push(normalizePolymarketMarket(market, orderbooks));
      } catch (error) {
        console.warn(`Failed to process market ${market.id}:`, error.message);
        // Include market without orderbook data
        normalizedMarkets.push(normalizePolymarketMarket(market));
      }
    }

    return normalizedMarkets;
  } catch (error) {
    throw error;
  }
}

/**
 * Get best prices for a specific token in a Polymarket market
 * @param tokenId CLOB token ID
 * @returns Promise<{bid: number, ask: number} | null>
 */
export async function getPolymarketBestPrices(
  tokenId: string
): Promise<{ bid: number; ask: number } | null> {
  try {
    const book = await fetchPolymarketOrderbook(tokenId);
    
    if (book.asks.length === 0 && book.bids.length === 0) {
      // Try price fallback
      const price = await fetchPolymarketPrice(tokenId);
      if (price !== null) {
        return { bid: price - 0.01, ask: price };
      }
      return null;
    }

    const bestAsk = book.asks.length > 0 ? parseFloat(book.asks[0].price) : null;
    const bestBid = book.bids.length > 0 ? parseFloat(book.bids[0].price) : null;

    if (bestAsk === null || bestBid === null) {
      return null;
    }

    return { bid: bestBid, ask: bestAsk };
  } catch (error) {
    console.error(`Error fetching Polymarket prices for ${tokenId}:`, error);
    return null;
  }
}

/**
 * For binary markets, calculate NO side pricing from YES side
 * @param yesPrice Price for YES outcome
 * @returns Number representing NO price
 */
export function calculateNoPrice(yesPrice: number): number {
  return 1 - yesPrice;
}

/**
 * Check if a Polymarket market is binary (exactly 2 outcomes)
 * @param market Polymarket market
 * @returns boolean
 */
export function isBinaryMarket(market: PolymarketMarket): boolean {
  return market.outcomes.length === 2 && market.clobTokenIds.length === 2;
}