import { Metadata } from 'next';
import Link from 'next/link';
import SEOStructuredData from '../../components/SEOStructuredData';

export const metadata: Metadata = {
  title: 'Tolga Demir Blog - Yazarlık Deneyimleri ve Edebiyat',
  description: 'Yazar Tolga Demir\'nın kişisel blog sayfası. Yazarlık deneyimleri, edebiyat üzerine düşünceler ve yazım süreci hakkında yazılar.',
  keywords: ['Tolga Demir blog', 'yazarlık deneyimleri', 'edebiyat yazıları', 'yazım süreci', 'Türk edebiyatı blog'],
  openGraph: {
    title: 'Tolga Demir Blog - Yazarlık ve Edebiyat',
    description: 'Yazarlık deneyimleri ve edebiyat üzerine kişisel yazılar',
    type: 'website',
  },
};

const blogPosts = [
  {
    id: 1,
    title: 'Yazarlık Yolculuğumda İlk Adımlar',
    excerpt: 'Küçük bir ilçede başlayan yazarlık serüvenimin ilk günlerini ve ilham kaynaklarımı paylaşıyorum.',
    date: '2025-01-10',
    slug: 'yazarlik-yolculugumda-ilk-adimlar',
    readTime: '5 dk'
  },
  {
    id: 2,
    title: 'Çağdaş Türk Edebiyatında Kadın Yazarlar',
    excerpt: 'Türk edebiyatında kadın yazarların önemini ve günümüzdeki yerini değerlendiriyorum.',
    date: '2025-01-05',
    slug: 'cagdas-turk-edebiyatinda-kadin-yazarlar',
    readTime: '7 dk'
  },
  {
    id: 4,
    title: 'Okurla Bağ Kurmak: Sosyal Medya ve Edebiyat',
    excerpt: 'Sosyal medyanın yazarlar ve okurlar arasındaki bağı nasıl güçlendirdiğini inceliyorum.',
    date: '2024-12-20',
    slug: 'okurla-bag-kurmak-sosyal-medya-edebiyat',
    readTime: '4 dk'
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <SEOStructuredData type="article" />
      
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-4">
              Tolga Demir Blog
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Yazarlık deneyimlerim, edebiyat üzerine düşüncelerim ve yazım sürecim hakkında yazılar
            </p>
          </div>

          {/* Blog Posts */}
          <div className="space-y-8">
            {blogPosts.map((post) => (
              <article key={post.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <time className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(post.date).toLocaleDateString('tr-TR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                  <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                    {post.readTime} okuma
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                  {post.title}
                </h2>
                
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {post.excerpt}
                </p>
                
                <Link 
                  href={`/blog/${post.slug}`}
                  className="inline-flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium transition-colors"
                >
                  Devamını Oku
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </article>
            ))}
          </div>

          {/* Newsletter CTA */}
          <div className="mt-16 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-8 text-center text-white">
            <h3 className="text-2xl font-bold mb-4">Blog Yazılarımı Kaçırmayın!</h3>
            <p className="mb-6 opacity-90">
              Yeni blog yazılarım ve yazarlık deneyimlerimden ilk siz haberdar olmak için haber bültenime abone olun.
            </p>
            <Link 
              href="/"
              className="inline-block bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Abone Ol
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
