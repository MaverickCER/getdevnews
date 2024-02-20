import Footer from '@/components/footer';
import Header from '@/components/header';

/**
 * React page representing the privacy policy. As we begin to use technologies
 * like cookies or start tracking Personally Identifiable Information we will
 * update this policy to reflect the changes. Unlike other sources, the plan
 * here is to provide all configuration options in a single location so that the
 * user has complete control over their data without the need to contact us.
 *
 * TODO: Add a form for DCMA takedowns that will allow users to request that
 * their content be removed from getDevNews.
 */
export default async function Policy() {
  return (
    <>
      <Header />
      <main className='flex min-h-screen max-w flex-col items-start text-left justify-start p-4 gap-4 m-auto'>
        <h2 className='text-xl'>getDevNews Privacy Policy</h2>
        <p>Last updated: February 20, 2024</p>
        <p>
          GetDevNews (referred to as &quote;us&quote;, &quote;we&quote;, or &quote;our&quote;)
          operates the website located at [URL] (the &quote;Service&quote;).
        </p>
        <p>
          This page informs you of our policies regarding the collection, use, and disclosure of
          personal data when you use our Service and the choices you have associated with that data.
        </p>
        <h3>Information Collection and Use</h3>
        <p>We do not collect any personally identifiable information from users of our Service.</p>
        <h3>Log Data</h3>
        <p>
          We do not use cookies or track users. However, like many site operators, we may collect
          information that your browser sends whenever you visit our Service (&quote;Log
          Data&quote;). This Log Data may include information such as your computer&apos;s Internet
          Protocol (&quote;IP&quote;) address, browser type, browser version, the pages of our
          Service that you visit, the time and date of your visit, the time spent on those pages,
          and other statistics.
        </p>
        <h3>Local Storage</h3>
        <p>
          We use local storage to determine if a user has already visited the page in the last 24
          hours. This information is used solely for the purpose of enhancing the user experience
          and is not used to track or identify individual users.
        </p>
        <h3>Contact Us</h3>
        <p>If you have any questions about this Privacy Policy, please contact us:</p>
        <ul>
          <li>
            Email: <a href='mailto:maverickcer@gmail.com'>maverickcer@gmail.com</a>
          </li>
          <li>Address: 30 N Gould St. Sheridan WY 82801</li>
        </ul>
        <h3>Notice Of Change</h3>
        <p>This policy can be changed at any time for any reason without notice.</p>
      </main>
      <Footer />
    </>
  );
}
