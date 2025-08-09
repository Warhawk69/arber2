// Live orderbook polling hook with optional SSE support
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CommonMarket, 
  ArbitrageOpportunity, 
  ApiError, 
  LiveDataHookResult 
} from '../api/types';
import { kalshiApi } from '../api/kalshi';
import { polymarketApi } from '../api/polymarket';
import { arbitrageCalculator } from '../lib/arbitrage';
import { useMatchesStore } from '../state/matches-store';

interface UseLiveOrderbooksOptions {
  kalshiPollInterval?: number;  // Kalshi polling interval in ms (default: 5000)
  polymarketPollInterval?: number;  // Polymarket polling interval in ms (default: 2500)
  enablePolling?: boolean;     // Enable/disable polling (default: true)
  sseEndpoint?: string;        // Optional SSE endpoint for real-time updates
  maxRetries?: number;         // Max retries on API failure (default: 3)
  retryDelay?: number;         // Delay between retries in ms (default: 1000)
}

export const useLiveOrderbooks = (options: UseLiveOrderbooksOptions = {}): LiveDataHookResult => {
  const {
    kalshiPollInterval = 5000,
    polymarketPollInterval = 2500,
    enablePolling = true,
    sseEndpoint,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  // State
  const [kalshiMarkets, setKalshiMarkets] = useState<CommonMarket[]>([]);
  const [polymarketMarkets, setPolymarketMarkets] = useState<CommonMarket[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<ApiError[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refs for intervals and SSE
  const kalshiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const polymarketIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef<{ kalshi: number; polymarket: number }>({ kalshi: 0, polymarket: 0 });

  // Get matches and ecosystems from store
  const matchesStore = useMatchesStore();

  // Error handling utility
  const addError = useCallback((error: ApiError) => {
    setErrors(prev => {
      const newErrors = [error, ...prev].slice(0, 10); // Keep only last 10 errors
      return newErrors;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Fetch Kalshi markets with retry logic
  const fetchKalshiMarkets = useCallback(async (): Promise<void> => {
    try {
      const response = await kalshiApi.getMarketsWithOrderbooks();
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data) {
        setKalshiMarkets(response.data);
        retryCountRef.current.kalshi = 0; // Reset retry count on success
      }
    } catch (error) {
      console.error('Error fetching Kalshi markets:', error);
      
      retryCountRef.current.kalshi++;
      if (retryCountRef.current.kalshi <= maxRetries) {
        addError({
          message: `Kalshi API error (retry ${retryCountRef.current.kalshi}/${maxRetries}): ${error}`,
          code: 'KALSHI_FETCH_ERROR',
          details: error,
        });
        
        // Schedule retry
        setTimeout(() => {
          if (enablePolling) fetchKalshiMarkets();
        }, retryDelay * retryCountRef.current.kalshi);
      } else {
        addError({
          message: `Kalshi API failed after ${maxRetries} retries: ${error}`,
          code: 'KALSHI_MAX_RETRIES_EXCEEDED',
          details: error,
        });
      }
    }
  }, [enablePolling, maxRetries, retryDelay, addError]);

  // Fetch Polymarket markets with retry logic
  const fetchPolymarketMarkets = useCallback(async (): Promise<void> => {
    try {
      const response = await polymarketApi.getMarketsWithOrderbooks();
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data) {
        setPolymarketMarkets(response.data);
        retryCountRef.current.polymarket = 0; // Reset retry count on success
      }
    } catch (error) {
      console.error('Error fetching Polymarket markets:', error);
      
      retryCountRef.current.polymarket++;
      if (retryCountRef.current.polymarket <= maxRetries) {
        addError({
          message: `Polymarket API error (retry ${retryCountRef.current.polymarket}/${maxRetries}): ${error}`,
          code: 'POLYMARKET_FETCH_ERROR',
          details: error,
        });
        
        // Schedule retry
        setTimeout(() => {
          if (enablePolling) fetchPolymarketMarkets();
        }, retryDelay * retryCountRef.current.polymarket);
      } else {
        addError({
          message: `Polymarket API failed after ${maxRetries} retries: ${error}`,
          code: 'POLYMARKET_MAX_RETRIES_EXCEEDED',
          details: error,
        });
      }
    }
  }, [enablePolling, maxRetries, retryDelay, addError]);

  // Calculate arbitrage opportunities when markets or matches change
  const updateArbitrageOpportunities = useCallback(() => {
    try {
      const allMarkets = [...kalshiMarkets, ...polymarketMarkets];
      
      // Get opportunities from matches
      const matchOpportunities = arbitrageCalculator.findArbitrageFromMatches(
        matchesStore.matches,
        kalshiMarkets,
        polymarketMarkets
      );

      // Get opportunities from ecosystems
      const ecosystemOpportunities = arbitrageCalculator.findArbitrageFromEcosystems(
        matchesStore.ecosystems,
        allMarkets
      );

      // Combine and deduplicate
      const allOpportunities = [...matchOpportunities, ...ecosystemOpportunities];
      const uniqueOpportunities = allOpportunities.filter((opp, index, arr) => 
        arr.findIndex(o => o.id === opp.id) === index
      );

      setArbitrageOpportunities(uniqueOpportunities);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error calculating arbitrage opportunities:', error);
      addError({
        message: `Failed to calculate arbitrage opportunities: ${error}`,
        code: 'ARBITRAGE_CALCULATION_ERROR',
        details: error,
      });
    }
  }, [kalshiMarkets, polymarketMarkets, matchesStore.matches, matchesStore.ecosystems, addError]);

  // Setup SSE connection (TODO: Future enhancement)
  const setupSSE = useCallback(() => {
    if (!sseEndpoint) return;

    try {
      // TODO: Implement SSE connection similar to dashboard.js
      // This is a placeholder for future SSE integration
      console.log('SSE setup would be implemented here for endpoint:', sseEndpoint);
      
      // Example SSE implementation:
      /*
      sseRef.current = new EventSource(sseEndpoint);
      
      sseRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'market_update') {
            // Handle real-time market updates
            if (data.platform === 'kalshi') {
              setKalshiMarkets(prev => updateMarketInList(prev, data.market));
            } else if (data.platform === 'polymarket') {
              setPolymarketMarkets(prev => updateMarketInList(prev, data.market));
            }
          }
        } catch (error) {
          console.error('SSE message parsing error:', error);
        }
      };
      
      sseRef.current.onerror = (error) => {
        console.error('SSE connection error:', error);
        addError({
          message: 'SSE connection failed',
          code: 'SSE_CONNECTION_ERROR',
          details: error,
        });
      };
      */
    } catch (error) {
      console.error('Failed to setup SSE:', error);
      addError({
        message: `SSE setup failed: ${error}`,
        code: 'SSE_SETUP_ERROR',
        details: error,
      });
    }
  }, [sseEndpoint, addError]);

  // Cleanup SSE connection
  const cleanupSSE = useCallback(() => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
  }, []);

  // Manual refresh function
  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    clearErrors();
    
    try {
      await Promise.all([
        fetchKalshiMarkets(),
        fetchPolymarketMarkets(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [fetchKalshiMarkets, fetchPolymarketMarkets, clearErrors]);

  // Setup polling intervals
  useEffect(() => {
    if (!enablePolling) return;

    // Initial fetch
    refresh();

    // Setup Kalshi polling
    kalshiIntervalRef.current = setInterval(() => {
      fetchKalshiMarkets();
    }, kalshiPollInterval);

    // Setup Polymarket polling
    polymarketIntervalRef.current = setInterval(() => {
      fetchPolymarketMarkets();
    }, polymarketPollInterval);

    return () => {
      if (kalshiIntervalRef.current) {
        clearInterval(kalshiIntervalRef.current);
      }
      if (polymarketIntervalRef.current) {
        clearInterval(polymarketIntervalRef.current);
      }
    };
  }, [enablePolling, kalshiPollInterval, polymarketPollInterval, fetchKalshiMarkets, fetchPolymarketMarkets, refresh]);

  // Setup SSE connection
  useEffect(() => {
    if (sseEndpoint) {
      setupSSE();
    }

    return () => {
      cleanupSSE();
    };
  }, [sseEndpoint, setupSSE, cleanupSSE]);

  // Update arbitrage opportunities when markets or store changes
  useEffect(() => {
    if (kalshiMarkets.length > 0 || polymarketMarkets.length > 0) {
      updateArbitrageOpportunities();
      setIsLoading(false);
    }
  }, [kalshiMarkets, polymarketMarkets, updateArbitrageOpportunities]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (kalshiIntervalRef.current) {
        clearInterval(kalshiIntervalRef.current);
      }
      if (polymarketIntervalRef.current) {
        clearInterval(polymarketIntervalRef.current);
      }
      cleanupSSE();
    };
  }, [cleanupSSE]);

  return {
    kalshiMarkets,
    polymarketMarkets,
    arbitrageOpportunities,
    isLoading,
    errors,
    lastUpdated,
    refresh,
  };
};

// Utility function to update a market in a list (for SSE updates)
function updateMarketInList(markets: CommonMarket[], updatedMarket: CommonMarket): CommonMarket[] {
  const index = markets.findIndex(m => m.id === updatedMarket.id);
  if (index !== -1) {
    const newMarkets = [...markets];
    newMarkets[index] = updatedMarket;
    return newMarkets;
  }
  return markets;
}

export default useLiveOrderbooks;