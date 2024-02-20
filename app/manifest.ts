import { MetadataRoute } from 'next'

// https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'getDevNews',
    short_name: 'getDevNews',
    description: 'getDevNews',
    start_url: '/',
    display: 'standalone',
    background_color: '#23272E',
    theme_color: '#23272E',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}