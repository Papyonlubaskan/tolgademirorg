
import Hero from '../components/Hero';
import FeaturedBooks from '../components/FeaturedBooks';
import NewsletterSection from '../components/NewsletterSection';
import Footer from '../components/Footer';
import SEOStructuredData from '../components/SEOStructuredData';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tolga Demir - Türk Edebiyatı Yazarı | Romanlar, Hikayeler, Kitaplar Online Oku',
  description: 'Tolga Demir - Çağdaş Türk edebiyatının önde gelen yazarlarından. Yazar Tolga Demir\'in tüm kitaplarını, romanlarını ve hikayelerini ücretsiz online okuyun. Edebiyat ve hikaye severler için resmi web sitesi.',
  keywords: ['Tolga Demir', 'Tolga Demir kimdir', 'yazar Tolga Demir', 'Tolga Demir kitapları', 'Tolga Demir eserleri', 'Tolga Demir biyografi', 'Tolga Demir romanları', 'Tolga Demir hikayeleri', 'Türk yazar Tolga Demir', 'Türk edebiyatı yazarı', 'çağdaş Türk edebiyatı', 'Türk romanları', 'Türkçe roman', 'Türkçe hikaye', 'online kitap oku', 'ücretsiz kitap oku', 'roman oku', 'hikaye oku', 'edebiyat', 'yazar', 'kitap', 'edebiyatçı', 'Türk edebiyatı', 'çağdaş edebiyat', 'fantastik roman', 'Türk yazarlar', 'ünlü Türk yazarlar', 'Tolga Demir resmi web sitesi'],
  authors: [{ name: 'Tolga Demir' }],
  creator: 'Tolga Demir',
  publisher: 'Tolga Demir',
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://tolgademir.org',
  },
  openGraph: {
    title: 'Tolga Demir - Türk Edebiyatı Yazarı | Romanlar, Hikayeler Online Oku',
    description: 'Tolga Demir - Çağdaş Türk edebiyatının önde gelen yazarı. Tüm kitaplarını, romanlarını ve hikayelerini ücretsiz online okuyun. Resmi web sitesi.',
    url: 'https://tolgademir.org',
    siteName: 'Tolga Demir - Türk Edebiyatı Yazarı',
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
    title: 'Tolga Demir - Türk Edebiyatı Yazarı | Romanlar ve Hikayeler',
    description: 'Tolga Demir - Çağdaş Türk edebiyatının önde gelen yazarı. Tüm kitaplarını, romanlarını ve hikayelerini ücretsiz online okuyun.',
    creator: '@tolgademir1914',
    site: '@tolgademir1914',
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
