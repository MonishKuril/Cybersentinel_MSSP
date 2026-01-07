const express = require('express');
const router = express.Router();
const Parser = require('rss-parser');
const parser = new Parser();

const NEWS_SOURCES = [
  { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews' },
  { name: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/' },
  { name: 'Dark Reading', url: 'http://www.darkreading.com/rss/all.xml' },
];

router.get('/scrape', async (req, res) => {
  console.log('News scraping initiated...');
  
  for (const source of NEWS_SOURCES) {
    try {
      console.log(`Fetching news from: ${source.url} (${source.name})`);
      const newsItems = await parseRSSFeed(source);

      if (newsItems.length === 0) {
        throw new Error('No news items found');
      }

      console.log(`Successfully fetched ${newsItems.length} items from ${source.name}`);
      return res.json({ 
        success: true, 
        news: newsItems.slice(0, 10),
        source: source.name,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Fetching from ${source.name} failed:`, error.message);
      // Continue to the next source
    }
  }

  // If all sources fail, send fallback news
  console.warn('All news sources failed. Sending fallback news.');
  res.status(500).json({ 
    success: false,
    message: 'All news sources failed',
    news: getFallbackNews(),
    source: 'Internal',
    timestamp: new Date().toISOString()
  });
});

async function parseRSSFeed(source) {
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items.map(item => ({
      title: item.title,
      link: item.link,
      pubDate: item.pubDate || item.isoDate,
    }));
  } catch (error) {
    console.error('RSS parsing failed:', error.message);
    throw new Error(`Failed to parse RSS feed from ${source.name}`);
  }
}

function getFallbackNews() {
  return [
    { title: "Dark Web Marketplace Leaks 10 Million Credit Card Numbers", link: "#" },
    { title: "Android Malware Masquerades as Popular Fitness App", link: "#" },
    { title: "AI-Driven Malware Capable of Evading Detection Found in Wild", link: "#" },
    { title: "Cybersecurity Spending Expected to Cross $200B Globally by Year-End", link: "#" },
  ];
}

module.exports = router;