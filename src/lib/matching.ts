// Market matching utilities with fuzzy similarity and condition matching
import { CommonMarket, ConditionMapping, RelationshipType } from '../api/types';

/**
 * Calculate fuzzy similarity between two markets
 * @param market1 First market
 * @param market2 Second market
 * @returns Similarity object with individual scores and overall score
 */
export function calculateMarketSimilarity(
  market1: CommonMarket,
  market2: CommonMarket
) {
  // Title similarity using token overlap
  const titleSimilarity = calculateTitleSimilarity(market1.title, market2.title);
  
  // Category match weight
  const categorySimilarity = calculateCategorySimilarity(market1.category, market2.category);
  
  // Close date proximity
  const dateSimilarity = calculateDateSimilarity(market1.closeTime, market2.closeTime);
  
  // Condition count similarity
  const conditionSimilarity = calculateConditionCountSimilarity(
    market1.conditions.length, 
    market2.conditions.length
  );

  // Settlement source similarity (if available)
  const settlementSimilarity = calculateSettlementSimilarity(
    market1.settlementSource,
    market2.settlementSource
  );

  // Weighted overall score
  const overall = (
    titleSimilarity * 0.4 +
    categorySimilarity * 0.2 +
    dateSimilarity * 0.2 +
    conditionSimilarity * 0.1 +
    settlementSimilarity * 0.1
  );

  return {
    overall,
    title: titleSimilarity,
    category: categorySimilarity,
    date: dateSimilarity,
    conditions: conditionSimilarity,
    settlement: settlementSimilarity
  };
}

/**
 * Calculate title similarity using token overlap
 * @param title1 First title
 * @param title2 Second title
 * @returns Similarity score (0-1)
 */
