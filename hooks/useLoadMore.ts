import { TArticleProps } from "@/components/article";
import { getArticles } from "@/lib/articles";
import { MutableRefObject, useEffect, useRef, useState } from "react";

export const useLoadMore = (ref: MutableRefObject<HTMLDivElement | null>, initialArticles: TArticleProps[]): TArticleProps[] => {
  const [articles, setArticles] = useState<TArticleProps[]>(initialArticles);
  const isIntersecting = useRef<boolean>(false);
  const offset = useRef<number>(9);

  useEffect(() => {
    const current = ref?.current;
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (entry.isIntersecting && !isIntersecting.current) {
          offset.current += 9;
          const newArticles: TArticleProps[] = await getArticles(offset.current);
          setArticles((prev) => [...prev, ...newArticles]);
        }
        isIntersecting.current = entry.isIntersecting;
      },
      { rootMargin: '0px' }
    );

    if (current && observer) {
      observer.observe(current);
    }

    return () => {
      if (current && observer) {
        observer.unobserve(current);
      }
    };
  }, [ref]);

  return articles;
};