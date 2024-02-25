import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { sql } from '@vercel/postgres';
import { parseString } from 'xml2js';
import crypto from 'crypto';
import { getMetaData } from '@/lib/url';

/**
 * Example: http://localhost:3000/api/webhook/twitter?hub.challenge=challenge_code
 * Endpoint for handling verification challenges from Twitter Webhook subscriptions.
 * This endpoint is used to verify subscriptions to Twitter channel updates using
 * the Account Activity API. It expects a 'crc_token' query parameter containing
 * the Challenge-Response Check provided by Twitter. Upon receiving the challenge,
 * it returns the same code to verify the subscription.
 * 
 * @param {NextRequest} request The incoming request object containing the verification challenge.
 * @returns {NextResponse} The response containing the verification challenge or a default message if none provided.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(decodeURI(request.url));
  const crc_token = searchParams.get('crc_token') || "no challenge";
  const response_token = `sha256=${crypto.createHmac('sha256', process.env.Twitter_API_SECRET || '').update(crc_token).digest('base64')}`
  console.log(`webhook/twitter params ${searchParams.toString()}`);

  return NextResponse.json({ response_token }, { status: 200 });
}

/**
 * Example: http://localhost:3000/api/webhook/twitter POST xml body
 * Endpoint for notifying getDevNews about Twitter channel updates using the PubSubHubbub protocol.
 * This endpoint is triggered when a Twitter channel publishes a new video.
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
  const tweets = [];
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

    const payload = JSON.parse(values.join(''));
    console.log(`webhook/twitter payload`, payload);

    // validate signature - throws error if not equal
    const signature = request.headers.get('x-twitter-webhooks-signature') || '';
    const expectedSignature = `sha256=${crypto.createHmac('sha256', process.env.Twitter_API_SECRET || '').update(payload).digest('base64')}`;
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

    for await (const tweet of payload.tweet_create_events) {
      try {
        const username = tweet.user.screen_name;
        const id = tweet.user.id;
        const url = `https://twitter.com/${username}`;
        const metadata = {
          blurDataURL: `data:image/webp;base64,UklGRqYAAABXRUJQVlA4IJoAAACQAwCdASoSAAoAPm0qkUWkIqGYBABABsSgAD4hG1FUWvyTKHAAAP79YPoLfDIpv9TX/ogTVmREI8Sv4zX8NsQPy1esqk/75c3H/xoXs4kC4kg0EkmTB1UXnuvQk/WQ4crqf6//0jTAE9E5fhSP/3YuV/WA7fBqNA//5cqf/D/Y/+fW+RBPLoCuSW2oymbMX71TAjsDFWF5TgAA`,
          byline: 'Twitter',
          dataURL: 'https://www.getdevnews.com/twitter-x.webp',
          date: Date.parse(tweet.created_at),
          description: tweet.text.length > 160 ? tweet.text?.substring(0, 160) + '...' : tweet.text,
          duration: 0,
          keywords: tweet.text.replace(/[^a-zA-Z0-9!#$%^&*()<>?.=\[\]{}\\|'`~]/g, ','),
          source: `${url}/status/${tweet.id}`,
          tag: '',
          title: `${username} on X:`,
        }
        console.log(`webhook/twitter processing metadata for ${id} ${username}`, metadata);
        const { blurDataURL, byline, dataURL, date, description, keywords, source, tag, title } = metadata;

        const articles = await sql`
          INSERT INTO articles (blurDataURL, byline, dataURL, date, description, keywords, source, tag, title) 
          VALUES (${blurDataURL}, ${byline}, ${dataURL}, ${date}, ${description}, ${`{${keywords}}`}, ${source}, ${tag}, ${title});
        `;

        console.log(`webhook/twitter result for ${id} ${username}`, articles);

        tweets.push(date);
      } catch (error) {
        console.error(`webhook/twitter encountered error for request`, request);
      }
    }
  } catch (error) {
    console.error(`webhook/twitter encountered error`, error);
  } finally {
    console.log(`webhook/twitter processed ${tweets.length} tweets for request`, request);
    return NextResponse.json({ message: 'acknowledged' }, { status: 200 });
  }
}
