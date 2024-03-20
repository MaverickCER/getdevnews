import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Example: http://localhost:3000/api/create/youtube/table
 * Endpoint for creating the 'youtube' table in the database meant for development
 * purposed only. Allows for easy management of systems while building the site.
 * 
 * @param {NextRequest} request The incoming request object.
 * @returns {NextResponse} The response indicating the success or failure of the
 * table creation operation.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = decodeURIComponent(searchParams.get('key') || '');
    if (key !== process.env.API_KEY && process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid key: ${key}`);
    }

    const result = await sql`
      CREATE TABLE youtube (
        email TEXT,
        expires BIGINT DEFAULT 32503680000000,
        channel TEXT UNIQUE
      );
    `;

    console.log(`create/youtube/table result`, result);

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error(`create/youtube/table encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
