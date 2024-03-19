import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeData } from '@/lib/url';

/**
 * Example: http://localhost:3000/api/delete/youtube/row?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DxulXmZrC9uI
 * This endpoint will serve to allow automated and manual processes to remove youtube
 * subscriptions from the feed.
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
    const key = searchParams.get('key');
    if (key !== process.env.API_KEY && process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid key: ${key}`);
    }

    const urls = decodeURIComponent(searchParams.get('url') || '').split(',');
    if (urls.length === 0) throw new Error(`Invalid urls: ${urls}`);
    console.log(`delete/youtube/row called for urls ${urls.join(', ')}`);

    for await (const url of urls) {
      try {
        const data = await getYouTubeData(url);

        if (data && data.channel) {
          console.log(`delete/youtube/row processing data for ${data.channel}`);

          const formData = new URLSearchParams();
          formData.append('hub.callback', 'https://www.getdevnews.com/api/webhook/youtube');
          formData.append('hub.mode', 'unsubscribe');
          formData.append('hub.topic', `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${data.channel}`);
          formData.append('hub.secret', process.env.YOUTUBE_API_SECRET || '');

          const requestOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
          };

          const response = await fetch('https://pubsubhubbub.appspot.com/', requestOptions);

          console.log(`delete/youtube/row response for channel ${data.channel}`, response.statusText);

          const now = Date.now();
          const youtube = await sql`
            UPDATE youtube 
            SET expires = ${now}
            WHERE channel = ${data.channel}
            RETURNING channel;
          `;

          const updates = youtube.rows.map(row => row.channel);
          console.log(`delete/youtube/row result for ${data.channel}`, updates.length);

          if (updates.length > 0) {
            channels.push(...updates);
          }
        }
      } catch (error) {
        console.error(`delete/youtube/row encountered error for ${url} of urls`, error);
      }
    }
  } catch (error) {
    console.error(`delete/youtube/row encountered error`, error);
  } finally {
    console.log(`delete/youtube/row processed ${channels.length} youtube channels`)
    return NextResponse.json({ channels }, { status: 200 });
  }
}
