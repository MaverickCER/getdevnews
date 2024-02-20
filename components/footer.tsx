import Link from 'next/link';
import Visitors from './visitors';

/**
 * React component representing the main footer on the page. It shows the standard
 * copyright data, a link to the privacy policy, and indicates how many visitors
 * have been on the site. This component is server side rendered except for the
 * number of visitors to provide the most performant experience.
 * 
 * TODO: Create a component underneath the main container that will house the
 * visitors information along with filters and search options to allow users to
 * better filter the results and find news that is more relevant to them.
 * 
 * @returns {JSX.Element} The JSX element representing the footer.
 */
export default async function Footer() {
  return (
    <footer>
      <section className='flex flex-row flex-wrap max-w m-auto p-4 gap-4 justify-around'>
        <a href='https://www.maverickmanasco.dev' target='_blank' className='text-center'>
          &copy; {new Date().getFullYear()} MaverickCER All Rights Reserved
        </a>
        <div className='text-center'>Visits in 2024: <Visitors /></div>
        <Link href='/policy' className='text-center'>
          Privacy Policy
        </Link>
      </section>
    </footer>
  );
}
