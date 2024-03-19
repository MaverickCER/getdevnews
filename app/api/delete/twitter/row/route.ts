import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Example: http://localhost:3000/api/delete/twitter/row?url=https%3A%2F%2Fwww.twitter.com%2Fwatch%3Fv%3DxulXmZrC9uI
 * This endpoint will serve to allow automated and manual processes to remove twitter
 * subscriptions from the feed.
 * 
 * Security:
 * The sql template engine serves to protect against malicious attacks.
 * 
 * @param {NextRequest} request The incoming request object.
 * @returns {NextResponse} The response containing the created article data or
 * an error message.
 */
export async function GET(request: NextRequest) {
  const usernames = [];
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== process.env.API_KEY && process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid key: ${key}`);
    }

    const username = searchParams.get('username') || '';
    console.log(`delete/twitter/row called for username ${username}`);

    const now = Date.now();
    const twitter = await sql`
      UPDATE twitter 
      SET expires = ${now}
      WHERE username = ${username}
      RETURNING username;
    `;

    const updates = twitter.rows.map(row => row.username);
    console.log(`create/twitter/row result for ${username}`, updates.length);

    if (updates.length > 0) {
      usernames.push(...updates);
    }
  } catch (error) {
    console.error(`delete/twitter/row encountered error`, error);
  } finally {
    console.log(`delete/twitter/row processed ${usernames.length} twitter usernames`)
    return NextResponse.json({ usernames }, { status: 200 });
  }
}
