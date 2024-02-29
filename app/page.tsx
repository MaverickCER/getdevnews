import type { TArticleProps } from '@/components/article';
import Article from '@/components/article';
import Footer from '@/components/footer';
import Header from '@/components/header';
import Insights from '@/components/insights';
import Skeleton from '@/components/skeleton';
import { getArticles } from '@/lib/articles';

export const dynamic = 'force-dynamic'

export default async function Home() {
  const articles = await getArticles();

  return (
    <>
      <Header />
      <main className='flex min-h-screen max-w flex-row flex-wrap items-center justify-center p-4 gap-4 m-auto'>
        {!articles || articles.length === 0 ? (
          <Skeleton count={10} />
        ) : (
          articles.map(
            ({ blurdataurl, byline, dataurl, date, description, duration, keywords, source, tag, title, views, visits }: TArticleProps) => (
              <Article
                key={source}
                blurdataurl={blurdataurl}
                byline={byline}
                date={date * 1}
                dataurl={dataurl}
                description={description}
                duration={duration}
                keywords={keywords}
                source={source}
                tag={tag}
                title={title}
                views={parseInt(`${views}`)}
                visits={parseInt(`${visits}`)}
              />
            )
          )
        )}
      </main>
      <Footer />
      <Insights />
    </>
  );
}
