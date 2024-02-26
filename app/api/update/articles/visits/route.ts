import { sql } from '@vercel/postgres';
import { NextResponse, userAgent } from 'next/server';

/**
 * Example: http://localhost:3000/api/update/articles/visits?source=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DxulXmZrC9uI
 * Endpoint for incrementing the number of visits on an article. This is called
 * from the client any time a user clicks on an article to open it in a new page.
 * The purpose is to track user engagement and provide insights into the popularity 
 * of articles, which can be useful for advertising purposes.
 * 
 * @returns {Response} The response containing the updated article data or an 
 * error message.
 */
export async function GET(request: Request) {
  try {
    const { isBot } = userAgent(request);
    if (isBot) return NextResponse.json({ error: "bot detected" }, { status: 207 });
  
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== process.env.API_KEY && process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid key: ${key}`);
    }

    const source = decodeURIComponent(searchParams.get('source') || '');


    console.log(`update/articles/visits source ${source}`);

    const result = await sql`
      UPDATE articles SET visits = visits + 1 WHERE source = ${source}
    `;

    console.log(`update/articles/visits result for source ${source}`, result);

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error(`update/articles/visits encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
