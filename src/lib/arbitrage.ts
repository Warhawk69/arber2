// Arbitrage detection and APR calculations
import { 
  ArbitrageOpportunity, 
  CommonMarket, 
  Condition, 
  ConditionMapping, 
  Match, 
  Ecosystem 
} from '../api/types';

export class ArbitrageCalculator {
  /**
   * Calculate arbitrage opportunity between two conditions
   * Based on PredictionMarketArb.txt logic:
   * - C = minYes + minNo (total cost to buy both sides)
   * - If C < 1 => arbitrage opportunity exists
   * - periodReturn = (1 - C) / C
   * - APR = periodReturn * (365 / D) where D = days until earliest close
   */
  calculateArbitrage(
    kalshiMarket: CommonMarket,
    polymarketMarket: CommonMarket,
    kalshiCondition: Condition,
    polymarketCondition: Condition,
    mapping: ConditionMapping
  ): ArbitrageOpportunity | null {
    // Only calculate arbitrage for 'same' relationships
    if (mapping.relationship !== 'same') {
      return null;
    }

    // Get the best ask prices (lowest cost to buy)
    const kalshiYesAsk = kalshiCondition.yesAsk || kalshiCondition.yesPrice;
    const kalshiNoAsk = kalshiCondition.noAsk || kalshiCondition.noPrice;
    const polyYesAsk = polymarketCondition.yesAsk || polymarketCondition.yesPrice;
    const polyNoAsk = polymarketCondition.noAsk || polymarketCondition.noPrice;

    // Find minimum cost to buy YES and NO across exchanges
    const minYes = Math.min(kalshiYesAsk, polyYesAsk);
    const minYesVenue = kalshiYesAsk <= polyYesAsk ? 'Kalshi' : 'Polymarket';
    
    const minNo = Math.min(kalshiNoAsk, polyNoAsk);
    const minNoVenue = kalshiNoAsk <= polyNoAsk ? 'Kalshi' : 'Polymarket';

    // Total cost to buy both sides
    const totalCost = minYes + minNo; // This is 'C' in the formula

    // Only proceed if there's an arbitrage opportunity
    if (totalCost >= 1) {
      return null; // No arbitrage opportunity
    }

    // Calculate returns
    // Note: The problem statement mentions ambiguity in formula
    // We use (1 - C) / C as specified, with a comment about the ambiguity
    const periodReturn = (1 - totalCost) / totalCost; // rPeriod = (1 - C) / C
    
    // Days until earliest close time
    const earliestCloseTime = new Date(Math.min(
      kalshiMarket.closeTime.getTime(),
      polymarketMarket.closeTime.getTime()
    ));
    const now = new Date();
    const daysUntilClose = Math.max(1, Math.ceil(
      (earliestCloseTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ));

    // Annualized return (APR)
    const annualizedReturn = periodReturn * (365 / daysUntilClose);
    
    // Profit on $100 stake
    const profitOn100 = 100 * periodReturn;

    return {
      id: `${mapping.id}-${Date.now()}`,
      conditionMapping: mapping,
      kalshiMarket,
      polymarketMarket,
      kalshiCondition,
      polymarketCondition,
      minYes,
      minYesVenue,
      minNo,
      minNoVenue,
      totalCost,
      periodReturn,
      daysUntilClose,
      annualizedReturn,
      profitOn100,
      updatedAt: new Date(),
      earliestCloseTime,
    };
  }

  /**
   * Find all arbitrage opportunities from a list of matches
   */
  findArbitrageFromMatches(
    matches: Match[],
    kalshiMarkets: CommonMarket[],
    polymarketMarkets: CommonMarket[]
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const match of matches) {
      const kalshiMarket = kalshiMarkets.find(m => m.id === match.kalshiMarketId);
      const polymarketMarket = polymarketMarkets.find(m => m.id === match.polymarketMarketId);

      if (!kalshiMarket || !polymarketMarket) {
        continue; // Skip if markets not found
      }

      // Check each condition mapping for arbitrage
      for (const mapping of match.conditionMappings) {
        if (mapping.relationship !== 'same') {
          continue; // Only 'same' relationships can have arbitrage
        }

        const kalshiCondition = kalshiMarket.conditions.find(c => c.name === mapping.kalshiCondition);
        const polyCondition = polymarketMarket.conditions.find(c => c.name === mapping.polymarketCondition);

        if (!kalshiCondition || !polyCondition) {
          continue; // Skip if conditions not found
        }

        const opportunity = this.calculateArbitrage(
          kalshiMarket,
          polymarketMarket,
          kalshiCondition,
          polyCondition,
          mapping
        );

        if (opportunity) {
          opportunity.matchId = match.id;
          opportunities.push(opportunity);
        }
      }
    }

    // Sort by APR descending
    return opportunities.sort((a, b) => b.annualizedReturn - a.annualizedReturn);
  }

