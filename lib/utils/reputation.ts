/**
 * Reputation and content filtering utilities
 * Combines reputation checks (negative rep = spammer) with community muted lists
 */

import { communityMutedManager } from '@/lib/hive/community-muted';

const REPUTATION_API = 'https://api.syncad.com/reputation-api/accounts';

// Cache to avoid repeated API calls for the same user
const repCache = new Map<string, { rep: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get user reputation from Syncad API
 * Returns the raw reputation score (can be negative)
 */
export async function getUserReputation(username: string): Promise<number> {
  try {
    // Check cache first
    const cached = repCache.get(username);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.rep;
    }

    const response = await fetch(`${REPUTATION_API}/${username}/reputation`);
    
    if (!response.ok) {
      return 25; // Default to neutral reputation on error
    }

    const reputation = await response.json();
    
    // Cache the result
    repCache.set(username, {
      rep: reputation,
      timestamp: Date.now()
    });

    return reputation;
  } catch (error) {
    return 25; // Default to neutral on error (fail-open)
  }
}

/**
 * Check if a user should be filtered out based on reputation
 * Returns true if the account should be hidden (negative rep)
 */
export async function isLowReputation(username: string): Promise<boolean> {
  const rep = await getUserReputation(username);
  return rep < 0;
}

/**
 * Filter content by reputation and community muted list
 * Removes items from:
 * 1. Authors with negative reputation (spammers/bots)
 * 2. Community muted accounts
 * Also filters nested replies recursively if they exist
 */
export async function filterByReputation<T extends { author: string; replies?: T[] }>(
  content: T[]
): Promise<T[]> {
  const filtered: T[] = [];

  for (const item of content) {
    // Check reputation (negative = spam)
    const reputation = await getUserReputation(item.author);
    const isSpammer = reputation < 0;
    
    // Check community muted list
    const isMuted = await communityMutedManager.isMuted(item.author);
    
    const shouldHide = isSpammer || isMuted;
    
    if (!shouldHide) {
      // If item has nested replies, filter them recursively
      if (item.replies && item.replies.length > 0) {
        item.replies = await filterByReputation(item.replies);
      }
      filtered.push(item);
    }
  }

  return filtered;
}

/**
 * Clear the reputation cache (useful for testing)
 */
export function clearReputationCache(): void {
  repCache.clear();
}
