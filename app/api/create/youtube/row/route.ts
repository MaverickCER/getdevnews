import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeData } from '@/lib/url';

/**
 * Example: http://localhost:3000/api/create/youtube/row?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DxulXmZrC9uI
 * This endpoint will serve to allow automated and manual processes to add youtube
 * subscriptions to the feed. Each youtube channel will be associated with an
 * expiration date and email indicating when the channel's pubsubhubbub links
 * should stop working.
 * 
 * Security:
 * The sql template engine serves to protect against malicious attacks.
 * 
 * @param {NextRequest} request The incoming request object.
 * @returns {NextResponse} The response containing the created article data or
 * an error message.
 */
export async function GET(request: NextRequest) {
  const channels = [];
  try {
    const { searchParams } = new URL(request.url);
    const key = decodeURIComponent(searchParams.get('key') || '');
    if (key !== process.env.API_KEY && process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid key: ${key}`);
    }

    const urls = decodeURIComponent(searchParams.get('url') || '').split(',');
    const email = searchParams.get('email') || '';
    const expires = (parseInt(`${searchParams.get('expires')}`) || 182500) * 24 * 60 * 60 * 1000;
    if (urls.length === 0) throw new Error(`Invalid urls: ${urls}`);
    console.log(`create/youtube/row called for${email ? ` ${email}` : ''} urls ${urls.join(', ')}`);

    for await (const url of urls) {
      try {
        const data = await getYouTubeData(url);

        if (data && data.channel) {
          console.log(`create/youtube/row processing data for ${data.channel}`);

          const formData = new URLSearchParams();
          formData.append('hub.callback', 'https://www.getdevnews.com/api/webhook/youtube');
          formData.append('hub.mode', 'subscribe');
          formData.append('hub.topic', `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${data.channel}`);
          formData.append('hub.secret', process.env.YOUTUBE_API_SECRET || '');
          formData.append('hub.expires', expires >= 172800 ? `172800` : `${expires}`);

          const requestOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          };

          const response = await fetch('https://pubsubhubbub.appspot.com/', requestOptions);

          console.log(`create/youtube/row response for channel ${data.channel}`, response.statusText);

          const youtube = await sql`
            INSERT INTO youtube (expires, channel, email) 
            VALUES (${Date.now() + expires}, ${data.channel}, ${email})
            RETURNING channel;
          `;

          const updates = youtube.rows.map(row => row.channel);
          console.log(`create/youtube/row result for ${data.channel}`, updates.length);

          if (updates.length > 0) {
            channels.push(...updates);
          }
        }
      } catch (error) {
        console.error(`create/youtube/row encountered error for ${url} of urls`, error);
      }
    }
    return NextResponse.json({ channels, count: channels.length }, { status: 200 });
  } catch (error) {
    console.error(`create/youtube/row encountered error`, error);
    return NextResponse.json({ error, channels, count: channels.length }, { status: 200 });
  }
}
