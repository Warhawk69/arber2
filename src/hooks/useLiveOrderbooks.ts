// Live data polling hook for markets and orderbooks
import { useState, useEffect, useCallback, useRef } from 'react';
import { CommonMarket, PollingConfig } from '../api/types';
import { fetchNormalizedKalshiMarkets } from '../api/kalshi';
import { fetchNormalizedPolymarketMarkets } from '../api/polymarket';
import { 
  updateMarkets, 
  getStore, 
  subscribeToStore,
  updateArbitrageOpportunities 
} from '../state/matches-store';
import { calculateArbitrageOpportunities } from '../lib/arbitrage';

export interface PollingHookState {
  loading: boolean;
  error: string | null;
  kalshiMarkets: CommonMarket[];
  polymarketMarkets: CommonMarket[];
  lastUpdated: Date | null;
  connectionStatus: {
    kalshi: boolean;
    polymarket: boolean;
  };
}

export interface PollingHookActions {
  startPolling: () => void;
  stopPolling: () => void;
  forceRefresh: () => Promise<void>;
  updateConfig: (config: Partial<PollingConfig>) => void;
}

/**
 * Custom hook for live market data polling
 */
export function useLiveOrderbooks(): PollingHookState & PollingHookActions {
  const [state, setState] = useState<PollingHookState>({
    loading: false,
    error: null,
    kalshiMarkets: [],
    polymarketMarkets: [],
    lastUpdated: null,
    connectionStatus: {
      kalshi: false,
      polymarket: false,
    },
  });

  const intervalRef = useRef<{
    kalshi?: NodeJS.Timeout;
    polymarket?: NodeJS.Timeout;
  }>({});

  const isPollingRef = useRef(false);

  // Get initial data from store
  useEffect(() => {
    const store = getStore();
    setState(prev => ({
      ...prev,
      kalshiMarkets: store.markets.kalshi,
      polymarketMarkets: store.markets.polymarket,
      lastUpdated: store.markets.lastUpdated,
    }));
  }, []);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = subscribeToStore((store) => {
      setState(prev => ({
        ...prev,
        kalshiMarkets: store.markets.kalshi,
        polymarketMarkets: store.markets.polymarket,
        lastUpdated: store.markets.lastUpdated,
      }));
    });

    return unsubscribe;
  }, []);

  /**
   * Fetch Kalshi markets with error handling
   */
  const fetchKalshiData = useCallback(async (): Promise<CommonMarket[]> => {
    try {
      const response = await fetchNormalizedKalshiMarkets();
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          connectionStatus: { ...prev.connectionStatus, kalshi: true },
          error: prev.error?.includes('Kalshi') ? null : prev.error,
        }));
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch Kalshi markets');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Kalshi polling error:', errorMessage);
      
      setState(prev => ({
        ...prev,
        connectionStatus: { ...prev.connectionStatus, kalshi: false },
        error: `Kalshi: ${errorMessage}`,
      }));
      
      return [];
    }
  }, []);

  /**
   * Fetch Polymarket markets with error handling
   */
  const fetchPolymarketData = useCallback(async (): Promise<CommonMarket[]> => {
    try {
      const response = await fetchNormalizedPolymarketMarkets();
      
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          connectionStatus: { ...prev.connectionStatus, polymarket: true },
          error: prev.error?.includes('Polymarket') ? null : prev.error,
        }));
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch Polymarket markets');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Polymarket polling error:', errorMessage);
      
      setState(prev => ({
        ...prev,
        connectionStatus: { ...prev.connectionStatus, polymarket: false },
        error: `Polymarket: ${errorMessage}`,
      }));
      
      return [];
    }
  }, []);

  /**
   * Update arbitrage opportunities when market data changes
   */
  const updateArbitrage = useCallback((kalshi: CommonMarket[], polymarket: CommonMarket[]) => {
    try {
      const store = getStore();
      const opportunities = calculateArbitrageOpportunities(
        store.matches,
        kalshi,
        polymarket
      );
      updateArbitrageOpportunities(opportunities);
    } catch (error) {
      console.error('Error updating arbitrage opportunities:', error);
    }
  }, []);

  /**
   * Fetch and update market data
   */
  const refreshData = useCallback(async (source: 'kalshi' | 'polymarket' | 'both' = 'both') => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const store = getStore();
      let kalshiData = store.markets.kalshi;
      let polymarketData = store.markets.polymarket;

      if (source === 'kalshi' || source === 'both') {
        kalshiData = await fetchKalshiData();
      }

      if (source === 'polymarket' || source === 'both') {
        polymarketData = await fetchPolymarketData();
      }

      // Update store with new data
      updateMarkets(kalshiData, polymarketData);

      // Update arbitrage opportunities
      updateArbitrage(kalshiData, polymarketData);

      setState(prev => ({
        ...prev,
        loading: false,
        lastUpdated: new Date(),
      }));
    } catch (error) {
      console.error('Error refreshing data:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Refresh failed',
      }));
    }
  }, [fetchKalshiData, fetchPolymarketData, updateArbitrage]);

  /**
   * Start polling with configured intervals
   */
  const startPolling = useCallback(() => {
    if (isPollingRef.current) return;

    const store = getStore();
    const config = store.polling;

    if (!config.enabled) return;

    isPollingRef.current = true;

    // Initial fetch
    refreshData();

    // Set up Kalshi polling
    intervalRef.current.kalshi = setInterval(() => {
      if (isPollingRef.current) {
        refreshData('kalshi');
      }
    }, config.kalshiInterval);

    // Set up Polymarket polling (more frequent)
    intervalRef.current.polymarket = setInterval(() => {
      if (isPollingRef.current) {
        refreshData('polymarket');
      }
    }, config.polymarketInterval);

    console.log(`Started polling: Kalshi every ${config.kalshiInterval}ms, Polymarket every ${config.polymarketInterval}ms`);
  }, [refreshData]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    isPollingRef.current = false;

    if (intervalRef.current.kalshi) {
      clearInterval(intervalRef.current.kalshi);
      intervalRef.current.kalshi = undefined;
    }

    if (intervalRef.current.polymarket) {
      clearInterval(intervalRef.current.polymarket);
      intervalRef.current.polymarket = undefined;
    }

    console.log('Stopped polling');
  }, []);

  /**
   * Force refresh all data
   */
  const forceRefresh = useCallback(async () => {
    await refreshData('both');
  }, [refreshData]);

  /**
   * Update polling configuration
   */
  const updateConfig = useCallback((newConfig: Partial<PollingConfig>) => {
    const store = getStore();
    const updatedConfig = { ...store.polling, ...newConfig };

    // If polling is currently active, restart with new intervals
    if (isPollingRef.current) {
      stopPolling();
      // Small delay to ensure cleanup
      setTimeout(() => {
        if (updatedConfig.enabled) {
          startPolling();
        }
      }, 100);
    }
  }, [startPolling, stopPolling]);

  // Auto-start polling on mount if enabled
  useEffect(() => {
    const store = getStore();
    if (store.polling.enabled) {
      startPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  // Handle visibility change to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, stop polling
        stopPolling();
      } else {
        // Page is visible again, restart polling
        const store = getStore();
        if (store.polling.enabled) {
          startPolling();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startPolling, stopPolling]);

  return {
    ...state,
    startPolling,
    stopPolling,
    forceRefresh,
    updateConfig,
  };
}

/**
 * Hook for component-specific market data with optional filtering
 */
export function useMarketData(filters?: {
  platform?: 'kalshi' | 'polymarket';
  category?: string;
  search?: string;
}) {
  const { kalshiMarkets, polymarketMarkets, loading, error, lastUpdated } = useLiveOrderbooks();

  const filteredMarkets = useCallback(() => {
    let markets: CommonMarket[] = [];

    if (!filters?.platform || filters.platform === 'kalshi') {
      markets.push(...kalshiMarkets);
    }
    if (!filters?.platform || filters.platform === 'polymarket') {
      markets.push(...polymarketMarkets);
    }

    // Apply category filter
    if (filters?.category) {
      markets = markets.filter(market => 
        market.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    // Apply search filter
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      markets = markets.filter(market =>
        market.title.toLowerCase().includes(searchTerm) ||
        market.category.toLowerCase().includes(searchTerm) ||
        market.id.toLowerCase().includes(searchTerm)
      );
    }

    return markets;
  }, [kalshiMarkets, polymarketMarkets, filters]);

  return {
    markets: filteredMarkets(),
    kalshiMarkets,
    polymarketMarkets,
    loading,
    error,
    lastUpdated,
  };
}

/**
 * TODO: Future enhancement - SSE (Server-Sent Events) support
 * This hook can be extended to accept an SSE endpoint for real-time updates
 * following the pattern mentioned in dashboard.js requirements
 */
export function useSSEOrderbooks(sseEndpoint?: string) {
  // TODO: Implement SSE connection for real-time price updates
  // This would supplement the polling approach with push notifications
  // when price changes occur, reducing latency for arbitrage detection
  
  console.warn('SSE support not yet implemented - using polling fallback');
  return useLiveOrderbooks();
}