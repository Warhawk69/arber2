// Kalshi API service
import { ApiResponse, KalshiMarket, KalshiOrderbook, Market, Condition, OrderbookSnapshot } from '../types';

// API endpoints - these would typically come from environment variables
const KALSHI_API_BASE = 'https://trading-api.kalshi.com/trade-api/v2';

// Cache for market data
let marketsCache: Market[] | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchKalshiMarkets(): Promise<ApiResponse<Market[]>> {
  try {
    // Check cache first
    if (marketsCache && Date.now() < cacheExpiry) {
      return { data: marketsCache, success: true };
    }

    // In a real implementation, this would make actual API calls
    // For now, we'll return mock data that matches the expected structure
    const mockMarkets: Market[] = [
      {
        id: 'ELECTION-2028-WINNER',
        title: 'Presidential Election Winner 2028',
        category: 'Politics',
        volume: 6000000,
        liquidity: 450000,
        closeDate: '2028-11-05',
        settlementSource: 'Associated Press',
        rules: 'Market resolves to the candidate declared winner by the Associated Press',
        conditions: [
          { name: 'JD Vance', yesPrice: 0.28, noPrice: 0.72, volume: 501296 },
          { name: 'Gavin Newsom', yesPrice: 0.13, noPrice: 0.87, volume: 363835 },
          { name: 'Alexandria Ocasio-Cortez', yesPrice: 0.09, noPrice: 0.91, volume: 218268 },
          { name: 'Pete Buttigieg', yesPrice: 0.07, noPrice: 0.93, volume: 139748 },
          { name: 'Marco Rubio', yesPrice: 0.06, noPrice: 0.94, volume: 128925 },
          { name: 'Andy Beshear', yesPrice: 0.05, noPrice: 0.95, volume: 292807 },
          { name: 'Gretchen Whitmer', yesPrice: 0.04, noPrice: 0.96, volume: 298604 }
        ]
      },
      {
        id: 'FED-SEPT-2025',
        title: 'Fed decision in September?',
        category: 'Economics',
        volume: 450000,
        liquidity: 120000,
        closeDate: '2025-09-18',
        settlementSource: 'Federal Reserve announcement',
        rules: 'Resolves based on Federal Reserve rate decision at September FOMC meeting',
        conditions: [
          { name: '25 bps decrease', yesPrice: 0.80, noPrice: 0.20, volume: 150000 },
          { name: 'No change', yesPrice: 0.15, noPrice: 0.85, volume: 180000 },
          { name: '25+ bps increase', yesPrice: 0.01, noPrice: 0.99, volume: 50000 }
        ]
      },
      {
        id: 'BTCPRICE-25DEC31',
        title: 'Bitcoin above $100k by year end?',
        category: 'Crypto',
        volume: 890000,
        liquidity: 250000,
        closeDate: '2025-12-31',
        conditions: [
          { name: 'Yes', yesPrice: 0.40, noPrice: 0.60 },
          { name: 'No', yesPrice: 0.60, noPrice: 0.40 }
        ]
      }
    ];

    // Update cache
    marketsCache = mockMarkets;
    cacheExpiry = Date.now() + CACHE_DURATION;

    return { data: mockMarkets, success: true };
  } catch (error) {
    console.error('Error fetching Kalshi markets:', error);
    return { 
      data: [], 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function fetchKalshiOrderbook(marketId: string, conditionName?: string): Promise<ApiResponse<OrderbookSnapshot>> {
  try {
    // In real implementation, this would fetch from Kalshi API
    // For Kalshi, we often get market-level orderbook data since many are binary
    
    // Find the market and condition to get base price
    const marketsResponse = await fetchKalshiMarkets();
    if (!marketsResponse.success) {
      throw new Error('Failed to fetch markets');
    }

    const market = marketsResponse.data.find(m => m.id === marketId);
    if (!market) {
      throw new Error(`Market ${marketId} not found`);
    }

    // For binary markets, use the first condition or the specified one
    let condition: Condition | undefined;
    if (conditionName) {
      condition = market.conditions.find(c => c.name === conditionName);
    } else {
      condition = market.conditions[0]; // Default to first condition for binary markets
    }
    
    if (!condition) {
      throw new Error(`Condition not found in market ${marketId}`);
    }

    // Simulate realistic bid/ask spread (usually 1-2 cents for Kalshi)
    const spread = 0.015; // 1.5 cent spread
    const yesPrice = condition.yesPrice;
    const noPrice = condition.noPrice;

    const orderbook: OrderbookSnapshot = {
      marketId,
      conditionName: condition.name,
      timestamp: Date.now(),
      yesBid: Math.max(0.01, yesPrice - spread/2),
      yesAsk: Math.min(0.99, yesPrice + spread/2),
      noBid: Math.max(0.01, noPrice - spread/2),
      noAsk: Math.min(0.99, noPrice + spread/2),
      volume: condition.volume
    };

    return { data: orderbook, success: true };
  } catch (error) {
    console.error('Error fetching Kalshi orderbook:', error);
    return { 
      data: {} as OrderbookSnapshot, 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// For binary Kalshi markets, we can derive the no side from yes side
export function deriveNoSideFromYes(yesBid: number, yesAsk: number): { noBid: number; noAsk: number } {
  return {
    noBid: 1 - yesAsk,
    noAsk: 1 - yesBid
  };
}

// Real API implementation would look like this:
/*
export async function fetchKalshiMarketsReal(): Promise<ApiResponse<Market[]>> {
  try {
    const response = await fetch(`${KALSHI_API_BASE}/markets`, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${apiKey}` // Would need API key for authenticated endpoints
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const kalshiMarkets: KalshiMarket[] = data.markets || [];
    
    // Transform to our standard Market format
    const markets: Market[] = kalshiMarkets
      .filter(km => km.status === 'open') // Only open markets
      .map(kalshiMarket => ({
        id: kalshiMarket.id,
        title: kalshiMarket.title,
        category: kalshiMarket.category,
        volume: kalshiMarket.volume || 0,
        liquidity: kalshiMarket.liquidity || 0,
        closeDate: kalshiMarket.close_time,
        settlementSource: 'Kalshi Rules',
        conditions: [
          // Most Kalshi markets are binary
          {
            name: kalshiMarket.yes_sub_title || 'Yes',
            yesPrice: 0.5, // Would need to fetch from orderbook
            noPrice: 0.5,
            volume: 0
          }
        ]
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

export async function fetchKalshiOrderbookReal(marketId: string): Promise<ApiResponse<OrderbookSnapshot>> {
  try {
    const response = await fetch(`${KALSHI_API_BASE}/markets/${marketId}/orderbook`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: KalshiOrderbook = await response.json();
    
    const orderbook: OrderbookSnapshot = {
      marketId,
      conditionName: 'Yes', // Kalshi is typically binary
      timestamp: Date.now(),
      yesBid: data.yes_bid || 0,
      yesAsk: data.yes_ask || 0,
      noBid: data.no_bid || (1 - (data.yes_ask || 0)),
      noAsk: data.no_ask || (1 - (data.yes_bid || 0)),
    };

    return { data: orderbook, success: true };
  } catch (error) {
    return { 
      data: {} as OrderbookSnapshot, 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
*/