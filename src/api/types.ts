// Shared TypeScript types for prediction market arbitrage system

export interface Condition {
  id: string;
  name: string;
  yesPrice: number;   // Price to buy YES (0-1)
  yesAsk?: number;    // Ask price for YES
  yesBid?: number;    // Bid price for YES
  noPrice: number;    // Price to buy NO (0-1) 
  noAsk?: number;     // Ask price for NO
  noBid?: number;     // Bid price for NO
  volume?: number;    // Trading volume
  liquidity?: number; // Available liquidity
}

export interface CommonMarket {
  id: string;
  platform: 'kalshi' | 'polymarket';
  title: string;
  subtitle?: string;
  category: string;
  closeTime: Date;
  volume?: number;
  liquidity?: number;
  status: 'open' | 'closed' | 'settled';
  settlementSource?: string;
  rules?: string;
  conditions: Condition[];
}

export interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle?: string;
  category: string;
  close_time: string;
  status: string;
  volume?: number;
  liquidity?: number;
  settlement_source?: string;
  rules?: string;
}

export interface KalshiOrderbook {
  ticker: string;
  yes: Array<{ price: number; size: number }>;
  no: Array<{ price: number; size: number }>;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  category?: string;
  end_date_iso: string;
  closed: boolean;
  volume?: string;
  liquidity?: string;
  clobTokenIds?: string[];
  tokens?: Array<{
    token_id: string;
    outcome: string;
    price?: string;
  }>;
}

export interface PolymarketBookResponse {
  market: string;
  asset_id: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
}

export type RelationshipType = 
  | 'same' 
  | 'subset' 
  | 'mutually-exclusive' 
  | 'complementary' 
  | 'opposites' 
  | 'overlapping';

export interface ConditionMapping {
  id: string;
  kalshiCondition: string;
  polymarketCondition: string;
  relationship: RelationshipType;
  confidence?: number;
}

export interface Match {
  id: string;
  kalshiMarketId: string;
  polymarketMarketId: string;
  createdAt: Date;
  confidence: number;
  conditionMappings: ConditionMapping[];
  conditionsMatched: boolean;
}

export interface Ecosystem {
  id: string;
  name: string;
  createdAt: Date;
  marketRefs: Array<{
    platform: 'kalshi' | 'polymarket';
    marketId: string;
  }>;
  conditionMappings: Array<{
    conditions: Record<string, string | null>; // marketKey -> conditionName
    relationship: RelationshipType;
  }>;
  conditionsMatched: boolean;
}

export interface ArbitrageOpportunity {
  id: string;
  matchId?: string;
  ecosystemId?: string;
  conditionMapping: ConditionMapping;
  kalshiMarket: CommonMarket;
  polymarketMarket: CommonMarket;
  kalshiCondition: Condition;
  polymarketCondition: Condition;
  
  // Arbitrage calculations
  minYes: number;      // Minimum cost to buy YES across exchanges
  minYesVenue: string; // Which exchange has the min YES price
  minNo: number;       // Minimum cost to buy NO across exchanges  
  minNoVenue: string;  // Which exchange has the min NO price
  
  totalCost: number;          // C = minYes + minNo
  periodReturn: number;       // (1 - C) / C
  daysUntilClose: number;     // D = days until earliest close
  annualizedReturn: number;   // APR = periodReturn * (365 / D)
  profitOn100: number;        // Profit on $100 stake
  
  // Metadata
  updatedAt: Date;
  earliestCloseTime: Date;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  loading?: boolean;
}

// Environment configuration
export interface ApiConfig {
  kalshiApiKey?: string;
  kalshiBaseUrl: string;
  polymarketBaseUrl: string;
  gammaMarketsUrl: string;
  clobApiUrl: string;
  pollIntervalMs: {
    kalshi: number;
    polymarket: number;
  };
}

// Store interfaces for state management
export interface MatchesStore {
  matches: Match[];
  ecosystems: Ecosystem[];
  
  // Actions
  addMatch: (match: Omit<Match, 'id' | 'createdAt'>) => void;
  updateMatch: (id: string, updates: Partial<Match>) => void;
  removeMatch: (id: string) => void;
  
  addEcosystem: (ecosystem: Omit<Ecosystem, 'id' | 'createdAt'>) => void;
  updateEcosystem: (id: string, updates: Partial<Ecosystem>) => void;
  removeEcosystem: (id: string) => void;
  
  // Persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

// Hook interfaces
export interface LiveDataHookResult {
  kalshiMarkets: CommonMarket[];
  polymarketMarkets: CommonMarket[];
  arbitrageOpportunities: ArbitrageOpportunity[];
  isLoading: boolean;
  errors: ApiError[];
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}