// Central store for matched markets and ecosystems with localStorage persistence
import { Match, Ecosystem, MatchesState, ConditionMapping, MarketRef, EcosystemConditionMapping } from '../api/types';

const STORAGE_KEY = 'arber2_matches_state';
const STORAGE_VERSION = 1;

/**
 * Load state from localStorage with version checking
 */
function loadFromStorage(): MatchesState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    
    // Version check for future migrations
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('Storage version mismatch, clearing state');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Convert date strings back to Date objects
    return {
      matches: parsed.matches.map((match: any) => ({
        ...match,
        createdAt: new Date(match.createdAt)
      })),
      ecosystems: parsed.ecosystems.map((ecosystem: any) => ({
        ...ecosystem,
        createdAt: new Date(ecosystem.createdAt),
        earliestEndTime: ecosystem.earliestEndTime ? new Date(ecosystem.earliestEndTime) : undefined
      })),
      lastUpdated: new Date(parsed.lastUpdated)
    };
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
}

/**
 * Save state to localStorage
 */
function saveToStorage(state: MatchesState): void {
  try {
    const toStore = {
      version: STORAGE_VERSION,
      matches: state.matches,
      ecosystems: state.ecosystems,
      lastUpdated: state.lastUpdated
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Create initial empty state
 */
function createInitialState(): MatchesState {
  return {
    matches: [],
    ecosystems: [],
    lastUpdated: new Date()
  };
}

// Global state
let currentState: MatchesState = loadFromStorage() || createInitialState();

// Subscribers for state updates
type StateListener = (state: MatchesState) => void;
const listeners: Set<StateListener> = new Set();

/**
 * Subscribe to state changes
 */
export function subscribe(listener: StateListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Notify all subscribers of state change
 */
function notifyListeners(): void {
  currentState.lastUpdated = new Date();
  saveToStorage(currentState);
  listeners.forEach(listener => listener(currentState));
}

/**
 * Get current state
 */
export function getState(): MatchesState {
  return { ...currentState };
}

// Match management functions

/**
 * Add a new match
 */
export function addMatch(match: Omit<Match, 'id'>): Match {
  const newMatch: Match = {
    ...match,
    id: generateId(),
    createdAt: new Date()
  };

  currentState.matches.push(newMatch);
  notifyListeners();
  
  return newMatch;
}

/**
 * Update an existing match
 */
export function updateMatch(matchId: string, updates: Partial<Match>): Match | null {
  const index = currentState.matches.findIndex(m => m.id === matchId);
  if (index === -1) return null;

  currentState.matches[index] = { ...currentState.matches[index], ...updates };
  notifyListeners();
  
  return currentState.matches[index];
}

/**
 * Delete a match
 */
export function deleteMatch(matchId: string): boolean {
  const initialLength = currentState.matches.length;
  currentState.matches = currentState.matches.filter(m => m.id !== matchId);
  
  if (currentState.matches.length < initialLength) {
    notifyListeners();
    return true;
  }
  return false;
}

/**
 * Get a specific match by ID
 */
export function getMatch(matchId: string): Match | null {
  return currentState.matches.find(m => m.id === matchId) || null;
}

/**
 * Get all matches
 */
export function getMatches(): Match[] {
  return [...currentState.matches];
}

/**
 * Get matches with condition mappings that have 'same' relationships
 */
export function getMatchesWithSameConditions(): Match[] {
  return currentState.matches.filter(match => 
    match.conditionMappings.some(mapping => mapping.relationship === 'same')
  );
}

// Ecosystem management functions

/**
 * Add a new ecosystem
 */
export function addEcosystem(ecosystem: Omit<Ecosystem, 'id'>): Ecosystem {
  const newEcosystem: Ecosystem = {
    ...ecosystem,
    id: generateId(),
    createdAt: new Date()
  };

  currentState.ecosystems.push(newEcosystem);
  notifyListeners();
  
  return newEcosystem;
}

/**
 * Update an existing ecosystem
 */
export function updateEcosystem(ecosystemId: string, updates: Partial<Ecosystem>): Ecosystem | null {
  const index = currentState.ecosystems.findIndex(e => e.id === ecosystemId);
  if (index === -1) return null;

  currentState.ecosystems[index] = { ...currentState.ecosystems[index], ...updates };
  notifyListeners();
  
  return currentState.ecosystems[index];
}

/**
 * Delete an ecosystem
 */
export function deleteEcosystem(ecosystemId: string): boolean {
  const initialLength = currentState.ecosystems.length;
  currentState.ecosystems = currentState.ecosystems.filter(e => e.id !== ecosystemId);
  
  if (currentState.ecosystems.length < initialLength) {
    notifyListeners();
    return true;
  }
  return false;
}

/**
 * Get a specific ecosystem by ID
 */
export function getEcosystem(ecosystemId: string): Ecosystem | null {
  return currentState.ecosystems.find(e => e.id === ecosystemId) || null;
}

/**
 * Get all ecosystems
 */
export function getEcosystems(): Ecosystem[] {
  return [...currentState.ecosystems];
}

// Condition mapping helpers

/**
 * Add condition mapping to a match
 */
export function addConditionMapping(matchId: string, mapping: ConditionMapping): boolean {
  const match = getMatch(matchId);
  if (!match) return false;

  const updatedMappings = [...match.conditionMappings, mapping];
  updateMatch(matchId, { 
    conditionMappings: updatedMappings,
    conditionsMatched: updatedMappings.length > 0 
  });
  
  return true;
}

/**
 * Remove condition mapping from a match
 */
export function removeConditionMapping(matchId: string, mappingIndex: number): boolean {
  const match = getMatch(matchId);
  if (!match || mappingIndex >= match.conditionMappings.length) return false;

  const updatedMappings = match.conditionMappings.filter((_, index) => index !== mappingIndex);
  updateMatch(matchId, { 
    conditionMappings: updatedMappings,
    conditionsMatched: updatedMappings.length > 0 
  });
  
  return true;
}

/**
 * Update condition mappings for a match
 */
export function updateConditionMappings(matchId: string, mappings: ConditionMapping[]): boolean {
  return updateMatch(matchId, { 
    conditionMappings: mappings,
    conditionsMatched: mappings.length > 0 
  }) !== null;
}

/**
 * Add condition mapping to an ecosystem
 */
export function addEcosystemConditionMapping(ecosystemId: string, mapping: EcosystemConditionMapping): boolean {
  const ecosystem = getEcosystem(ecosystemId);
  if (!ecosystem) return false;

  const updatedMappings = [...ecosystem.conditionMappings, mapping];
  updateEcosystem(ecosystemId, { 
    conditionMappings: updatedMappings,
    conditionsMatched: updatedMappings.length > 0 
  });
  
  return true;
}

/**
 * Update ecosystem condition mappings
 */
export function updateEcosystemConditionMappings(ecosystemId: string, mappings: EcosystemConditionMapping[]): boolean {
  return updateEcosystem(ecosystemId, { 
    conditionMappings: mappings,
    conditionsMatched: mappings.length > 0 
  }) !== null;
}

// Utility functions

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clear all data (useful for development/testing)
 */
export function clearAllData(): void {
  currentState = createInitialState();
  localStorage.removeItem(STORAGE_KEY);
  notifyListeners();
}

/**
 * Get statistics about stored data
 */
export function getStats() {
  const matches = currentState.matches;
  const ecosystems = currentState.ecosystems;
  
  const totalConditionMappings = matches.reduce((sum, match) => 
    sum + match.conditionMappings.length, 0
  );
  
  const matchesWithMappings = matches.filter(m => m.conditionsMatched).length;
  const ecosystemsWithMappings = ecosystems.filter(e => e.conditionsMatched).length;
  
  return {
    totalMatches: matches.length,
    totalEcosystems: ecosystems.length,
    totalConditionMappings,
    matchesWithMappings,
    ecosystemsWithMappings,
    lastUpdated: currentState.lastUpdated
  };
}

/**
 * Export data for backup
 */
export function exportData(): string {
  return JSON.stringify({
    version: STORAGE_VERSION,
    exportDate: new Date().toISOString(),
    data: currentState
  }, null, 2);
}

/**
 * Import data from backup
 */
export function importData(jsonData: string): boolean {
  try {
    const parsed = JSON.parse(jsonData);
    
    if (!parsed.data || !parsed.version) {
      throw new Error('Invalid backup format');
    }
    
    // Convert date strings back to Date objects
    const importedState: MatchesState = {
      matches: parsed.data.matches.map((match: any) => ({
        ...match,
        createdAt: new Date(match.createdAt)
      })),
      ecosystems: parsed.data.ecosystems.map((ecosystem: any) => ({
        ...ecosystem,
        createdAt: new Date(ecosystem.createdAt),
        earliestEndTime: ecosystem.earliestEndTime ? new Date(ecosystem.earliestEndTime) : undefined
      })),
      lastUpdated: new Date()
    };
    
    currentState = importedState;
    notifyListeners();
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}