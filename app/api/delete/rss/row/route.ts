import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * Example: http://localhost:3000/api/delete/rss/row?url=https%3A%2F%2Fscoutlife.org%2Fhobbies-projects%2Ffunstuff%2F575%2Fmorse-code-translator%2F
 * This endpoint will serve to allow automated and manual processes to remove rss
 * sources from the table. This will ensure that future articles are not added
 * via rss feed once a subscription ends.
 * 
 * Security:
 * The sql template engine serves to protect against malicious attacks.
 * TODO: Consider setting up a table of known news URLs and preventing urls from
 * other domains from being added.
 * 
 * @param {NextRequest} request The incoming request object.
 * @returns {NextResponse} The response containing the deleted article data or
 * an error message.
 */
export async function GET(request: NextRequest) {
  const sources = [];
  try {
    const { searchParams } = new URL(request.url);
    const key = decodeURIComponent(searchParams.get('key') || '');
    if (key !== process.env.API_KEY && process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid key: ${key}`);
    }

    const urls = decodeURIComponent(searchParams.get('url') || '').split(',');
    if (urls.length === 0) throw new Error(`Invalid urls: ${urls}`);
    console.log(`delete/rss/row called for urls ${urls.join(', ')}`);

    for await (const url of urls) {
      try {
        const now = Date.now();
        const rss = await sql`
          UPDATE rss 
          SET expires = ${now}
          WHERE source LIKE ${url} OR email LIKE ${url}
          RETURNING source;
        `;

        const updates = rss.rows.map(row => row.source);
        console.log(`delete/rss/row result for ${url}`, updates);

        if (updates.length > 0) {
          sources.push(...updates);
        }
      } catch (error) {
        console.error(`delete/rss/row encountered error for ${url} of urls`, error);
      }
    }
    return NextResponse.json({ sources, count: sources.length }, { status: 200 });
  } catch (error) {
    console.error(`delete/rss/row encountered error`, error);
    return NextResponse.json({ error, sources, count: sources.length }, { status: 500 });
  }
}
