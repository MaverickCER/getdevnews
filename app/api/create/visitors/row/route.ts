import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse, userAgent } from 'next/server';

/**
 * Example: http://localhost:3000/api/create/visitors/row
 * This endpoint will serve to track visits to the site on a daily basis. The
 * client is responsible for determining whether the user has visited in the last
 * 24 hours, and sending a request to this endpoint if not. This will allow us
 * to get a rough idea of the unique daily visits while not infringing on the 
 * right to privacy.
 * 
 * Security:
 * The sql template engine serves to protect against malicious attacks.
 * TODO: Consider requesting permission for tracking and update the table below
 * to also hold browser, cpu, device, engine, ip, and os so that we can gain
 * a better understanding of the target audience, the devices they're using
 * and their overall experience on the site.
 * 
 * @param {NextRequest} request The incoming request object.
 * @returns {NextResponse} The response containing the created article data or
 * an error message.
 */
export async function GET(request: NextRequest) {
  try {
    const { isBot } = userAgent(request);
    if (isBot) return NextResponse.json({ error: "bot detected" }, { status: 207 });

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== process.env.API_KEY && process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid key: ${key}`);
    }

    const date = Date.now();
    const visitors = await sql`INSERT INTO visitors (date) VALUES (${date});`;

    console.log(`create/visitors/row result`, visitors);

    return NextResponse.json({ visitors }, { status: 200 });
  } catch (error) {
    console.error(`create/visitors/row encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
