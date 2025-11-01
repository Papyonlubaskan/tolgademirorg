
'use client';

import Footer from '../../components/Footer';

export default function KVKKPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200 mb-8">KVKK Aydınlatma Metni</h1>
            
            <div className="space-y-8 text-gray-600 dark:text-gray-300">
              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">1. Veri Sorumlusu</h2>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <p className="font-medium">Veri Sorumlusu:</p>
                  <p>Tolga Demir (Bireysel)</p>
                  <p>Web sitesi: tolgademir.org</p>
                  <p>E-posta: info@tolgademir.org</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">2. Kişisel Verilerin İşlenme Amaçları</h2>
                <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
                <ul className="list-disc list-inside space-y-2 mt-4">
                  <li><strong>İletişim Yönetimi:</strong> Sorularınızı yanıtlamak ve geri bildirimlerinizi almak</li>
                  <li><strong>Bilgilendirme Hizmetleri:</strong> Haber bülteni ve güncellemeler göndermek</li>
                  <li><strong>İçerik Kişiselleştirme:</strong> Size uygun içerik önerileri sunmak</li>
                  <li><strong>Analitik ve İstatistik:</strong> Site kullanımını analiz etmek ve geliştirmek</li>
                  <li><strong>Hukuki Yükümlülük:</strong> Yasal zorunlulukları yerine getirmek</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">3. İşlenen Kişisel Veri Kategorileri</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Kimlik Bilgileri</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Ad ve soyad</li>
                      <li>• E-posta adresi</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">İletişim Bilgileri</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Mesaj içeriği</li>
                      <li>• Konu başlığı</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Teknik Bilgiler</h3>
                    <ul className="text-sm space-y-1">
                      <li>• IP adresi</li>
                      <li>• Çerez verileri</li>
                      <li>• Tarayıcı bilgileri</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Kullanım Bilgileri</h3>
                    <ul className="text-sm space-y-1">
                      <li>• Sayfa ziyaretleri</li>
                      <li>• Okuma tercihleri</li>
                      <li>• Etkileşim verileri</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">4. Verilerin Toplanma Yöntemi</h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>Web sitesi iletişim formları aracılığıyla</li>
                  <li>Haber bülteni abonelik formu ile</li>
                  <li>Çerezler ve benzer teknolojiler ile otomatik toplama</li>
                  <li>Site kullanım analitikleri aracılığıyla</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">5. Hukuki Sebep</h2>
                <p>Kişisel verileriniz aşağıdaki hukuki sebeplerle işlenmektedir:</p>
                <ul className="list-disc list-inside space-y-2 mt-4">
                  <li><strong>Açık Rıza:</strong> Haber bülteni aboneliği için</li>
                  <li><strong>Meşru Menfaat:</strong> Site analitikleri ve güvenlik için</li>
                  <li><strong>Sözleşmenin İfası:</strong> Hizmet sunumu için</li>
                  <li><strong>Hukuki Yükümlülük:</strong> Yasal gereklilikler için</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">6. Veri Paylaşımı</h2>
                <p>Kişisel verileriniz aşağıdaki durumlar dışında üçüncü taraflarla paylaşılmaz:</p>
                <ul className="list-disc list-inside space-y-2 mt-4">
                  <li>Yasal zorunluluklar (mahkeme kararı, resmi talep)</li>
                  <li>Hizmet sağlayıcılar (hosting, analytics)</li>
                  <li>Güvenlik ve dolandırıcılık önleme</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">7. Veri Saklama Süreleri</h2>
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                  <ul className="space-y-2">
                    <li><strong>İletişim Mesajları:</strong> 3 yıl</li>
                    <li><strong>Haber Bülteni Abonelikleri:</strong> Abonelik sonlanana kadar</li>
                    <li><strong>Analitik Veriler:</strong> 2 yıl</li>
                    <li><strong>Çerez Verileri:</strong> Çerez politikasına göre</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">8. Kişisel Veri Sahibinin Hakları</h2>
                <p>KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:</p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <ul className="list-disc list-inside space-y-2">
                    <li>Verilerinizin işlenip işlenmediğini öğrenme</li>
                    <li>İşlenen veriler hakkında bilgi talep etme</li>
                    <li>İşleme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                    <li>Yurt içinde/dışında aktarıldığı tarafları bilme</li>
                  </ul>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
                    <li>Koşulları varsa verilerin silinmesini/yok edilmesini isteme</li>
                    <li>Yapılan işlemlerin üçüncü taraflara bildirilmesini isteme</li>
                    <li>Otomatik sistemle analiz edilmesine itiraz etme</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">9. Başvuru Yöntemleri</h2>
                <p>Haklarınızı kullanmak için aşağıdaki yöntemlerle başvurabilirsiniz:</p>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
                  <ul className="space-y-2">
                    <li><strong>E-posta:</strong> kvkk@tolgademir.org</li>
                    <li><strong>İletişim Formu:</strong> Web sitesi iletişim sayfası</li>
                    <li><strong>Başvuru Süreci:</strong> 30 gün içinde yanıtlanır</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">10. Güvenlik Önlemleri</h2>
                <p>
                  Kişisel verilerinizin güvenliği için uygun teknik ve idari tedbirler alınmaktadır:
                </p>
                <ul className="list-disc list-inside space-y-2 mt-4">
                  <li>SSL şifreleme teknolojisi</li>
                  <li>Güvenli sunucu altyapısı</li>
                  <li>Düzenli güvenlik güncellemeleri</li>
                  <li>Erişim yetkilendirmesi</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">11. İletişim Bilgileri</h2>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <p><strong>Veri Sorumlusu:</strong> Tolga Demir</p>
                  <p><strong>KVKK İletişim:</strong> kvkk@tolgademir.org</p>
                  <p><strong>Genel İletişim:</strong> 
                    <a href="/contact" className="text-orange-600 dark:text-orange-400 hover:underline ml-1">İletişim Sayfası</a>
                  </p>
                </div>
              </section>

              <div className="text-sm text-gray-500 dark:text-gray-400 mt-8 pt-8 border-t border-gray-200 dark:border-gray-600">
                <p>Bu aydınlatma metni 6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca hazırlanmıştır.</p>
                <p>Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
