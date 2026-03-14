export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  source: string;
  category: string;
  pubDate: string;
  snippet: string;
}

interface FeedConfig {
  url: string;
  source: string;
  category: string;
}

const PH_NEWS_FEEDS: FeedConfig[] = [
  { url: 'https://www.philstar.com/rss/business', source: 'Philstar', category: 'Business' },
  { url: 'https://www.rappler.com/business/feed/', source: 'Rappler', category: 'Business' },
  { url: 'https://www.rappler.com/business/stock-market/feed/', source: 'Rappler', category: 'Stocks' },
  { url: 'https://data.gmanetwork.com/gno/rss/economy/feed.xml', source: 'GMA News', category: 'Economy' },
  { url: 'https://newsinfo.inquirer.net/feed', source: 'Inquirer', category: 'Economy' },
  { url: 'https://www.manilatimes.net/feed/', source: 'Manila Times', category: 'Transport' },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Stocks: ['stock', 'pse', 'shares', 'trading', 'market', 'index', 'fmetf', 'ipo'],
  Housing: ['housing', 'real estate', 'condo', 'property', 'mortgage', 'pagibig', 'pag-ibig'],
  Energy: ['energy', 'meralco', 'electricity', 'oil', 'fuel', 'gasoline', 'petron', 'diesel'],
  Transport: ['transport', 'fare', 'jeepney', 'bus', 'mrt', 'lrt', 'grab', 'angkas'],
  Airfare: ['airfare', 'airline', 'cebu pacific', 'pal', 'airasia', 'flight', 'seat sale'],
  Economy: ['inflation', 'bsp', 'gdp', 'interest rate', 'peso', 'remittance', 'ofw'],
  Business: ['business', 'franchise', 'sme', 'entrepreneur', 'startup', 'company'],
};

function categorizeArticle(title: string, defaultCategory: string): string {
  const lowerTitle = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lowerTitle.includes(kw))) {
      return category;
    }
  }
  return defaultCategory;
}

async function fetchFeed(feedConfig: FeedConfig): Promise<NewsArticle[]> {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedConfig.url)}`;
  const response = await fetch(proxyUrl);
  const text = await response.text();
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(text, 'text/xml');
  const items = doc.querySelectorAll('item');
  const articles: NewsArticle[] = [];

  items.forEach((item, i) => {
    if (i >= 10) return;
    const title = item.querySelector('title')?.textContent ?? 'Untitled';
    const link = item.querySelector('link')?.textContent ?? '';
    const guid = item.querySelector('guid')?.textContent ?? link;
    const pubDate = item.querySelector('pubDate')?.textContent ?? new Date().toISOString();
    const description = item.querySelector('description')?.textContent ?? '';

    articles.push({
      id: guid || `${feedConfig.source}-${Date.now()}-${Math.random()}`,
      title,
      link,
      source: feedConfig.source,
      category: categorizeArticle(title, feedConfig.category),
      pubDate,
      snippet: description.replace(/<[^>]*>/g, '').slice(0, 150),
    });
  });

  return articles;
}

export async function fetchNewsFeed(): Promise<NewsArticle[]> {
  const allArticles: NewsArticle[] = [];

  const feedPromises = PH_NEWS_FEEDS.map(async (feedConfig) => {
    try {
      return await fetchFeed(feedConfig);
    } catch (error) {
      console.warn(`Failed to fetch ${feedConfig.source}:`, error);
      return [];
    }
  });

  const results = await Promise.allSettled(feedPromises);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allArticles.push(...result.value);
    }
  }

  allArticles.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );

  return allArticles;
}

export function getAvailableCategories(): string[] {
  return ['All', 'Economy', 'Business', 'Stocks', 'Housing', 'Energy', 'Transport', 'Airfare'];
}
