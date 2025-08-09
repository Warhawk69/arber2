// Arbitrage detection and APR calculation utilities
import {
  ArbitrageOpportunity,
  CommonMarket,
  MarketMatch,
  ConditionMapping,
  Platform
} from '../api/types';

/**
 * Calculate arbitrage opportunities from matched markets with 'same' condition mappings
 * 
 * Formula per PredictionMarketArb.txt:
 * - C = minYes + minNo (total cost to guarantee win)
 * - If C < 1, arbitrage exists
 * - periodReturn = (1 - C) / C (assumed interpretation of ambiguous formula)
 * - APR = periodReturn * (365 / D) where D = days until earliest end time
 */
export function calculateArbitrageOpportunities(
  matches: MarketMatch[],
  kalshiMarkets: CommonMarket[],
  polymarketMarkets: CommonMarket[]
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];

  for (const match of matches) {
    // Only process matches with at least one 'same' condition mapping
    const sameConditionMappings = match.conditionMappings.filter(
      mapping => mapping.relationship === 'same'
    );

    if (sameConditionMappings.length === 0) {
      continue;
    }

    // Get the matched markets
    const kalshiMarket = kalshiMarkets.find(m => m.id === match.kalshiMarketId);
    const polymarketMarket = polymarketMarkets.find(m => m.id === match.polymarketMarketId);

    if (!kalshiMarket || !polymarketMarket) {
      continue;
    }

    // Process each 'same' condition mapping
    for (const mapping of sameConditionMappings) {
      const opportunity = calculateConditionArbitrage(
        mapping,
        kalshiMarket,
        polymarketMarket,
        match
      );

      if (opportunity) {
        opportunities.push(opportunity);
      }
    }
  }

  return opportunities.sort((a, b) => b.apr - a.apr); // Sort by APR descending
}

/**
 * Calculate arbitrage for a specific condition mapping
 */
