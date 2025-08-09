// Market matching utilities with fuzzy similarity and condition matching
import {
  CommonMarket,
  SimilarityScore,
  MarketMatch,
  ConditionMapping,
  RelationshipType
} from '../api/types';

/**
 * Calculate similarity score between two markets
 * Uses title token overlap, category match, close date proximity, and condition count similarity
 */
export function calculateSimilarity(market1: CommonMarket, market2: CommonMarket): SimilarityScore {
  // Title similarity using token overlap
  const titleSimilarity = calculateTitleSimilarity(market1.title, market2.title);
  
  // Category similarity
  const categorySimilarity = calculateCategorySimilarity(market1.category, market2.category);
  
  // Close date proximity (exact date = 1, else decays)
  const dateSimilarity = calculateDateSimilarity(market1.closeTime, market2.closeTime);
  
  // Condition count similarity
  const conditionSimilarity = calculateConditionCountSimilarity(
    market1.outcomes.length,
    market2.outcomes.length
  );

  // Settlement source similarity
  const settlementSimilarity = calculateSettlementSimilarity(
    market1.settlementSource,
    market2.settlementSource
  );

  // Weighted overall score
  const overall = (
    titleSimilarity * 0.4 +
    dateSimilarity * 0.3 +
    conditionSimilarity * 0.2 +
    categorySimilarity * 0.05 +
    settlementSimilarity * 0.05
  );

  return {
    overall,
    title: titleSimilarity,
    date: dateSimilarity,
    conditions: conditionSimilarity,
    settlement: settlementSimilarity,
  };
}

/**
 * Calculate title similarity using token overlap
 */
function calculateTitleSimilarity(title1: string, title2: string): number {
  // Normalize titles: lowercase, remove punctuation, split into tokens
  const normalize = (title: string): string[] => {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 2) // Filter out short words
      .filter(token => !['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with'].includes(token));
  };

  const tokens1 = normalize(title1);
  const tokens2 = normalize(title2);

  if (tokens1.length === 0 || tokens2.length === 0) {
    return 0;
  }

  // Calculate Jaccard similarity (intersection over union)
  const intersection = tokens1.filter(token => tokens2.includes(token));
  const union = [...new Set([...tokens1, ...tokens2])];

  return intersection.length / union.length;
}

/**
 * Calculate category similarity
 */
function calculateCategorySimilarity(category1: string, category2: string): number {
  if (!category1 || !category2) return 0;

  const cat1 = category1.toLowerCase().trim();
  const cat2 = category2.toLowerCase().trim();

  if (cat1 === cat2) return 1;

  // Check for partial matches (e.g., "Politics" vs "Political")
  if (cat1.includes(cat2) || cat2.includes(cat1)) return 0.8;

  // Check for related categories
  const categoryMappings: Record<string, string[]> = {
    'politics': ['political', 'election', 'government'],
    'economics': ['economic', 'finance', 'financial', 'fed', 'monetary'],
    'sports': ['sport', 'athletic', 'baseball', 'football', 'basketball'],
    'technology': ['tech', 'ai', 'crypto', 'cryptocurrency', 'bitcoin'],
  };

  for (const [mainCat, related] of Object.entries(categoryMappings)) {
    if ((cat1 === mainCat && related.includes(cat2)) ||
        (cat2 === mainCat && related.includes(cat1)) ||
        (related.includes(cat1) && related.includes(cat2))) {
      return 0.6;
    }
  }

  return 0;
}

/**
 * Calculate date similarity with proximity decay
 */
function calculateDateSimilarity(date1: Date, date2: Date): number {
  const diffDays = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);
  
  if (diffDays === 0) return 1; // Exact match
  if (diffDays <= 1) return 0.9; // Within 1 day
  if (diffDays <= 7) return 0.7; // Within 1 week
  if (diffDays <= 30) return 0.5; // Within 1 month
  if (diffDays <= 90) return 0.2; // Within 3 months
  
  return 0; // Too far apart
}

/**
 * Calculate condition count similarity
 */
