
import BookDetail from './BookDetail';
import { createBookSlug } from '@/lib/utils';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

// Static generation devre dışı (XAMPP uyumluluğu için)
// export async function generateStaticParams() {
//   return [];
// }

// Canonical URL için metadata
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tolgademir.org';
  
  return {
    alternates: {
      canonical: `${baseUrl}/kitaplar/${id}`,
    }
  };
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookDetail bookId={id} />;
}
