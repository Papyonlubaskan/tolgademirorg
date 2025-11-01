import ChapterReader from './ChapterReader';

export async function generateStaticParams() {
  // Static generation için basit parametreler
  return [
    { id: '1', chapterId: '1' },
    { id: '2', chapterId: '1' },
    { id: '3', chapterId: '1' },
  ];
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}) {
  const { id, chapterId } = await params;
  
  return <ChapterReader bookId={id} chapterId={chapterId} />;
}