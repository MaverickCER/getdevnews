import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { sql } from '@vercel/postgres';
import crypto from 'crypto';
import { getMetaData, getYouTubeData } from '@/lib/url';

/**
 * Example: http://localhost:3000/api/webhook/youtube?hub.challenge=challenge_code
 * Endpoint for handling verification challenges from YouTube Webhook subscriptions.
 * This endpoint is used to verify subscriptions to YouTube channel updates using
 * the PubSubHubbub protocol. It expects a 'hub.challenge' query parameter 
 * containing the challenge code provided by YouTube. Upon receiving the challenge,
 * it returns the same code to verify the subscription.
 * 
 * @param {NextRequest} request The incoming request object containing the verification challenge.
 * @returns {NextResponse} The response containing the verification challenge or a default message if none provided.
 */
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
export async function POST(request: NextRequest) {
  try {
    if (!request.body) throw new Error('Invalid POST Request');
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

    // validate signature - throws error if not equal
    const signature = request.headers.get('x-hub-signature') || '';
    const expectedSignature = `sha1=${crypto.createHmac('sha1', process.env.YOUTUBE_API_SECRET || '').update(payload).digest('hex')}`;
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    // Regular expression to match either watch?v= or /shorts/
    const regex = /(?:watch\?v=|\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = (payload || '').match(regex);

    const url = match && match.length > 1 ? `https://www.youtube.com/watch?v=${match[1]}` : '';
    if (!url) throw new Error(`Invalid url: ${url}`);

    const metadata = await getMetaData(url);
    if (typeof metadata !== 'object' || metadata === null) throw new Error(`Invalid URL: ${url} - ${JSON.stringify(metadata)}`);

    const youtube = await getYouTubeData(url);
    if (!youtube) throw new Error(`Invalid youtube link: ${url}`);
    metadata.byline = youtube.byline;
    metadata.duration = youtube.duration;
    metadata.email = youtube.email;
    metadata.keywords = [...metadata.keywords, ...youtube.keywords];
    metadata.tag = youtube.tag;

    console.log(`webhook/youtube processing metadata for ${url}`, metadata);
    const { blurDataURL, byline, dataURL, date, description, email, keywords, source, tag, title } = metadata;

    const articles = await sql`
      INSERT INTO articles (blurDataURL, byline, dataURL, date, description, email, keywords, source, tag, title) 
      VALUES (${blurDataURL}, ${byline}, ${dataURL}, ${date}, ${description}, ${email}, ${`{${keywords.join(',')}}`}, ${source}, ${tag}, ${title});
    `;

    console.log(`webhook/youtube processed ${url}`, articles);

    revalidatePath('/');
    return NextResponse.json({ message: 'acknowledged' }, { status: 200 });
  } catch (error) {
    console.error(`webhook/youtube encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
