import HiveClient from '@/lib/hive/hiveclient';
import { useState, useEffect, useRef } from 'react';
import { ExtendedComment } from './useComments';
import { getFollowing } from '@/lib/hive/client-functions';
import { filterByReputation } from '@/lib/utils/reputation';
import { hiveBatchFetch } from '@/lib/hive/hive-batcher';

interface lastContainerInfo {
  permlink: string;
  date: string;
}

export type SnapFilterType = 'community' | 'all' | 'following';

interface UseSnapsProps {
  filterType?: SnapFilterType;
  username?: string; // Required when filterType is 'following'
}

const CACHE_KEY_PREFIX = 'snaps_cache_';

export const useSnaps = ({ filterType = 'community', username }: UseSnapsProps = {}) => {
  const lastContainerRef = useRef<lastContainerInfo | null>(null);
  const fetchedPermlinksRef = useRef<Set<string>>(new Set());
  const followingListRef = useRef<string[]>([]);

  const [comments, setComments] = useState<ExtendedComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [followingListLoaded, setFollowingListLoaded] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const pageMinSize = 10;
  const communityTag = process.env.NEXT_PUBLIC_HIVE_COMMUNITY_TAG || '';

  // Load from cache on mount or filter change
  useEffect(() => {
    const cacheKey = `${CACHE_KEY_PREFIX}${filterType}_${username || 'guest'}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setComments(parsed);
          // Don't set isLoading to true if we have cached data to show
        }
      } catch (e) {
        console.error('Error parsing snaps cache', e);
      }
    }
  }, [filterType, username]);

  // Save to cache when comments update
  useEffect(() => {
    if (comments.length > 0 && currentPage === 1) {
      const cacheKey = `${CACHE_KEY_PREFIX}${filterType}_${username || 'guest'}`;
      sessionStorage.setItem(cacheKey, JSON.stringify(comments.slice(0, 20)));
    }
  }, [comments, filterType, username, currentPage]);

  // Load following list once when needed
  useEffect(() => {
    const loadFollowingList = async () => {
      if (filterType === 'following' && username) {
        if (followingListRef.current.length === 0) {
          setFollowingListLoaded(false);
          try {
            const following = await getFollowing(username, '', 1000);
            followingListRef.current = following;
            setFollowingListLoaded(true);
            setFetchTrigger(prev => prev + 1);
          } catch (error) {
            console.error('Error loading following list:', error);
            setFollowingListLoaded(true);
            setFetchTrigger(prev => prev + 1);
          }
        } else {
          setFollowingListLoaded(true);
          setFetchTrigger(prev => prev + 1);
        }
      }
    };
    loadFollowingList();
  }, [filterType, username]);

  // Filter comments by the target tag
  function filterCommentsByTag(comments: ExtendedComment[], targetTag: string): ExtendedComment[] {
    return comments.filter((commentItem) => {
      try {
        if (!commentItem.json_metadata) return false;
        const metadata = JSON.parse(commentItem.json_metadata);
        const tags = metadata.tags || [];
        return tags.includes(targetTag);
      } catch (error) {
        return false;
      }
    });
  }

  // Filter comments by following
  function filterCommentsByFollowing(comments: ExtendedComment[]): ExtendedComment[] {
    return comments.filter((commentItem) =>
      followingListRef.current.includes(commentItem.author)
    );
  }

  // Fetch comments with a minimum size - OPTIMIZED
  async function getMoreSnaps(): Promise<ExtendedComment[]> {
    const author = "peak.snaps";
    const limit = 25; // Fetch more per batch
    const allFilteredComments: ExtendedComment[] = [];

    let hasMoreData = true;
    let permlink = lastContainerRef.current?.permlink || "";
    let date = lastContainerRef.current?.date || new Date().toISOString();

    let loopCount = 0;
    const maxLoops = 3; // Reduced loops but better batching

    while (allFilteredComments.length < pageMinSize && hasMoreData && loopCount < maxLoops) {
      loopCount++;

      const containers = await HiveClient.database.call('get_discussions_by_author_before_date', [
        author,
        permlink,
        date,
        limit,
      ]);

      if (!containers.length) {
        hasMoreData = false;
        break;
      }

      // BATCH FETCH ALL REPLIES IN ONE REQUEST
      const batchParams = containers.map((c: any) => [author, c.permlink]);
      const batchReplies = await hiveBatchFetch('condenser_api', 'get_content_replies', batchParams);

      for (let i = 0; i < containers.length; i++) {
        const container = containers[i];
        const replies = (batchReplies[i] || []) as ExtendedComment[];

        let filteredComments: ExtendedComment[] = [];

        if (filterType === 'community') {
          filteredComments = filterCommentsByTag(replies, communityTag);
        } else if (filterType === 'all') {
          filteredComments = replies;
        } else if (filterType === 'following') {
          filteredComments = filterCommentsByFollowing(replies);
        }

        // Only filter reputation if we have content
        if (filteredComments.length > 0) {
          filteredComments = await filterByReputation(filteredComments);
          allFilteredComments.push(...filteredComments);
        }

        fetchedPermlinksRef.current.add(container.permlink);
        permlink = container.permlink;
        date = container.created;
      }
    }

    lastContainerRef.current = { permlink, date };
    return allFilteredComments;
  }

  // Reset when filter changes
  useEffect(() => {
    lastContainerRef.current = null;
    fetchedPermlinksRef.current.clear();
    // Don't clear comments immediately if we have cached ones
    const cacheKey = `${CACHE_KEY_PREFIX}${filterType}_${username || 'guest'}`;
    if (!sessionStorage.getItem(cacheKey)) {
      setComments([]);
    }
    setHasMore(true);
    setCurrentPage(1);
    setFetchTrigger(prev => prev + 1);
  }, [filterType, username]);

  // Fetch posts
  useEffect(() => {
    if (filterType === 'following' && !followingListLoaded) return;

    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const newSnaps = await getMoreSnaps();

        if (newSnaps.length < pageMinSize) {
          setHasMore(false);
        }

        setComments((prevPosts) => {
          const existingPermlinks = new Set(prevPosts.map((post) => post.permlink));
          const uniqueSnaps = newSnaps.filter((snap) => !existingPermlinks.has(snap.permlink));

          // If first page, we might replace cache/stale data
          if (currentPage === 1) {
            const cacheKey = `${CACHE_KEY_PREFIX}${filterType}_${username || 'guest'}`;
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData && prevPosts.length > 0 && uniqueSnaps.length > 0) {
              // We have fresh data and cached data, prefer fresh
              return uniqueSnaps;
            }
          }

          return [...prevPosts, ...uniqueSnaps];
        });
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage, fetchTrigger]);

  const loadNextPage = () => {
    if (!isLoading && hasMore) {
      setCurrentPage((prevPage) => prevPage + 1);
    }
  };

  const refresh = () => {
    lastContainerRef.current = null;
    fetchedPermlinksRef.current.clear();
    setComments([]);
    setHasMore(true);
    setCurrentPage(1);
    setFetchTrigger(prev => prev + 1);
  };

  return { comments, isLoading, loadNextPage, hasMore, currentPage, refresh };
};
