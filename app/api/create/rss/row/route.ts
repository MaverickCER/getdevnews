import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { getMetaData, getYouTubeData } from '@/lib/url';
import { revalidatePath } from 'next/cache';
import Parser from 'rss-parser';

/**
 * Example: http://localhost:3000/api/create/rss/row?url=https%3A%2F%2Fmedium.com%2Ffeed%2F%40kevin-jonathan
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
    const email = searchParams.get('email') || '';
    const expires = (parseInt(`${searchParams.get('expires')}`) || 182500) * 24 * 60 * 60 * 1000;
    if (urls.length === 0) throw new Error(`Invalid urls: ${urls}`);
    console.log(`create/rss/row called for${email ? ` ${email}` : ''} urls ${urls}`);

    for await (const url of urls) {
      try {
        const feed = await new Parser().parseURL(url);

        if (feed.items.length > 0) {
          console.log(`create/rss/row processing data for ${url}`);

          const rss = await sql`
            INSERT INTO rss (expires, source, email) 
            VALUES (${expires}, ${url}, ${email})
            RETURNING source;
          `;
  
          const updates = rss.rows.map(row => row.source);
          console.log(`create/rss/row result for ${url}`, updates.length);
  
          if (updates.length > 0) {
            links.push(...updates);
          }
        }
      } catch (error) {
        console.error(`create/rss/row encountered error for ${url} of urls`, error);
      }
    }
  } catch (error) {
    console.error(`create/rss/row encountered error`, error);
  } finally {
    console.log(`create/rss/row processed ${links.length} rss feed links`)
    return NextResponse.json({ links }, { status: 200 });
  }
}
