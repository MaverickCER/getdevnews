import Link from 'next/link';

/**
 * React component representing the main header on the page. It utilizes some fun
 * css properties to only show getDevNews() as the title while including more
 * information that will help improve search engine optimization. This website
 * will not have a lot of original content so we need to ensure that the little
 * content we do have is as optimized as possible.
 *
 * @returns {JSX.Element} The JSX element representing the header.
 */
export default function Header() {
  return (
    <header className='flex max-w flex-row flex-wrap items-center justify-center p-4 gap-4 m-auto'>
      <Link href='/' className='text-center'>
        <h1 className='text-center fs-24 text-2xl font-bold tracking-wider'>
          getDevNews&#40;&#41; is a news aggregation platform for developers that helps you stay up
          to date with any and all news that could impact web, game, or xr development.
        </h1>
      </Link>
    </header>
  );
}