  /**
   * Find arbitrage opportunities from ecosystems
   */
  findArbitrageFromEcosystems(
    ecosystems: Ecosystem[],
    allMarkets: CommonMarket[]
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const ecosystem of ecosystems) {
      if (!ecosystem.conditionsMatched || ecosystem.conditionMappings.length === 0) {
        continue;
      }

      // Get markets referenced in this ecosystem
      const ecosystemMarkets = ecosystem.marketRefs
        .map(ref => allMarkets.find(m => m.id === ref.marketId && m.platform === ref.platform))
        .filter(Boolean) as CommonMarket[];

      if (ecosystemMarkets.length < 2) {
        continue; // Need at least 2 markets for arbitrage
      }

      // Check each condition mapping in the ecosystem
      for (const mapping of ecosystem.conditionMappings) {
        if (mapping.relationship !== 'same') {
          continue;
        }

        // Find pairs of markets with the mapped conditions
        const marketPairs = this.findMarketPairsWithConditions(ecosystemMarkets, mapping);

        for (const pair of marketPairs) {
          const opportunity = this.calculateArbitrage(
            pair.market1,
            pair.market2,
            pair.condition1,
            pair.condition2,
            {
              id: `ecosystem-${ecosystem.id}-${pair.condition1.id}-${pair.condition2.id}`,
              kalshiCondition: pair.condition1.name,
              polymarketCondition: pair.condition2.name,
              relationship: 'same',
            }
          );

          if (opportunity) {
            opportunity.ecosystemId = ecosystem.id;
            opportunities.push(opportunity);
          }
        }
      }
    }

