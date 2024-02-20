import { NextRequest, NextResponse } from 'next/server';
import { parseString } from 'xml2js';

/**
 * Example: http://localhost:3000/api/webhook/youtube POST xml body
 * Endpoint for notifying getDevNews about YouTube channel updates using the PubSubHubbub protocol.
 * This endpoint is triggered when a YouTube channel publishes a new video.
 * It receives an Atom feed notification in XML format as the request body.
 * The notification is parsed to extract the link to the newly published video.
 * The link is then encoded and used to create a new article entry in the database
 * via another API endpoint.
 * Webhooks like this will be primary way for news to be added to the site.
 * 
 * @param {NextRequest} request The incoming request object.
 * @returns {NextResponse} The response indicating acknowledgement of the event.
 */
export async function POST(request: NextRequest) {
  try {
    if (request.method === 'POST') {
      const { body } = request;

      // Parse the XML body to extract the link to the newly published video
      parseString(body || '', (error, result) => {
        if (error) {
          console.error(`api/webhook/youtube encountered parsing error`, error.stack);
          return;
        }
        const videoLink = encodeURIComponent(result.feed.entry[0].link[0].$.href);
        if (!videoLink) return;

        // send video link to creation endpoint so it can be added to the site
        const baseUrl = process.env.VERCEL_ENV === 'development' ? 'http://localhost:3000' : 'https://www.getdevnews.com';
        fetch(`${baseUrl}/api/create/articles?url=${videoLink}`).then((res) => res.json());
      });

      return NextResponse.json({ message: 'acknowledged' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'failed' }, { status: 405 });
    }
  } catch (error) {
    console.error(`webhook/youtube encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
