'use client'

import { useObserver } from '@/hooks/useObserver';
import { getArticle, updateVisits } from '@/lib/articles';
import { getDurationFromMs } from '@/lib/duration';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import Skeleton from './skeleton';

export type TArticleProps = {
  source: string;
};

type TArticleFields = {
  blurdataurl: string;
  byline: string;
  date: string;
  description: string;
  duration: string;
  keywords: string[];
  tag: string;
  title: string;
  views: string;
  visits: string;
}

/**
 * React component representing an article item. The aim is to display the data
 * we've pulled in a way that is pleasing to the eye but formatted consistently
 * in a way that is easy to skim and find important information. Unlike the site's
 * original inspiration, which doesn't use any images at all, we plan to cache
 * and show the link's thumbnail in an effort to make the articles easier to skim
 * or help the user find intriguing articles faster.
 *
 * @param {Object} props The props object containing article data.
 * @param {string} props.source The source URL of the article.
 * @returns {JSX.Element} The JSX element representing the article item.
 */
export default function Article({
  source, 
}: TArticleProps) {
  const [article, setArticle] = useState<TArticleFields | null>(null);
  const [url, setUrl] = useState<string>('');
  const ref = useRef(null);
  const isIntersecting = useObserver(ref, source, article ? article.blurdataurl : '');

  useEffect(() => {
    (async () => {
      const article = await getArticle(source, false);
      setArticle(article);
    })()
  }, [source]);

  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isIntersecting && !url && !isDevelopment) {
      const updateUrl = async () => {
        const data = await getArticle(source, true);
        console.error(data);
        setUrl(data.dataurl);
      }

      updateUrl();
    }
  }, [isIntersecting, url, source]);
  
  if (!article || !article.blurdataurl) return <Skeleton count={1} />;
  const { blurdataurl, byline, date, description, duration, keywords, tag, title, views, visits, } = article;
  const timestamp = getDurationFromMs(parseInt(duration));

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
          src={url ? url : blurdataurl}
          sizes='1200px'
          onError={() => setUrl(blurdataurl)}
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
          <time dateTime={new Date(parseInt(date)).toISOString()}>
            {new Date(parseInt(date)).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' })}{' '}
            {new Date(parseInt(date)).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </time>
          {timestamp && <span aria-label='duration'>{timestamp}</span>}
          {Boolean(parseInt(visits)) && <span aria-label='visits'>{visits}</span>}
        </div>
      </div>
    </button>
  );
}
