import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * Example: http://localhost:3000/api/create/twitter/article?url=https%3A%2F%2Fscoutlife.org%2Fhobbies-projects%2Ffunstuff%2F575%2Fmorse-code-translator%2F
 * This endpoint will serve to allow manual processes to add twitter links to the 
 * home page. This will be helpful in the event that a webhook event isn't processed
 * correctly or we have a user that wants to post a single tweet as an advertisement
 * 
 * Security:
 * The sql template engine serves to protect against malicious attacks.
 * 
 * @param {NextRequest} request The incoming request object.
 * @returns {NextResponse} The response containing the created article data or
 * an error message.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = decodeURIComponent(searchParams.get('key') || '');
    if (key !== process.env.API_KEY && process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid key: ${key}`);
    }

    const created_at = decodeURIComponent(searchParams.get('created_at') || '');
    if (!created_at) throw new Error(`!created_at`);

    const id = decodeURIComponent(searchParams.get('id') || '');
    if (!id) throw new Error(`!id`);

    const text = decodeURIComponent(searchParams.get('text') || '');
    if (!text) throw new Error(`!text`);

    const username = decodeURIComponent(searchParams.get('username') || '');
    if (!username) throw new Error(`!username`);

    const emailParam = searchParams.get('email') || '';
    const url = `https://twitter.com/${username}/status/${id}`;
    console.log(`create/twitter/article called for${emailParam ? ` ${emailParam}` : ''} URL ${url}`);

    const metadata = {
      blurDataURL: `data:image/webp;base64,UklGRqYAAABXRUJQVlA4IJoAAACQAwCdASoSAAoAPm0qkUWkIqGYBABABsSgAD4hG1FUWvyTKHAAAP79YPoLfDIpv9TX/ogTVmREI8Sv4zX8NsQPy1esqk/75c3H/xoXs4kC4kg0EkmTB1UXnuvQk/WQ4crqf6//0jTAE9E5fhSP/3YuV/WA7fBqNA//5cqf/D/Y/+fW+RBPLoCuSW2oymbMX71TAjsDFWF5TgAA`,
      byline: 'Twitter',
      dataURL: 'https://www.getdevnews.com/twitter-x.webp',
      date: Date.parse(created_at),
      description: text.length > 160 ? text?.substring(0, 160) + '...' : text,
      duration: 0,
      email: emailParam,
      keywords: text.replace(/[^a-zA-Z0-9!#$%^&*()<>?.=\[\]{}\\|'`~]/g, ','),
      source: url,
      tag: emailParam ? 'ad' : '',
      title: `${username} on X:`,
    }

    console.log(`create/twitter/article processing metadata for ${url}`, metadata);
    const { blurDataURL, byline, dataURL, date, description, email, keywords, source, tag, title } = metadata;

    const articles = await sql`
      INSERT INTO articles (blurDataURL, byline, dataURL, date, description, email, keywords, source, tag, title) 
      VALUES (${blurDataURL}, ${byline}, ${dataURL}, ${date}, ${description}, ${email}, ${`{${keywords}}`}, ${source}, ${tag}, ${title});
    `;

    console.log(`create/twitter/article result for ${url}`, articles);
    
    revalidatePath('/');

    return NextResponse.json({ articles }, { status: 200 });
  } catch (error) {
    console.error(`create/twitter/article encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
