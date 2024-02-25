'use client';

import { useObserver } from '@/hooks/useObserver';
import { updateVisits } from '@/lib/articles';
import { getDurationFromMs } from '@/lib/duration';
import Image from 'next/image';
import { useRef } from 'react';

export type TArticleProps = {
  blurdataurl: string;
  byline: string;
  dataurl: string;
  date: number;
  description: string;
  duration: number;
  keywords: string[];
  source: string;
  tag: string;
  title: string;
  views: number;
  visits: number;
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
 * @param {string} props.blurdataurl The base64-encoded blur data URL for the article image.
 * @param {string} props.byline The author or creator of the article.
 * @param {string} props.dataurl The URL of the article image.
 * @param {number} props.date The timestamp of the article publication date.
 * @param {string} props.description The brief description of the article content.
 * @param {number} props.duration Ms to consume article content.
 * @param {string} props.source The source URL of the article.
 * @param {string} props.tag The tag or category of the article.
 * @param {string} props.title The title of the article.
 * @param {number} props.views The number of times this article has been viewed.
 * @param {number} props.visits The number of times this article has been clicked.
 * @returns {JSX.Element} The JSX element representing the article item.
 */
export default function Article({
  blurdataurl,
  byline,
  dataurl,
  date,
  description,
  duration,
  keywords,
  source,
  tag,
  title,
  views,
  visits,
}: TArticleProps) {
  const ref = useRef(null);
  const isIntersecting = useObserver(ref, source);
  const timestamp = getDurationFromMs(duration);
  
  return (
    <button
      ref={ref}
      onClick={() => updateVisits(source, tag === 'ad', keywords)}
      data-intersecting={isIntersecting}
      data-views={views}
      className='flex flex-col flex-grow flex-shrink w-1/4 pb-4 rounded border-none min-w max-w'>
      <div
        className='relative img-wrapper rounded overflow-hidden'
        style={{ marginBottom: '-16px' }}
        aria-hidden={Boolean(!tag)}>
        <Image
          alt={source}
          aria-hidden={true}
          blurDataURL={blurdataurl}
          fill
          placeholder='blur'
          src={dataurl}
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
        <p className='font-bold leading-6' aria-label='titled as'>
          {title}
        </p>
        <small className='leading-6'>{description}</small>
        <div className='text-sm truncate leading-6 gap-x-1 flex flex-row flex-wrap'>
          <address>{byline}</address>
          <time dateTime={new Date(date).toISOString()}>
            {new Date(date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}{' '}
            {new Date(date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </time>
          {timestamp && <span aria-label='duration'>{timestamp}</span>}
          {Boolean(visits) && <span aria-label='visits'>{visits}</span>}
        </div>
      </div>
    </button>
  );
}
