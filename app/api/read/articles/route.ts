import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

/**
 * Example: http://localhost:3000/api/read/articles
 * Endpoint for retrieving articles from the database that were published within
 * the last 24 hours. This is the default endpoint for the website and serves to
 * provide all the data required for each of the links. A separate endpoint will
 * be created to get historical data from previous days.
 * 
 * @returns {Response} The response containing the articles published within the
 * last 24 hours or an error message.
 */
export async function GET() {
  try {
    const result = await sql`
      SELECT * FROM articles WHERE date > EXTRACT(EPOCH FROM NOW()) - 24 * 60 * 60 * 1000;
    `;
    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error(`read/articles encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
