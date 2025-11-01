import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kitaplarım | Tolga Demir',
  description: 'Tolga Demir\'nın tüm kitapları ve hikayeleri. Yeni ve popüler kitapları keşfedin.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://tolgademir.org'}/kitaplar`,
  }
};

export default function BooksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  );
}