function calculateConditionCountSimilarity(count1: number, count2: number): number {
  if (count1 === count2) return 1;
  
  const diff = Math.abs(count1 - count2);
  const maxCount = Math.max(count1, count2);
  
  return Math.max(0, 1 - (diff / maxCount));
}

/**
 * Calculate settlement source similarity
 */
function calculateSettlementSimilarity(source1?: string, source2?: string): number {
  if (!source1 || !source2) return 0.5; // Default when unknown

  const s1 = source1.toLowerCase().trim();
  const s2 = source2.toLowerCase().trim();

  if (s1 === s2) return 1;

  // Check for known equivalent sources
  const equivalents = [
    ['associated press', 'ap', 'ap news'],
    ['reuters', 'reuters news'],
    ['cnn', 'cnn news'],
    ['federal reserve', 'fed', 'fomc'],
    ['sec', 'securities and exchange commission'],
  ];

  for (const group of equivalents) {
    if (group.includes(s1) && group.includes(s2)) {
      return 1;
    }
  }

  // Partial string matching
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }

  return 0;
}

/**
 * Find potential market matches using similarity scoring
 */
export function findPotentialMatches(
  kalshiMarkets: CommonMarket[],
  polymarketMarkets: CommonMarket[],
  minSimilarity = 0.6
): Array<{
  kalshi: CommonMarket;
  polymarket: CommonMarket;
  similarity: SimilarityScore;
}> {
  const potentialMatches: Array<{
    kalshi: CommonMarket;
    polymarket: CommonMarket;
    similarity: SimilarityScore;
  }> = [];

  for (const kalshiMarket of kalshiMarkets) {
    for (const polymarketMarket of polymarketMarkets) {
      const similarity = calculateSimilarity(kalshiMarket, polymarketMarket);
      
      if (similarity.overall >= minSimilarity) {
        potentialMatches.push({
          kalshi: kalshiMarket,
          polymarket: polymarketMarket,
          similarity,
        });
      }
    }
  }

  // Sort by similarity score descending
  return potentialMatches.sort((a, b) => b.similarity.overall - a.similarity.overall);
}

/**
 * Suggest condition mappings between markets
 */
export function suggestConditionMappings(
  kalshiMarket: CommonMarket,
  polymarketMarket: CommonMarket
): ConditionMapping[] {
  const suggestions: ConditionMapping[] = [];

  for (const kalshiCondition of kalshiMarket.outcomes) {
    for (const polymarketCondition of polymarketMarket.outcomes) {
      const similarity = calculateConditionSimilarity(
        kalshiCondition.name,
        polymarketCondition.name
      );

      if (similarity.score >= 0.7) {
        suggestions.push({
          id: `${kalshiCondition.id}-${polymarketCondition.id}`,
          kalshiCondition: kalshiCondition.name,
          polymarketCondition: polymarketCondition.name,
          relationship: similarity.relationship,
          confidence: similarity.score,
          createdAt: new Date(),
        });
      }
    }
  }

  return suggestions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
}

/**
 * Calculate similarity between individual conditions
 */
