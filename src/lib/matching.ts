// Market matching utilities with fuzzy similarity
import { CommonMarket, ConditionMapping, RelationshipType } from '../api/types';

export interface SimilarityScore {
  overall: number;
  title: number;
  date: number;
  conditions: number;
  settlement: number;
  category: number;
}

export class MarketMatcher {
  /**
   * Calculate similarity score between two markets
   */
  calculateSimilarity(market1: CommonMarket, market2: CommonMarket): SimilarityScore {
    const titleSimilarity = this.calculateTitleSimilarity(market1.title, market2.title);
    const dateSimilarity = this.calculateDateSimilarity(market1.closeTime, market2.closeTime);
    const conditionSimilarity = this.calculateConditionSimilarity(market1, market2);
    const settlementSimilarity = this.calculateSettlementSimilarity(
      market1.settlementSource || '', 
      market2.settlementSource || ''
    );
    const categorySimilarity = this.calculateCategorySimilarity(market1.category, market2.category);

    // Weighted overall score
    const overall = (
      titleSimilarity * 0.4 +
      dateSimilarity * 0.25 +
      conditionSimilarity * 0.15 +
      settlementSimilarity * 0.1 +
      categorySimilarity * 0.1
    );

    return {
      overall,
      title: titleSimilarity,
      date: dateSimilarity,
      conditions: conditionSimilarity,
      settlement: settlementSimilarity,
      category: categorySimilarity,
    };
  }

  /**
   * Calculate title similarity using token overlap and fuzzy matching
   */
  calculateTitleSimilarity(title1: string, title2: string): number {
    const normalize = (str: string): string[] => {
      return str.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 2) // Filter short words
        .filter(word => !this.isStopWord(word)); // Filter stop words
    };

    const tokens1 = normalize(title1);
    const tokens2 = normalize(title2);

    if (tokens1.length === 0 || tokens2.length === 0) {
      return 0;
    }

    // Token overlap similarity
    const commonTokens = tokens1.filter(token => 
      tokens2.some(token2 => this.areTokensSimilar(token, token2))
    );
    const tokenOverlap = commonTokens.length / Math.max(tokens1.length, tokens2.length);

    // Levenshtein distance for overall similarity
    const levenshteinSimilarity = this.calculateLevenshteinSimilarity(
      title1.toLowerCase(), 
      title2.toLowerCase()
    );

    // Jaro-Winkler for better name matching
    const jaroSimilarity = this.calculateJaroSimilarity(title1.toLowerCase(), title2.toLowerCase());

