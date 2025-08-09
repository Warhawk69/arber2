// Hook for polling live orderbook data with optional SSE support
import { useState, useEffect, useCallback, useRef } from 'react';
import { CommonMarket } from '../api/types';
import { fetchNormalizedKalshiMarkets } from '../api/kalshi';
import { fetchNormalizedPolymarketMarkets } from '../api/polymarket';

interface LiveOrderbooksState {
  kalshiMarkets: CommonMarket[];
  polymarketMarkets: CommonMarket[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseLiveOrderbooksOptions {
  kalshiPollingInterval?: number; // milliseconds, default 5000 (5s)
  polymarketPollingInterval?: number; // milliseconds, default 2500 (2.5s)
  enablePolling?: boolean; // default true
  sseEndpoint?: string; // optional SSE endpoint for future integration
  includeOrderbooks?: boolean; // whether to fetch full orderbook data
  onError?: (error: string, platform: string) => void;
}

/**
 * Hook for managing live orderbook data from Kalshi and Polymarket
 * Implements polling with configurable intervals and error handling
 * Structure allows for future SSE integration without breaking changes
 */
export function useLiveOrderbooks(options: UseLiveOrderbooksOptions = {}) {
  const {
    kalshiPollingInterval = 5000,
    polymarketPollingInterval = 2500,
    enablePolling = true,
    sseEndpoint,
    includeOrderbooks = false,
    onError
  } = options;

  const [state, setState] = useState<LiveOrderbooksState>({
    kalshiMarkets: [],
    polymarketMarkets: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  // Track polling intervals
  const kalshiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const polymarketIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  // Fetch Kalshi markets
  const fetchKalshiData = useCallback(async () => {
    try {
      const markets = await fetchNormalizedKalshiMarkets(includeOrderbooks);
      
      setState(prev => ({
        ...prev,
        kalshiMarkets: markets,
        error: prev.error?.includes('Polymarket') ? prev.error : null,
        lastUpdated: new Date()
      }));
    } catch (error) {
      const errorMessage = `Kalshi API Error: ${error.message}`;
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
      
      if (onError) {
        onError(error.message, 'Kalshi');
      }
    }
  }, [includeOrderbooks, onError]);

  // Fetch Polymarket markets
  const fetchPolymarketData = useCallback(async () => {
    try {
      const markets = await fetchNormalizedPolymarketMarkets(includeOrderbooks);
      
      setState(prev => ({
        ...prev,
        polymarketMarkets: markets,
        error: prev.error?.includes('Kalshi') ? prev.error : null,
        lastUpdated: new Date()
      }));
    } catch (error) {
      const errorMessage = `Polymarket API Error: ${error.message}`;
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
      
      if (onError) {
        onError(error.message, 'Polymarket');
      }
    }
  }, [includeOrderbooks, onError]);

  // Initial data fetch
  const fetchInitialData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    // Fetch both platforms concurrently
    await Promise.allSettled([
      fetchKalshiData(),
      fetchPolymarketData()
    ]);
    
    setState(prev => ({ ...prev, loading: false }));
  }, [fetchKalshiData, fetchPolymarketData]);

  // Setup SSE connection (future feature)
  const setupSSE = useCallback(() => {
    if (!sseEndpoint) return;

    // TODO: Implement SSE connection following dashboard.js pattern
    // This is structured for future implementation when SSE relay is available
    console.log('SSE endpoint provided but not yet implemented:', sseEndpoint);
    
    /*
    try {
      const eventSource = new EventSource(sseEndpoint);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Handle real-time updates
          // Update specific market prices without full refetch
        } catch (error) {
          console.error('SSE message parsing error:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        eventSource.close();
      };
      
      sseRef.current = eventSource;
    } catch (error) {
      console.error('Failed to establish SSE connection:', error);
    }
    */
  }, [sseEndpoint]);

  // Setup polling intervals
  useEffect(() => {
    if (!enablePolling) return;

    // Clear existing intervals
    if (kalshiIntervalRef.current) clearInterval(kalshiIntervalRef.current);
    if (polymarketIntervalRef.current) clearInterval(polymarketIntervalRef.current);

    // Setup Kalshi polling
    kalshiIntervalRef.current = setInterval(() => {
      fetchKalshiData();
    }, kalshiPollingInterval);

    // Setup Polymarket polling
    polymarketIntervalRef.current = setInterval(() => {
      fetchPolymarketData();
    }, polymarketPollingInterval);

    return () => {
      if (kalshiIntervalRef.current) clearInterval(kalshiIntervalRef.current);
      if (polymarketIntervalRef.current) clearInterval(polymarketIntervalRef.current);
    };
  }, [enablePolling, kalshiPollingInterval, polymarketPollingInterval, fetchKalshiData, fetchPolymarketData]);

  // Setup SSE connection
  useEffect(() => {
    setupSSE();

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
    };
  }, [setupSSE]);

  // Initial data load
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchInitialData();
  }, [fetchInitialData]);

  // Get market by ID from either platform
  const getMarketById = useCallback((id: string, platform?: 'Kalshi' | 'Polymarket'): CommonMarket | null => {
    if (platform === 'Kalshi' || !platform) {
      const kalshiMarket = state.kalshiMarkets.find(m => m.id === id);
      if (kalshiMarket) return kalshiMarket;
    }
    
    if (platform === 'Polymarket' || !platform) {
      const polyMarket = state.polymarketMarkets.find(m => m.id === id);
      if (polyMarket) return polyMarket;
    }
    
    return null;
  }, [state.kalshiMarkets, state.polymarketMarkets]);

  // Filter markets by category
  const getMarketsByCategory = useCallback((category: string): CommonMarket[] => {
    const allMarkets = [...state.kalshiMarkets, ...state.polymarketMarkets];
    return allMarkets.filter(market => 
      market.category.toLowerCase().includes(category.toLowerCase())
    );
  }, [state.kalshiMarkets, state.polymarketMarkets]);

  // Get combined market count
  const getTotalMarketCount = useCallback((): number => {
    return state.kalshiMarkets.length + state.polymarketMarkets.length;
  }, [state.kalshiMarkets.length, state.polymarketMarkets.length]);

  // Check if data is stale (older than 2x polling interval)
  const isDataStale = useCallback((): boolean => {
    if (!state.lastUpdated) return true;
    
    const staleThreshold = Math.max(kalshiPollingInterval, polymarketPollingInterval) * 2;
    const timeSinceUpdate = Date.now() - state.lastUpdated.getTime();
    
    return timeSinceUpdate > staleThreshold;
  }, [state.lastUpdated, kalshiPollingInterval, polymarketPollingInterval]);

  return {
    // State
    ...state,
    
    // Derived state
    allMarkets: [...state.kalshiMarkets, ...state.polymarketMarkets],
    totalMarkets: getTotalMarketCount(),
    isStale: isDataStale(),
    
    // Actions
    refresh,
    getMarketById,
    getMarketsByCategory,
    
    // Connection status
    isPolling: enablePolling,
    hasSSE: !!sseEndpoint,
    
    // Platform-specific counts
    kalshiMarketCount: state.kalshiMarkets.length,
    polymarketMarketCount: state.polymarketMarkets.length
  };
}

/**
 * Simplified hook for just getting live markets without advanced features
 */
export function useSimpleLiveMarkets() {
  return useLiveOrderbooks({
    includeOrderbooks: false,
    kalshiPollingInterval: 10000, // 10s for lighter polling
    polymarketPollingInterval: 10000,
  });
}

/**
 * Hook optimized for arbitrage detection with full orderbook data
 */
export function useArbitrageLiveData() {
  return useLiveOrderbooks({
    includeOrderbooks: true,
    kalshiPollingInterval: 5000,
    polymarketPollingInterval: 2500,
    onError: (error, platform) => {
      console.warn(`${platform} arbitrage data error:`, error);
    }
  });
}