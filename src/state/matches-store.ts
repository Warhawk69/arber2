// Central store for matched markets and ecosystems with localStorage persistence
import {
  MatchesStore,
  CommonMarket,
  MarketMatch,
  Ecosystem,
  ArbitrageOpportunity,
  PollingConfig,
  Platform
} from '../api/types';

// Default store state
const defaultState: MatchesStore = {
  markets: {
    kalshi: [],
    polymarket: [],
    lastUpdated: new Date(),
  },
  matches: [],
  ecosystems: [],
  arbitrageOpportunities: [],
  polling: {
    kalshiInterval: 5000, // 5 seconds
    polymarketInterval: 2500, // 2.5 seconds 
    enabled: true,
  },
};

// Storage keys
const STORAGE_KEYS = {
  MATCHES: 'arber2_matches',
  ECOSYSTEMS: 'arber2_ecosystems',
  POLLING_CONFIG: 'arber2_polling_config',
  LAST_UPDATED: 'arber2_last_updated',
} as const;

/**
 * Load persisted data from localStorage
 */
function loadFromStorage(): Partial<MatchesStore> {
  try {
    const stored: Partial<MatchesStore> = {};

    // Load matches
    const matchesData = localStorage.getItem(STORAGE_KEYS.MATCHES);
    if (matchesData) {
      const matches = JSON.parse(matchesData);
      // Convert date strings back to Date objects
      stored.matches = matches.map((match: any) => ({
        ...match,
        createdAt: new Date(match.createdAt),
        conditionMappings: match.conditionMappings.map((mapping: any) => ({
          ...mapping,
          createdAt: new Date(mapping.createdAt),
        })),
      }));
    }

    // Load ecosystems
    const ecosystemsData = localStorage.getItem(STORAGE_KEYS.ECOSYSTEMS);
    if (ecosystemsData) {
      const ecosystems = JSON.parse(ecosystemsData);
      stored.ecosystems = ecosystems.map((ecosystem: any) => ({
        ...ecosystem,
        createdAt: new Date(ecosystem.createdAt),
        earliestEndTime: ecosystem.earliestEndTime ? new Date(ecosystem.earliestEndTime) : undefined,
        conditionMappings: ecosystem.conditionMappings.map((mapping: any) => ({
          ...mapping,
          createdAt: new Date(mapping.createdAt),
        })),
      }));
    }

    // Load polling config
    const pollingData = localStorage.getItem(STORAGE_KEYS.POLLING_CONFIG);
    if (pollingData) {
      stored.polling = JSON.parse(pollingData);
    }

    // Load last updated timestamp
    const lastUpdatedData = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
    if (lastUpdatedData) {
      stored.markets = {
        kalshi: [],
        polymarket: [],
        lastUpdated: new Date(lastUpdatedData),
      };
    }

    return stored;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return {};
  }
}

/**
 * Save data to localStorage
 */
