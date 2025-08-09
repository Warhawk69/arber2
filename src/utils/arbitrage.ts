// Arbitrage calculation utilities
import { ArbitrageOpportunity, MatchedMarketPair, ConditionMapping, OrderbookSnapshot } from '../types';
import { fetchKalshiOrderbook } from '../api/kalshi';
import { fetchPolymarketOrderbook } from '../api/polymarket';

// Calculate days until a date
function calculateDaysUntil(dateString: string): number {
  const targetDate = new Date(dateString);
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Calculate arbitrage opportunity for a condition mapping with 'same' relationship
export async function calculateArbitrageOpportunity(
  marketPair: MatchedMarketPair,
  conditionMapping: ConditionMapping
): Promise<ArbitrageOpportunity | null> {
  try {
    // Only process 'same' relationship mappings for arbitrage
    if (conditionMapping.relationship !== 'same') {
      return null;
    }

    // Fetch orderbook data for both conditions
    const [kalshiOrderbookResponse, polyOrderbookResponse] = await Promise.all([
      fetchKalshiOrderbook(marketPair.kalshiMarketId, conditionMapping.kalshi),
      fetchPolymarketOrderbook(marketPair.polymarketMarketId, conditionMapping.polymarket)
    ]);

    if (!kalshiOrderbookResponse.success || !polyOrderbookResponse.success) {
      console.error('Failed to fetch orderbook data');
      return null;
    }

    const kalshiOrderbook = kalshiOrderbookResponse.data;
    const polyOrderbook = polyOrderbookResponse.data;

    // Calculate ask prices (what we pay to buy)
    const kalshiYesAsk = kalshiOrderbook.yesAsk;
    const kalshiNoAsk = kalshiOrderbook.noAsk;
    const polyYesAsk = polyOrderbook.yesAsk;
    const polyNoAsk = polyOrderbook.noAsk;

    // Find minimum ask prices for yes and no outcomes
    const minYesAsk = Math.min(kalshiYesAsk, polyYesAsk);
    const minNoAsk = Math.min(kalshiNoAsk, polyNoAsk);

    // Check if arbitrage exists: total cost < 1.00
    const totalCost = minYesAsk + minNoAsk;
    
    if (totalCost >= 1.0) {
      return null; // No arbitrage opportunity
    }

    // Calculate return metrics according to the spec
    const profit = 1.0 - totalCost;
    const rPeriod = profit / totalCost; // Return for the period
    
    const daysUntilClose = calculateDaysUntil(marketPair.earliestEndTime);
    const dailyReturn = daysUntilClose > 0 ? rPeriod / daysUntilClose : 0;

    const opportunity: ArbitrageOpportunity = {
      id: `${marketPair.id}-${conditionMapping.kalshi}-${conditionMapping.polymarket}`,
      kalshiCondition: conditionMapping.kalshi,
      polymarketCondition: conditionMapping.polymarket,
      marketPair,
      minYes: minYesAsk,
      minNo: minNoAsk,
      totalCost,
      rPeriod,
      dailyReturn,
      daysUntilClose,
      updated: new Date().toISOString(),
      kalshiData: {
        yesAsk: kalshiYesAsk,
        noAsk: kalshiNoAsk
      },
      polymarketData: {
        yesAsk: polyYesAsk,
        noAsk: polyNoAsk
      }
    };

    return opportunity;
  } catch (error) {
    console.error('Error calculating arbitrage opportunity:', error);
    return null;
  }
}

// Calculate all arbitrage opportunities for a matched market pair
export async function calculateAllArbitrageOpportunities(
  marketPair: MatchedMarketPair
): Promise<ArbitrageOpportunity[]> {
  if (!marketPair.conditionsMatched || marketPair.conditionMappings.length === 0) {
    return [];
  }

  const opportunities: ArbitrageOpportunity[] = [];

  // Process each condition mapping with 'same' relationship
  for (const mapping of marketPair.conditionMappings) {
    if (mapping.relationship === 'same') {
      const opportunity = await calculateArbitrageOpportunity(marketPair, mapping);
      if (opportunity) {
        opportunities.push(opportunity);
      }
    }
  }

  return opportunities;
}

// Calculate arbitrage opportunities from multiple market pairs
export async function calculateMultipleArbitrageOpportunities(
  marketPairs: MatchedMarketPair[]
): Promise<ArbitrageOpportunity[]> {
  const allOpportunities: ArbitrageOpportunity[] = [];

  for (const marketPair of marketPairs) {
    const opportunities = await calculateAllArbitrageOpportunities(marketPair);
    allOpportunities.push(...opportunities);
  }

  // Sort by daily return (best opportunities first)
  return allOpportunities.sort((a, b) => b.dailyReturn - a.dailyReturn);
}

// Utility to format arbitrage data for display (similar to the mock data structure)
export function formatArbitrageForDisplay(opportunity: ArbitrageOpportunity) {
  const { marketPair, kalshiData, polymarketData } = opportunity;
  
  // Determine which exchange has better yes/no prices
  const bestYesExchange = kalshiData.yesAsk <= polymarketData.yesAsk ? 'Kalshi' : 'Polymarket';
  const bestNoExchange = kalshiData.noAsk <= polymarketData.noAsk ? 'Kalshi' : 'Polymarket';
  
  const bestYesPrice = Math.min(kalshiData.yesAsk, polymarketData.yesAsk);
  const bestNoPrice = Math.min(kalshiData.noAsk, polymarketData.noAsk);

  // Calculate stakes (proportional to prices to guarantee profit)
  const totalStake = 100; // Base stake of $100
  const yesStake = Math.round(totalStake * bestYesPrice);
  const noStake = Math.round(totalStake * bestNoPrice);
  const actualTotalStake = yesStake + noStake;

  // Calculate profit
  const profit = totalStake - actualTotalStake;
  const profitPercentage = ((profit / actualTotalStake) * 100);

  return {
    id: parseInt(opportunity.id.split('-')[1]) || Math.floor(Math.random() * 10000),
    percentage: profitPercentage,
    event: marketPair.kalshi.title,
    eventType: `${marketPair.kalshi.category} | Cross-Platform`,
    market: `${opportunity.kalshiCondition} / ${opportunity.polymarketCondition}`,
    startTime: new Date(marketPair.earliestEndTime).toLocaleDateString(),
    bets: [
      {
        outcome: opportunity.kalshiCondition,
        venue: bestYesExchange,
        odds: `${(bestYesPrice * 100).toFixed(0)}¢`,
        stake: yesStake,
        payout: totalStake
      },
      {
        outcome: `Not ${opportunity.kalshiCondition}`,
        venue: bestNoExchange,
        odds: `${(bestNoPrice * 100).toFixed(0)}¢`,
        stake: noStake,
        payout: totalStake
      }
    ],
    profit,
    totalStake: actualTotalStake,
    updated: `${Math.floor(Math.random() * 10) + 1} min ago`,
    kalshiConditions: [
      {
        name: opportunity.kalshiCondition,
        yesPrice: kalshiData.yesAsk,
        noPrice: kalshiData.noAsk
      }
    ],
    polymarketConditions: [
      {
        name: opportunity.polymarketCondition,
        yesPrice: polymarketData.yesAsk,
        noPrice: polymarketData.noAsk
      }
    ],
    // Additional metadata
    rawOpportunity: opportunity
  };
}

// Utility to check if an arbitrage opportunity is still valid
export async function validateArbitrageOpportunity(
  opportunity: ArbitrageOpportunity
): Promise<boolean> {
  try {
    const newOpportunity = await calculateArbitrageOpportunity(
      opportunity.marketPair,
      {
        kalshi: opportunity.kalshiCondition,
        polymarket: opportunity.polymarketCondition,
        relationship: 'same',
        matched: true
      }
    );

    return newOpportunity !== null;
  } catch {
    return false;
  }
}

// Calculate expected profit for a given stake
export function calculateExpectedProfit(
  opportunity: ArbitrageOpportunity,
  totalStake: number
): { profit: number; yesStake: number; noStake: number } {
  const yesStake = totalStake * opportunity.minYes;
  const noStake = totalStake * opportunity.minNo;
  const actualTotalStake = yesStake + noStake;
  const profit = totalStake - actualTotalStake;

  return {
    profit,
    yesStake,
    noStake
  };
}

// Risk assessment for arbitrage opportunities
export function assessArbitrageRisk(opportunity: ArbitrageOpportunity): {
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
} {
  const factors: string[] = [];
  let riskScore = 0;

  // Check time to expiration
  if (opportunity.daysUntilClose < 1) {
    factors.push('Very short time to expiration');
    riskScore += 3;
  } else if (opportunity.daysUntilClose < 7) {
    factors.push('Short time to expiration');
    riskScore += 1;
  }

  // Check profit margin
  if (opportunity.rPeriod < 0.02) { // Less than 2% return
    factors.push('Low profit margin');
    riskScore += 2;
  }

  // Check if markets have different settlement sources
  const kalshiSource = opportunity.marketPair.kalshi.settlementSource?.toLowerCase() || '';
  const polySource = opportunity.marketPair.polymarket.settlementSource?.toLowerCase() || '';
  
  if (kalshiSource !== polySource && 
      !kalshiSource.includes('ap') && !polySource.includes('ap')) {
    factors.push('Different settlement sources');
    riskScore += 2;
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (riskScore <= 1) {
    riskLevel = 'low';
  } else if (riskScore <= 3) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  return { riskLevel, factors };
}