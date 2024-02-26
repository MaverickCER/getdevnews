import { NextRequest, NextResponse, userAgent } from 'next/server';

/**
 * Example: http://localhost:3000/api/delete/youtube/subscription?channelId=UC_x5XG1OV2P6uZZ5FSM9Ttw
 * Endpoint for subscribing to YouTube channel updates using PubSubHubbub protocol.
 * While there is an online form to accomplish this same task, having a deadicated
 * endpoint for use in development can make this process easier.
 * 
 * @param {NextRequest} request The incoming request object.
 * @returns {NextResponse} The response indicating the success or failure of the
 * subscription attempt.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== process.env.API_KEY && process.env.NODE_ENV !== 'development') {
      throw new Error(`Invalid key: ${key}`);
    }

    const channelId = searchParams.get('channelId') || '';
    if (!channelId) return NextResponse.json({ error: "Invalid channelId" }, { status: 400 });

    console.log(`delete/youtube/subscription channelId ${channelId}`);

    const formData = new URLSearchParams();
    formData.append('hub.callback', 'https://www.getdevnews.com/api/webhook/youtube');
    formData.append('hub.mode', 'unsubscribe');
    formData.append('hub.topic', `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`);
    formData.append('hub.secret', process.env.YOUTUBE_API_SECRET || '');

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    };

    const response = await fetch('https://pubsubhubbub.appspot.com/', requestOptions);

    console.log(`delete/youtube/subscription response for channelId ${channelId}`, response);

    return NextResponse.json({ response: response.statusText }, { status: 200 });
  } catch (error) {
    console.error(`delete/youtube/subscription encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
