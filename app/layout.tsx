
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";
import Header from '../components/Header';
import MaintenanceChecker from '../components/MaintenanceChecker';
import GoogleAnalytics from '../components/GoogleAnalytics';
import CookieConsent from '../components/CookieConsent';
import { ToastProvider } from '../components/Toast';
import { WebsiteStructuredData } from '../components/StructuredData';
import ConsoleDisabler from '../components/ConsoleDisabler';
import SimpleSecurity from '../components/SimpleSecurity';
import SEOStructuredData from '../components/SEOStructuredData';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pacifico',
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'Tolga Demir - Türk Edebiyatı Yazarı | Romanlar, Hikayeler, Kitaplar Online Oku',
    template: '%s | Tolga Demir - Türk Edebiyatı Yazarı'
  },
  description: 'Tolga Demir - Çağdaş Türk edebiyatının önde gelen yazarı. Yazar Tolga Demir\'in tüm kitaplarını, romanlarını ve hikayelerini ücretsiz online okuyun. Edebiyat ve hikaye severler için resmi web sitesi.',
  keywords: ['Tolga Demir', 'Tolga Demir kimdir', 'yazar Tolga Demir', 'Tolga Demir kitapları', 'Tolga Demir eserleri', 'Tolga Demir biyografi', 'Tolga Demir romanları', 'Tolga Demir hikayeleri', 'Türk yazar Tolga Demir', 'Türk edebiyatı yazarı', 'çağdaş Türk edebiyatı', 'Türk romanları', 'Türkçe roman', 'Türkçe hikaye', 'online kitap oku', 'ücretsiz kitap oku', 'roman oku', 'hikaye oku', 'edebiyat', 'yazar', 'kitap', 'edebiyatçı', 'Türk edebiyatı', 'çağdaş edebiyat', 'fantastik roman', 'Türk yazarlar', 'ünlü Türk yazarlar', 'Tolga Demir resmi web sitesi', 'online edebiyat', 'dijital kitap'],
  authors: [{ name: 'Tolga Demir', url: 'https://tolgademir.org' }],
  creator: 'Tolga Demir',
  publisher: 'Tolga Demir',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://tolgademir.org'),
  alternates: {
    canonical: 'https://tolgademir.org',
  },
  openGraph: {
    type: 'profile',
    locale: 'tr_TR',
    url: 'https://tolgademir.org',
    title: 'Tolga Demir - Türk Edebiyatı Yazarı | Romanlar, Hikayeler Online Oku',
    description: 'Tolga Demir - Çağdaş Türk edebiyatının önde gelen yazarı. Tüm kitaplarını, romanlarını ve hikayelerini ücretsiz online okuyun. Resmi web sitesi.',
    siteName: 'Tolga Demir - Türk Edebiyatı Yazarı',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Tolga Demir - Yazar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tolga Demir - Türk Edebiyatı Yazarı | Romanlar ve Hikayeler',
    description: 'Tolga Demir - Çağdaş Türk edebiyatının önde gelen yazarı. Tüm kitaplarını, romanlarını ve hikayelerini ücretsiz online okuyun.',
    creator: '@tolgademir1914',
    site: '@tolgademir1914',
    images: ['/images/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
      noimageindex: false,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' }
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
  other: {
    'revisit-after': '7 days',
    'distribution': 'global',
    'rating': 'general',
    'referrer': 'origin-when-cross-origin',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning={true}>
      <head>
        <link href="https://cdn.jsdelivr.net/npm/remixicon@4.0.0/fonts/remixicon.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" rel="stylesheet" />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_title: document.title,
                    page_location: window.location.href
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300`}
      >
        {/* <ConsoleDisabler /> */}
        {/* <SimpleSecurity /> */}
        <SEOStructuredData type="homepage" />
        <WebsiteStructuredData searchUrl="https://tolgademir.org/kitaplar?q={search_term_string}" />
        <ToastProvider>
          <MaintenanceChecker>
            <Header />
            {children}
            <CookieConsent />
          </MaintenanceChecker>
        </ToastProvider>
      </body>
    </html>
  );
}

