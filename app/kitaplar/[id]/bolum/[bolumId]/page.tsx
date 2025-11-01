import BolumReader from './BolumReader';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
    bolumId: string;
  }>;
}

// Static generation devre dışı (XAMPP uyumluluğu için)
// export async function generateStaticParams() {
//   return [];
// }

// Canonical URL için metadata
export async function generateMetadata({ params }: { params: Promise<{ id: string; bolumId: string }> }): Promise<Metadata> {
  const { id, bolumId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tolgademir.org';
  
  return {
    alternates: {
      canonical: `${baseUrl}/kitaplar/${id}/bolum/${bolumId}`,
    }
  };
}

export default async function Page({ params }: PageProps) {
  const { id, bolumId } = await params;
  
  return <BolumReader bookId={id} bolumId={bolumId} />;
}
