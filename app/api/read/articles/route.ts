import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

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
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '9');
    const offset = parseInt(searchParams.get('offset') || '0');

    const now = Date.now();
    const date = now - 48 * 60 * 60 * 1000;

    const result = await sql`
      SELECT source
      FROM articles
      WHERE date > ${date} AND date < ${now}
      ORDER BY date DESC
      LIMIT ${limit}
      OFFSET ${offset};
    `;

    console.log(`read/articles result`, result);

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error(`read/articles encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
