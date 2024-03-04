import type { TArticleProps } from '@/components/article';
import Articles from '@/components/articles';
import Footer from '@/components/footer';
import Header from '@/components/header';
import Insights from '@/components/insights';
import { getArticles } from '@/lib/articles';

export const dynamic = 'force-dynamic'

export default async function Page() {
  const articles: TArticleProps[] = await getArticles(0);

  return (
    <>
      <Header />
      <main className='flex min-h-screen max-w flex-row flex-wrap items-center justify-center p-4 gap-4 m-auto'>
        <Articles initialArticles={articles} />
      </main>
      <Footer />
      <Insights />
    </>
  );
}
