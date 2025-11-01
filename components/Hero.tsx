
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface HeroData {
  hero_background?: string;
  hero_image?: string;
  hero_title?: string;
  hero_subtitle?: string;
  sections?: Array<{
    type: string;
    content: string;
  }>;
}

export default function Hero() {
  const [heroData, setHeroData] = useState<HeroData>({
    hero_background: '/hero-background.jpg',
    hero_image: '/hero-profile.jpg',
    hero_title: 'Tolga Demir',
    hero_subtitle: 'Yazar & Hikaye Anlatıcı',
    sections: []
  });

  useEffect(() => {
    loadHeroData();
  }, []);

  const loadHeroData = async () => {
    try {
      // Ana sayfa verilerini settings'ten yükle
      const response = await fetch('/api/settings?key=page_page_page_home');
      const data = await response.json();
      
      if (data.success && data.data) {
        const pageData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
        setHeroData(prev => ({
          ...prev,
          ...pageData
        }));
      }
    } catch (error) {
      console.error('Hero data load error:', error);
      // Hata durumunda varsayılan değerler kullanılacak
    }
  };

  // İçerik paragrafları
  const contentParagraphs = heroData.sections?.filter(s => s.type === 'paragraph') || [];

  return (
    <div className="relative min-h-screen">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${heroData.hero_background}')`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-transparent dark:from-gray-900/95 dark:via-gray-900/85 dark:to-transparent"></div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
              Merhaba, Ben 
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent block mt-2 italic" style={{fontFamily: 'Times New Roman, serif'}}>
                {heroData.hero_title || 'Tolga Demir'}
              </span>
            </h1>
            
            {heroData.hero_subtitle && (
              <p className="text-2xl text-gray-700 dark:text-gray-200 font-medium">
                {heroData.hero_subtitle}
              </p>
            )}

            {/* Dinamik İçerik */}
            {contentParagraphs.length > 0 ? (
              contentParagraphs.map((para, index) => (
                <p 
                  key={index}
                  className={index === 0 ? "text-xl text-gray-600 dark:text-gray-300 leading-relaxed" : "text-lg text-gray-500 dark:text-gray-400"}
                >
                  {para.content}
                </p>
              ))
            ) : (
              <>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-200 leading-relaxed">
                  Sayın Okuyucuma;
                </p>
                <p className="text-base font-medium text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Yeni bir olaydan bahsetmeliyim. Sen veya siz mi demeliyim okuyucuma… İçin için mutluyken… Çünkü yıllar sonra; hemen sonra, şimdi, Bugün, kolay ve huzurlu bir gündeyim. Huzurlu, sessiz, sakin; olmak ne güzel...
                </p>
                <p className="text-base font-medium text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Hızlı olarak konuya gireyim. İndirimli bir şeyi yakalamış sevinciyle… Garantisi mi? Hala o zor günlerden sonra hayattayım… Öncelikle bilin alışılmadık sese karşı duyarlıyım. En azından bugün bu kanaateyim. İstanbul… Üsküdar'dan Kadıköy'e Taksi Dolmuşla geçerken… Birden çok siren sesi… Metrolpol şehir'e Anadolu'dan gelen biri için alışıldık değil. Başlamak bitirmenin yarısı… O gün Dolmuştan indim. Bir kovalamaca şehirde… Bir köşede Aşk yaşayan gençler, Bir köşede mutlular… Bir köşe para kazanmak isteyenler. Kar, Fırsat, Tasarruf, Sağlık Sonucu bekleyenler… Vapur seslerine geçiyor. Sonuç mu… Bir Kadıköy turu… Kanıtlanmış bir şey ki orası başka bir İstanbul… Sanki vaha… Ama ona rağmen Kadıköy Boğa'nın oradan girdin mi? Ekstra olarak, Mülteciler Üst kat dükkanlarda… Kazandıran, Kazançlı yazıları arasında, Tüyo sırlarını verenlerin olduğu bir At yarışı bayisi… Geç oradan… Yürü boğa boyunca… Duyuru yapan anutçular… İstiklal' Caddesi'ndeki kadar olmasa da bir güruh üzerine üzerine geliyor insanın… Dikkat… Et… Yürürken… Cüzdan kapılmasın… Omuz ata ata yardır. Öğlenin en civcivli saati… Kimse çarpıştığına aldırmıyor. Özel… Bir yer gibi geliyor. Sahile ulaşabilmek. Tiyatrolara gel. Kafeler sokağına bir selam çak. Uyarı… Zihninden sana: O kadar Tiyatrocun Adamsın. El broşürü al bari… gir içeri al broşür. Çık. Çabuk yap. Nefes almak için sahile çıkmalısın. Uyarı havuza dikket et düşme yazısını oku… Acele Acele yürüyen insanların arasından… Yardım istemek için, birisi durduruyor. Sınırlı zamanı var. Sorup teşekkür etmeden gidiyor. Sen ona ne dediğin bilmiyorsun. İlk… Sağ… Girme… Son sokağı geç… Artık yokuş aşağı… Sadece Denizi görebilmek için… Kısa Süreli… Bitiyor yazan milyonculardan aşağıya… Yürü… Katıl katıla gülenler… Sokakta bağış toplayanlar dergiye üye yapmaya çalışıyor. Onlar gibi olsan da bir zamanlar aldırma… Üyelere Özel demelerine aldırma… Geç gitsin… Davetlerini geri çevirip, yürü… Ve iskele göründü… Artık daha az kalabalık… Evleri geç… Satılık evleri geç… Almaya gücün yok. Biraz nefes almaya geldin. Zula'dan termosu çıkar. Karşınızda Deniz… otur duvara kalça üstü…. İzle Denizi… Bir temiz nefes… Keşfet yatları; benimde olur mu diyerek iç çek. Karşılaştır Şans oyunlarından çıksa şunu alırım şunu lama para de… İnanılmaz zorlu biraz zorlu bir sürecin ardından nefes al… İnanılmaz bir huzur… Huzur mu, dediniz. Etkileyici çiftler geçerken, gözün dalmasın… Senin de bir gün gönlüne göresi olur de… Arka fonda Biri radyo açmış. Güneşimi kaybettim çalıyor. Müthiş o koşuşturmaca Yorgunluğuna iyi geliyor. Harika dalıyorsun gözün… Mükemmel/ Şaşırtıcı bir klip çekiyor zihin… Efsane sevgili kızı hatırla… Mucizevi tanışmıştın… Klişeydi her şey... Seni olduğundan farklı düşünmüştü. Sen Tiyatro okumak istiyordu. Onunda kocaman sertifikası vardı. Sertifikalı aşk… Risksizdi başlangıçta… Her şey… Fonda dokunulmazımsın benim… Yüreğime hükmedemem… Güneşimi kaybettim…. Bla Bla… Resmi unvanı yok. Koruması ise, uzak dur demek. Güvenli mi? Bu şehre rağmen nasıl yaptığı belirsiz kaliteli koruma da işte… Benim çiçeğim de içinden… Bisikletler çekiyor. Tıkırdayan boncukları var tellerinde… Öğreneli yıllar olsa da bisiklet kullanmayı yıllar gibi… En uygun aşktı o de iç çek. Eksiksiz ve tam. Ama onunun için öyle miydin? İşte sırf bu yüzden işte… Yaşamadan çok yakın oldukları çalıyor radyoda… Toparlanırken, bak telefona… Sivri burnun, kırkına gelmiş saçların… işte deki kendine kendi… İstanbulsuz, aşksız Yazar… Gözün tekrar geriye aynı yolu yürümeye kesiyor mu? İşte Ben Tolga Demir…
                </p>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/kitaplar" 
                className="bg-orange-600 dark:bg-orange-700 text-white px-8 py-4 rounded-full font-semibold hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors cursor-pointer text-center whitespace-nowrap"
              >
                Kitaplarımı Keşfet
              </Link>
              <Link 
                href="/hakkimda" 
                className="border-2 border-orange-600 dark:border-orange-400 text-orange-600 dark:text-orange-400 px-8 py-4 rounded-full font-semibold hover:bg-orange-50 dark:hover:bg-gray-800 transition-colors cursor-pointer text-center whitespace-nowrap"
              >
                Benim Hikayem
              </Link>
            </div>
          </div>
          
          <div className="flex justify-center lg:justify-end">
            <div className="sticky top-24 self-start">
              <img
                src={heroData.hero_image || '/hero-profile.jpg'}
                alt={heroData.hero_title || 'Tolga Demir'}
                className="w-80 h-96 object-cover rounded-2xl shadow-2xl transition-all duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/hero-profile.jpg';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