    // Combine different similarity measures
    return Math.max(tokenOverlap * 0.5 + levenshteinSimilarity * 0.3 + jaroSimilarity * 0.2);
  }

  /**
   * Calculate date similarity (exact match = 1, proximity decay)
   */
  calculateDateSimilarity(date1: Date, date2: Date): number {
    if (date1.getTime() === date2.getTime()) {
      return 1.0;
    }

    const timeDiff = Math.abs(date1.getTime() - date2.getTime());
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    // Exponential decay - same day = 1, 1 day = 0.9, 7 days = 0.5, etc.
    if (daysDiff === 0) return 1.0;
    if (daysDiff <= 1) return 0.9;
    if (daysDiff <= 7) return 0.7;
    if (daysDiff <= 30) return 0.4;
    if (daysDiff <= 90) return 0.2;
    return 0.1;
  }

  /**
   * Calculate condition count and name similarity
   */
  calculateConditionSimilarity(market1: CommonMarket, market2: CommonMarket): number {
    const count1 = market1.conditions.length;
    const count2 = market2.conditions.length;
    
    // Condition count similarity
    const countDiff = Math.abs(count1 - count2);
    const countSimilarity = 1 - (countDiff / Math.max(count1, count2));

    // Condition name similarity
    let nameMatches = 0;
    let totalComparisons = 0;

    for (const condition1 of market1.conditions) {
      for (const condition2 of market2.conditions) {
        const similarity = this.calculateTitleSimilarity(condition1.name, condition2.name);
        if (similarity > 0.7) { // High threshold for condition matching
          nameMatches++;
        }
        totalComparisons++;
      }
    }

    const nameSimilarity = totalComparisons > 0 ? nameMatches / Math.min(count1, count2) : 0;

    return (countSimilarity * 0.4 + nameSimilarity * 0.6);
  }

  /**
   * Calculate settlement source similarity
   */
  calculateSettlementSimilarity(source1: string, source2: string): number {
    if (!source1 || !source2) return 0.5; // Neutral if missing

    const normalize = (str: string) => str.toLowerCase().trim();
    const norm1 = normalize(source1);
    const norm2 = normalize(source2);

    if (norm1 === norm2) return 1.0;

    // Check for common sources
    const apSources = ['ap', 'associated press', 'ap news'];
    const officialSources = ['official', 'government', 'federal reserve', 'fed'];

    const isAP1 = apSources.some(ap => norm1.includes(ap));
    const isAP2 = apSources.some(ap => norm2.includes(ap));
    if (isAP1 && isAP2) return 1.0;

    const isOfficial1 = officialSources.some(official => norm1.includes(official));
    const isOfficial2 = officialSources.some(official => norm2.includes(official));
    if (isOfficial1 && isOfficial2) return 0.8;

    // Fuzzy string matching for settlement sources
    return this.calculateJaroSimilarity(norm1, norm2);
  }

  /**
   * Calculate category similarity
   */
  calculateCategorySimilarity(category1: string, category2: string): number {
    const normalize = (str: string) => str.toLowerCase().trim();
    const norm1 = normalize(category1);
    const norm2 = normalize(category2);

    if (norm1 === norm2) return 1.0;

    // Define related categories
    const categoryGroups = [
      ['politics', 'political', 'election', 'government'],
      ['economics', 'finance', 'macro', 'economic', 'financial'],
      ['crypto', 'cryptocurrency', 'bitcoin', 'eth', 'blockchain'],
      ['sports', 'sport', 'baseball', 'football', 'basketball'],
      ['technology', 'tech', 'ai', 'artificial intelligence'],
    ];

    for (const group of categoryGroups) {
      const inGroup1 = group.some(cat => norm1.includes(cat));
      const inGroup2 = group.some(cat => norm2.includes(cat));
      if (inGroup1 && inGroup2) return 0.8;
    }

    return this.calculateJaroSimilarity(norm1, norm2);
  }

  /**
   * Check if two tokens are similar (handles variations)
   */
  private areTokensSimilar(token1: string, token2: string): boolean {
    if (token1 === token2) return true;
    
    // Handle common variations
    const variations: Record<string, string[]> = {
      'trump': ['donald', 'dt'],
      'biden': ['joe', 'joseph'],
      'election': ['presidential', 'president'],
      'fed': ['federal', 'reserve'],
      'btc': ['bitcoin'],
      'eth': ['ethereum'],
    };

    for (const [key, vars] of Object.entries(variations)) {
      if ((token1 === key && vars.includes(token2)) ||
          (token2 === key && vars.includes(token1))) {
        return true;
      }
    }

    // Levenshtein distance for typos
    return this.calculateLevenshteinSimilarity(token1, token2) > 0.8;
  }

  /**
   * Check if word is a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'will', 'be', 'is', 'are', 'was', 'were', 'has', 'have', 'had', 'do', 'does', 'did',
      'a', 'an', 'this', 'that', 'these', 'those', 'can', 'could', 'would', 'should'
    ]);
    return stopWords.has(word.toLowerCase());
  }

  /**
   * Calculate Levenshtein distance similarity (0-1)
   */
  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate Jaro similarity
   */
  private calculateJaroSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const matchDistance = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
    const str1Matches = new Array(str1.length).fill(false);
    const str2Matches = new Array(str2.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    // Find matches
    for (let i = 0; i < str1.length; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, str2.length);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    // Find transpositions
    let k = 0;
    for (let i = 0; i < str1.length; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    return (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3.0;
  }

  /**
   * Find best condition mappings between two markets
   */
  findConditionMappings(
    market1: CommonMarket, 
    market2: CommonMarket,
    threshold: number = 0.7
  ): ConditionMapping[] {
    const mappings: ConditionMapping[] = [];
    
    for (const condition1 of market1.conditions) {
      for (const condition2 of market2.conditions) {
        const similarity = this.calculateTitleSimilarity(condition1.name, condition2.name);
        
        if (similarity >= threshold) {
          const relationship = this.inferRelationship(condition1.name, condition2.name, similarity);
          
          mappings.push({
            id: `${condition1.id}-${condition2.id}`,
            kalshiCondition: condition1.name,
            polymarketCondition: condition2.name,
            relationship,
            confidence: similarity,
          });
        }
      }
    }

    // Sort by confidence and remove duplicates
    return mappings
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .filter((mapping, index, arr) => 
        arr.findIndex(m => 
          m.kalshiCondition === mapping.kalshiCondition || 
          m.polymarketCondition === mapping.polymarketCondition
        ) === index
      );
  }

  /**
   * Infer relationship type between conditions
   */
  private inferRelationship(condition1: string, condition2: string, similarity: number): RelationshipType {
    const norm1 = condition1.toLowerCase();
    const norm2 = condition2.toLowerCase();

    // Exact or very high similarity -> same
    if (similarity > 0.95 || norm1 === norm2) {
      return 'same';
    }

    // Check for opposite relationships
    if ((norm1.includes('yes') && norm2.includes('no')) ||
        (norm1.includes('no') && norm2.includes('yes')) ||
        (norm1.includes('above') && norm2.includes('below')) ||
        (norm1.includes('over') && norm2.includes('under'))) {
      return 'opposites';
    }

    // Check for subset relationships
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      return 'subset';
    }

    // High similarity -> same outcome
    if (similarity > 0.8) {
      return 'same';
    }

    // Medium similarity -> overlapping
    if (similarity > 0.6) {
      return 'overlapping';
    }

    // Default to overlapping for lower similarity
    return 'overlapping';
  }

  /**
   * Suggest automatic matches based on similarity threshold
   */
  suggestMatches(
    kalshiMarkets: CommonMarket[], 
    polymarketMarkets: CommonMarket[],
    threshold: number = 0.8
  ): Array<{
    kalshiMarket: CommonMarket;
    polymarketMarket: CommonMarket;
    similarity: SimilarityScore;
    conditionMappings: ConditionMapping[];
  }> {
    const suggestions = [];

    for (const kalshiMarket of kalshiMarkets) {
      for (const polymarketMarket of polymarketMarkets) {
        const similarity = this.calculateSimilarity(kalshiMarket, polymarketMarket);
        
        if (similarity.overall >= threshold) {
          const conditionMappings = this.findConditionMappings(kalshiMarket, polymarketMarket);
          
          suggestions.push({
            kalshiMarket,
            polymarketMarket,
            similarity,
            conditionMappings,
          });
        }
      }
    }

    return suggestions.sort((a, b) => b.similarity.overall - a.similarity.overall);
  }
}

export const marketMatcher = new MarketMatcher();