import { MetadataRoute } from 'next'

// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap#generating-a-sitemap-using-code-js-ts
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.getdevnews.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://www.getdevnews.com/policy',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ]
}