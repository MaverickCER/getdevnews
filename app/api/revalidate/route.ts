import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * Example: http://localhost:3000/api/revalidate?path=%2F
 * This endpoint will serve to allow for manual revalidation of paths.
 * 
 * @param {NextRequest} request The incoming request object.
 * @param {string} request.path search param indicating the path to be invalidated.
 * @returns {NextResponse} The response indicating successful revalidation or error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== process.env.API_KEY && process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid key: ${key}`);
    }

    const path = decodeURIComponent(searchParams.get('path') || '');

    revalidatePath(path);

    console.log(`Revalidating path: ${path}`);

    return NextResponse.json({ message: `Revalidated ${path}` }, { status: 200 });
  } catch (error) {
    console.error(`create/articles/row encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
