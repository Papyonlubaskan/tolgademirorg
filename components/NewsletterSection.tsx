
'use client';

import { useState } from 'react';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    try {
      setIsSubmitting(true);
      setError('');

      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setIsSubscribed(true);
        setShowMessage(true);
        setEmail('');
        
        // Mesajı 4 saniye sonra gizle
        setTimeout(() => setShowMessage(false), 4000);
      } else {
        setError(result.error || 'Abonelik işlemi başarısız');
      }
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 transition-colors">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            📚 Hiçbir Güncellemeyi Kaçırmayın!
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            Yeni kitaplarım, bölüm güncellemeleri ve özel içeriklerimden 
            ilk siz haberdar olmak için haber bültenime abone olun.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/20 p-8 max-w-md mx-auto">
          {showMessage ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-check-line text-2xl text-green-600 dark:text-green-300"></i>
              </div>
              <h3 className="text-xl font-semibold text-green-700 dark:text-green-300">Başarıyla Abone Oldunuz!</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Artık tüm güncellemelerimizi e-posta adresinizden takip edebilirsiniz.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-mail-line text-2xl text-orange-600 dark:text-orange-300"></i>
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresinizi girin"
                required
                disabled={isSubmitting}
                className="w-full px-6 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-full focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 text-center text-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 disabled:opacity-50"
              />
              
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-orange-600 to-pink-600 dark:from-orange-700 dark:to-pink-700 text-white py-4 rounded-full font-semibold hover:from-orange-700 hover:to-pink-700 dark:hover:from-orange-600 dark:hover:to-pink-600 transition-all duration-300 cursor-pointer text-lg whitespace-nowrap flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <i className="ri-notification-line mr-2"></i>
                    Abone Ol
                  </>
                )}
              </button>
            </form>
          )}
          
          <div className="mt-6 grid grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center justify-center">
              <i className="ri-book-line mr-1"></i>
              <span>Yeni Kitaplar</span>
            </div>
            <div className="flex items-center justify-center">
              <i className="ri-refresh-line mr-1"></i>
              <span>Bölüm Güncellemeleri</span>
            </div>
            <div className="flex items-center justify-center">
              <i className="ri-heart-line mr-1"></i>
              <span>Özel İçerikler</span>
            </div>
          </div>
          
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Spam göndermiyoruz. İstediğiniz zaman abonelikten çıkabilirsiniz.
          </p>
        </div>
      </div>
    </section>
  );
}
