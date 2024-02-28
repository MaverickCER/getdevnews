import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { getMetaData, getYouTubeData } from '@/lib/url';
import { revalidatePath } from 'next/cache';
import Parser from 'rss-parser';

/**
 * Example: http://localhost:3000/api/create/articles/rss?url=https%3A%2F%2Fmedium.com%2Ffeed%2F%40kevin-jonathan
 * This endpoint will serve to allow automated and manual processes to add links
 * to the home page from rss feeds. All links will be able to get the baseline data through the
 * getMetaData function.
 * 
 * Security:
 * The sql template engine serves to protect against malicious attacks.
 * TODO: Consider setting up a table of known news URLs and preventing urls from
 * other domains from being added.
 * 
 * @param {NextRequest} request The incoming request object.
 * @returns {NextResponse} The response containing the created article data or
 * an error message.
 */
export async function GET(request: NextRequest) {
  const links = [];
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== process.env.API_KEY && process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid key: ${key}`);
    }

    const urls = decodeURIComponent(searchParams.get('url') || '').split(',');
    const isAd = searchParams.get('ad') === 'true';
    if (urls.length === 0) throw new Error(`Invalid urls: ${urls}`);
    console.log(`create/articles/rss called for${isAd ? ' Ad' : ''} urls ${urls}`);

    for await (const url of urls) {
      try {
        const feed = await new Parser().parseURL(url);
    
        for await (const item of feed.items) {
          try {
            const published = Date.parse(item.pubDate || item.published || new Date());
            if (published < Date.now() - 24 * 60 * 60 * 1000) continue;
            const metadata = await getMetaData(item.link || '');
            if (typeof metadata !== 'object' || metadata === null) throw new Error(`Invalid item link: ${item.link} - ${JSON.stringify(metadata)}`);
    
            if (isAd) {
              metadata.tag = 'ad';
            }
    
            console.log(`create/articles/rss processing metadata for ${item.link} of ${url}`, metadata);
            const { blurDataURL, byline, dataURL, date, description, keywords, source, tag, title } = metadata;
    
            const articles = await sql`
              INSERT INTO articles (blurDataURL, byline, dataURL, date, description, keywords, source, tag, title) 
              VALUES (${blurDataURL}, ${byline}, ${dataURL}, ${date}, ${description}, ${`{${keywords.join(',')}}`}, ${source}, ${tag}, ${title});
            `;
    
            console.log(`create/articles/rss result for ${item.link} of ${url}`, articles);
    
            if (articles.rowCount) {
              links.push(item.link);
            }
          } catch (error) {
            console.error(`create/articles/rss encountered error for ${item.link} of ${url}`, error);
          }
        }
      } catch (error) {
        console.error(`create/articles/rss encountered error for ${url} of urls`, error);
      }
    }

    revalidatePath('/');
  } catch (error) {
    console.error(`create/articles/rss encountered error`, error);
  } finally {
    console.log(`create/articles/feed processed ${links.length} rss feed links`)
    return NextResponse.json({ articles: links.length }, { status: 200 });
  }
}
