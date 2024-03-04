'use client'

import type { TArticleProps } from '@/components/article';
import Skeleton from '@/components/skeleton';
import { useLoadMore } from '@/hooks/useLoadMore';
import dynamic from 'next/dynamic';
import { useRef } from 'react';

const Article = dynamic(() => import('@/components/article'), {
  loading: () => <Skeleton count={1} />,
});

type TArticlesProps = {
  initialArticles: TArticleProps[];
};

export default function Articles({ initialArticles }: TArticlesProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const articles = useLoadMore(ref, initialArticles);

  if (!articles || articles.length === 0) return <Skeleton count={9} />;

  return (
    <>
      {articles.map(({ source }: TArticleProps) => (
        <Article key={source} source={source} />
      ))}
      <div ref={ref} />
    </>
  );
}
