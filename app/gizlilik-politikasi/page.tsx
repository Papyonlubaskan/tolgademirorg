
'use client';

import Footer from '../../components/Footer';

export const dynamic = 'force-dynamic';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-8">Gizlilik Politikası</h1>
            
            <div className="space-y-8 text-gray-600 dark:text-gray-300">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">1. Giriş</h2>
                <p>
                  Bu gizlilik politikası, Tolga Demir web sitesi ziyaretçilerinin kişisel verilerinin nasıl toplandığı, 
                  kullanıldığı ve korunduğu hakkında bilgi vermektedir. Web sitemizi kullanarak, bu gizlilik politikasında 
                  açıklanan uygulamaları kabul etmiş olursunuz.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">2. Toplanan Bilgiler</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Kişisel Bilgiler</h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Ad ve soyad</li>
                      <li>E-posta adresi</li>
                      <li>İletişim formu aracılığıyla gönderilen mesajlar</li>
                      <li>Haber bülteni abonelik bilgileri</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Otomatik Toplanan Bilgiler</h3>
                    <ul className="list-disc list-inside space-y-2">
                      <li>IP adresi</li>
                      <li>Tarayıcı türü ve versiyonu</li>
                      <li>Ziyaret edilen sayfalar</li>
                      <li>Site kullanım istatistikleri</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">3. Bilgilerin Kullanımı</h2>
                <p>Toplanan kişisel bilgiler aşağıdaki amaçlarla kullanılmaktadır:</p>
                <ul className="list-disc list-inside space-y-2 mt-4">
                  <li>İletişim taleplerini yanıtlamak</li>
                  <li>Haber bülteni göndermek</li>
                  <li>Web site deneyimini geliştirmek</li>
                  <li>İstatistiksel analiz yapmak</li>
                  <li>Yasal yükümlülükleri yerine getirmek</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">4. Çerezler (Cookies)</h2>
                <p>
                  Web sitemiz, kullanıcı deneyimini geliştirmek için çerezler kullanmaktadır. Çerezler, 
                  tarayıcınız tarafından kaydedilen küçük veri dosyalarıdır. Çerez ayarlarınızı tarayıcınızdan 
                  yönetebilirsiniz.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">5. Veri Güvenliği</h2>
                <p>
                  Kişisel verilerinizin güvenliği bizim için önemlidir. Uygun teknik ve idari güvenlik 
                  önlemlerini alarak verilerinizi yetkisiz erişim, kayıp veya kötüye kullanımdan korumaya 
                  çalışıyoruz.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">6. Haklarınız</h2>
                <p>KVKK ve GDPR kapsamında aşağıdaki haklara sahipsiniz:</p>
                <ul className="list-disc list-inside space-y-2 mt-4">
                  <li>Verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>İşlenen verileriniz hakkında bilgi talep etme</li>
                  <li>Verilerinizin düzeltilmesini isteme</li>
                  <li>Verilerinizin silinmesini isteme</li>
                  <li>Veri işlemeye itiraz etme</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">7. İletişim</h2>
                <p>
                  Gizlilik politikası ile ilgili sorularınız için 
                  <a href="/contact" className="text-orange-600 dark:text-orange-400 hover:underline ml-1">iletişim sayfasından</a> 
                  bize ulaşabilirsiniz.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">8. Değişiklikler</h2>
                <p>
                  Bu gizlilik politikası gerektiğinde güncellenebilir. Önemli değişiklikler durumunda 
                  kullanıcılar bilgilendirilecektir.
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
