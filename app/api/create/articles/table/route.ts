import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse, userAgent } from 'next/server';

/**
 * Example: http://localhost:3000/api/create/articles/table
 * Endpoint for creating the 'articles' table in the database meant for development
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
      CREATE TABLE articles (
        active BOOLEAN DEFAULT TRUE,
        blurDataURL TEXT,
        byline TEXT,
        date BIGINT,
        dataURL TEXT,
        description TEXT,
        email TEXT,
        keywords TEXT[],
        source TEXT UNIQUE,
        tag TEXT,
        title TEXT,
        views BIGINT DEFAULT 0,
        visits BIGINT DEFAULT 0
      );
    `;

    console.log(`create/articles/table result`, result);

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error(`create/articles/table encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
