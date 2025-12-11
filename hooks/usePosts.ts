import { findPosts } from "@/lib/hive/client-functions";
import { Discussion } from "@hiveio/dhive";
import { useEffect, useState } from "react";
import { filterByReputation } from "@/lib/utils/reputation";

export default function usePosts(query: string, params: any[]) {
  const [posts, setPosts] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleGetPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allPosts = await findPosts(query, params);
        // Filter out low reputation accounts
        const filteredPosts = (await filterByReputation(allPosts as any) as unknown) as Discussion[];
        setPosts(filteredPosts);
      } catch (e) {
        console.error(e);
        setError("Error loading posts!");
      } finally {
        setIsLoading(false);
      }
    };
    handleGetPosts();
  }, [query, params]);
  return { posts, isLoading, error };
}
