import Footer from '@/components/footer';
import Header from '@/components/header';
import Skeleton from '@/components/skeleton';

// https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
export default async function Loading() {
  return (
    <>
      <Header />
      <main className='flex min-h-screen max-w flex-row flex-wrap items-center justify-center p-4 gap-4 m-auto'>
        <Skeleton count={10} />
      </main>
      <Footer />
    </>
  );
}
