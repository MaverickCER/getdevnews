import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Example: http://localhost:3000/api/create/twitter/row?url=https%3A%2F%2Fwww.twitter.com%2Fwatch%3Fv%3DxulXmZrC9uI
 * This endpoint will serve to allow automated and manual processes to add twitter
 * subscriptions to the feed. Each twitter username will be associated with an
 * expiration date and email indicating when the username's pubsubhubbub links
 * should stop working.
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
    const email = searchParams.get('email') || '';
    const expires = (parseInt(`${searchParams.get('expires')}`) || 182500) * 24 * 60 * 60 * 1000;
    console.log(`create/twitter/row called for${email ? ` ${email}` : ''} username ${username}`);

    const twitter = await sql`
      INSERT INTO twitter (expires, username, email) 
      VALUES (${Date.now() + expires}, ${username}, ${email})
      RETURNING username;
    `;

    const updates = twitter.rows.map(row => row.username);
    console.log(`create/twitter/row result for ${username}`, updates.length);

    if (updates.length > 0) {
      usernames.push(...updates);
    }
  } catch (error) {
    console.error(`create/twitter/row encountered error`, error);
  } finally {
    console.log(`create/twitter/row processed ${usernames.length} twitter usernames`)
    return NextResponse.json({ usernames }, { status: 200 });
  }
}
