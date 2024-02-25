/**
 * Asynchronous function to fetch articles from the server.
 * 
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of 
 * article objects fetched from the server.
 */
export async function getArticles() {
  try {
    const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://www.getdevnews.com';
    const response = await fetch(`${baseUrl}/api/read/articles`, {
      cache: 'no-store', 
    }).then((res) => res.json());
    if (!response || !response.result || !Array.isArray(response.result.rows)) return [];
    return response.result.rows;
  } catch (error) {
    console.error(`getArticles encountered error`, error);
    return [];
  }
};

/**
 * Asynchronous function to update articles whenever a user visits them. User
 * visits should only count once per user per day.
 * 
 * @returns {void};
 */
export async function updateVisits(source: string) {
  try {
    window.open(source, '_blank');
    const record = localStorage.getItem(source);
    if (!record) {
      localStorage.setItem(source, '1');
      const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://www.getdevnews.com';
      await fetch(`${baseUrl}/api/update/articles/visits?source=${source}`, { cache: 'no-store', });
    }
  } catch (error) {
    console.error(`handleClick encountered error`, error);
  }
}

/**
 * Asynchronous function to update articles whenever a user vies them. User
 * views should .
 * 
 * @returns {void};
 */
export async function updateViews(source: string) {
  try {
    const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://www.getdevnews.com';
    await fetch(`${baseUrl}/api/update/articles/views?source=${source}`, { cache: 'no-store', });
  } catch (error) {
    console.error(`handleClick encountered error`, error);
  }
}
