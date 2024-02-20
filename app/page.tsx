import Article from '@/components/article';
import Footer from '@/components/footer';
import Header from '@/components/header';
import Insights from '@/components/insights';
import Skeleton from '@/components/skeleton';
import { getArticles } from '@/lib/articles';

type TArticle = {
  blurdataurl: string;
  byline: string;
  dataurl: string;
  date: number;
  description: string;
  source: string;
  tag: string;
  title: string;
};

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
            ({ blurdataurl, byline, dataurl, date, description, source, tag, title }: TArticle) => (
              <Article
                key={source}
                blurDataURL={blurdataurl}
                byline={byline}
                date={date * 1}
                dataURL={dataurl}
                description={description}
                source={source}
                tag={tag}
                title={title}
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
