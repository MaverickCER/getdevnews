import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { getMetaData, getYouTubeData } from '@/lib/url';

/**
 * Example: http://localhost:3000/api/create/articles/row?url=https%3A%2F%2Fscoutlife.org%2Fhobbies-projects%2Ffunstuff%2F575%2Fmorse-code-translator%2F
 * This endpoint will serve to allow automated and manual processes to add links
 * to the home page. All links will be able to get the baseline data through the
 * getMetaData function but add ons may be required for some urls to ensure that
 * the information collected is as accurate as possible.
 * 
 * Extansions:
 * YouTube is a great extension in this case as we want to be able to display
 * the channel who created the video rather than crediting youtube. This extension
 * also determines the appropriate tag for live or short videos and pulls the
 * keywords that the content creator thought were important for the video.
 * 
 * Security:
 * The sql template engine serves to protect against malicious attacks.
 * TODO: Consider setting up a table of known news URLs and preventing urls from
 * other domains from being added.
 * 
 * @param {NextRequest} request The incoming request object.
 * @returns {NextResponse} The response containing the created article data or
 * an error message.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = decodeURIComponent(searchParams.get('url') || '');
    const isAd = searchParams.get('ad') === 'true';
    if (!url) throw new Error(`Invalid Url: ${url}`);
    console.log(`create/articles/row called for ${isAd ? ' Ad' : ''} URL ${url}`);

    const metadata = await getMetaData(url);
    if (typeof metadata !== 'object' || metadata === null) throw new Error(`Invalid URL: ${url} - ${JSON.stringify(metadata)}`);

    const youtube = await getYouTubeData(url);
    if (youtube) {
      metadata.byline = youtube.byline;
      metadata.keywords = [...metadata.keywords, ...youtube.keywords];
      metadata.tag = youtube.tag;
    }

    if (isAd) {
      metadata.tag = 'ad';
    }

    console.log(`create/articles/row processing metadata for ${url}`, metadata);
    const { blurDataURL, byline, dataURL, date, description, keywords, source, tag, title } = metadata;

    const articles = await sql`
      INSERT INTO articles (blurDataURL, byline, dataURL, date, description, keywords, source, tag, title) 
      VALUES (${blurDataURL}, ${byline}, ${dataURL}, ${date}, ${description}, ${`{${keywords.join(',')}}`}, ${source}, ${tag}, ${title});
    `;

    console.log(`create/articles/row `, articles);

    return NextResponse.json({ articles }, { status: 200 });
  } catch (error) {
    console.error(`create/articles/row encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}