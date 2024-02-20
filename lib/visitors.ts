/**
 * Asynchronous function to retrieve the number of visitors from the server.
 * This function sends a request to the server to fetch visitor data.
 * 
 * @returns {Promise<number>} A promise that resolves to the number of visitors
 * retrieved from the server. If an error occurs during the process, it returns
 * 0 and logs the error.
 */
export async function getVisitors() {
  try {
    const baseUrl = process.env.VERCEL_ENV === 'development' ? 'http://localhost:3000' : 'https://www.getdevnews.com';
    const response = await fetch(`${baseUrl}/api/read/visitors`).then((res) => { try { return res.json() } catch { return res }});
    return response.visitors;
  } catch (error) {
    console.error(`getVisitors encountered error`, error);
    return 0;
  }
}

/**
 * Asynchronous function to update visitor information.
 * This function checks the last visit time stored in the local storage.
 * If the last visit time is not available or it's been more than 24 hours since
 * the last visit, it sends a request to the server to update visitor information.
 * 
 * This information can be used to assist with advertising later on.
 * 
 * @returns {Promise<void>} A promise that resolves after updating visitor
 * information. If an error occurs during the process, it logs the error but
 * does not affect the function's behavior.
 */
export async function updateVisitors() {
  try {
    const lastVisit = parseInt(localStorage.getItem('lastVisit') || '0');
    const now = Date.now();
    if (!lastVisit || lastVisit > now - 24 * 60 * 1000) {
      localStorage.setItem('lastVisit', `${now}`);
      const baseUrl = process.env.VERCEL_ENV === 'development' ? 'http://localhost:3000' : 'https://www.getdevnews.com';
      const response = await fetch(`${baseUrl}/api/update/visitors`);
      console.error(response);
    }
  } catch (error) {
    console.error(`updateVisitors encountered error`, error);
  }
}
