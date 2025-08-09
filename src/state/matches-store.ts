// Central state management store for matches and ecosystems
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Match, Ecosystem, MatchesStore } from '../api/types';

// Action types
type MatchesAction = 
  | { type: 'ADD_MATCH'; payload: Omit<Match, 'id' | 'createdAt'> }
  | { type: 'UPDATE_MATCH'; payload: { id: string; updates: Partial<Match> } }
  | { type: 'REMOVE_MATCH'; payload: string }
  | { type: 'ADD_ECOSYSTEM'; payload: Omit<Ecosystem, 'id' | 'createdAt'> }
  | { type: 'UPDATE_ECOSYSTEM'; payload: { id: string; updates: Partial<Ecosystem> } }
  | { type: 'REMOVE_ECOSYSTEM'; payload: string }
  | { type: 'LOAD_FROM_STORAGE'; payload: { matches: Match[]; ecosystems: Ecosystem[] } }
  | { type: 'CLEAR_ALL' };

// State interface
interface MatchesState {
  matches: Match[];
  ecosystems: Ecosystem[];
}

// Initial state
const initialState: MatchesState = {
  matches: [],
  ecosystems: [],
};

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Reducer
function matchesReducer(state: MatchesState, action: MatchesAction): MatchesState {
  switch (action.type) {
    case 'ADD_MATCH': {
      const newMatch: Match = {
        ...action.payload,
        id: generateId(),
        createdAt: new Date(),
      };
      return {
        ...state,
        matches: [newMatch, ...state.matches],
      };
    }

    case 'UPDATE_MATCH': {
      return {
        ...state,
        matches: state.matches.map(match =>
          match.id === action.payload.id
            ? { ...match, ...action.payload.updates }
            : match
        ),
      };
    }

    case 'REMOVE_MATCH': {
      return {
        ...state,
        matches: state.matches.filter(match => match.id !== action.payload),
      };
    }

    case 'ADD_ECOSYSTEM': {
      const newEcosystem: Ecosystem = {
        ...action.payload,
        id: generateId(),
        createdAt: new Date(),
      };
      return {
        ...state,
        ecosystems: [newEcosystem, ...state.ecosystems],
      };
    }

    case 'UPDATE_ECOSYSTEM': {
      return {
        ...state,
        ecosystems: state.ecosystems.map(ecosystem =>
          ecosystem.id === action.payload.id
            ? { ...ecosystem, ...action.payload.updates }
            : ecosystem
        ),
      };
    }

    case 'REMOVE_ECOSYSTEM': {
      return {
        ...state,
        ecosystems: state.ecosystems.filter(ecosystem => ecosystem.id !== action.payload),
      };
    }

    case 'LOAD_FROM_STORAGE': {
      return {
        matches: action.payload.matches,
        ecosystems: action.payload.ecosystems,
      };
    }

    case 'CLEAR_ALL': {
      return initialState;
    }

    default:
      return state;
  }
}

// Storage utilities
const STORAGE_KEYS = {
  MATCHES: 'arbitrage-matches',
  ECOSYSTEMS: 'arbitrage-ecosystems',
};

const saveToLocalStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn(`Failed to save to localStorage:`, error);
  }
};

const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      // Convert date strings back to Date objects
      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          ...item,
          createdAt: new Date(item.createdAt),
        })) as T;
      }
      return parsed;
    }
  } catch (error) {
    console.warn(`Failed to load from localStorage:`, error);
  }
  return defaultValue;
};

// Context
const MatchesContext = createContext<{
  state: MatchesState;
  dispatch: React.Dispatch<MatchesAction>;
  store: MatchesStore;
} | null>(null);

// Provider component
interface MatchesProviderProps {
  children: ReactNode;
}

export const MatchesProvider: React.FC<MatchesProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(matchesReducer, initialState);

  // Load from localStorage on mount
  useEffect(() => {
    const matches = loadFromLocalStorage<Match[]>(STORAGE_KEYS.MATCHES, []);
    const ecosystems = loadFromLocalStorage<Ecosystem[]>(STORAGE_KEYS.ECOSYSTEMS, []);
    
    dispatch({
      type: 'LOAD_FROM_STORAGE',
      payload: { matches, ecosystems },
    });
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (state.matches.length > 0 || state.ecosystems.length > 0) {
      saveToLocalStorage(STORAGE_KEYS.MATCHES, state.matches);
      saveToLocalStorage(STORAGE_KEYS.ECOSYSTEMS, state.ecosystems);
    }
  }, [state.matches, state.ecosystems]);

  // Store interface implementation
  const store: MatchesStore = {
    matches: state.matches,
    ecosystems: state.ecosystems,

    addMatch: (match) => {
      dispatch({ type: 'ADD_MATCH', payload: match });
    },

    updateMatch: (id, updates) => {
      dispatch({ type: 'UPDATE_MATCH', payload: { id, updates } });
    },

    removeMatch: (id) => {
      dispatch({ type: 'REMOVE_MATCH', payload: id });
    },

    addEcosystem: (ecosystem) => {
      dispatch({ type: 'ADD_ECOSYSTEM', payload: ecosystem });
    },

    updateEcosystem: (id, updates) => {
      dispatch({ type: 'UPDATE_ECOSYSTEM', payload: { id, updates } });
    },

    removeEcosystem: (id) => {
      dispatch({ type: 'REMOVE_ECOSYSTEM', payload: id });
    },

    loadFromStorage: () => {
      const matches = loadFromLocalStorage<Match[]>(STORAGE_KEYS.MATCHES, []);
      const ecosystems = loadFromLocalStorage<Ecosystem[]>(STORAGE_KEYS.ECOSYSTEMS, []);
      
      dispatch({
        type: 'LOAD_FROM_STORAGE',
        payload: { matches, ecosystems },
      });
    },

    saveToStorage: () => {
      saveToLocalStorage(STORAGE_KEYS.MATCHES, state.matches);
      saveToLocalStorage(STORAGE_KEYS.ECOSYSTEMS, state.ecosystems);
    },
  };

  return (
    <MatchesContext.Provider value={{ state, dispatch, store }}>
      {children}
    </MatchesContext.Provider>
  );
};

