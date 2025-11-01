import BookDetail from './BookDetail';

export async function generateStaticParams() {
  // Statik parametreler - Supabase bağımlılığı kaldırıldı
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
    { id: 'f9dbd2e7-9c48-4057-a50b-bf3e6b43ccd4' },
    { id: '8b2a1c3d-5e6f-7g8h-9i0j-1k2l3m4n5o6p' },
    { id: '4c8f2a9e-7b1d-4e5f-8c9a-2b3e4f5a6b7c' },
    { id: '9bb7872b-e6e8-4eac-a7cc-a2e76fa8148e' },
    { id: '7c4d8f2a-1b5e-4c6f-9a0b-3d2e1f0c5b6a' },
    { id: 'a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p' },
    { id: 'b2c3d4e5-f6g7-8h9i-0j1k-2l3m4n5o6p7q' },
    { id: 'c3d4e5f6-g7h8-9i0j-1k2l-3m4n5o6p7q8r' }
  ];
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return <BookDetail bookId={id} />;
}