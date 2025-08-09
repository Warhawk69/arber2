// Core types for the prediction market arbitrage system

export interface Condition {
  name: string;
  yesPrice: number;
  noPrice: number;
  volume?: number;
  yesBid?: number;
  noBid?: number;
  yesAsk?: number;
  noAsk?: number;
}

export interface Market {
  id: string;
  title: string;
  category: string;
  volume: number;
  liquidity: number;
  closeDate: string;
  settlementSource?: string;
  rules?: string;
  conditions: Condition[];
  // Exchange-specific fields
  endTime?: string;
  close_time?: string;
  outcomeTokens?: string[];
}

export interface OrderbookSnapshot {
  marketId: string;
  conditionName: string;
  timestamp: number;
  yesBid: number;
  noBid: number;
  yesAsk: number;
  noAsk: number;
  volume?: number;
}

export interface ConditionMapping {
  kalshi: string;
  polymarket: string;
  relationship: 'same' | 'subset' | 'mutually-exclusive' | 'complementary' | 'opposites' | 'overlapping';
  matched: boolean;
}

export interface MatchedMarketPair {
  id: number;
  kalshiMarketId: string;
  polymarketMarketId: string;
  createdAt: string;
  conditionMappings: ConditionMapping[];
  conditionsMatched: boolean;
  volume: number;
  earliestEndTime: string;
  confidence?: number;
  kalshi: Market;
  polymarket: Market;
}

export interface ArbitrageOpportunity {
  id: string;
  kalshiCondition: string;
  polymarketCondition: string;
  marketPair: MatchedMarketPair;
  minYes: number;
  minNo: number;
  totalCost: number;
  rPeriod: number;
  dailyReturn: number;
  daysUntilClose: number;
  updated: string;
  kalshiData: {
    yesAsk: number;
    noAsk: number;
  };
  polymarketData: {
    yesAsk: number;
    noAsk: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

// Polymarket specific types
export interface PolymarketMarket {
  id: string;
  question: string;
  description?: string;
  end_date: string;
  category?: string;
  outcomeTokens?: string[];
  outcomes?: string[];
  volume?: number;
  liquidity?: number;
}

export interface PolymarketOrderbook {
  market: string;
  asset_id: string;
  bids: Array<{ price: string; size: string }>;
  asks: Array<{ price: string; size: string }>;
}

// Kalshi specific types
export interface KalshiMarket {
  id: string;
  title: string;
  subtitle?: string;
  open_time: string;
  close_time: string;
  settle_time?: string;
  category: string;
  status: string;
  tags?: string[];
  volume?: number;
  liquidity?: number;
  yes_sub_title?: string;
  no_sub_title?: string;
}

export interface KalshiOrderbook {
  market_id: string;
  yes_bid?: number;
  yes_ask?: number;
  no_bid?: number;
  no_ask?: number;
}

// Polling configuration
export interface PollingConfig {
  polymarketInterval: number; // milliseconds
  kalshiInterval: number; // milliseconds
  enabled: boolean;
}

// Local storage types
export interface MatchStore {
  matches: MatchedMarketPair[];
  lastUpdated: string;
}

export interface MarketSimilarity {
  overall: number;
  title: number;
  date: number;
  category: number;
  settlement?: number;
}