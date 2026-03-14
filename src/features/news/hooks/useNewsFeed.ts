import { useState, useEffect, useCallback } from 'react';
import { fetchNewsFeed, type NewsArticle } from '../services/rssService';

interface UseNewsFeedResult {
  articles: NewsArticle[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

// Simple in-memory cache
let cachedArticles: NewsArticle[] = [];
let cacheTimestamp: Date | null = null;
const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function useNewsFeed(): UseNewsFeedResult {
  const [articles, setArticles] = useState<NewsArticle[]>(cachedArticles);
  const [isLoading, setIsLoading] = useState(cachedArticles.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(cacheTimestamp);

  const fetchArticles = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const newArticles = await fetchNewsFeed();

      if (newArticles.length > 0) {
        cachedArticles = newArticles;
        cacheTimestamp = new Date();
        setArticles(newArticles);
        setLastUpdated(cacheTimestamp);
      } else if (cachedArticles.length === 0) {
        setError('No news articles available. Check your connection and try again.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch news';
      setError(message);
      // Keep cached articles if available
      if (cachedArticles.length > 0) {
        setArticles(cachedArticles);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const isCacheValid =
      cacheTimestamp && Date.now() - cacheTimestamp.getTime() < CACHE_DURATION_MS;

    if (!isCacheValid) {
      fetchArticles();
    }
  }, [fetchArticles]);

  const refresh = useCallback(async () => {
    await fetchArticles();
  }, [fetchArticles]);

  return { articles, isLoading, error, refresh, lastUpdated };
}
