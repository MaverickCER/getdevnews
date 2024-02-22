import { NextApiRequest, NextApiResponse } from 'next';
import { parseString } from 'xml2js';
import crypto from 'crypto';

export async function GET(request: NextApiRequest, response: NextApiResponse) {
  const hub_challenge = request.query['hub.challenge'] || 'No Challenge';

  console.log(`webhook/youtube query`, request.query);

  return response.status(204).send(hub_challenge);
}

/**
 * Example: http://localhost:3000/api/webhook/youtube POST xml body
 * Endpoint for notifying getDevNews about YouTube channel updates using the PubSubHubbub protocol.
 * This endpoint is triggered when a YouTube channel publishes a new video.
 * It receives an Atom feed notification in XML format as the request body.
 * The notification is parsed to extract the link to the newly published video.
 * The link is then encoded and used to create a new article entry in the database
 * via another API endpoint.
 * Webhooks like this will be primary way for news to be added to the site.
 * 
 * @param {NextApiRequest} request The incoming request object.
 * @returns {NextApiResponse} The response indicating acknowledgement of the event.
 */
export async function POST(request: NextApiRequest, response: NextApiResponse) {
  let respond = true;
  try {
    const signatures = request.headers['x-hub-signature'] || '';
    const signature = Array.isArray(signatures) ? signatures.join('') : '';
    const hmac = crypto.createHmac('sha256', process.env.YOUTUBE_API_SECRET || '');
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    request.on('end', () => {
      const payload = Buffer.concat(chunks).toString('utf-8');
      console.log(`webhook/youtube payload`, payload);
      hmac.update(payload);
      const expectedSignature = 'sha256=' + hmac.digest('hex');
      const isValidSignature = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
      if (isValidSignature) {
        response.status(200).send('Update Recieved');
        respond = false;
        parseString(payload || '', (error, result) => {
          if (error) {
            console.error(`webhook/youtube encountered parsing error`, error);
            return;
          }

          const videoLink = encodeURIComponent(result.feed.entry[0].link[0].$.href);
          if (!videoLink) return;

          console.log(`webhook/youtube videoLink ${videoLink}`);

          // send video link to creation endpoint so it can be added to the site
          const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://www.getdevnews.com';
          const response = fetch(`${baseUrl}/api/create/articles?url=${videoLink}`).then((res) => res.json());

          console.log(`webhook/youtube response`, response);
        });
      } else {
        response.status(400).send('Invalid Signature');
        respond = false;
        const ip = request.headers['x-forwarded-for'] || '';
        const userAgent = request.headers['user-agent'] || '';
        const isBot = userAgent.toLowerCase().includes('bot');
        console.error(`webhook/youtube unauthorized access`, { ip, isBot, userAgent });
      }
    });
  } catch (error) {
    console.error(`webhook/youtube encountered error`, error);
    if (respond) {
      response.status(500).send('Invalid Data Stream');
      respond = false;
    }
  } finally {
    if (respond) {
      response.status(400).send('Invalid Data Stream');
    }
  }
}
