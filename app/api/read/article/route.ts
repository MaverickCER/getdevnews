import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Example: http://localhost:3000/api/read/articles?columns=blurdataurl,byline,date,description,duration,keywords,source,tag,title,views,visits&source=some_source
 * Endpoint for retrieving articles from the database based on specified columns and source.
 * 
 * @returns {Response} The response containing the articles matching the specified criteria or an error message.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Retrieve columns from query parameters, defaulting to a predefined list if not specified
    const columns = decodeURIComponent(searchParams.get('columns') || 'blurdataurl, byline, date, description, duration, keywords, source, tag, title, views, visits');
    const source = decodeURIComponent(searchParams.get('source') || '');

    let result;
    if (columns === 'dataurl') {
      result = await sql`
        SELECT dataurl
        FROM articles
        WHERE source = ${source};
      `;
    } else {
      result = await sql`
        SELECT blurdataurl, byline, date, description, duration, keywords, source, tag, title, views, visits
        FROM articles
        WHERE source = ${source};
      `;
    }

    console.log(`read/article result for source ${source}`, result);

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    console.error(`read/article encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