function calculateConditionArbitrage(
  mapping: ConditionMapping,
  kalshiMarket: CommonMarket,
  polymarketMarket: CommonMarket,
  match: MarketMatch
): ArbitrageOpportunity | null {
  if (!mapping.kalshiCondition || !mapping.polymarketCondition) {
    return null;
  }

  // Find the conditions in each market
  const kalshiCondition = kalshiMarket.outcomes.find(
    c => c.name === mapping.kalshiCondition
  );
  const polymarketCondition = polymarketMarket.outcomes.find(
    c => c.name === mapping.polymarketCondition
  );

  if (!kalshiCondition || !polymarketCondition) {
    return null;
  }

  // Get prices for YES and NO across both exchanges
  const kalshiYesAsk = kalshiCondition.yesPrice;
  const kalshiNoAsk = kalshiCondition.noPrice;
  const polymarketYesAsk = polymarketCondition.yesPrice;
  const polymarketNoAsk = polymarketCondition.noPrice;

  // Find minimum costs to buy YES and NO
  const yesPrices = [kalshiYesAsk, polymarketYesAsk].filter(p => p !== undefined && p > 0);
  const noPrices = [kalshiNoAsk, polymarketNoAsk].filter(p => p !== undefined && p > 0);

  if (yesPrices.length === 0 || noPrices.length === 0) {
    return null;
  }

  const minYes = Math.min(...yesPrices);
  const minNo = Math.min(...noPrices);

  // Calculate arbitrage
  const C = minYes + minNo;

  // Only proceed if arbitrage exists (C < 1)
  if (C >= 1) {
    return null;
  }

  // Calculate returns
  // Note: PredictionMarketArb.txt shows "rPeriod = 1 - C / C" which simplifies to 0
  // Assuming intended formula is (1 - C) / C based on standard arbitrage calculations
  const periodReturn = (1 - C) / C;

  // Calculate days until earliest end time
  const earliestEndTime = new Date(Math.min(
    kalshiMarket.closeTime.getTime(),
    polymarketMarket.closeTime.getTime()
  ));
  const daysUntilClose = Math.max(1, Math.ceil(
    (earliestEndTime.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));

  // Calculate APR
  const apr = periodReturn * (365 / daysUntilClose);
  const profitOn100 = 100 * periodReturn;

  // Determine which exchange offers the best prices
  const yesBet = minYes === kalshiYesAsk ? {
    platform: 'kalshi' as Platform,
    marketId: kalshiMarket.id,
    condition: mapping.kalshiCondition,
    price: minYes,
  } : {
    platform: 'polymarket' as Platform,
    marketId: polymarketMarket.id,
    condition: mapping.polymarketCondition,
    price: minYes,
  };

  const noBet = minNo === kalshiNoAsk ? {
    platform: 'kalshi' as Platform,
    marketId: kalshiMarket.id,
    condition: mapping.kalshiCondition,
    price: minNo,
  } : {
    platform: 'polymarket' as Platform,
    marketId: polymarketMarket.id,
    condition: mapping.polymarketCondition,
    price: minNo,
  };

  // Collect all underlying conditions for expanded view
  const allConditions = [
    {
      platform: 'kalshi' as Platform,
      marketId: kalshiMarket.id,
      condition: mapping.kalshiCondition,
      yesPrice: kalshiYesAsk,
      noPrice: kalshiNoAsk,
    },
    {
      platform: 'polymarket' as Platform,
      marketId: polymarketMarket.id,
      condition: mapping.polymarketCondition,
      yesPrice: polymarketYesAsk,
      noPrice: polymarketNoAsk,
    },
  ];

  return {
    id: `${match.id}-${mapping.id}`,
    eventName: kalshiMarket.title || polymarketMarket.title,
    eventType: `${kalshiMarket.category} | ${polymarketMarket.category}`,
    market: mapping.kalshiCondition,
    earliestEndTime,
    daysUntilClose,
    minYes,
    minNo,
    C,
    periodReturn,
    apr,
    profitOn100,
    yesBet,
    noBet,
    updatedAt: new Date(),
    allConditions,
  };
}

/**
 * Update arbitrage opportunities with new price data
 * Efficiently recalculates only when underlying prices change
 */
export function updateArbitrageOpportunities(
  existingOpportunities: ArbitrageOpportunity[],
  updatedKalshiMarkets: CommonMarket[],
  updatedPolymarketMarkets: CommonMarket[]
): ArbitrageOpportunity[] {
  return existingOpportunities.map(opportunity => {
    // Find updated market data
    const kalshiMarket = updatedKalshiMarkets.find(m => 
      m.id === opportunity.yesBet.marketId || m.id === opportunity.noBet.marketId
    );
    const polymarketMarket = updatedPolymarketMarkets.find(m => 
      m.id === opportunity.yesBet.marketId || m.id === opportunity.noBet.marketId
    );

    if (!kalshiMarket || !polymarketMarket) {
      return opportunity; // Return unchanged if markets not found
    }

    // Get updated condition prices
    const kalshiCondition = kalshiMarket.outcomes.find(c => 
      c.name === opportunity.allConditions.find(ac => ac.platform === 'kalshi')?.condition
    );
    const polymarketCondition = polymarketMarket.outcomes.find(c => 
      c.name === opportunity.allConditions.find(ac => ac.platform === 'polymarket')?.condition
    );

    if (!kalshiCondition || !polymarketCondition) {
      return opportunity;
    }

    // Check if prices have changed
    const kalshiConditionData = opportunity.allConditions.find(ac => ac.platform === 'kalshi');
    const polymarketConditionData = opportunity.allConditions.find(ac => ac.platform === 'polymarket');

    const pricesChanged = 
      kalshiCondition.yesPrice !== kalshiConditionData?.yesPrice ||
      kalshiCondition.noPrice !== kalshiConditionData?.noPrice ||
      polymarketCondition.yesPrice !== polymarketConditionData?.yesPrice ||
      polymarketCondition.noPrice !== polymarketConditionData?.noPrice;

    if (!pricesChanged) {
      return opportunity; // No price changes, return as-is
    }

    // Recalculate with new prices
    const yesPrices = [kalshiCondition.yesPrice, polymarketCondition.yesPrice]
      .filter(p => p !== undefined && p > 0);
    const noPrices = [kalshiCondition.noPrice, polymarketCondition.noPrice]
      .filter(p => p !== undefined && p > 0);

    if (yesPrices.length === 0 || noPrices.length === 0) {
      return opportunity; // Can't calculate, return as-is
    }

    const minYes = Math.min(...yesPrices);
    const minNo = Math.min(...noPrices);
    const C = minYes + minNo;

    // If no longer an arbitrage opportunity, mark for removal by setting APR to 0
    if (C >= 1) {
      return {
        ...opportunity,
        minYes,
        minNo,
        C,
        periodReturn: 0,
        apr: 0,
        profitOn100: 0,
        updatedAt: new Date(),
      };
    }

    const periodReturn = (1 - C) / C;
    const apr = periodReturn * (365 / opportunity.daysUntilClose);
    const profitOn100 = 100 * periodReturn;

    // Update bet information
    const yesBet = minYes === kalshiCondition.yesPrice ? {
      platform: 'kalshi' as Platform,
      marketId: kalshiMarket.id,
      condition: kalshiCondition.name,
      price: minYes,
    } : {
      platform: 'polymarket' as Platform,
      marketId: polymarketMarket.id,
      condition: polymarketCondition.name,
      price: minYes,
    };

    const noBet = minNo === kalshiCondition.noPrice ? {
      platform: 'kalshi' as Platform,
      marketId: kalshiMarket.id,
      condition: kalshiCondition.name,
      price: minNo,
    } : {
      platform: 'polymarket' as Platform,
      marketId: polymarketMarket.id,
      condition: polymarketCondition.name,
      price: minNo,
    };

    // Update all conditions data
    const allConditions = [
      {
        platform: 'kalshi' as Platform,
        marketId: kalshiMarket.id,
        condition: kalshiCondition.name,
        yesPrice: kalshiCondition.yesPrice,
        noPrice: kalshiCondition.noPrice,
      },
      {
        platform: 'polymarket' as Platform,
        marketId: polymarketMarket.id,
        condition: polymarketCondition.name,
        yesPrice: polymarketCondition.yesPrice,
        noPrice: polymarketCondition.noPrice,
      },
    ];

    return {
      ...opportunity,
      minYes,
      minNo,
      C,
      periodReturn,
      apr,
      profitOn100,
      yesBet,
      noBet,
      updatedAt: new Date(),
      allConditions,
    };
  }).filter(opp => opp.apr > 0); // Remove opportunities that are no longer profitable
}

/**
 * Calculate portfolio-level arbitrage metrics
 */
export function calculatePortfolioMetrics(opportunities: ArbitrageOpportunity[]) {
  if (opportunities.length === 0) {
    return {
      totalOpportunities: 0,
      averageAPR: 0,
      totalProfitOn100: 0,
      bestAPR: 0,
      averageDaysToExpiry: 0,
    };
  }

  const totalAPR = opportunities.reduce((sum, opp) => sum + opp.apr, 0);
  const totalProfit = opportunities.reduce((sum, opp) => sum + opp.profitOn100, 0);
  const totalDays = opportunities.reduce((sum, opp) => sum + opp.daysUntilClose, 0);

  return {
    totalOpportunities: opportunities.length,
    averageAPR: totalAPR / opportunities.length,
    totalProfitOn100: totalProfit,
    bestAPR: Math.max(...opportunities.map(opp => opp.apr)),
    averageDaysToExpiry: totalDays / opportunities.length,
  };
}

/**
 * Filter arbitrage opportunities by criteria
 */
export function filterArbitrageOpportunities(
  opportunities: ArbitrageOpportunity[],
  filters: {
    minAPR?: number;
    maxDaysToExpiry?: number;
    minProfitOn100?: number;
    categories?: string[];
  }
): ArbitrageOpportunity[] {
  return opportunities.filter(opp => {
    if (filters.minAPR && opp.apr < filters.minAPR) return false;
    if (filters.maxDaysToExpiry && opp.daysUntilClose > filters.maxDaysToExpiry) return false;
    if (filters.minProfitOn100 && opp.profitOn100 < filters.minProfitOn100) return false;
    if (filters.categories && filters.categories.length > 0) {
      const categoryMatch = filters.categories.some(cat => 
        opp.eventType.toLowerCase().includes(cat.toLowerCase())
      );
      if (!categoryMatch) return false;
    }
    return true;
  });
}