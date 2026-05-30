import { safeFetch } from '../utils/fetch';
import type { SourceResult } from "../../types";

const RSS_FEEDS = [
  { url: 'http://feeds.bbci.co.uk/news/world/rss.xml', name: 'BBC', source: 'BBC' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', source: 'Al Jazeera' },
  { url: 'https://feeds.reuters.com/reuters/worldNews', name: 'Reuters', source: 'Reuters' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', name: 'NYT', source: 'NYT' },
  { url: 'https://www.france24.com/en/rss', name: 'France24', source: 'France24' },
];

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!match) return '';
  return match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/, '$1').trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

function parseXmlRss(xml: string, sourceName: string): any[] {
  const items: any[] = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  const itemMatches = xml.match(itemRegex) ?? [];

  for (const itemXml of itemMatches.slice(0, 50)) {
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const pubDate = extractTag(itemXml, 'pubDate');
    const category = extractTag(itemXml, 'category');

    const latMatch = itemXml.match(/<geo:lat[^>]*>([^<]+)<\/geo:lat>/i) ??
      itemXml.match(/<lat[^>]*>([^<]+)<\/lat>/i);
    const lngMatch = itemXml.match(/<geo:long[^>]*>([^<]+)<\/geo:long>/i) ??
      itemXml.match(/<geo:lng[^>]*>([^<]+)<\/geo:lng>/i) ??
      itemXml.match(/<long[^>]*>([^<]+)<\/long>/i);

    items.push({
      title: decodeEntities(title),
      source: sourceName,
      link: decodeEntities(link),
      pubDate,
      category: decodeEntities(category),
      lat: latMatch ? parseFloat(latMatch[1]) : undefined,
      lng: lngMatch ? parseFloat(lngMatch[1]) : undefined,
    });
  }

  return items;
}

export async function fetchRssData(): Promise<SourceResult> {
  try {
    const results = await Promise.allSettled(
      RSS_FEEDS.map((feed) =>
        safeFetch(feed.url, { headers: { Accept: 'application/rss+xml, application/xml, text/xml' } }, 12_000)
          .then(async (response) => {
            const text = await response.text();
            return { source: feed.source, text };
          })
          .catch(() => null),
      ),
    );

    const articles: any[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const parsed = parseXmlRss(result.value.text, result.value.source);
        articles.push(...parsed);
      }
    }

    articles.sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return db - da;
    });

    return {
      name: 'rss', source: 'rss',
      success: true,
      data: { articles: articles.slice(0, 200) },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'rss', source: 'rss',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