export function calculateTitleSimilarity(title1: string, title2: string): number {
  // Normalize titles: lowercase, remove punctuation, split into tokens
  const normalize = (str: string) => 
    str.toLowerCase()
       .replace(/[^\w\s]/g, ' ')
       .split(/\s+/)
       .filter(token => token.length > 2); // Ignore very short words

  const tokens1 = normalize(title1);
  const tokens2 = normalize(title2);

  if (tokens1.length === 0 || tokens2.length === 0) {
    return 0;
  }

  // Calculate Jaccard similarity (intersection / union)
  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Calculate category similarity
 * @param cat1 First category
 * @param cat2 Second category
 * @returns Similarity score (0-1)
 */
export function calculateCategorySimilarity(cat1: string, cat2: string): number {
  if (!cat1 || !cat2) return 0.5; // Default if missing

  // Exact match
  if (cat1.toLowerCase() === cat2.toLowerCase()) {
    return 1.0;
  }

  // Partial match for related categories
  const relatedCategories = {
    'politics': ['election', 'government', 'policy'],
    'economics': ['finance', 'macro', 'fed', 'rates'],
    'crypto': ['cryptocurrency', 'bitcoin', 'eth'],
    'sports': ['baseball', 'football', 'basketball'],
    'technology': ['tech', 'ai', 'software']
  };

  const norm1 = cat1.toLowerCase();
  const norm2 = cat2.toLowerCase();

  for (const [main, related] of Object.entries(relatedCategories)) {
    if ((norm1 === main && related.includes(norm2)) ||
        (norm2 === main && related.includes(norm1)) ||
        (related.includes(norm1) && related.includes(norm2))) {
      return 0.8;
    }
  }

  // Token similarity for categories
  return calculateTitleSimilarity(cat1, cat2) * 0.6;
}

/**
 * Calculate date similarity based on proximity
 * @param date1 First close date
 * @param date2 Second close date
 * @returns Similarity score (0-1)
 */
export function calculateDateSimilarity(date1: Date, date2: Date): number {
  if (!date1 || !date2) return 0.5;

  const timeDiff = Math.abs(date1.getTime() - date2.getTime());
  const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

  // Exact date match
  if (daysDiff === 0) return 1.0;

  // Proximity-based scoring (decays over 30 days)
  if (daysDiff <= 1) return 0.95;
  if (daysDiff <= 7) return 0.8;
  if (daysDiff <= 30) return 0.6;
  if (daysDiff <= 90) return 0.3;
  
  return 0.1; // Very different dates
}

/**
 * Calculate condition count similarity
 * @param count1 Number of conditions in first market
 * @param count2 Number of conditions in second market
 * @returns Similarity score (0-1)
 */
export function calculateConditionCountSimilarity(count1: number, count2: number): number {
  if (count1 === count2) return 1.0;

  const diff = Math.abs(count1 - count2);
  const maxCount = Math.max(count1, count2);
  
  return 1 - (diff / maxCount);
}

/**
 * Calculate settlement source similarity
 * @param source1 First settlement source
 * @param source2 Second settlement source
 * @returns Similarity score (0-1)
 */
export function calculateSettlementSimilarity(
  source1?: string, 
  source2?: string
): number {
  if (!source1 || !source2) return 0.5;

  // Exact match
  if (source1.toLowerCase() === source2.toLowerCase()) {
    return 1.0;
  }

  // Common trusted sources
  const trustedSources = ['associated press', 'ap', 'reuters', 'federal reserve', 'fed'];
  
  const norm1 = source1.toLowerCase();
  const norm2 = source2.toLowerCase();

  // Both use same trusted source
  for (const trusted of trustedSources) {
    if (norm1.includes(trusted) && norm2.includes(trusted)) {
      return 1.0;
    }
  }

  // Token-based similarity
  return calculateTitleSimilarity(source1, source2) * 0.7;
}

/**
 * Find potential condition mappings between two markets
 * @param market1 First market
 * @param market2 Second market
 * @param minSimilarity Minimum similarity threshold for auto-mapping
 * @returns Array of potential condition mappings
 */
export function findPotentialConditionMappings(
  market1: CommonMarket,
  market2: CommonMarket,
  minSimilarity: number = 0.7
): Array<{ 
  condition1: string; 
  condition2: string; 
  similarity: number;
  suggestedRelationship: RelationshipType;
}> {
  const potentialMappings = [];

  for (const cond1 of market1.conditions) {
    for (const cond2 of market2.conditions) {
      const similarity = calculateConditionSimilarity(cond1.name, cond2.name);
      
      if (similarity >= minSimilarity) {
        const relationship = suggestRelationshipType(cond1.name, cond2.name, similarity);
        
        potentialMappings.push({
          condition1: cond1.name,
          condition2: cond2.name,
          similarity,
          suggestedRelationship: relationship
        });
      }
    }
  }

  // Sort by similarity descending
  return potentialMappings.sort((a, b) => b.similarity - a.similarity);
}

/**
 * Calculate similarity between two condition names
 * @param cond1 First condition name
 * @param cond2 Second condition name
 * @returns Similarity score (0-1)
 */
export function calculateConditionSimilarity(cond1: string, cond2: string): number {
  // Handle exact matches and common variations
  const norm1 = normalizeConditionName(cond1);
  const norm2 = normalizeConditionName(cond2);

  if (norm1 === norm2) return 1.0;

  // Handle Yes/No binary conditions
  if ((norm1 === 'yes' && norm2 === 'no') || (norm1 === 'no' && norm2 === 'yes')) {
    return 0.1; // These are opposites, not similar
  }

  // Use title similarity algorithm
  return calculateTitleSimilarity(cond1, cond2);
}

/**
 * Normalize condition names for comparison
 * @param condition Condition name
 * @returns Normalized condition name
 */
export function normalizeConditionName(condition: string): string {
  return condition.toLowerCase()
                  .replace(/[^\w\s]/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
}

/**
 * Suggest relationship type based on condition similarity
 * @param cond1 First condition
 * @param cond2 Second condition  
 * @param similarity Calculated similarity score
 * @returns Suggested relationship type
 */
export function suggestRelationshipType(
  cond1: string, 
  cond2: string, 
  similarity: number
): RelationshipType {
  const norm1 = normalizeConditionName(cond1);
  const norm2 = normalizeConditionName(cond2);

  // High similarity suggests same condition
  if (similarity >= 0.9) {
    return 'same';
  }

  // Check for opposite conditions
  if ((norm1.includes('yes') && norm2.includes('no')) ||
      (norm1.includes('no') && norm2.includes('yes')) ||
      (norm1.includes('increase') && norm2.includes('decrease')) ||
      (norm1.includes('over') && norm2.includes('under'))) {
    return 'opposites';
  }

  // Check for subset relationships
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return 'subset';
  }

  // Medium similarity suggests overlapping
  if (similarity >= 0.6) {
    return 'overlapping';
  }

  // Default for moderate similarity
  return 'complementary';
}

/**
 * Validate condition mapping quality
 * @param mapping Condition mapping
 * @param market1 First market
 * @param market2 Second market
 * @returns Validation result with issues
 */
export function validateConditionMapping(
  mapping: ConditionMapping,
  market1: CommonMarket,
  market2: CommonMarket
) {
  const issues = [];
  
  // Check if conditions exist
  const cond1 = market1.conditions.find(c => c.name === mapping.kalshi);
  const cond2 = market2.conditions.find(c => c.name === mapping.polymarket);

  if (!cond1) {
    issues.push(`Kalshi condition "${mapping.kalshi}" not found`);
  }
  
  if (!cond2) {
    issues.push(`Polymarket condition "${mapping.polymarket}" not found`);
  }

  if (cond1 && cond2) {
    // Check price reasonableness for 'same' relationships
    if (mapping.relationship === 'same') {
      const priceDiff = Math.abs(cond1.yesPrice - cond2.yesPrice);
      if (priceDiff > 0.3) {
        issues.push(`Large price difference (${(priceDiff * 100).toFixed(1)}%) for 'same' relationship`);
      }
    }

    // Check for opposite pricing patterns
    if (mapping.relationship === 'opposites') {
      const expectedOpposite = 1 - cond1.yesPrice;
      const actualPrice = cond2.yesPrice;
      const oppositeDiff = Math.abs(expectedOpposite - actualPrice);
      
      if (oppositeDiff > 0.2) {
        issues.push(`Pricing doesn't support 'opposites' relationship`);
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    confidence: issues.length === 0 ? (mapping.confidence || 0.8) : 0.3
  };
}

/**
 * Auto-generate condition mappings for similar markets
 * @param market1 First market (Kalshi)
 * @param market2 Second market (Polymarket)
 * @param confidenceThreshold Minimum confidence for auto-mapping
 * @returns Array of auto-generated mappings
 */
export function autoGenerateConditionMappings(
  market1: CommonMarket,
  market2: CommonMarket,
  confidenceThreshold: number = 0.8
): ConditionMapping[] {
  const mappings: ConditionMapping[] = [];
  const used2 = new Set<string>();

  for (const cond1 of market1.conditions) {
    let bestMatch = null;
    let bestSimilarity = 0;

    for (const cond2 of market2.conditions) {
      if (used2.has(cond2.name)) continue;

      const similarity = calculateConditionSimilarity(cond1.name, cond2.name);
      
      if (similarity > bestSimilarity && similarity >= confidenceThreshold) {
        bestSimilarity = similarity;
        bestMatch = cond2;
      }
    }

    if (bestMatch) {
      const relationship = suggestRelationshipType(cond1.name, bestMatch.name, bestSimilarity);
      
      mappings.push({
        kalshi: cond1.name,
        polymarket: bestMatch.name,
        relationship,
        confidence: bestSimilarity
      });

      used2.add(bestMatch.name);
    }
  }

  return mappings;
}