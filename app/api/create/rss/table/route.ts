import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Example: http://localhost:3000/api/create/rss/table
 * Endpoint for creating the 'rss' table in the database meant for development
 * purposed only. Allows for easy management of systems while building the site.
 * 
 * @param {NextRequest} request The incoming request object.
 * @returns {NextResponse} The response indicating the success or failure of the
 * table creation operation.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== process.env.API_KEY && process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid key: ${key}`);
    }

    const result = await sql`
      CREATE TABLE rss (
        email TEXT,
        expires BIGINT DEFAULT 32503680000000,
        source TEXT UNIQUE
      );
    `;

    console.log(`create/rss/table result`, result);

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error(`create/rss/table encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}