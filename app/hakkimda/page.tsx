'use client';

import { useState, useEffect } from 'react';
import Footer from '../../components/Footer';
import { PersonStructuredData } from '../../components/StructuredData';

export const dynamic = 'force-dynamic';

export default function AboutPage() {
  const [stats, setStats] = useState({
    totalBooks: 5,
    totalReaders: 350000,
    totalComments: 25000,
    yearsExperience: 8
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Gerçek verileri API'den çek
      const [booksRes, commentsRes] = await Promise.all([
        fetch('/api/books'),
        fetch('/api/comments?limit=1')
      ]);

      let totalBooks = 5; // Varsayılan
      let totalComments = 25000; // Varsayılan
      let totalReaders = 350000; // Varsayılan (likes + views estimate)

      if (booksRes.ok) {
        const booksData = await booksRes.json();
        if (booksData.success) {
          totalBooks = booksData.total || booksData.data?.length || 5;
        }
      }

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        if (commentsData.success && commentsData.total) {
          totalComments = commentsData.total;
        }
      }

      // Likes API'si parametre gerektiriyor, şimdilik varsayılan değer kullan

      // Yıllık deneyim hesapla (2017'den bu yana)
      const startYear = 2017;
      const currentYear = new Date().getFullYear();
      const yearsExperience = currentYear - startYear;

      setStats({
        totalBooks,
        totalReaders,
        totalComments,
        yearsExperience
      });
    } catch (error) {
      console.error('Stats load error:', error);
      // Hata durumunda varsayılan değerler kullanılacak
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
    return num.toString();
  };

  return (
    <>
      <PersonStructuredData
        name="Tolga Demir"
        description="1986 İzmir doğumlu Türk yazar, tiyatro yönetmeni ve senarist. Bursa Uludağ Üniversitesi Dramatik Yazarlık mezunu. Bonzirik Edebiyat Sanat Dergisi kurucusu. Star TV'de Beni Affet dizisinde senarist olarak çalıştı. Drama eğitmeni ve tiyatro yönetmeni."
        image="/profile-image.jpg"
        sameAs={[
          'https://tolgademir.org',
          'https://www.instagram.com/tolgademir1914',
        ]}
      />
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
        <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white mb-4">Hakkımda</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Hikayelerin büyülü dünyasında geçen yazarlık yolculuğum
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 mb-20">
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Merhaba, Ben Tolga</h2>
                <div className="space-y-6">
                  <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 font-light">
                    Tolga Demir Türkiye İzmir'de 14.07.1986 tarihinde doğdu. İlköğretim eğitimini ve lise öğrenimini İzmir'de tamamladı. Tiyatro ile tanışması lise tiyatrosuyla Ümit Denizer'in Ferhat ile Şirin isimli oyun metnindeki Behzad rolüyle oldu. 2004 ile 2009 yılları arasında İzmir İda Sanat Atölyesi Nde ilk Tiyatro eğitimine başladı. Yine aynı kurumda süreçte çocuk animasyon sorumlusu olarak; clown ve (İzmir Güzelyalı Küçük Kulüp Anaokulu Drama eğitmeni 2007-2009) drama eğitmenliği çalışmalarında bulundu. Yine aynı süreçte Aysa Prodüksiyon Tiyatrosunun İzmir Şubesinde çeşitli görev ve sorumluluklar aldı.
                  </p>
                  <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 font-light">
                    2009 yılında Bursa Uludağ Üniversitesi Güzel Sanatlar Fakültesi Sahne Sanatları Bölümü Dramatik Yazarlık Anasanat Dalı Nı kazanarak; lisans eğitimine başladı. Bursa'da lisans eğitimine devam ederken çeşitli kurum ve kuruluşlarda drama eğitmenlikleri yaptı: "Bursa Özel Ayçı Çocuk Evi Drama Eğitmeni 2009-2011; Özel Mavi Dünya Koleji Drama Eğitmeni 2010-2011, Bursa Özel Saygınkent Anaokulu Drama Eğitmeni 2010-2012, Bursa Uludağ Kültür Merkezi Drama Eğitmenliği 2009-2011"
                  </p>
                  <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300 font-light">
                    Lisans eğitimine devam ettiği süreçte Bonzirik Edebiyat Sanat Güncel Konulu E Dergi De 30 sayı boyunca Kurucu, Yönetici, Editör pozisyonlarında görev alarak derginin çıkmasında etkin rol aldı. 2013 yılında Bursa Uludağ Üniversitesi Güzel Sanatlar Fakültesi Sahne Sanatları Bölümü Dramatik Yazarlık Anasanat Dalında mezun oldu. Yine aynı yıl Star Tv De yayınlanmakta olan Beni Affet isimli günlük dizide senarist (396-568) olarak çalıştı. 2015 yılı Kültür Bakanlığı Edebi Eserleri Destekleme Kurulu tarafından Lunapark Saati isimli eseriyle desteğe layık bulundu. Yazarın; 2017-2018 Tiyatro Sezonunda İzmir Baykuş Çocuk Tiyatrosu, Tiyatro Kalemi Oyuncuları tarafından Sekiz Renk Ormanında Masallar isimli Tiyatro Oyunu, Gökkuşağı Ormanı ismiyle uyarlanarak oynandı. 2017-2018 sezonunda Sevim Burak'ın İşte Baş, İşte Gövde, İşte Kanatlar metnini yöneterek Tiyatro Kalemi bünyesinde sahnelendi. 2018 yılı Eylül Ayında İstanbul Aydın Üniversitesi Sosyal Bilimler Enstitüsü, Sahne Sanatları, Tiyatro Yönetmenliği Yüksek Lisans Eğitimini tamamladı. 2020 yılında 1Haberver.com isimli Bursa e gazetede Tiyatro Oyunlarının rejilerini inceleyip, eleştiri yazıları kaleme almaya başladı. Serbest yazarlık çalışmalarıyla gelecek süreçte yayımlanmak üzere eser hazırlıklarına devam etmektedir.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <img
                src="/profile-image.jpg"
                alt="Tolga Demir"
                className="w-full h-96 object-cover object-top rounded-2xl shadow-lg"
              />

              <div className="bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-2xl shadow-xl p-8 border border-orange-200 dark:border-gray-700">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-purple-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                    <i className="ri-book-open-line text-white text-2xl"></i>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800 dark:text-white">Yazarlık Felsefem</h3>
                </div>
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-purple-500">
                    <div className="flex items-start">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                        <i className="ri-brain-line text-white text-2xl"></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-2 text-xl flex items-center">
                          ONTOLOJİ
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                          Felsefe Deyince esasında bir dalın Ontolojisi akla geliyor. Yani varlık Felsefesi… Aristo'nun dediği, <span className="italic font-semibold text-purple-600 dark:text-purple-400">Düşünüyorum öyleyse varım</span>… Fikri… Bende <span className="italic font-semibold text-orange-600 dark:text-orange-400">Düşünüp, Yazıyorum, öyleyse varım.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-orange-500">
                    <div className="flex items-start">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-pink-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                        <i className="ri-community-line text-white text-2xl"></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-2 text-xl flex items-center">
                          OKUR ETKİLEŞİMİ
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                          Bana dönüş yapan tüm kitleme, esasında <span className="font-semibold text-orange-600 dark:text-orange-400">sizinle beraber devam edecek eserlerim</span> diyorum.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-500">
                    <div className="flex items-start">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center mr-4 flex-shrink-0 shadow-md">
                        <i className="ri-trophy-line text-white text-2xl"></i>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-2 text-xl flex items-center">
                          SÜREKLİ GELİŞİM
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                          Gelişim için henüz çapraz okuma yapsam da sıkı bir <span className="font-semibold text-blue-600 dark:text-blue-400">Bilim Teknik</span> okuruyum. Bunun beni geliştirdiğini biliyor ve farkındayım.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">İstatistiklerim</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-xl">
                    <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">{stats.totalBooks}</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Yayınlanan Kitap</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Basılı Romanlar</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{formatNumber(stats.totalReaders)}+</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Toplam Okur</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tüm Platformlar</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                    <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">{formatNumber(stats.totalComments)}+</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Yorum & Etkileşim</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Aktif Topluluk</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">{stats.yearsExperience}</div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Yıllık Deneyim</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">2017'den Beri</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 mb-16">
            <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-12 text-center">Yazarlık Yolculuğum</h3>
            <div className="space-y-8">
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 dark:from-gray-700 dark:to-gray-700 p-8 rounded-xl border-l-4 border-orange-500 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold mr-4 text-xl shadow-lg">1</div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white">BAŞLANGIÇ</h4>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                  Her şey çocuk yaşta yazdığım kompozisyonlarla başladı… <span className="font-semibold text-orange-600 dark:text-orange-400">Sözlerle başladı.</span>
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-700 p-8 rounded-xl border-l-4 border-blue-500 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-full flex items-center justify-center font-bold mr-4 text-xl shadow-lg">2</div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white">KEŞİF VE DENEYİM</h4>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                  İlk iş, olarak Lise Tiyatrosundan sonra; yazdıklarımı oynama ve oynatma fikriyle başladı. 2008 yılında ise artık sadece <span className="font-semibold text-blue-600 dark:text-blue-400">yazarlık fikrindeydim.</span> Anladığım kadarıyla başarılı oldum.
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-700 p-8 rounded-xl border-l-4 border-purple-500 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold mr-4 text-xl shadow-lg">3</div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white">OLGUNLUK</h4>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                  Yüksek Lisans biraz zorlu geçse de benim için <span className="font-semibold text-purple-600 dark:text-purple-400">olgunluk dönemim oldu.</span>
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-700 p-8 rounded-xl border-l-4 border-green-500 shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center font-bold mr-4 text-xl shadow-lg">4</div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 dark:text-white">BUGÜN VE GELECEK</h4>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                  Bugünü hiçbir zaman net yaşamadım. Ne yapabilirim ki öyleyim. Ama gel gör ki şimdiye; dair; söyleyeceklerim <span className="italic font-semibold text-green-600 dark:text-green-400">tadını çıkardığım anlardır.</span> Gelecek ise, <span className="font-semibold text-green-600 dark:text-green-400">hep planlanmalı…</span> İşte böyle… <span className="italic text-gray-600 dark:text-gray-400">Bir hayat felsefesinden yazdıklarımda, kalemime damladı.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

        <Footer />
      </div>
    </>
  );
}