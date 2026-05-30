import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

interface GdeltArticle {
  url: string;
  title: string;
  seendate: string;
  socialimage: string;
  domain: string;
  language: string;
  sourcecountry: string;
  geographiclocations?: string;
  tone?: string;
}

interface GdeltResponse {
  articles: GdeltArticle[];
}

export async function fetchGdeltData(): Promise<SourceResult> {
  try {
    const result = await safeFetchJSON<GdeltResponse>(
      'https://api.gdeltproject.org/api/v2/doc/doc?query=sources:english&mode=artlist&maxrecords=50&format=json',
    );

    const articles = result.articles || [];

    const events = articles.map((a) => {
      let lat: number | null = null;
      let lng: number | null = null;

      if (a.geographiclocations) {
        const match = a.geographiclocations.match(/#-?\d+\.?\d*,-?\d+\.?\d*/);
        if (match) {
          const parts = match[0].replace('#', '').split(',');
          lat = parseFloat(parts[0]);
          lng = parseFloat(parts[1]);
          if (isNaN(lat)) lat = null;
          if (isNaN(lng)) lng = null;
        }
      }

      let tone: number | null = null;
      if (a.tone) {
        const toneVal = parseFloat(a.tone.split(',')[0]);
        if (!isNaN(toneVal)) tone = toneVal;
      }

      return {
        title: a.title,
        url: a.url,
        date: a.seendate,
        source: a.domain,
        country: a.sourcecountry || null,
        lat,
        lng,
        tone,
      };
    });

    return {
      name: 'gdelt', source: 'gdelt',
      success: true,
      data: { events },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'gdelt', source: 'gdelt',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
