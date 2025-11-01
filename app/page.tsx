
import Hero from '../components/Hero';
import FeaturedBooks from '../components/FeaturedBooks';
import NewsletterSection from '../components/NewsletterSection';
import Footer from '../components/Footer';
import SEOStructuredData from '../components/SEOStructuredData';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tolga Demir - Türk Edebiyatı Yazarı | Kitaplar, Romanlar ve Hikayeler',
  description: 'Yazar Tolga Demir\'nın resmi web sitesi. Çağdaş Türk edebiyatının önemli eserlerini keşfedin. Hikayeler, romanlar ve yeni çıkan kitaplar için takip edin. Online ücretsiz okuma imkanı.',
  keywords: ['Tolga Demir', 'Tolga Demir yazar', 'Türk yazar', 'çağdaş edebiyat', 'Türk edebiyatı', 'roman', 'hikaye', 'kitap oku', 'online kitap okuma', 'ücretsiz kitap', 'Türkçe roman', 'edebiyat', 'yazar Tolga Demir kitapları', 'Tolga Demir eserleri'],
  authors: [{ name: 'Tolga Demir' }],
  creator: 'Tolga Demir',
  publisher: 'Tolga Demir',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://tolgademir.org',
  },
  openGraph: {
    title: 'Tolga Demir - Türk Edebiyatı Yazarı | Kitaplar ve Romanlar',
    description: 'Yazar Tolga Demir\'nın resmi web sitesi. Çağdaş Türk edebiyatının önemli eserlerini keşfedin. Online ücretsiz okuma imkanı.',
    url: 'https://tolgademir.org',
    siteName: 'Tolga Demir - Yazar',
    locale: 'tr_TR',
    type: 'profile',
    images: [
      {
        url: 'https://readdy.ai/api/search-image?query=Author%20Tolga%20Demir%20book%20cover&width=1200&height=630&seq=og-image&orientation=landscape',
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
    images: ['https://readdy.ai/api/search-image?query=Author%20Tolga%20Demir%20book%20cover&width=1200&height=630&seq=twitter-image&orientation=landscape'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen">
      <SEOStructuredData type="homepage" />
      <Hero />
      <FeaturedBooks />
      <NewsletterSection />
      <Footer />
    </div>
  );
}
