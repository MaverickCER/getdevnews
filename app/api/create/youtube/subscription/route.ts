import { NextRequest, NextResponse, userAgent } from 'next/server';

/**
 * Example: http://localhost:3000/api/create/youtube/subscription?channelId=UC_x5XG1OV2P6uZZ5FSM9Ttw
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
    if (process.env.VERCEL_ENV !== 'development') {
      const { isBot, device } = userAgent(request);
      const ip = request.ip;
      console.error(`create/youtube/subscription unauthorized access`, { device, ip, isBot });
      return NextResponse.json({ error: '404: This page could not be found.' }, { status: 504 });
    }

    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId') || '';
    if (!channelId) return NextResponse.json({ error: "Invalid channelId" }, { status: 400 });
    const topic = `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`;
    const formData = new URLSearchParams();
    formData.append('hub.callback', 'https://www.getdevnews.com/webhook/youtube');
    formData.append('hub.mode', 'subscribe');
    formData.append('hub.topic', topic);
    formData.append('hub.secret', process.env.YOUTUBE_API_SECRET || '');

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    };

    const response = await fetch('https://pubsubhubbub.appspot.com/', requestOptions);

    return NextResponse.json({ response: response.statusText }, { status: 200 });
  } catch (error) {
    console.error(`create/youtube/subscription encountered error`, error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
