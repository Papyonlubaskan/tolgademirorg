'use client';

import Footer from '../../components/Footer';

export const dynamic = 'force-dynamic';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Kullanım Koşulları
          </h1>
          
          <div className="prose prose-lg dark:prose-invert">
            <p>Kullanım koşulları burada yer alacak.</p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}