function calculateConditionSimilarity(
  condition1: string,
  condition2: string
): { score: number; relationship: RelationshipType } {
  const c1 = condition1.toLowerCase().trim();
  const c2 = condition2.toLowerCase().trim();

  // Exact match
  if (c1 === c2) {
    return { score: 1, relationship: 'same' };
  }

  // Check for obvious same conditions with different formatting
  const normalizeCondition = (cond: string): string => {
    return cond
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const norm1 = normalizeCondition(c1);
  const norm2 = normalizeCondition(c2);

  if (norm1 === norm2) {
    return { score: 0.95, relationship: 'same' };
  }

  // Check for opposites
  const opposites = [
    ['yes', 'no'],
    ['true', 'false'],
    ['pass', 'fail'],
    ['win', 'lose'],
    ['increase', 'decrease'],
    ['above', 'below'],
    ['over', 'under'],
    ['higher', 'lower'],
    ['up', 'down'],
  ];

  for (const [opp1, opp2] of opposites) {
    if ((c1.includes(opp1) && c2.includes(opp2)) || 
        (c1.includes(opp2) && c2.includes(opp1))) {
      return { score: 0.9, relationship: 'opposites' };
    }
  }

  // Check for containment (subset relationship)
  if (c1.includes(c2) || c2.includes(c1)) {
    return { score: 0.8, relationship: 'subset' };
  }

  // Token-based similarity for more complex matching
  const tokens1 = norm1.split(' ').filter(t => t.length > 1);
  const tokens2 = norm2.split(' ').filter(t => t.length > 1);

  const commonTokens = tokens1.filter(token => tokens2.includes(token));
  const tokenSimilarity = commonTokens.length / Math.max(tokens1.length, tokens2.length);

  if (tokenSimilarity >= 0.7) {
    return { score: tokenSimilarity, relationship: 'same' };
  } else if (tokenSimilarity >= 0.5) {
    return { score: tokenSimilarity, relationship: 'overlapping' };
  } else if (tokenSimilarity >= 0.3) {
    return { score: tokenSimilarity, relationship: 'complementary' };
  }

  return { score: 0, relationship: 'mutually-exclusive' };
}

/**
 * Validate a market match for quality and consistency
 */
export function validateMarketMatch(
  kalshiMarket: CommonMarket,
  polymarketMarket: CommonMarket,
  conditionMappings: ConditionMapping[]
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check date consistency
  const dateDiff = Math.abs(
    kalshiMarket.closeTime.getTime() - polymarketMarket.closeTime.getTime()
  ) / (1000 * 60 * 60 * 24);

  if (dateDiff > 7) {
    issues.push(`Close dates differ by ${Math.round(dateDiff)} days`);
  }

  // Check if we have any 'same' mappings for arbitrage potential
  const sameMappings = conditionMappings.filter(m => m.relationship === 'same');
  if (sameMappings.length === 0) {
    issues.push('No "same" condition mappings found - no arbitrage potential');
  }

  // Check for conflicting mappings
  const kalshiConditionUsage = new Map<string, number>();
  const polymarketConditionUsage = new Map<string, number>();

  conditionMappings.forEach(mapping => {
    if (mapping.kalshiCondition) {
      kalshiConditionUsage.set(
        mapping.kalshiCondition,
        (kalshiConditionUsage.get(mapping.kalshiCondition) || 0) + 1
      );
    }
    if (mapping.polymarketCondition) {
      polymarketConditionUsage.set(
        mapping.polymarketCondition,
        (polymarketConditionUsage.get(mapping.polymarketCondition) || 0) + 1
      );
    }
  });

  // Check for over-used conditions
  kalshiConditionUsage.forEach((count, condition) => {
    if (count > 1) {
      issues.push(`Kalshi condition "${condition}" mapped multiple times`);
    }
  });

  polymarketConditionUsage.forEach((count, condition) => {
    if (count > 1) {
      issues.push(`Polymarket condition "${condition}" mapped multiple times`);
    }
  });

  // Check category compatibility
  if (kalshiMarket.category !== polymarketMarket.category) {
    const catSimilarity = calculateCategorySimilarity(
      kalshiMarket.category,
      polymarketMarket.category
    );
    if (catSimilarity < 0.6) {
      issues.push(`Categories seem incompatible: ${kalshiMarket.category} vs ${polymarketMarket.category}`);
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Create a market match object
 */
export function createMarketMatch(
  kalshiMarket: CommonMarket,
  polymarketMarket: CommonMarket,
  conditionMappings: ConditionMapping[] = [],
  confidence?: number
): MarketMatch {
  const similarity = calculateSimilarity(kalshiMarket, polymarketMarket);
  
  return {
    id: `${kalshiMarket.id}-${polymarketMarket.id}-${Date.now()}`,
    kalshiMarketId: kalshiMarket.id,
    polymarketMarketId: polymarketMarket.id,
    createdAt: new Date(),
    confidence: confidence || similarity.overall,
    conditionMappings,
    conditionsMatched: conditionMappings.length > 0,
    totalVolume: (kalshiMarket.volume || 0) + (polymarketMarket.volume || 0),
  };
}