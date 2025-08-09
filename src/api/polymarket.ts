// Polymarket API service
import { ApiResponse, PolymarketMarket, PolymarketOrderbook, Market, Condition, OrderbookSnapshot } from '../types';

// API endpoints - these would typically come from environment variables
const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';
const POLYMARKET_CLOB_BASE = 'https://clob.polymarket.com';

// Cache for market data
let marketsCache: Market[] | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchPolymarketMarkets(): Promise<ApiResponse<Market[]>> {
  try {
    // Check cache first
    if (marketsCache && Date.now() < cacheExpiry) {
      return { data: marketsCache, success: true };
    }

    // In a real implementation, this would make actual API calls
    // For now, we'll return mock data that matches the expected structure
    const mockMarkets: Market[] = [
      {
        id: '0x2028election',
        title: '2028 US Presidential Election',
        category: 'Politics',
        volume: 5200000,
        liquidity: 380000,
        closeDate: '2028-11-05',
        settlementSource: 'AP News',
        rules: 'Market resolves to the candidate declared winner by Associated Press',
        conditions: [
          { name: 'J.D. Vance', yesPrice: 0.27, noPrice: 0.73, volume: 480000 },
          { name: 'Gavin Newsom', yesPrice: 0.14, noPrice: 0.86, volume: 340000 },
          { name: 'AOC', yesPrice: 0.08, noPrice: 0.92, volume: 195000 },
          { name: 'Pete Buttigieg', yesPrice: 0.07, noPrice: 0.93, volume: 125000 },
          { name: 'Marco Rubio', yesPrice: 0.06, noPrice: 0.94, volume: 115000 },
          { name: 'Andrew Beshear', yesPrice: 0.05, noPrice: 0.95, volume: 270000 },
          { name: 'Gretchen Whitmer', yesPrice: 0.04, noPrice: 0.96, volume: 280000 }
        ]
      },
      {
        id: '0xfedrate092025',
        title: 'Federal Reserve Rate Decision September 2025',
        category: 'Macro',
        volume: 420000,
        liquidity: 110000,
        closeDate: '2025-09-18',
        settlementSource: 'Fed official statement',
        rules: 'Resolves based on the Federal Reserve rate decision',
        conditions: [
          { name: 'Rate decrease', yesPrice: 0.78, noPrice: 0.22, volume: 140000 },
          { name: 'No change', yesPrice: 0.16, noPrice: 0.84, volume: 170000 },
          { name: 'Rate increase', yesPrice: 0.02, noPrice: 0.98, volume: 45000 }
        ]
      },
      {
        id: '0xbtc100keoy',
        title: 'BTC above $100,000 by EOY',
        category: 'Cryptocurrency',
        volume: 670000,
        liquidity: 180000,
        closeDate: '2025-12-31',
        conditions: [
          { name: 'Yes', yesPrice: 0.38, noPrice: 0.62 },
          { name: 'No', yesPrice: 0.62, noPrice: 0.38 }
        ]
      }
    ];

    // Update cache
    marketsCache = mockMarkets;
    cacheExpiry = Date.now() + CACHE_DURATION;

    return { data: mockMarkets, success: true };
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error);
    return { 
      data: [], 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function fetchPolymarketOrderbook(marketId: string, conditionName: string): Promise<ApiResponse<OrderbookSnapshot>> {
  try {
    // In real implementation, this would fetch from CLOB API
    // For now, we'll simulate orderbook data with realistic bid/ask spreads
    
    // Find the market and condition to get base price
    const marketsResponse = await fetchPolymarketMarkets();
    if (!marketsResponse.success) {
      throw new Error('Failed to fetch markets');
    }

    const market = marketsResponse.data.find(m => m.id === marketId);
    const condition = market?.conditions.find(c => c.name === conditionName);
    
    if (!condition) {
      throw new Error(`Condition ${conditionName} not found in market ${marketId}`);
    }

    // Simulate realistic bid/ask spread (usually 1-3 cents)
    const spread = 0.02; // 2 cent spread
    const yesPrice = condition.yesPrice;
    const noPrice = condition.noPrice;

    const orderbook: OrderbookSnapshot = {
      marketId,
      conditionName,
      timestamp: Date.now(),
      yesBid: Math.max(0.01, yesPrice - spread/2),
      yesAsk: Math.min(0.99, yesPrice + spread/2),
      noBid: Math.max(0.01, noPrice - spread/2),
      noAsk: Math.min(0.99, noPrice + spread/2),
      volume: condition.volume
    };

    return { data: orderbook, success: true };
  } catch (error) {
    console.error('Error fetching Polymarket orderbook:', error);
    return { 
      data: {} as OrderbookSnapshot, 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Real API implementation would look like this:
/*
export async function fetchPolymarketMarketsReal(): Promise<ApiResponse<Market[]>> {
  try {
    const response = await fetch(`${POLYMARKET_API_BASE}/markets`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: PolymarketMarket[] = await response.json();
    
    // Transform to our standard Market format
    const markets: Market[] = data.map(polyMarket => ({
      id: polyMarket.id,
      title: polyMarket.question,
      category: polyMarket.category || 'Other',
      volume: polyMarket.volume || 0,
      liquidity: polyMarket.liquidity || 0,
      closeDate: polyMarket.end_date,
      conditions: polyMarket.outcomes?.map(outcome => ({
        name: outcome,
        yesPrice: 0.5, // Would need to fetch from orderbook
        noPrice: 0.5,
        volume: 0
      })) || []
    }));

    return { data: markets, success: true };
  } catch (error) {
    return { 
      data: [], 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
*/