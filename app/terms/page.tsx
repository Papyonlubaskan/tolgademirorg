
'use client';

import Footer from '../../components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-8">Kullanım Koşulları</h1>
            
            <div className="space-y-8 text-gray-600 dark:text-gray-300">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">1. Kabul ve Onay</h2>
                <p>
                  Bu web sitesini kullanarak, aşağıda belirtilen kullanım koşullarını kabul etmiş sayılırsınız. 
                  Bu koşulları kabul etmiyorsanız, lütfen siteyi kullanmayınız.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">2. Site İçeriği ve Telif Hakları</h2>
                <div className="space-y-4">
                  <p>
                    Bu web sitesinde yer alan tüm içerikler (yazılar, hikayeler, görseller, tasarım) 
                    Tolga Demir'ya aittir ve telif hakları ile korunmaktadır.
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>İçeriklerin izinsiz kopyalanması, çoğaltılması yasaktır</li>
                    <li>Ticari amaçlarla kullanım kesinlikle yasaktır</li>
                    <li>Alıntı yapılması durumunda kaynak belirtilmesi zorunludur</li>
                    <li>Hikayelerin tamamının veya bir bölümünün başka yerde yayınlanması yasaktır</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">3. Kullanıcı Sorumlulukları</h2>
                <p>Site kullanıcıları aşağıdaki kurallara uymayı kabul eder:</p>
                <ul className="list-disc list-inside space-y-2 mt-4">
                  <li>Siteyi yasal olmayan amaçlarla kullanmamak</li>
                  <li>Başka kullanıcılara zarar verecek davranışlarda bulunmamak</li>
                  <li>Spam veya rahatsız edici içerik göndermemek</li>
                  <li>Sahte bilgiler vermemek</li>
                  <li>Site güvenliğini tehlikeye atacak faaliyetlerde bulunmamak</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">4. Hizmet Kullanımı</h2>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Hikaye Okuma</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Hikayeler ücretsiz olarak sunulmaktadır</li>
                    <li>Okuma deneyimi kişisel kullanım içindir</li>
                    <li>Hikayelerin paylaşımı sadece site içi özelliklerle yapılabilir</li>
                  </ul>
                  
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-6">Yorum Sistemi</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Yorumlar moderasyona tabidir</li>
                    <li>Uygunsuz yorumlar silinebilir</li>
                    <li>Saygılı ve yapıcı yorumlar beklenmektedir</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">5. Hizmet Kesintileri</h2>
                <p>
                  Site bakım, güncelleme veya teknik sorunlar nedeniyle geçici olarak erişilemeyebilir. 
                  Bu durumlar için önceden bildirim yapılmaya çalışılacak ancak garanti verilmemektedir.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">6. Sorumluluk Reddi</h2>
                <p>
                  Site sahibi, kullanıcıların site kullanımından kaynaklanan herhangi bir zarardan 
                  sorumlu değildir. Site "olduğu gibi" sunulmaktadır.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">7. Bağlantılar</h2>
                <p>
                  Sitemizde üçüncü taraf web sitelerine bağlantılar bulunabilir. Bu sitelerin içeriği 
                  ve gizlilik politikalarından sorumlu değiliz.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">8. Değişiklikler</h2>
                <p>
                  Bu kullanım koşulları önceden haber vermeksizin güncellenebilir. Güncel koşulları 
                  düzenli olarak kontrol etmenizi öneririz.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">9. Uyuşmazlıklar</h2>
                <p>
                  Bu koşullardan kaynaklanan uyuşmazlıklar Türkiye Cumhuriyeti yasalarına tabi olup, 
                  İstanbul mahkemeleri yetkilidir.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">10. İletişim</h2>
                <p>
                  Kullanım koşulları ile ilgili sorularınız için 
                  <a href="/contact" className="text-orange-600 dark:text-orange-400 hover:underline ml-1">iletişim sayfasından</a> 
                  bize ulaşabilirsiniz.
                </p>
              </section>

              <div className="text-sm text-gray-500 dark:text-gray-400 mt-8 pt-8 border-t border-gray-200 dark:border-gray-600">
                Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
