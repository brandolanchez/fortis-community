/**
 * Community Muted List Manager
 * Fetches and caches muted accounts from Hive communities
 */

const STORAGE_KEY = 'hive_community_muted';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface MutedListCache {
  accounts: Set<string>;
  timestamp: number;
}

class CommunityMutedManager {
  private cache: MutedListCache | null = null;
  private loading: Promise<Set<string>> | null = null;

  /**
   * Fetch muted accounts from Hive community
   */
  private async fetchCommunityMutedList(): Promise<string[]> {
    try {
      // Get muted accounts from hive-139531 community
      const response = await fetch('https://api.hive.blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'bridge.list_all_subscriptions',
          params: { community: 'hive-139531' },
          id: 1
        })
      });
      
      const data = await response.json();
      const subscriptions = data.result || [];
      
      // Filter for muted accounts
      const mutedAccounts = subscriptions
        .filter((sub: any) => sub[1] === 'muted')
        .map((sub: any) => sub[0]);
      
      return mutedAccounts;
    } catch (error) {
      console.error('Failed to fetch community muted list:', error);
      return [];
    }
  }

  /**
   * Load muted list from localStorage
   */
  private loadFromStorage(): MutedListCache | null {
    try {
      if (typeof window === 'undefined') return null;
      
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      const cache: MutedListCache = {
        accounts: new Set(data.accounts),
        timestamp: data.timestamp
      };
      
      // Check if cache is still valid
      if (Date.now() - cache.timestamp < CACHE_DURATION) {
        return cache;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load muted list from storage:', error);
      return null;
    }
  }

  /**
   * Save muted list to localStorage
   */
  private saveToStorage(accounts: Set<string>): void {
    try {
      if (typeof window === 'undefined') return;
      
      const data = {
        accounts: Array.from(accounts),
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save muted list to storage:', error);
    }
  }

  /**
   * Get the community muted list
   */
  async getMutedList(): Promise<Set<string>> {
    // Return cached list if available
    if (this.cache) {
      return this.cache.accounts;
    }

    // If already loading, wait for that promise
    if (this.loading) {
      return this.loading;
    }

    // Try to load from localStorage first
    const stored = this.loadFromStorage();
    if (stored) {
      this.cache = stored;
      return stored.accounts;
    }

    // Fetch from remote
    this.loading = (async () => {
      const mutedAccounts = await this.fetchCommunityMutedList();
      const mutedSet = new Set(mutedAccounts.map(a => a.toLowerCase()));
      
      this.cache = {
        accounts: mutedSet,
        timestamp: Date.now()
      };
      
      this.saveToStorage(mutedSet);
      this.loading = null;
      
      return mutedSet;
    })();

    return this.loading;
  }

  /**
   * Check if an account is muted in the community
   */
  async isMuted(username: string): Promise<boolean> {
    const mutedList = await this.getMutedList();
    return mutedList.has(username.toLowerCase());
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

export const communityMutedManager = new CommunityMutedManager();
