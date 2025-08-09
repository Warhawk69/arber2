// Polling service for market data
import { useState, useEffect, useRef } from 'react';
import { fetchPolymarketMarkets, fetchPolymarketOrderbook } from './polymarket';
import { fetchKalshiMarkets, fetchKalshiOrderbook } from './kalshi';
import { Market, OrderbookSnapshot, PollingConfig } from '../types';

// Default polling configuration
const DEFAULT_CONFIG: PollingConfig = {
  polymarketInterval: 2500, // 2.5 seconds as specified
  kalshiInterval: 5000, // 5 seconds as specified
  enabled: true
};

// Market data hook
export function useMarketData() {
  const [kalshiMarkets, setKalshiMarkets] = useState<Market[]>([]);
  const [polymarketMarkets, setPolymarketMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [kalshiResponse, polyResponse] = await Promise.all([
          fetchKalshiMarkets(),
          fetchPolymarketMarkets()
        ]);

        if (!mounted) return;

        if (!kalshiResponse.success) {
          throw new Error(`Kalshi API error: ${kalshiResponse.error}`);
        }

        if (!polyResponse.success) {
          throw new Error(`Polymarket API error: ${polyResponse.error}`);
        }

        setKalshiMarkets(kalshiResponse.data);
        setPolymarketMarkets(polyResponse.data);
        setLastUpdated(new Date());
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const refreshData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [kalshiResponse, polyResponse] = await Promise.all([
        fetchKalshiMarkets(),
        fetchPolymarketMarkets()
      ]);

      if (!kalshiResponse.success) {
        throw new Error(`Kalshi API error: ${kalshiResponse.error}`);
      }

      if (!polyResponse.success) {
        throw new Error(`Polymarket API error: ${polyResponse.error}`);
      }

      setKalshiMarkets(kalshiResponse.data);
      setPolymarketMarkets(polyResponse.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return {
    kalshiMarkets,
    polymarketMarkets,
    loading,
    error,
    lastUpdated,
    refreshData
  };
}

// Orderbook polling hook for specific markets
export function useOrderbookPolling(
  subscriptions: Array<{ exchange: 'kalshi' | 'polymarket'; marketId: string; conditionName?: string }>,
  config: Partial<PollingConfig> = {}
) {
  const [orderbooks, setOrderbooks] = useState<Map<string, OrderbookSnapshot>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!finalConfig.enabled || subscriptions.length === 0) {
      return;
    }

    const fetchOrderbook = async (subscription: typeof subscriptions[0]) => {
      try {
        const key = `${subscription.exchange}-${subscription.marketId}-${subscription.conditionName || 'default'}`;
        
        let response;
        if (subscription.exchange === 'kalshi') {
          response = await fetchKalshiOrderbook(subscription.marketId, subscription.conditionName);
        } else {
          if (!subscription.conditionName) {
            throw new Error('Condition name required for Polymarket orderbook');
          }
          response = await fetchPolymarketOrderbook(subscription.marketId, subscription.conditionName);
        }

        if (response.success) {
          setOrderbooks(prev => new Map(prev).set(key, response.data));
        } else {
          console.error(`Failed to fetch orderbook for ${key}:`, response.error);
        }
      } catch (err) {
        console.error(`Error fetching orderbook:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    // Set up polling for each subscription
    subscriptions.forEach(subscription => {
      const key = `${subscription.exchange}-${subscription.marketId}-${subscription.conditionName || 'default'}`;
      
      // Initial fetch
      fetchOrderbook(subscription);
      
      // Set up interval
      const interval = subscription.exchange === 'kalshi' 
        ? finalConfig.kalshiInterval 
        : finalConfig.polymarketInterval;
        
      const timeoutId = setInterval(() => fetchOrderbook(subscription), interval);
      intervalsRef.current.set(key, timeoutId);
    });

    // Cleanup function
    return () => {
      intervalsRef.current.forEach(timeoutId => clearInterval(timeoutId));
      intervalsRef.current.clear();
    };
  }, [subscriptions, finalConfig]);

  const getOrderbook = (exchange: string, marketId: string, conditionName?: string): OrderbookSnapshot | undefined => {
    const key = `${exchange}-${marketId}-${conditionName || 'default'}`;
    return orderbooks.get(key);
  };

  return {
    orderbooks,
    loading,
    error,
    getOrderbook
  };
}

// Simplified polling hook for basic price updates
export function usePricePolling(config: Partial<PollingConfig> = {}) {
  const [kalshiMarkets, setKalshiMarkets] = useState<Market[]>([]);
  const [polymarketMarkets, setPolymarketMarkets] = useState<Market[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const kalshiIntervalRef = useRef<NodeJS.Timeout>();
  const polyIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!finalConfig.enabled) {
      return;
    }

    const fetchKalshiData = async () => {
      try {
        const response = await fetchKalshiMarkets();
        if (response.success) {
          setKalshiMarkets(response.data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('Error fetching Kalshi data:', err);
      }
    };

    const fetchPolymarketData = async () => {
      try {
        const response = await fetchPolymarketMarkets();
        if (response.success) {
          setPolymarketMarkets(response.data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('Error fetching Polymarket data:', err);
      }
    };

    // Initial fetch
    fetchKalshiData();
    fetchPolymarketData();

    // Set up intervals
    kalshiIntervalRef.current = setInterval(fetchKalshiData, finalConfig.kalshiInterval);
    polyIntervalRef.current = setInterval(fetchPolymarketData, finalConfig.polymarketInterval);

    return () => {
      if (kalshiIntervalRef.current) clearInterval(kalshiIntervalRef.current);
      if (polyIntervalRef.current) clearInterval(polyIntervalRef.current);
    };
  }, [finalConfig]);

  return {
    kalshiMarkets,
    polymarketMarkets,
    lastUpdated
  };
}