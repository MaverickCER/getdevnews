import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Example: http://localhost:3000/api/read/visitors
 * Endpoint for retrieving the number of visitors in database that were added in
 * the last 24 hours.
 * 
 * @returns {Response} The response containing the the number of visitors
 * published within the last 24 hours or an error message.
 */
export async function GET(request: NextRequest) {
  try {
    const date = (Date.now() - 24 * 60 * 60 * 1000) * 0;

    const result = await sql`
      SELECT COUNT(*) FROM visitors WHERE date > ${date};
    `;

    console.log(`read/visitors result`, result);

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error(`read/visitors encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
