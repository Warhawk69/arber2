// Common types for arbitrage detection system

export interface Condition {
  name: string;
  yesPrice: number;
  noPrice: number;
  volume?: number;
  clobTokenId?: string; // For Polymarket
}

export interface CommonMarket {
  id: string;
  platform: 'Kalshi' | 'Polymarket';
  title: string;
  subtitle?: string;
  category: string;
  closeTime: Date;
  volume: number;
  liquidity?: number;
  conditions: Condition[];
  settlementSource?: string;
  rules?: string;
  // Raw pricing data
  yesBid?: number;
  yesAsk?: number;
  noBid?: number;
  noAsk?: number;
}

export type RelationshipType = 'same' | 'subset' | 'mutually-exclusive' | 'complementary' | 'opposites' | 'overlapping';

export interface ConditionMapping {
  kalshi: string;
  polymarket: string;
  relationship: RelationshipType;
  confidence?: number;
}

export interface Match {
  id: string;
  kalshiMarketId: string;
  polyMarketId: string;
  createdAt: Date;
  confidence: number;
  conditionMappings: ConditionMapping[];
  conditionsMatched: boolean;
}

export interface Ecosystem {
  id: string;
  name: string;
  createdAt: Date;
  marketRefs: MarketRef[];
  conditionMappings: EcosystemConditionMapping[];
  conditionsMatched: boolean;
  // Derived stats
  exchanges: number;
  markets: number;
  conditions: number;
  earliestEndTime?: Date;
}

export interface MarketRef {
  platform: 'Kalshi' | 'Polymarket';
  marketId: string;
  title: string;
}

export interface EcosystemConditionMapping {
  conditions: Record<string, string | null>; // key: "exchange-market", value: condition name or null
  relationship: RelationshipType;
}

export interface ArbitrageOpportunity {
  id: string;
  matchId: string;
  conditionMapping: ConditionMapping;
  kalshiMarket: CommonMarket;
  polymarketMarket: CommonMarket;
  
  // Pricing data
  minYes: number;
  minNo: number;
  costSum: number; // C = minYes + minNo
  
  // Calculations
  hasArbitrage: boolean; // C < 1
  periodReturn: number; // (1 - C) / C
  annualizedReturn: number; // APR
  daysUntilClose: number;
  profitOnHundred: number; // 100 * periodReturn
  
  // Metadata
  eventName: string;
  earliestEndTime: Date;
  lastUpdated: Date;
}

// API Response Types
export interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle?: string;
  category: string;
  close_time: string;
  volume: number;
  liquidity?: number;
  status: string;
  yes_bid?: number;
  yes_ask?: number;
  no_bid?: number;
  no_ask?: number;
}

export interface KalshiOrderbook {
  yes: Array<{ price: number; size: number }>;
  no: Array<{ price: number; size: number }>;
}

export interface PolymarketMarket {
  id: string;
  question: string;
  category: string;
  endDate: string;
  volume: number;
  liquidity?: number;
  clobTokenIds: string[];
  outcomes: string[];
  active: boolean;
}

export interface PolymarketBook {
  market: string;
  asset_id: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
}

// Error handling
export interface ApiError {
  message: string;
  status?: number;
  platform?: string;
}

// Store state
export interface MatchesState {
  matches: Match[];
  ecosystems: Ecosystem[];
  lastUpdated: Date;
}

// Environment configuration
export interface ApiConfig {
  kalshiApiKey?: string;
  kalshiBaseUrl: string;
  polymarketGammaUrl: string;
  polymarketClobUrl: string;
  pollingIntervals: {
    kalshi: number; // milliseconds
    polymarket: number;
  };
}