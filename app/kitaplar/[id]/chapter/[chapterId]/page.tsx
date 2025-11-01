
import ChapterReader from './ChapterReader';

export const dynamic = 'force-dynamic';

// Static generation devre dışı (XAMPP uyumluluğu için)
// export async function generateStaticParams() {
//   return [];
// }

export default async function ChapterPage({ params }: { params: Promise<{ id: string; chapterId: string }> }) {
  const { id, chapterId } = await params;
  return <ChapterReader bookId={id} chapterId={chapterId} />;
}
