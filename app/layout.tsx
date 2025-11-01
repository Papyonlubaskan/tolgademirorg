
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
    default: 'Tolga Demir - Türk Edebiyatı Yazarı | Kitaplar, Romanlar, Hikayeler',
    template: '%s | Tolga Demir - Yazar'
  },
  description: 'Tolga Demir, çağdaş Türk edebiyatının önemli yazarlarından biri. Yazarın resmi web sitesi. Kitaplarını ücretsiz okuyun, yazarlık yolculuğunu keşfedin.',
  keywords: ['Tolga Demir', 'Tolga Demir yazar', 'Tolga Demir kimdir', 'Tolga Demir kitapları', 'Tolga Demir eserleri', 'Tolga Demir biyografi', 'Türk yazar Tolga Demir', 'çağdaş Türk edebiyatı', 'Türk romanları', 'fantastik roman yazarı', 'Türk edebiyatı yazarı', 'roman oku', 'hikaye oku', 'online kitap okuma', 'ücretsiz kitap', 'Türkçe edebiyat', 'kitap yazar', 'çağdaş edebiyat', 'Türk hikaye yazarı', 'yazarlık', 'edebiyat yazarı'],
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
    title: 'Tolga Demir - Türk Edebiyatı Yazarı | Romanlar ve Hikayeler',
    description: 'Yazar Tolga Demir\'nın resmi web sitesi. Çağdaş Türk edebiyatının eserlerini ücretsiz online okuyun.',
    siteName: 'Tolga Demir - Yazar',
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
    title: 'Tolga Demir - Türk Edebiyatı Yazarı',
    description: 'Yazar Tolga Demir\'nın resmi web sitesi. Çağdaş Türk edebiyatının eserlerini ücretsiz okuyun.',
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

