import { NextRequest, NextResponse, userAgent } from 'next/server';
import { parseString } from 'xml2js';
import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(decodeURI(request.url));
  const hub_challenge = searchParams.get('hub.challenge') || "no challenge";

  console.log(`webhook/youtube params ${searchParams.toString()}`);

  const response = new NextResponse(hub_challenge)
  response.headers.set('content-type', 'image/png');
  return response;
}

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
export async function POST(request: NextRequest, response: NextResponse) {
  let respond = true;
  try {
    if (!request.body) throw new Error('');
    const signatures = request.headers.get('x-hub-signature') || '';
    const signature = Array.isArray(signatures) ? signatures.join('') : '';
    const hmac = crypto.createHmac('sha256', process.env.YOUTUBE_API_SECRET || '');
    const reader = await request.body.getReader();
    const values = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // If request is done, break out of the loop
        break;
      }

      // Assuming value is a Uint8Array representing the chunk of data
      const decoder = new TextDecoder('utf-8');
      const decodedStr = decoder.decode(value);

      // Append the current chunk to the accumulated XML string
      values.push(decodedStr);
    }

    const payload = values.join('');
    console.log(`webhook/youtube payload`, payload);
    hmac.update(payload);
    const expectedSignature = 'sha256=' + hmac.digest('hex');
    const isValidSignature = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    if (isValidSignature) {
      NextResponse.json({ message: 'Update Recieved' }, { status: 200 });
      respond = false;
      parseString(payload || '', (error, result) => {
        if (error) {
          console.error(`api/webhook/youtube encountered parsing error`, error.stack);
          return;
        }

        const videoLink = encodeURIComponent(result.feed.entry[0].link[0].$.href);
        if (!videoLink) return;

        console.log(`webhook/youtube videoLink ${videoLink}`);

        // send video link to creation endpoint so it can be added to the site
        const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://www.getdevnews.com';
        const response = fetch(`${baseUrl}/api/create/articles?url=${videoLink}`, {
          cache: 'no-store', 
        }).then((res) => res.json());

        console.log(`webhook/youtube response`, response);
      });
    } else {
      NextResponse.json({ message: 'Invalid Signature' }, { status: 400 });
      respond = false;
      const ip = request.ip;
      const { isBot, device } = userAgent(request);
      console.error(`webhook/youtube unauthorized access`, { device, ip, isBot });
    }
  } catch (error) {
    console.error(`webhook/youtube encountered error`, error);
    if (respond) {
      NextResponse.json({ error }, { status: 500 });
      respond = false;
    }
  } finally {
    if (respond) {
      NextResponse.json({ message: 'Invalid Data Stream' }, { status: 400 });
    }
  }
}
