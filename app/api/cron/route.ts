import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { getMetaData, getYouTubeData } from '@/lib/url';
import { revalidatePath } from 'next/cache';
import Parser from 'rss-parser';

/**
 * Example: http://localhost:3000/api/cron
 * This endpoint will serve to allow automated and manual processes to add artciles
 * to the home page through a batch process of all known rss feeds.
 * 
 * Security:
 * The sql template engine serves to protect against malicious attacks.
 * TODO: Consider setting up a table of known news feeds and preventing feeds from
 * other domains from being added.
 * 
 * @param {NextRequest} request The incoming request object.
 * @returns {NextResponse} The response containing the created article data or
 * an error message.
 */
export async function GET(request: NextRequest) {
  const links = [];
  try {
    if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid Authorization: ${request.headers.get('Authorization')}`);
    }

    const now = Date.now();
    const rssRecords = await sql`
      SELECT email, expires, source
      FROM rss
      WHERE expires > ${now};
    `;
    const rss = rssRecords.rows.map((row) => {
      return { email: row.email, expires: row.expires, source: row.source };
    });

    for await (const data of rss) {
      try {
        const feed = await new Parser().parseURL(data.source);
    
        for await (const item of feed.items) {
          try {
            const published = Date.parse(item.pubDate || item.published || new Date());
            if (published < Date.now() - 24 * 60 * 60 * 1000) continue;
            const metadata = await getMetaData(item.link || '');
            if (typeof metadata !== 'object' || metadata === null) throw new Error(`Invalid item link: ${item.link} - ${JSON.stringify(metadata)}`);
    
            if (data.email) {
              metadata.tag = 'ad';
              metadata.email = data.email;
            }
    
            console.log(`cron processing metadata for ${item.link} of ${data.source}`, metadata);
            const { blurDataURL, byline, dataURL, date, description, email, keywords, source, tag, title } = metadata;
    
            const articles = await sql`
              INSERT INTO articles (blurDataURL, byline, dataURL, date, description, email, keywords, source, tag, title) 
              VALUES (${blurDataURL}, ${byline}, ${dataURL}, ${date}, ${description}, ${email}, ${`{${keywords.join(',')}}`}, ${source}, ${tag}, ${title})
              RETURNING source;
            `;
    
            const updates = articles.rows.map(row => row.source);
    
            console.log(`cron result for ${data.source}`, updates.length);
  
            if (updates.length > 0) {
              links.push(...updates);
            }
          } catch (error) {
            console.error(`cron encountered error for ${item.link} of ${data.source}`, error);
          }
        }
      } catch (error) {
        console.error(`cron encountered error for ${data.source} of feeds`, error);
      }
    }
  } catch (error) {
    console.error(`cron encountered error`, error);
  } finally {
    console.log(`cron processed ${links.length} rss feed links`, links);
  }

  const channels = [];
  try {
    if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid Authorization: ${request.headers.get('Authorization')}`);
    }

    const now = Date.now();
    const youtubeRecords = await sql`
      SELECT email, expires, channel
      FROM youtube
      WHERE expires > ${now - (48 * 60 * 60 * 1000)};
    `;
    const youtube = youtubeRecords.rows.map((row) => {
      return { email: row.email, expires: row.expires, channel: row.channel };
    });

    for await (const data of youtube) {
      try {
        console.log(`create/youtube/row processing data for ${data.channel}`);

        const expires = data.expires - Date.now(); // > 0 means it hasn't expired
        const formData = new URLSearchParams();
        formData.append('hub.callback', 'https://www.getdevnews.com/api/webhook/youtube');
        formData.append('hub.mode', expires > 0 ? 'subscribe' : 'unsubscribe');
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

        channels.push({ status: response.statusText, mode: expires > 0 ? 'subscribe' : 'unsubscribe', channel: data.channel })

        console.log(`create/youtube/row response for ${expires > 0 ? 'subscribing to' : 'unsubscribing from'} channel ${data.channel}`, response.statusText);
      } catch (error) {
        console.error(`cron encountered error for ${data.channel} of youtube`, error);
      }
    }
  } catch (error) {
    console.error(`cron encountered error`, error);
  } finally {
    console.log(`cron processed ${channels.length} youtube channels`, channels);
  }

  console.log(`cron processed ${channels.length} youtube channels and ${links.length} rss feeds`);
  return NextResponse.json({ links, channels }, { status: 200 });
}
