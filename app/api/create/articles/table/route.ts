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
    if (process.env.VERCEL_ENV !== 'development') {
      const { isBot, device } = userAgent(request);
      const ip = request.ip;
      console.error(`create/articles/table unauthorized access`, { device, ip, isBot });
      return NextResponse.json({ error: '404: This page could not be found.' }, { status: 504 });
    }

    const result = await sql`
      CREATE TABLE articles (
        blurDataURL TEXT,
        byline TEXT,
        date BIGINT,
        dataURL TEXT,
        description TEXT,
        keywords TEXT[],
        source TEXT UNIQUE,
        tag TEXT,
        title TEXT
      );
    `;

    console.log(`create/articles/table result`, result);

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error(`create/articles/table encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