// Hook to use the matches store
export const useMatchesStore = (): MatchesStore => {
  const context = useContext(MatchesContext);
  if (!context) {
    throw new Error('useMatchesStore must be used within a MatchesProvider');
  }
  return context.store;
};

// Hook to get raw state (for debugging)
export const useMatchesState = (): MatchesState => {
  const context = useContext(MatchesContext);
  if (!context) {
    throw new Error('useMatchesState must be used within a MatchesProvider');
  }
  return context.state;
};

// Utility functions for working with matches and ecosystems
export class MatchesStoreUtils {
  /**
   * Find a match by market IDs
   */
  static findMatchByMarkets(
    matches: Match[], 
    kalshiMarketId: string, 
    polymarketMarketId: string
  ): Match | undefined {
    return matches.find(
      match => 
        match.kalshiMarketId === kalshiMarketId && 
        match.polymarketMarketId === polymarketMarketId
    );
  }

  /**
   * Get all matched market IDs
   */
  static getMatchedMarketIds(matches: Match[]): {
    kalshi: Set<string>;
    polymarket: Set<string>;
  } {
    const kalshi = new Set<string>();
    const polymarket = new Set<string>();

    matches.forEach(match => {
      kalshi.add(match.kalshiMarketId);
      polymarket.add(match.polymarketMarketId);
    });

    return { kalshi, polymarket };
  }

  /**
   * Get all ecosystem market IDs
   */
  static getEcosystemMarketIds(ecosystems: Ecosystem[]): Set<string> {
    const marketIds = new Set<string>();

    ecosystems.forEach(ecosystem => {
      ecosystem.marketRefs.forEach(ref => {
        marketIds.add(ref.marketId);
      });
    });

    return marketIds;
  }

  /**
   * Find ecosystems containing a specific market
   */
  static findEcosystemsWithMarket(
    ecosystems: Ecosystem[], 
    marketId: string, 
    platform: 'kalshi' | 'polymarket'
  ): Ecosystem[] {
    return ecosystems.filter(ecosystem =>
      ecosystem.marketRefs.some(ref => 
        ref.marketId === marketId && ref.platform === platform
      )
    );
  }

  /**
   * Get matches with completed condition mappings
   */
  static getMatchesWithConditionMappings(matches: Match[]): Match[] {
    return matches.filter(match => 
      match.conditionsMatched && match.conditionMappings.length > 0
    );
  }

  /**
   * Get ecosystems with completed condition mappings
   */
  static getEcosystemsWithConditionMappings(ecosystems: Ecosystem[]): Ecosystem[] {
    return ecosystems.filter(ecosystem => 
      ecosystem.conditionsMatched && ecosystem.conditionMappings.length > 0
    );
  }

  /**
   * Calculate statistics for the store
   */
  static calculateStats(matches: Match[], ecosystems: Ecosystem[]): {
    totalMatches: number;
    matchesWithConditions: number;
    totalEcosystems: number;
    ecosystemsWithConditions: number;
    totalMarketsCovered: number;
    averageConditionsPerMatch: number;
  } {
    const matchesWithConditions = matches.filter(m => m.conditionsMatched).length;
    const ecosystemsWithConditions = ecosystems.filter(e => e.conditionsMatched).length;
    
    const allMarketIds = new Set<string>();
    matches.forEach(match => {
      allMarketIds.add(match.kalshiMarketId);
      allMarketIds.add(match.polymarketMarketId);
    });
    ecosystems.forEach(ecosystem => {
      ecosystem.marketRefs.forEach(ref => {
        allMarketIds.add(ref.marketId);
      });
    });

    const totalConditions = matches.reduce((sum, match) => sum + match.conditionMappings.length, 0);
    const averageConditionsPerMatch = matches.length > 0 ? totalConditions / matches.length : 0;

    return {
      totalMatches: matches.length,
      matchesWithConditions,
      totalEcosystems: ecosystems.length,
      ecosystemsWithConditions,
      totalMarketsCovered: allMarketIds.size,
      averageConditionsPerMatch,
    };
  }

  /**
   * Export data for backup/sharing
   */
  static exportData(matches: Match[], ecosystems: Ecosystem[]): {
    version: string;
    timestamp: string;
    matches: Match[];
    ecosystems: Ecosystem[];
  } {
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      matches,
      ecosystems,
    };
  }

  /**
   * Import data from backup
   */
  static importData(data: any): {
    matches: Match[];
    ecosystems: Ecosystem[];
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    let matches: Match[] = [];
    let ecosystems: Ecosystem[] = [];
    let isValid = true;

    try {
      if (!data.matches || !Array.isArray(data.matches)) {
        errors.push('Invalid matches data');
        isValid = false;
      } else {
        matches = data.matches.map((match: any) => ({
          ...match,
          createdAt: new Date(match.createdAt),
        }));
      }

      if (!data.ecosystems || !Array.isArray(data.ecosystems)) {
        errors.push('Invalid ecosystems data');
        isValid = false;
      } else {
        ecosystems = data.ecosystems.map((ecosystem: any) => ({
          ...ecosystem,
          createdAt: new Date(ecosystem.createdAt),
        }));
      }
    } catch (error) {
      errors.push(`Import error: ${error}`);
      isValid = false;
    }

    return { matches, ecosystems, isValid, errors };
  }
}

export default MatchesStoreUtils;