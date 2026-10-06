import '@/styles/mockup-tokens.css';
import '@/styles/mockup-base.css';
import '@/styles/mockup-components.css';
import '@/styles/compat.css';
import { Providers } from './providers';

export const metadata = {
  title: { default: 'VocabLearning', template: '%s — VocabLearning' },
  description: 'Học từ vựng tiếng Anh thông minh với hệ thống SRS',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900;1,62..125,100..900&family=Gentium+Book+Plus:ital,wght@0,400;0,700;1,400&display=swap"
        />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
