// LocalStorage-backed store for market matches
import { MatchedMarketPair, MatchStore } from '../types';

const STORAGE_KEY = 'arber2_match_store';

// Load matches from localStorage
function loadMatches(): MatchedMarketPair[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const data: MatchStore = JSON.parse(stored);
    return data.matches || [];
  } catch (error) {
    console.error('Error loading matches from localStorage:', error);
    return [];
  }
}

// Save matches to localStorage
function saveMatches(matches: MatchedMarketPair[]): void {
  try {
    const data: MatchStore = {
      matches,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving matches to localStorage:', error);
  }
}

// Store class for managing market matches
class MatchStoreManager {
  private matches: MatchedMarketPair[] = [];
  private listeners: Array<(matches: MatchedMarketPair[]) => void> = [];

  constructor() {
    this.matches = loadMatches();
  }

  // Get all matches
  getMatches(): MatchedMarketPair[] {
    return [...this.matches];
  }

  // Get matches with condition mappings
  getMatchesWithConditions(): MatchedMarketPair[] {
    return this.matches.filter(match => match.conditionsMatched && match.conditionMappings.length > 0);
  }

  // Get a specific match by ID
  getMatch(id: number): MatchedMarketPair | undefined {
    return this.matches.find(match => match.id === id);
  }

  // Add a new match
  addMatch(match: Omit<MatchedMarketPair, 'id'>): MatchedMarketPair {
    const newMatch: MatchedMarketPair = {
      ...match,
      id: Date.now() + Math.random() // Simple ID generation
    };
    
    this.matches.push(newMatch);
    this.save();
    this.notifyListeners();
    
    return newMatch;
  }

  // Update an existing match
  updateMatch(id: number, updates: Partial<MatchedMarketPair>): boolean {
    const index = this.matches.findIndex(match => match.id === id);
    if (index === -1) return false;
    
    this.matches[index] = { ...this.matches[index], ...updates };
    this.save();
    this.notifyListeners();
    
    return true;
  }

  // Remove a match
  removeMatch(id: number): boolean {
    const index = this.matches.findIndex(match => match.id === id);
    if (index === -1) return false;
    
    this.matches.splice(index, 1);
    this.save();
    this.notifyListeners();
    
    return true;
  }

  // Get matches by Kalshi market ID
  getMatchesByKalshiMarket(kalshiMarketId: string): MatchedMarketPair[] {
    return this.matches.filter(match => match.kalshiMarketId === kalshiMarketId);
  }

  // Get matches by Polymarket market ID
  getMatchesByPolymarketMarket(polymarketMarketId: string): MatchedMarketPair[] {
    return this.matches.filter(match => match.polymarketMarketId === polymarketMarketId);
  }

  // Check if markets are already matched
  areMarketsMatched(kalshiMarketId: string, polymarketMarketId: string): boolean {
    return this.matches.some(match => 
      match.kalshiMarketId === kalshiMarketId && 
      match.polymarketMarketId === polymarketMarketId
    );
  }

  // Get matches that expire soon (within specified days)
  getExpiringMatches(days: number = 7): MatchedMarketPair[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    
    return this.matches.filter(match => {
      const endDate = new Date(match.earliestEndTime);
      return endDate <= cutoffDate;
    });
  }

  // Calculate total volume across all matches
  getTotalVolume(): number {
    return this.matches.reduce((sum, match) => sum + match.volume, 0);
  }

  // Get statistics
  getStats() {
    const total = this.matches.length;
    const withConditions = this.getMatchesWithConditions().length;
    const totalVolume = this.getTotalVolume();
    const avgVolume = total > 0 ? totalVolume / total : 0;
    
    return {
      totalMatches: total,
      matchesWithConditions: withConditions,
      matchesWithoutConditions: total - withConditions,
      totalVolume,
      averageVolume: avgVolume,
      completionRate: total > 0 ? withConditions / total : 0
    };
  }

  // Subscribe to changes
  subscribe(listener: (matches: MatchedMarketPair[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Clear all matches (for testing/reset)
  clear(): void {
    this.matches = [];
    this.save();
    this.notifyListeners();
  }

  // Import matches from external source
  importMatches(matches: MatchedMarketPair[]): void {
    this.matches = matches;
    this.save();
    this.notifyListeners();
  }

  // Export matches for backup
  exportMatches(): MatchedMarketPair[] {
    return [...this.matches];
  }

  private save(): void {
    saveMatches(this.matches);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.matches]));
  }
}

// Singleton instance
export const matchStore = new MatchStoreManager();

// React hook for using the match store
import { useState, useEffect } from 'react';

export function useMatchStore() {
  const [matches, setMatches] = useState<MatchedMarketPair[]>(matchStore.getMatches());

  useEffect(() => {
    const unsubscribe = matchStore.subscribe(setMatches);
    return unsubscribe;
  }, []);

  return {
    matches,
    addMatch: (match: Omit<MatchedMarketPair, 'id'>) => matchStore.addMatch(match),
    updateMatch: (id: number, updates: Partial<MatchedMarketPair>) => matchStore.updateMatch(id, updates),
    removeMatch: (id: number) => matchStore.removeMatch(id),
    getMatch: (id: number) => matchStore.getMatch(id),
    getMatchesWithConditions: () => matchStore.getMatchesWithConditions(),
    areMarketsMatched: (kalshiId: string, polyId: string) => matchStore.areMarketsMatched(kalshiId, polyId),
    getStats: () => matchStore.getStats(),
    clear: () => matchStore.clear()
  };
}

// Utility functions for working with matches
export function createMatch(
  kalshiMarket: any,
  polymarketMarket: any,
  confidence: number = 0
): Omit<MatchedMarketPair, 'id'> {
  const earliestEndTime = new Date(kalshiMarket.closeDate) < new Date(polymarketMarket.closeDate)
    ? kalshiMarket.closeDate
    : polymarketMarket.closeDate;

  return {
    kalshiMarketId: kalshiMarket.id,
    polymarketMarketId: polymarketMarket.id,
    createdAt: new Date().toISOString(),
    conditionMappings: [],
    conditionsMatched: false,
    volume: kalshiMarket.volume + polymarketMarket.volume,
    earliestEndTime,
    confidence,
    kalshi: kalshiMarket,
    polymarket: polymarketMarket
  };
}