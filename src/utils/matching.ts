// Market similarity and fuzzy matching utilities
import { Market, MarketSimilarity } from '../types';

// Fuzzy string matching using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i += 1) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j += 1) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Calculate string similarity based on Levenshtein distance
function stringSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : 1 - distance / maxLength;
}

// Extract keywords from title for better matching
function extractKeywords(title: string): string[] {
  // Remove common words and punctuation
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'will', 'be'];
  
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .filter(Boolean);
}

// Calculate keyword-based similarity
function keywordSimilarity(title1: string, title2: string): number {
  const keywords1 = new Set(extractKeywords(title1));
  const keywords2 = new Set(extractKeywords(title2));
  
  if (keywords1.size === 0 && keywords2.size === 0) return 1;
  if (keywords1.size === 0 || keywords2.size === 0) return 0;
  
  const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
  const union = new Set([...keywords1, ...keywords2]);
  
  return intersection.size / union.size; // Jaccard similarity
}

// Calculate title similarity using multiple methods
function calculateTitleSimilarity(title1: string, title2: string): number {
  const stringScore = stringSimilarity(title1, title2);
  const keywordScore = keywordSimilarity(title1, title2);
  
  // Weight string similarity more heavily for short titles, keyword similarity for longer ones
  const avgLength = (title1.length + title2.length) / 2;
  const stringWeight = avgLength < 50 ? 0.7 : 0.4;
  const keywordWeight = 1 - stringWeight;
  
  return stringScore * stringWeight + keywordScore * keywordWeight;
}

// Calculate date similarity
function calculateDateSimilarity(date1: string, date2: string): number {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Exact match
    if (d1.getTime() === d2.getTime()) return 1;
    
    // Check if dates are within same day
    if (d1.toDateString() === d2.toDateString()) return 0.95;
    
    // Check if dates are within a week
    const diffDays = Math.abs(d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 7) return Math.max(0.7, 1 - diffDays / 7 * 0.3);
    
    // Dates too far apart
    return 0;
  } catch {
    return 0;
  }
}

// Calculate category similarity
function calculateCategorySimilarity(cat1: string, cat2: string): number {
  if (!cat1 || !cat2) return 0.5; // Neutral if missing category
  
  const c1 = cat1.toLowerCase();
  const c2 = cat2.toLowerCase();
  
  // Exact match
  if (c1 === c2) return 1;
  
  // Common category mappings
  const categoryMappings: Record<string, string[]> = {
    'politics': ['politics', 'political', 'election', 'government'],
    'economics': ['economics', 'economic', 'finance', 'macro', 'fed', 'monetary'],
    'crypto': ['crypto', 'cryptocurrency', 'bitcoin', 'btc', 'blockchain'],
    'technology': ['technology', 'tech', 'ai', 'artificial intelligence', 'software'],
    'sports': ['sports', 'sport', 'baseball', 'football', 'basketball', 'soccer']
  };
  
  // Check if categories map to the same group
  for (const [group, variants] of Object.entries(categoryMappings)) {
    const c1InGroup = variants.some(variant => c1.includes(variant));
    const c2InGroup = variants.some(variant => c2.includes(variant));
    
    if (c1InGroup && c2InGroup) return 0.9;
  }
  
  // Use string similarity for categories
  return stringSimilarity(c1, c2);
}

// Calculate settlement source similarity
function calculateSettlementSimilarity(source1?: string, source2?: string): number {
  if (!source1 || !source2) return 0.5; // Neutral if missing
  
  const s1 = source1.toLowerCase();
  const s2 = source2.toLowerCase();
  
  // Exact match
  if (s1 === s2) return 1;
  
  // Check for common authoritative sources
  const authoritativeSources = [
    ['ap', 'associated press'],
    ['reuters'],
    ['fed', 'federal reserve'],
    ['cnn'],
    ['bbc'],
    ['nyt', 'new york times'],
    ['wsj', 'wall street journal']
  ];
  
  for (const sourceGroup of authoritativeSources) {
    const s1HasSource = sourceGroup.some(source => s1.includes(source));
    const s2HasSource = sourceGroup.some(source => s2.includes(source));
    
    if (s1HasSource && s2HasSource) return 0.95;
  }
  
  // Use string similarity
  return stringSimilarity(s1, s2);
}

// Calculate condition count similarity
function calculateConditionSimilarity(market1: Market, market2: Market): number {
  const count1 = market1.conditions.length;
  const count2 = market2.conditions.length;
  
  if (count1 === count2) return 1;
  
  // Penalize large differences in condition count
  const diff = Math.abs(count1 - count2);
  const maxCount = Math.max(count1, count2);
  
  return Math.max(0, 1 - diff / maxCount);
}

// Main function to compute market similarity
export function computeMarketSimilarity(kalshiMarket: Market, polyMarket: Market): MarketSimilarity {
  const titleSim = calculateTitleSimilarity(kalshiMarket.title, polyMarket.title);
  const dateSim = calculateDateSimilarity(kalshiMarket.closeDate, polyMarket.closeDate);
  const categorySim = calculateCategorySimilarity(kalshiMarket.category, polyMarket.category);
  const settlementSim = calculateSettlementSimilarity(kalshiMarket.settlementSource, polyMarket.settlementSource);
  const conditionSim = calculateConditionSimilarity(kalshiMarket, polyMarket);
  
  // Weighted overall score
  const overall = (
    titleSim * 0.4 +       // Title is most important
    dateSim * 0.25 +       // Date is very important
    categorySim * 0.15 +   // Category matters
    conditionSim * 0.15 +  // Number of conditions should be similar
    settlementSim * 0.05   // Settlement source is nice to have
  );
  
  return {
    overall,
    title: titleSim,
    date: dateSim,
    category: categorySim,
    settlement: settlementSim
  };
}

// Utility function to find best matches for a market
export function findBestMatches(
  targetMarket: Market, 
  candidateMarkets: Market[], 
  minSimilarity: number = 0.7
): Array<{ market: Market; similarity: MarketSimilarity }> {
  return candidateMarkets
    .map(candidate => ({
      market: candidate,
      similarity: computeMarketSimilarity(targetMarket, candidate)
    }))
    .filter(result => result.similarity.overall >= minSimilarity)
    .sort((a, b) => b.similarity.overall - a.similarity.overall);
}

// Utility to check if two markets are likely the same event
export function areMarketsSimilar(market1: Market, market2: Market, threshold: number = 0.8): boolean {
  const similarity = computeMarketSimilarity(market1, market2);
  return similarity.overall >= threshold;
}