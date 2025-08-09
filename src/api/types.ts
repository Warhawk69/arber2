// Shared TypeScript types for arbitrage detection system

// Platform identifier
export type Platform = 'kalshi' | 'polymarket';

// Relationship types for condition mapping
export type RelationshipType = 'same' | 'subset' | 'mutually-exclusive' | 'complementary' | 'opposites' | 'overlapping';

// Common market structure normalized across platforms
export interface CommonMarket {
  id: string;
  platform: Platform;
  title: string;
  subtitle?: string;
  category: string;
  closeTime: Date;
  volume?: number;
  liquidity?: number;
  settlementSource?: string;
  rules?: string;
  // Pricing for binary markets
  yesBid?: number;
  yesAsk?: number;
  noBid?: number;
  noAsk?: number;
  // Multi-outcome conditions
  outcomes: MarketCondition[];
}

// Individual condition/outcome within a market
export interface MarketCondition {
  id: string;
  name: string;
  yesPrice: number;
  noPrice: number;
  volume?: number;
  // For Polymarket multi-outcome markets
  clobTokenId?: string;
}

// Kalshi-specific market data
export interface KalshiMarket {
  event_ticker: string;
  ticker: string;
  title: string;
  subtitle?: string;
  status: string;
  close_time: string;
  expiration_time: string;
  category: string;
  yes_bid?: number;
  yes_ask?: number;
  no_bid?: number;
  no_ask?: number;
  volume?: number;
  open_interest?: number;
  dollar_volume?: number;
}

// Kalshi orderbook structure
export interface KalshiOrderbook {
  market: string;
  yes?: Array<{ price: number; size: number }>;
  no?: Array<{ price: number; size: number }>;
}

// Polymarket-specific market data
export interface PolymarketMarket {
  conditionId: string;
  questionId: string;
  question: string;
  description?: string;
  outcomes: string[];
  outcomeSlots: string[];
  resolutionSource: string;
  endDate: string;
  category: string;
  clobTokenIds: string[];
  active: boolean;
  volume?: number;
}

// Polymarket orderbook/price data
export interface PolymarketOrderbook {
  market: string;
  asset_id: string;
  bids: Array<{ price: number; size: number }>;
  asks: Array<{ price: number; size: number }>;
}

// Condition mapping between different platforms
export interface ConditionMapping {
  id: string;
  kalshiCondition?: string;
  polymarketCondition?: string;
  relationship: RelationshipType;
  confidence?: number;
  createdAt: Date;
}

// Market match between platforms
export interface MarketMatch {
  id: string;
  kalshiMarketId: string;
  polymarketMarketId: string;
  createdAt: Date;
  confidence: number;
  conditionMappings: ConditionMapping[];
  conditionsMatched: boolean;
  totalVolume?: number;
}

// Ecosystem containing multiple markets across exchanges
export interface Ecosystem {
  id: string;
  name: string;
  createdAt: Date;
  marketRefs: Array<{
    platform: Platform;
    marketId: string;
    market?: CommonMarket;
  }>;
  conditionMappings: ConditionMapping[];
  conditionsMatched: boolean;
  // Derived stats
  exchanges: number;
  markets: number;
  conditions: number;
  earliestEndTime?: Date;
}

// Arbitrage opportunity
export interface ArbitrageOpportunity {
  id: string;
  eventName: string;
  eventType: string;
  market: string;
  earliestEndTime: Date;
  daysUntilClose: number;
  // Arbitrage calculation
  minYes: number;
  minNo: number;
  C: number; // minYes + minNo
  periodReturn: number; // (1 - C) / C
  apr: number; // periodReturn * (365 / daysUntilClose)
  profitOn100: number; // 100 * periodReturn
  // Underlying bets
  yesBet: {
    platform: Platform;
    marketId: string;
    condition: string;
    price: number;
  };
  noBet: {
    platform: Platform;
    marketId: string;
    condition: string;
    price: number;
  };
  // Metadata
  updatedAt: Date;
  // All underlying conditions for expanded view
  allConditions: Array<{
    platform: Platform;
    marketId: string;
    condition: string;
    yesPrice: number;
    noPrice: number;
  }>;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// Market similarity scoring
export interface SimilarityScore {
  overall: number;
  title: number;
  date: number;
  conditions: number;
  settlement: number;
}

// Polling configuration
export interface PollingConfig {
  kalshiInterval: number; // milliseconds
  polymarketInterval: number; // milliseconds
  enabled: boolean;
}

// Store state interface
export interface MatchesStore {
  markets: {
    kalshi: CommonMarket[];
    polymarket: CommonMarket[];
    lastUpdated: Date;
  };
  matches: MarketMatch[];
  ecosystems: Ecosystem[];
  arbitrageOpportunities: ArbitrageOpportunity[];
  polling: PollingConfig;
}

// Environment configuration
export interface EnvironmentConfig {
  KALSHI_API_KEY?: string;
  KALSHI_BASE_URL: string;
  POLYMARKET_GAMMA_URL: string;
  POLYMARKET_CLOB_URL: string;
  POLYMARKET_PRICE_URL: string;
}