import { sql } from '@vercel/postgres';

/**
 * Retrieves a bearer token from Twitter API for authentication.
 * This function sends a POST request to the Twitter API with client credentials
 * to obtain a bearer token for accessing Twitter endpoints.
 * If successful, it returns the bearer token; otherwise, it falls back to
 * the bearer token provided in the environment variables.
 * 
 * @returns {Promise<string>} A Promise resolving to the bearer token string.
 */
export async function authenticate(): Promise<string> {
  try {
    const input = `https://api.twitter.com/oauth2/token`;
    const init = {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${process.env.TWITTER_API_KEY}:${process.env.TWITTER_API_SECRET}`),
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: 'grant_type=client_credentials'
    };

    const response = await fetch(input, init).then(res => res.json());

    if (response.access_token) {
      return response.access_token;
    }

    return process.env.TWITTER_BEARER_TOKEN || '';
  } catch (error) {
    console.error(`twitter.authenticate encountered error`, error);
    return process.env.TWITTER_BEARER_TOKEN || '';
  }
}

/**
 * Retrieves tweets from a specified Twitter user's timeline and stores them as 
 * articles in the database. This function fetches tweets from the Twitter API
 * for the given user ID within the last 24 hours. Each tweet is processed to
 * extract metadata such as author, date, description, and URL. The metadata is 
 * then used to create an article entry in the database. If 'isAd' is true, the 
 * article is tagged as an advertisement.
 * 
 * @param {string} id The Twitter user ID whose timeline to retrieve.
 * @param {boolean} isAd Specifies whether the retrieved tweets are advertisements.
 * @returns {Promise<number>} A Promise resolving to the number of tweets processed.
 */
export async function getTimeline(id: string, isAd: boolean): Promise<number> {
  if (!id) return 0;
  const tweets = [];

  try {
    const input = `https://api.twitter.com/2/users/${id}/tweets?` +
      `tweet.fields=author_id,created_at,id,text&` +
      `expansions=author_id&` +
      `start_time=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`;
    const init = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + await authenticate(),
      },
    };

    const response = await fetch(input, init).then(res => res.json());
    const username = response.includes.users[0].username
    const url = `https://twitter.com/${username}`;

    for await (const tweet of response.data) {
      try {
        const metadata = {
          blurDataURL: `data:image/webp;base64,UklGRqYAAABXRUJQVlA4IJoAAACQAwCdASoSAAoAPm0qkUWkIqGYBABABsSgAD4hG1FUWvyTKHAAAP79YPoLfDIpv9TX/ogTVmREI8Sv4zX8NsQPy1esqk/75c3H/xoXs4kC4kg0EkmTB1UXnuvQk/WQ4crqf6//0jTAE9E5fhSP/3YuV/WA7fBqNA//5cqf/D/Y/+fW+RBPLoCuSW2oymbMX71TAjsDFWF5TgAA`,
          byline: 'Twitter',
          dataURL: 'https://www.getdevnews.com/twitter-x.webp',
          date: Date.parse(tweet.created_at),
          description: tweet.text.length > 160 ? tweet.text?.substring(0, 160) + '...' : tweet.text,
          duration: 0,
          keywords: tweet.text.replace(/[^a-zA-Z0-9!#$%^&*()<>?.=\[\]{}\\|'`~]/g, ','),
          source: `${url}/status/${tweet.id}`,
          tag: isAd ? 'ad' : '',
          title: `${username} on X:`,
        }
        console.log(`twitter.getTimeline processing metadata for ${id} ${username}`, metadata);
        const { blurDataURL, byline, dataURL, date, description, keywords, source, tag, title } = metadata;

        const articles = await sql`
          INSERT INTO articles (blurDataURL, byline, dataURL, date, description, keywords, source, tag, title) 
          VALUES (${blurDataURL}, ${byline}, ${dataURL}, ${date}, ${description}, ${`{${keywords}}`}, ${source}, ${tag}, ${title});
        `;

        console.log(`twitter.getTimeline result for ${id} ${username}`, articles);

        tweets.push(date);
      } catch (error) {
        console.error(`twitter.getTimeline encountered error for ${id} ${url}/status/${tweet.id}`, error);
      }
    }
  } catch (error) {
    console.error(`twitter.authenticate encountered error for ${id}`, error);
  } finally {
    const date = (Date.parse(`${tweets.sort().pop() || ''}`) || Date.now());
    console.log(`twitter.getTimeline processed ${tweets.length} tweets for ${id}`);
    await sql`
      UPDATE tweeters
      SET date = ${date}
      WHERE id = ${id}
    `;
    return tweets.length;
  }
}