    return opportunities.sort((a, b) => b.annualizedReturn - a.annualizedReturn);
  }

  /**
   * Update arbitrage opportunities with new market data
   */
  updateArbitrageOpportunities(
    existingOpportunities: ArbitrageOpportunity[],
    updatedMarkets: CommonMarket[]
  ): ArbitrageOpportunity[] {
    const updatedOpportunities: ArbitrageOpportunity[] = [];

    for (const opportunity of existingOpportunities) {
      // Find updated markets
      const updatedKalshiMarket = updatedMarkets.find(m => m.id === opportunity.kalshiMarket.id);
      const updatedPolyMarket = updatedMarkets.find(m => m.id === opportunity.polymarketMarket.id);

      if (!updatedKalshiMarket || !updatedPolyMarket) {
        continue; // Skip if markets no longer available
      }

      // Find updated conditions
      const updatedKalshiCondition = updatedKalshiMarket.conditions.find(
        c => c.name === opportunity.kalshiCondition.name
      );
      const updatedPolyCondition = updatedPolyMarket.conditions.find(
        c => c.name === opportunity.polymarketCondition.name
      );

      if (!updatedKalshiCondition || !updatedPolyCondition) {
        continue; // Skip if conditions no longer available
      }

      // Recalculate with updated data
      const updatedOpportunity = this.calculateArbitrage(
        updatedKalshiMarket,
        updatedPolyMarket,
        updatedKalshiCondition,
        updatedPolyCondition,
        opportunity.conditionMapping
      );

      if (updatedOpportunity) {
        // Preserve original IDs
        updatedOpportunity.id = opportunity.id;
        updatedOpportunity.matchId = opportunity.matchId;
        updatedOpportunity.ecosystemId = opportunity.ecosystemId;
        updatedOpportunities.push(updatedOpportunity);
      }
    }

    return updatedOpportunities.sort((a, b) => b.annualizedReturn - a.annualizedReturn);
  }

  /**
   * Calculate portfolio-level statistics for multiple arbitrage opportunities
   */
  calculatePortfolioStats(opportunities: ArbitrageOpportunity[]): {
    totalOpportunities: number;
    averageAPR: number;
    totalPotentialProfit: number;
    averageDaysUntilClose: number;
    riskScore: number;
  } {
    if (opportunities.length === 0) {
      return {
        totalOpportunities: 0,
        averageAPR: 0,
        totalPotentialProfit: 0,
        averageDaysUntilClose: 0,
        riskScore: 0,
      };
    }

    const totalAPR = opportunities.reduce((sum, opp) => sum + opp.annualizedReturn, 0);
    const totalProfit = opportunities.reduce((sum, opp) => sum + opp.profitOn100, 0);
    const totalDays = opportunities.reduce((sum, opp) => sum + opp.daysUntilClose, 0);

    // Risk score based on time until close and number of opportunities
    const avgDays = totalDays / opportunities.length;
    const riskScore = Math.min(1, Math.max(0, (avgDays - 1) / 365)) * 
                     Math.min(1, opportunities.length / 10);

    return {
      totalOpportunities: opportunities.length,
      averageAPR: totalAPR / opportunities.length,
      totalPotentialProfit: totalProfit,
      averageDaysUntilClose: avgDays,
      riskScore,
    };
  }

  /**
   * Filter opportunities by minimum APR threshold
   */
  filterByMinAPR(opportunities: ArbitrageOpportunity[], minAPR: number): ArbitrageOpportunity[] {
    return opportunities.filter(opp => opp.annualizedReturn >= minAPR);
  }

  /**
   * Filter opportunities by maximum days until close
   */
  filterByMaxDays(opportunities: ArbitrageOpportunity[], maxDays: number): ArbitrageOpportunity[] {
    return opportunities.filter(opp => opp.daysUntilClose <= maxDays);
  }

  /**
   * Get the best arbitrage opportunity (highest APR)
   */
  getBestOpportunity(opportunities: ArbitrageOpportunity[]): ArbitrageOpportunity | null {
    if (opportunities.length === 0) return null;
    return opportunities.reduce((best, current) => 
      current.annualizedReturn > best.annualizedReturn ? current : best
    );
  }

  /**
   * Private helper to find market pairs with specific conditions
   */
  private findMarketPairsWithConditions(
    markets: CommonMarket[],
    mapping: { conditions: Record<string, string | null> }
  ): Array<{
    market1: CommonMarket;
    market2: CommonMarket;
    condition1: Condition;
    condition2: Condition;
  }> {
    const pairs = [];
    const marketKeys = Object.keys(mapping.conditions);

    for (let i = 0; i < marketKeys.length; i++) {
      for (let j = i + 1; j < marketKeys.length; j++) {
        const key1 = marketKeys[i];
        const key2 = marketKeys[j];
        const conditionName1 = mapping.conditions[key1];
        const conditionName2 = mapping.conditions[key2];

        if (!conditionName1 || !conditionName2) continue;

        // Find markets by key format: "Platform-MarketName"
        const market1 = markets.find(m => `${m.platform}-${m.title}` === key1);
        const market2 = markets.find(m => `${m.platform}-${m.title}` === key2);

        if (!market1 || !market2) continue;

        const condition1 = market1.conditions.find(c => c.name === conditionName1);
        const condition2 = market2.conditions.find(c => c.name === conditionName2);

        if (condition1 && condition2) {
          pairs.push({ market1, market2, condition1, condition2 });
        }
      }
    }

    return pairs;
  }

  /**
   * Calculate the theoretical maximum profit for an arbitrage opportunity
   * considering liquidity constraints
   */
  calculateMaxProfit(
    opportunity: ArbitrageOpportunity,
    availableLiquidity: { kalshi: number; polymarket: number }
  ): number {
    const maxStake = Math.min(
      availableLiquidity.kalshi,
      availableLiquidity.polymarket,
      10000 // Reasonable max stake limit
    );

    return maxStake * opportunity.periodReturn;
  }
}

// Note about formula ambiguity:
// The PredictionMarketArb.txt mentions "rPeriod = 1 - C / C" which would always equal 0.
// We assume the intended formula is "rPeriod = (1 - C) / C" which makes economic sense.
// This gives the period return as the profit margin divided by the cost.

export const arbitrageCalculator = new ArbitrageCalculator();