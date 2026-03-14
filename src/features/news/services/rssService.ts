// Native RSS service using fetch (rss-parser uses Node.js http module which doesn't work on React Native)

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

// Simple XML tag extraction using regex (works on React Native)
function extractTagContent(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function extractCDATA(content: string): string {
  const cdataMatch = content.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return cdataMatch ? cdataMatch[1] : content;
}

function parseRSSItems(xml: string): Array<{ title: string; link: string; pubDate: string; description: string; guid: string }> {
  const items: Array<{ title: string; link: string; pubDate: string; description: string; guid: string }> = [];

  // Match all <item> blocks
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(xml)) !== null) {
    const itemXml = itemMatch[1];

    const title = extractCDATA(extractTagContent(itemXml, 'title')).replace(/<[^>]*>/g, '');
    const link = extractTagContent(itemXml, 'link').replace(/<[^>]*>/g, '').trim();
    const pubDate = extractTagContent(itemXml, 'pubDate');
    const description = extractCDATA(extractTagContent(itemXml, 'description')).replace(/<[^>]*>/g, '');
    const guid = extractTagContent(itemXml, 'guid') || link;

    if (title && link) {
      items.push({ title, link, pubDate, description, guid });
    }
  }

  return items;
}

async function fetchFeed(feedConfig: FeedConfig): Promise<NewsArticle[]> {
  try {
    const response = await fetch(feedConfig.url, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    const items = parseRSSItems(xml);

    return items.slice(0, 10).map((item) => ({
      id: item.guid || `${feedConfig.source}-${Date.now()}-${Math.random()}`,
      title: item.title,
      link: item.link,
      source: feedConfig.source,
      category: categorizeArticle(item.title, feedConfig.category),
      pubDate: item.pubDate || new Date().toISOString(),
      snippet: item.description.slice(0, 150),
    }));
  } catch (error) {
    console.warn(`Failed to fetch ${feedConfig.source}:`, error);
    return [];
  }
}

export async function fetchNewsFeed(): Promise<NewsArticle[]> {
  const allArticles: NewsArticle[] = [];

  const feedPromises = PH_NEWS_FEEDS.map((feedConfig) => fetchFeed(feedConfig));
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