function saveToStorage(key: keyof typeof STORAGE_KEYS, data: any): void {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

// Initialize store with persisted data
let store: MatchesStore = {
  ...defaultState,
  ...loadFromStorage(),
};

// Subscribers for store updates
type StoreSubscriber = (store: MatchesStore) => void;
const subscribers = new Set<StoreSubscriber>();

/**
 * Subscribe to store updates
 */
export function subscribeToStore(callback: StoreSubscriber): () => void {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Notify all subscribers of store changes
 */
function notifySubscribers(): void {
  subscribers.forEach(callback => callback(store));
}

/**
 * Get current store state (read-only)
 */
export function getStore(): Readonly<MatchesStore> {
  return store;
}

/**
 * Update market data
 */
export function updateMarkets(kalshi: CommonMarket[], polymarket: CommonMarket[]): void {
  store.markets = {
    kalshi,
    polymarket,
    lastUpdated: new Date(),
  };
  
  saveToStorage('LAST_UPDATED', store.markets.lastUpdated);
  notifySubscribers();
}

/**
 * Add a new market match
 */
export function addMarketMatch(match: MarketMatch): void {
  // Check if match already exists
  const existingIndex = store.matches.findIndex(m => 
    m.kalshiMarketId === match.kalshiMarketId && 
    m.polymarketMarketId === match.polymarketMarketId
  );

  if (existingIndex >= 0) {
    // Update existing match
    store.matches[existingIndex] = match;
  } else {
    // Add new match
    store.matches.push(match);
  }

  saveToStorage('MATCHES', store.matches);
  notifySubscribers();
}

/**
 * Update condition mappings for a match
 */
export function updateMatchConditions(matchId: string, conditionMappings: any[]): void {
  const matchIndex = store.matches.findIndex(m => m.id === matchId);
  if (matchIndex >= 0) {
    store.matches[matchIndex] = {
      ...store.matches[matchIndex],
      conditionMappings,
      conditionsMatched: conditionMappings.length > 0,
    };

    saveToStorage('MATCHES', store.matches);
    notifySubscribers();
  }
}

/**
 * Remove a market match
 */
export function removeMarketMatch(matchId: string): void {
  store.matches = store.matches.filter(m => m.id !== matchId);
  saveToStorage('MATCHES', store.matches);
  notifySubscribers();
}

/**
 * Add a new ecosystem
 */
export function addEcosystem(ecosystem: Ecosystem): void {
  store.ecosystems.push(ecosystem);
  saveToStorage('ECOSYSTEMS', store.ecosystems);
  notifySubscribers();
}

/**
 * Update ecosystem condition mappings
 */
export function updateEcosystemConditions(ecosystemId: string, conditionMappings: any[]): void {
  const ecosystemIndex = store.ecosystems.findIndex(e => e.id === ecosystemId);
  if (ecosystemIndex >= 0) {
    store.ecosystems[ecosystemIndex] = {
      ...store.ecosystems[ecosystemIndex],
      conditionMappings,
      conditionsMatched: conditionMappings.length > 0,
    };

    saveToStorage('ECOSYSTEMS', store.ecosystems);
    notifySubscribers();
  }
}

/**
 * Remove an ecosystem
 */
export function removeEcosystem(ecosystemId: string): void {
  store.ecosystems = store.ecosystems.filter(e => e.id !== ecosystemId);
  saveToStorage('ECOSYSTEMS', store.ecosystems);
  notifySubscribers();
}

/**
 * Create a new ecosystem from selected markets
 */
export function createEcosystem(
  name: string,
  selectedMarkets: Array<{ market: CommonMarket; platform: Platform }>
): Ecosystem {
  // Calculate derived stats
  const exchanges = new Set(selectedMarkets.map(m => m.platform)).size;
  const markets = selectedMarkets.length;
  const conditions = selectedMarkets.reduce((sum, m) => sum + m.market.outcomes.length, 0);
  
  // Find earliest end time
  const endTimes = selectedMarkets.map(m => m.market.closeTime.getTime());
  const earliestEndTime = endTimes.length > 0 ? new Date(Math.min(...endTimes)) : undefined;

  const ecosystem: Ecosystem = {
    id: `ecosystem-${Date.now()}`,
    name,
    createdAt: new Date(),
    marketRefs: selectedMarkets.map(m => ({
      platform: m.platform,
      marketId: m.market.id,
      market: m.market,
    })),
    conditionMappings: [],
    conditionsMatched: false,
    exchanges,
    markets,
    conditions,
    earliestEndTime,
  };

  addEcosystem(ecosystem);
  return ecosystem;
}

/**
 * Update arbitrage opportunities
 */
export function updateArbitrageOpportunities(opportunities: ArbitrageOpportunity[]): void {
  store.arbitrageOpportunities = opportunities;
  notifySubscribers();
}

/**
 * Update polling configuration
 */
export function updatePollingConfig(config: Partial<PollingConfig>): void {
  store.polling = { ...store.polling, ...config };
  saveToStorage('POLLING_CONFIG', store.polling);
  notifySubscribers();
}

/**
 * Get markets by platform
 */
export function getMarketsByPlatform(platform: Platform): CommonMarket[] {
  return store.markets[platform] || [];
}

/**
 * Get market by ID and platform
 */
export function getMarket(platform: Platform, marketId: string): CommonMarket | undefined {
  return store.markets[platform].find(m => m.id === marketId);
}

/**
 * Get all matched markets with condition mappings
 */
export function getMatchedMarketsWithConditions(): MarketMatch[] {
  return store.matches.filter(match => match.conditionsMatched);
}

/**
 * Get ecosystems with matched conditions
 */
export function getEcosystemsWithConditions(): Ecosystem[] {
  return store.ecosystems.filter(ecosystem => ecosystem.conditionsMatched);
}

/**
 * Clear all stored data (for testing/reset)
 */
export function clearStore(): void {
  store = { ...defaultState };
  
  // Clear localStorage
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  
  notifySubscribers();
}

/**
 * Export data for backup
 */
export function exportStoreData(): string {
  const exportData = {
    matches: store.matches,
    ecosystems: store.ecosystems,
    polling: store.polling,
    exportedAt: new Date().toISOString(),
  };
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Import data from backup
 */
export function importStoreData(jsonData: string): boolean {
  try {
    const importData = JSON.parse(jsonData);
    
    if (importData.matches) {
      store.matches = importData.matches.map((match: any) => ({
        ...match,
        createdAt: new Date(match.createdAt),
        conditionMappings: match.conditionMappings.map((mapping: any) => ({
          ...mapping,
          createdAt: new Date(mapping.createdAt),
        })),
      }));
      saveToStorage('MATCHES', store.matches);
    }
    
    if (importData.ecosystems) {
      store.ecosystems = importData.ecosystems.map((ecosystem: any) => ({
        ...ecosystem,
        createdAt: new Date(ecosystem.createdAt),
        earliestEndTime: ecosystem.earliestEndTime ? new Date(ecosystem.earliestEndTime) : undefined,
        conditionMappings: ecosystem.conditionMappings.map((mapping: any) => ({
          ...mapping,
          createdAt: new Date(mapping.createdAt),
        })),
      }));
      saveToStorage('ECOSYSTEMS', store.ecosystems);
    }
    
    if (importData.polling) {
      store.polling = importData.polling;
      saveToStorage('POLLING_CONFIG', store.polling);
    }
    
    notifySubscribers();
    return true;
  } catch (error) {
    console.error('Error importing store data:', error);
    return false;
  }
}

/**
 * Get store statistics
 */
export function getStoreStats() {
  return {
    totalMatches: store.matches.length,
    matchesWithConditions: store.matches.filter(m => m.conditionsMatched).length,
    totalEcosystems: store.ecosystems.length,
    ecosystemsWithConditions: store.ecosystems.filter(e => e.conditionsMatched).length,
    totalArbitrageOpportunities: store.arbitrageOpportunities.length,
    kalshiMarkets: store.markets.kalshi.length,
    polymarketMarkets: store.markets.polymarket.length,
    lastUpdated: store.markets.lastUpdated,
  };
}