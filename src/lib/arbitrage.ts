// Arbitrage detection and APR calculations
import { CommonMarket, ConditionMapping, ArbitrageOpportunity } from '../api/types';

/**
 * Calculate arbitrage opportunity between two matched conditions
 * 
 * Based on PredictionMarketArb.txt formula:
 * - C = minYes + minNo (total cost to buy both sides)
 * - If C < 1, arbitrage exists
 * - periodReturn = (1 - C) / C 
 *   Note: Spec shows "rPeriod = 1 - C / C" which simplifies to 0,
 *   assuming intended formula is (1 - C) / C for meaningful returns
 * - APR = periodReturn * (365 / D) where D = days until earliest end date
 * 
 * @param kalshiMarket Kalshi market data
 * @param polymarketMarket Polymarket market data
 * @param conditionMapping Mapping between conditions
 * @returns ArbitrageOpportunity | null
 */
export function calculateArbitrage(
  kalshiMarket: CommonMarket,
  polymarketMarket: CommonMarket,
  conditionMapping: ConditionMapping
): ArbitrageOpportunity | null {
  try {
    // Find the matched conditions
    const kalshiCondition = kalshiMarket.conditions.find(c => c.name === conditionMapping.kalshi);
    const polyCondition = polymarketMarket.conditions.find(c => c.name === conditionMapping.polymarket);

    if (!kalshiCondition || !polyCondition) {
      console.warn('Conditions not found for mapping:', conditionMapping);
      return null;
    }

    // Only process 'same' relationships for arbitrage
    if (conditionMapping.relationship !== 'same') {
      return null;
    }

    // Get YES and NO ask prices (cost to buy)
    const kalshiYesAsk = kalshiCondition.yesPrice;
    const kalshiNoAsk = kalshiCondition.noPrice;
    const polyYesAsk = polyCondition.yesPrice;
    const polyNoAsk = polyCondition.noPrice;

    // Find minimum costs across exchanges
    const minYes = Math.min(kalshiYesAsk, polyYesAsk);
    const minNo = Math.min(kalshiNoAsk, polyNoAsk);

    // Total cost to establish both positions
    const costSum = minYes + minNo; // C in the formula

    // Check for arbitrage opportunity
    const hasArbitrage = costSum < 1;

    if (!hasArbitrage) {
      return null; // No arbitrage opportunity
    }

    // Calculate returns
    // Formula ambiguity note: spec shows "rPeriod = 1 - C / C" which equals 0
    // Assuming intended formula is (1 - C) / C for meaningful period return
    const periodReturn = (1 - costSum) / costSum;

    // Calculate days until close (use earliest end time)
    const earliestEndTime = kalshiMarket.closeTime < polymarketMarket.closeTime 
      ? kalshiMarket.closeTime 
      : polymarketMarket.closeTime;
    
    const now = new Date();
    const daysUntilClose = Math.max(1, Math.ceil((earliestEndTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Annualized return (APR)
    const annualizedReturn = periodReturn * (365 / daysUntilClose);

    // Profit on $100 stake
    const profitOnHundred = 100 * periodReturn;

    // Generate unique ID for this opportunity
    const id = `${kalshiMarket.id}-${polymarketMarket.id}-${conditionMapping.kalshi}-${conditionMapping.polymarket}`;

    // Event name (prefer the more descriptive title)
    const eventName = kalshiMarket.title.length > polymarketMarket.title.length 
      ? kalshiMarket.title 
      : polymarketMarket.title;

    return {
      id,
      matchId: `${kalshiMarket.id}-${polymarketMarket.id}`,
      conditionMapping,
      kalshiMarket,
      polymarketMarket,
      minYes,
      minNo,
      costSum,
      hasArbitrage,
      periodReturn,
      annualizedReturn,
      daysUntilClose,
      profitOnHundred,
      eventName,
      earliestEndTime,
      lastUpdated: new Date()
    };

  } catch (error) {
    console.error('Error calculating arbitrage:', error);
    return null;
  }
}

/**
 * Calculate arbitrage opportunities for all condition mappings in a match
 * @param kalshiMarket Kalshi market
 * @param polymarketMarket Polymarket market
 * @param conditionMappings Array of condition mappings
 * @returns ArbitrageOpportunity[]
 */
export function calculateAllArbitrageOpportunities(
  kalshiMarket: CommonMarket,
  polymarketMarket: CommonMarket,
  conditionMappings: ConditionMapping[]
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  for (const mapping of conditionMappings) {
    const opportunity = calculateArbitrage(kalshiMarket, polymarketMarket, mapping);
    if (opportunity) {
      opportunities.push(opportunity);
    }
  }

  return opportunities;
}

/**
 * Sort arbitrage opportunities by APR descending
 * @param opportunities Array of opportunities
 * @returns Sorted array
 */
export function sortOpportunitiesByAPR(opportunities: ArbitrageOpportunity[]): ArbitrageOpportunity[] {
  return [...opportunities].sort((a, b) => b.annualizedReturn - a.annualizedReturn);
}

/**
 * Filter opportunities by minimum APR threshold
 * @param opportunities Array of opportunities
 * @param minAPR Minimum APR threshold (e.g., 0.05 for 5%)
 * @returns Filtered array
 */
export function filterOpportunitiesByMinAPR(
  opportunities: ArbitrageOpportunity[], 
  minAPR: number
): ArbitrageOpportunity[] {
  return opportunities.filter(opp => opp.annualizedReturn >= minAPR);
}

/**
 * Group opportunities by event/market pair
 * @param opportunities Array of opportunities
 * @returns Record<string, ArbitrageOpportunity[]>
 */
export function groupOpportunitiesByEvent(
  opportunities: ArbitrageOpportunity[]
): Record<string, ArbitrageOpportunity[]> {
  const grouped: Record<string, ArbitrageOpportunity[]> = {};

  for (const opportunity of opportunities) {
    const key = opportunity.matchId;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(opportunity);
  }

  return grouped;
}

/**
 * Calculate portfolio metrics for a set of arbitrage opportunities
 * @param opportunities Array of opportunities
 * @param totalCapital Total capital to deploy
 * @returns Portfolio metrics
 */
export function calculatePortfolioMetrics(
  opportunities: ArbitrageOpportunity[],
  totalCapital: number = 10000
) {
  if (opportunities.length === 0) {
    return {
      totalOpportunities: 0,
      averageAPR: 0,
      totalProfit: 0,
      capitalRequired: 0,
      averageDaysToClose: 0
    };
  }

  const totalProfit = opportunities.reduce((sum, opp) => {
    // Assume equal allocation across opportunities
    const allocation = totalCapital / opportunities.length;
    const profit = allocation * opp.periodReturn;
    return sum + profit;
  }, 0);

  const averageAPR = opportunities.reduce((sum, opp) => sum + opp.annualizedReturn, 0) / opportunities.length;
  
  const averageDaysToClose = opportunities.reduce((sum, opp) => sum + opp.daysUntilClose, 0) / opportunities.length;

  // Capital required is the sum of all position costs
  const capitalRequired = opportunities.reduce((sum, opp) => {
    const allocation = totalCapital / opportunities.length;
    return sum + (allocation * opp.costSum);
  }, 0);

  return {
    totalOpportunities: opportunities.length,
    averageAPR,
    totalProfit,
    capitalRequired,
    averageDaysToClose
  };
}

/**
 * Format APR as percentage string
 * @param apr APR as decimal (e.g., 0.15 for 15%)
 * @param decimals Number of decimal places
 * @returns Formatted string
 */
export function formatAPR(apr: number, decimals: number = 1): string {
  return `${(apr * 100).toFixed(decimals)}%`;
}

/**
 * Format profit as currency string
 * @param profit Profit amount
 * @param currency Currency symbol
 * @returns Formatted string
 */
export function formatProfit(profit: number, currency: string = '$'): string {
  return `${currency}${profit.toFixed(2)}`;
}

/**
 * Check if an arbitrage opportunity is still valid based on market close times
 * @param opportunity Arbitrage opportunity
 * @param bufferMinutes Buffer time before market close to consider opportunity invalid
 * @returns boolean
 */
export function isOpportunityValid(
  opportunity: ArbitrageOpportunity, 
  bufferMinutes: number = 60
): boolean {
  const now = new Date();
  const bufferTime = bufferMinutes * 60 * 1000; // Convert to milliseconds
  const earliestClose = opportunity.earliestEndTime.getTime() - bufferTime;
  
  return now.getTime() < earliestClose;
}

/**
 * Calculate risk metrics for an arbitrage opportunity
 * @param opportunity Arbitrage opportunity
 * @returns Risk metrics
 */
export function calculateRiskMetrics(opportunity: ArbitrageOpportunity) {
  // Risk factors:
  // 1. Time to expiration (shorter = higher execution risk)
  // 2. Market depth/liquidity
  // 3. Platform risk (counterparty)
  // 4. Settlement source differences

  const timeRisk = opportunity.daysUntilClose < 7 ? 'HIGH' : 
                   opportunity.daysUntilClose < 30 ? 'MEDIUM' : 'LOW';

  const profitMargin = opportunity.periodReturn;
  const profitRisk = profitMargin < 0.01 ? 'HIGH' : 
                     profitMargin < 0.05 ? 'MEDIUM' : 'LOW';

  // Calculate overall risk score (1-10, where 10 is highest risk)
  let riskScore = 1;
  if (timeRisk === 'HIGH') riskScore += 3;
  else if (timeRisk === 'MEDIUM') riskScore += 1;
  
  if (profitRisk === 'HIGH') riskScore += 3;
  else if (profitRisk === 'MEDIUM') riskScore += 1;

  // Platform diversification reduces risk
  riskScore = Math.max(1, riskScore - 1);

  return {
    timeRisk,
    profitRisk,
    riskScore: Math.min(10, riskScore),
    riskLevel: riskScore <= 3 ? 'LOW' : riskScore <= 6 ? 'MEDIUM' : 'HIGH'
  };
}