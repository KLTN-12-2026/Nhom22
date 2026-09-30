import { Inter, Be_Vietnam_Pro } from 'next/font/google';
import '@/styles/globals.css';
import '@/styles/ui.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const beVietnam = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-be-vietnam',
});

export const metadata = {
  title: { default: 'VocabFlow', template: '%s — VocabFlow' },
  description: 'Học từ vựng tiếng Anh thông minh với hệ thống SRS và AI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" className={`${inter.variable} ${beVietnam.variable}`}>
      <body>
        <a href="#main-content" className="skip-link">Chuyển đến nội dung chính</a>
        <Providers>
          <main id="main-content">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
