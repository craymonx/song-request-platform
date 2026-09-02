import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://cantomooncouver-requests.craymonx.chatgpt.site'),
  title: '歡樂滿歌華 | Cantomooncouver Song Requests',
  description: '現場點唱站 · Send a live song request to Cantomooncouver.',
  icons: { icon: '/cantomooncouver-logo.png' },
  openGraph: {
    title: '歡樂滿歌華 | Cantomooncouver Song Requests',
    description: '現場點唱站 · Send a live song request to Cantomooncouver.',
    url: '/',
    siteName: 'Cantomooncouver',
    locale: 'zh_HK',
    type: 'website',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'Cantomooncouver Live Song Requests' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cantomooncouver Live Song Requests',
    description: '現場點唱站 · Send a live song request.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
