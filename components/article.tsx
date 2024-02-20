'use client';

import { updateArticle } from '@/lib/articles';
import Image from 'next/image';

type TArticleProps = {
  blurDataURL: string;
  byline: string;
  dataURL: string;
  date: number;
  description: string;
  source: string;
  tag: string;
  title: string;
};

/**
 * React component representing an article item. The aim is to display the data
 * we've pulled in a way that is pleasing to the eye but formatted consistently
 * in a way that is easy to skim and find important information. Unlike the site's
 * original inspiration, which doesn't use any images at all, we plan to cache
 * and show the link's thumbnail in an effort to make the articles easier to skim
 * or help the user find intriguing articles faster.
 *
 * @param {Object} props The props object containing article data.
 * @param {string} props.blurDataURL The base64-encoded blur data URL for the article image.
 * @param {string} props.byline The author or creator of the article.
 * @param {string} props.dataURL The URL of the article image.
 * @param {number} props.date The timestamp of the article publication date.
 * @param {string} props.description The brief description of the article content.
 * @param {string} props.source The source URL of the article.
 * @param {string} props.tag The tag or category of the article.
 * @param {string} props.title The title of the article.
 * @returns {JSX.Element} The JSX element representing the article item.
 */
export default function Article({
  blurDataURL,
  byline,
  dataURL,
  date,
  description,
  source,
  tag,
  title,
}: TArticleProps) {
  return (
    <button
      onClick={() => updateArticle(source)}
      className='flex flex-col flex-grow flex-shrink w-1/4 pb-4 rounded border-none min-w max-w'>
      <div
        className='relative img-wrapper rounded overflow-hidden'
        style={{ marginBottom: '-16px' }}
        aria-hidden={Boolean(!tag)}>
        <Image
          alt={source}
          aria-hidden={true}
          blurDataURL={blurDataURL}
          fill
          placeholder='blur'
          src={dataURL}
          sizes='1200px'
        />
        {tag && (
          <strong
            className={`absolute top-1 right-1 p-1 rounded badge leading-none font-bold capitalize ${tag}`}>
            {tag}
          </strong>
        )}
      </div>
      <div className='flex flex-col m-auto p-4 z-10 text-left rounded data'>
        <span className='sr-only'>Click here to view content as provided by </span>
        <i className='text-sm truncate leading-6'>
          {byline} -{' '}
          <time dateTime={new Date(date).toISOString()}>
            {new Date(date).toLocaleDateString()} {new Date(date).toLocaleTimeString()}
          </time>
        </i>
        <span className='sr-only'>and titled as </span>
        <p className='font-bold leading-6'>{title}</p>
        <small className='leading-6'>{description}</small>
      </div>
    </button>
  );
}
