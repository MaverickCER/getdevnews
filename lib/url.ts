import { getBase64, getBlobURL } from '@/lib/img';
import { google } from 'googleapis'
import { getDurationFromPT } from './duration';

/**
 * Asynchronous function to retrieve metadata from a given URL. The system verifies
 * that blurDataURL, byline, dataURL, description, source, and title are identifiable
 * before returning the data to the requestor. This ensures that any articles
 * added to the database will have all the required components to be displayed
 * in a consistent format. 
 * 
 * @param {string} url The URL from which to fetch metadata.
 * @returns {Promise<object | null>} A promise that resolves to an object containing the retrieved metadata, or null if an error occurs.
 */
export async function getMetaData(url: string) {
  try {
    // Fetch the HTML content of the URL
    const response = await fetch(url, {
      cache: 'no-store', 
    });
    const html = await response.text();

    // Create a temporary div element to hold the HTML content
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(html);
    const tempDiv = dom.window.document.createElement('div');
    tempDiv.innerHTML = html;

    // Extract metadata elements such as title, description, etc.
    const innerTitle = tempDiv.querySelector('title')?.innerText || '';
    const ogTitle = tempDiv.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    const twitterTitle = tempDiv.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || tempDiv.querySelector('meta[name="twitter:text:title"]')?.getAttribute('content') || '';
    const title = ogTitle || twitterTitle || innerTitle || '';
    const ogURL = tempDiv.querySelector('meta[property="og:url"]')?.getAttribute('content') || '';
    const twitterURL = tempDiv.querySelector('meta[name="twitter:url"]')?.getAttribute('content') || '';
    const source = ogURL || twitterURL || url;
    const ogImage = tempDiv.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    const twitterImage = tempDiv.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || '';
    const image = (ogImage || twitterImage || '').split('?')[0];
    const blurDataURL = await getBase64(image, 0, 10) || '';
    const dataURL = await getBlobURL(image, 1200, 0, url) || '';
    const description = tempDiv.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const date = Date.parse(tempDiv.querySelector('meta[itemprop="datePublished"]')?.getAttribute('content') || tempDiv.querySelector('meta[itemprop="uploadDate"]')?.getAttribute('content') || tempDiv.querySelector('time')?.getAttribute('datetime') || new Date().toISOString());
    const byline = tempDiv.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';
    const metaKeywords = (tempDiv.querySelector('meta[name="keywords"]')?.getAttribute('content') || '').replace(/[^a-zA-Z0-9!#$%^&*()<>?.=\[\]{}\\|'`~]/g, ',').split(',') || [];
    const titleKeywords = title.replace(/[^a-zA-Z0-9!#$%^&*()<>?.=\[\]{}\\|'`~]/g, ' ').split(' ') || [];
    const descriptionKeywords = description.replace(/[^a-zA-Z0-9!#$%^&*()<>?.=\[\]{}\\|'`~]/g, ' ').split(' ') || [];
    const keywords = [...descriptionKeywords, ...titleKeywords, ...metaKeywords].map((v) => v.toLowerCase().trim()).filter((v, i, a) => v && a.indexOf(v) === i);

    if (!blurDataURL || !byline || !dataURL || !description || !source || !title) return null;

    return {
      blurDataURL,
      byline,
      dataURL,
      date,
      description: description.length > 160 ? description?.substring(0, 160) + '...' : description,
      duration: 0,
      keywords,
      source,
      tag: '',
      title: title.length > 70 ? title?.substring(0, 70) + '...' : title,
    };
  } catch (error) {
    console.error(`getMetaData encountered error`, error);
    return null;
  }
}

/**
 * Asynchronous function to retrieve metadata from a YouTube video URL using the
 * YouTube API. This is especially important to ensure that the correct channel
 * is attributed for creating the content. It also determines the appropriate
 * tag for live content or shorts and pulls the keywords the content creator
 * wants associated with their work.
 * 
 * @param {string} url The URL of the YouTube video.
 * @returns {Promise<object | null>} A promise that resolves to an object
 * containing the retrieved metadata, or null if an error occurs.
 */
export async function getYouTubeData(url: string) {    
  try {
    const youtube = google.youtube({
      version: 'v3',
      key: process.env.YOUTUBE_API_KEY,
    });
    
    // Regular expression to match YouTube video ID
    const pattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(pattern);
    if (!match) return null;
    const videoId = match[1];

    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails'],
      id: [videoId],
    });

    const video = response?.data?.items?.[0];
    if (!video || !video.snippet || !video.contentDetails) return null;
    const duration = getDurationFromPT(video.contentDetails.duration || '');

    const isLive = video.snippet.liveBroadcastContent === 'live';
    const isShort = duration < 5 * 60 * 1000;
    return {
      byline: video.snippet.channelTitle || 'YouTube',
      duration,
      keywords: video.snippet.tags || [],
      tag: isLive ? 'live' : isShort ? 'short' : ''
    };
  } catch (error) {
    console.error('getVideoData encountered error', error);
    return null;
  }
}
