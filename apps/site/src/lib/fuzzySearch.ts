/**
 * Fuzzy search utilities for Cleci Personaliza product search.
 * Uses Levenshtein distance for typo-tolerant matching.
 */

/** Normalize a string: lowercase + remove diacritics */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s]/g, " ")   // remove special chars
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein distance between two strings */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Score how well a product field matches the query.
 * Returns a score from 0 (no match) to 1 (perfect match).
 * Considers:
 *  - exact substring → highest score
 *  - word-level fuzzy match → medium score
 *  - full-string fuzzy match → lower fallback
 */
function scoreMatch(field: string, queryNorm: string): number {
  const fieldNorm = normalize(field);

  // 1. Exact substring (normalized)
  if (fieldNorm.includes(queryNorm)) return 1.0;

  // 2. Check each query word against field words
  const queryWords = queryNorm.split(" ").filter(Boolean);
  const fieldWords = fieldNorm.split(" ").filter(Boolean);

  let wordScore = 0;
  for (const qw of queryWords) {
    if (qw.length < 2) continue;
    // best match among field words
    const bestWordDist = Math.min(...fieldWords.map((fw) => levenshtein(qw, fw)));
    const maxLen = Math.max(qw.length, 1);
    const tolerance = qw.length <= 3 ? 0 : qw.length <= 5 ? 1 : 2;
    if (bestWordDist <= tolerance) {
      wordScore += 1 - bestWordDist / maxLen;
    }
  }
  if (queryWords.length > 0 && wordScore > 0) {
    return (wordScore / queryWords.length) * 0.85;
  }

  // 3. Whole-string Levenshtein as last resort (for very short queries)
  const dist = levenshtein(queryNorm, fieldNorm.slice(0, queryNorm.length + 4));
  const maxLen = Math.max(queryNorm.length, 1);
  if (dist <= Math.ceil(maxLen * 0.4)) {
    return 0.4 * (1 - dist / maxLen);
  }

  return 0;
}

export interface SearchableProduct {
  id: string | number;
  title?: string;
  name?: string;        // fallback alias
  description?: string;
  category?: string;
  badge?: string | null;
  tags?: string[];
}

/** Score threshold: products below this are excluded */
const THRESHOLD = 0.25;

/**
 * Fuzzy-search a list of products by query string.
 * Returns products sorted by relevance (highest score first).
 */
export function fuzzySearchProducts<T extends SearchableProduct>(
  products: T[],
  query: string
): T[] {
  if (!query || query.trim().length === 0) return products;

  const queryNorm = normalize(query);

  const scored = products.map((product) => {
    const nameField = product.title ?? product.name ?? "";
    const scores = [
      scoreMatch(nameField, queryNorm) * 1.0,
      scoreMatch(product.description ?? "", queryNorm) * 0.6,
      scoreMatch(product.category ?? "", queryNorm) * 0.7,
      scoreMatch(product.badge ?? "", queryNorm) * 0.5,
      ...(product.tags ?? []).map((t) => scoreMatch(t, queryNorm) * 0.8),
    ];
    const best = Math.max(...scores);
    return { product, score: best };
  });

  return scored
    .filter(({ score }) => score >= THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product);
}
