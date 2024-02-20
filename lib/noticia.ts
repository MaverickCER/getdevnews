import { Noticia_Text } from 'next/font/google';

// https://vercel.com/blog/nextjs-next-font
const noticia = Noticia_Text({
  preload: true,
  style: ['normal', 'italic'],
  subsets: ['latin'],
  weight: ['400', '700'],
});

export default noticia.className;
