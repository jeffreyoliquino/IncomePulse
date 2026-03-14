import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Card } from '@/src/components/ui';
import { useNewsFeed } from '@/src/features/news/hooks/useNewsFeed';
import { getAvailableCategories } from '@/src/features/news/services/rssService';
import { formatDateShort } from '@/src/lib/formatters';

const NEWS_CATEGORIES = getAvailableCategories();

export default function NewsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { articles, isLoading, error, refresh, lastUpdated } = useNewsFeed();

  const filteredArticles =
    selectedCategory === 'All'
      ? articles
      : articles.filter((a) => a.category === selectedCategory);

  const openArticle = (url: string) => {
    if (url) Linking.openURL(url);
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      Economy: 'line-chart',
      Business: 'briefcase',
      Stocks: 'bar-chart',
      Housing: 'home',
      Energy: 'bolt',
      Transport: 'bus',
      Airfare: 'plane',
    };
    return icons[category] ?? 'newspaper-o';
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      Economy: 'bg-primary-50 text-primary-600',
      Business: 'bg-accent-50 text-accent-600',
      Stocks: 'bg-warning-50 text-warning-600',
      Housing: 'bg-purple-50 text-purple-600',
      Energy: 'bg-danger-50 text-danger-600',
      Transport: 'bg-blue-50 text-blue-600',
      Airfare: 'bg-teal-50 text-teal-600',
    };
    return colors[category] ?? 'bg-surface-100 text-surface-600';
  };

  return (
    <View className="flex-1 bg-surface-50 dark:bg-surface-900">
      {/* Category Filter */}
      <View className="bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-3"
        >
          <View className="flex-row gap-2">
            {NEWS_CATEGORIES.map((category) => (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 ${
                  selectedCategory === category
                    ? 'bg-primary-600'
                    : 'bg-surface-100 dark:bg-surface-700'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedCategory === category
                      ? 'text-white'
                      : 'text-surface-600 dark:text-surface-200'
                  }`}
                >
                  {category}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Last Updated */}
      {lastUpdated && (
        <View className="px-4 py-2 bg-white dark:bg-surface-800 border-b border-surface-100 dark:border-surface-700">
          <Text className="text-xs text-surface-400">
            Updated {formatDateShort(lastUpdated.toISOString())}
          </Text>
        </View>
      )}

      {/* News Feed */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={isLoading && articles.length > 0} onRefresh={refresh} />
        }
      >
        {/* Loading State */}
        {isLoading && articles.length === 0 && (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="mt-4 text-sm text-surface-500 dark:text-surface-400">
              Fetching Philippine news...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && articles.length === 0 && (
          <View className="items-center justify-center py-20">
            <FontAwesome name="exclamation-circle" size={48} color="#dc2626" />
            <Text className="mt-4 text-base text-surface-600 dark:text-surface-200">
              Couldn't load news
            </Text>
            <Text className="mt-1 text-sm text-surface-400 text-center px-8">
              {error}
            </Text>
            <Pressable
              onPress={refresh}
              className="mt-4 rounded-lg bg-primary-600 px-6 py-2"
            >
              <Text className="text-sm font-medium text-white">Try Again</Text>
            </Pressable>
          </View>
        )}

        {/* Empty Filtered State */}
        {!isLoading && !error && filteredArticles.length === 0 && articles.length > 0 && (
          <View className="items-center justify-center py-20">
            <FontAwesome name="filter" size={48} color="#cbd5e1" />
            <Text className="mt-4 text-base text-surface-400">
              No {selectedCategory} articles
            </Text>
            <Text className="mt-1 text-sm text-surface-400">
              Try a different category
            </Text>
          </View>
        )}

        {/* Empty State - No articles at all */}
        {!isLoading && !error && articles.length === 0 && (
          <View className="items-center justify-center py-20">
            <FontAwesome name="newspaper-o" size={48} color="#cbd5e1" />
            <Text className="mt-4 text-base text-surface-400">
              No news available
            </Text>
            <Text className="mt-2 text-center text-sm text-surface-400 px-8">
              Pull down to refresh
            </Text>
          </View>
        )}

        {/* Article Count */}
        {filteredArticles.length > 0 && (
          <Text className="mb-3 text-xs font-semibold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
            {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
            {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
          </Text>
        )}

        {/* Articles List */}
        {filteredArticles.map((article) => (
          <Card
            key={article.id}
            variant="elevated"
            className="mb-3"
            onPress={() => openArticle(article.link)}
          >
            <Text className="text-base font-semibold text-surface-900 dark:text-surface-100 leading-5">
              {article.title}
            </Text>
            {article.snippet ? (
              <Text className="mt-1.5 text-sm text-surface-500 dark:text-surface-400 leading-5" numberOfLines={2}>
                {article.snippet}
              </Text>
            ) : null}
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className={`rounded-full px-2.5 py-0.5 ${getCategoryColor(article.category).split(' ')[0]}`}>
                  <Text className={`text-xs font-medium ${getCategoryColor(article.category).split(' ')[1]}`}>
                    {article.category}
                  </Text>
                </View>
                <Text className="text-xs text-surface-500 dark:text-surface-400">{article.source}</Text>
              </View>
              <Text className="text-xs text-surface-400">
                {formatDateShort(article.pubDate)}
              </Text>
            </View>
          </Card>
        ))}

        {/* News Sources Footer */}
        {articles.length > 0 && (
          <Card variant="outlined" className="mb-8 mt-4">
            <Text className="text-xs font-semibold text-surface-500 dark:text-surface-400 mb-2">
              NEWS SOURCES
            </Text>
            <Text className="text-xs text-surface-400 leading-5">
              Philstar Business, Rappler, GMA News Economy, Inquirer, Manila Times
            </Text>
            <Text className="mt-2 text-xs text-surface-300">
              Auto-refreshes every 15 minutes
            </Text>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}
