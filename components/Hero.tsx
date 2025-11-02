'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface HeroSection {
  id: string;
  type: string;
  content: string;
  order: number;
}

interface HeroData {
  hero_background: string;
  hero_image: string;
  hero_title: string;
  hero_subtitle: string;
  sections: HeroSection[];
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
    const fetchHeroData = async () => {
      try {
        const response = await fetch('/api/settings/hero');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setHeroData(data.data);
          }
        }
      } catch (error) {
        console.error('Hero data fetch error:', error);
      }
    };

    fetchHeroData();
  }, []);

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
        <div className="grid lg:grid-cols-2 gap-12 items-start">
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
                  Hızlı olarak konuya gireyim. İndirimli bir şeyi yakalamış sevinciyle… Garantisi mi? Hâlâ o zor günlerden sonra hayattayım… Öncelikle bilin alışılmadık sese karşı duyarlıyım. En azından bugün bu kanaatteyim. İstanbul… Üsküdar'dan Kadıköy'e taksi dolmuşla geçerken… Birden çok siren sesi… Metropol şehire Anadolu'dan gelen biri için alışılmamış değil. Başlamak bitirmenin yarısı… O gün dolmuştan indim. Bir kovalamaca şehirde… Bir köşede aşk yaşayan gençler, bir köşede mutlular… Bir köşe para kazanmak isteyenler. Kâr, fırsat, tasarruf, sağlık sonucu bekleyenler… Vapur seslerine geçiyor. Sonuç mu… Bir Kadıköy turu… Kanıtlanmış bir şey ki orası başka bir İstanbul… Sanki vaha… Ama ona rağmen Kadıköy Boğa'nın oradan girdin mi? Ekstra olarak, mülteciler üst kat dükkânlarda… Kazandıran, kazançlı yazıları arasında, tüyo sırlarını verenlerin olduğu bir at yarışı bayisi… Geç oradan… Yürü boğa boyunca… Duyuru yapan anonsçular… İstiklal Caddesi'ndeki kadar olmasa da bir güruh üzerine üzerine geliyor insanın… Dikkat… Et… Yürürken… Cüzdan kapılmasın… Omuz ata ata yarıdır. Öğlenin en cıvıl cıvıl saati… Kimse çarpıştığına aldırmıyor. Özel… Bir yer gibi geliyor. Sahile ulaşabilmek. Tiyatrolara gel. Kafeler sokağına bir selam çak. Uyarı… Zihninden sana: O kadar tiyatrocusun adamsın. El broşürü al bari… gir içeri, al broşür. Çık. Çabuk yap. Nefes almak için sahile çıkmalısın. Uyarı havuza dikkat et düşme yazısını oku… Acele acele yürüyen insanların arasından… Yardım istemek için, birisi durduruyor. Sınırlı zamanı var. Sorup teşekkür etmeden gidiyor. Sen ona ne dediğini bilmiyorsun. İlk… Sağ… Girme… Son sokağı geç… Artık yokuş aşağı… Sadece denizi görebilmek için… Kısa süreli… Bitiyor yazan milyonculardan aşağıya… Yürü… Katıla katıla gülenler… Sokakta bağış toplayanlar dergiye üye yapmaya çalışıyor. Onlar gibi olsan da bir zamanlar aldırma… Üyelere özel demelerine aldırma… Geç gitsin… Davetlerini geri çevirip, yürü… Ve iskele göründü… Artık daha az kalabalık… Evleri geç… Satılık evleri geç… Almaya gücün yok. Biraz nefes almaya geldin. Zulanın içinden termosu çıkar. Karşınızda deniz… otur duvara kalça üstü… İzle denizi… Bir temiz nefes… Keşfet yatları; benim de olur mu diyerek iç çek. Karşılaştır şans oyunlarından çıksa şunu alırım diye para de… İnanılmaz zorlu biraz zorlu bir sürecin ardından nefes al… İnanılmaz bir huzur… Huzur mu, dediniz. Etkileyici çiftler geçerken, gözün dalmasın… Senin de bir gün gönlüne göre biri olur de… Arka fonda biri radyo açmış. Güneşimi kaybettim çalıyor. Müthiş o koşuşturmaca yorgunluğuna iyi geliyor. Harika dalıyorsun gözün… Mükemmel, şaşırtıcı bir klip çekiyor zihin… Efsane sevgili kızı hatırla… Mucizevi tanışmıştın… Klişeydi her şey... Seni olduğundan farklı düşünmüştü. Sen tiyatro okumak istiyordun. Onun da kocaman sertifikası vardı. Sertifikalı aşk… Risksizdi başlangıçta… Her şey… Fonda dokunulmazsın benim… Yüreğime hükmedemem… Güneşimi kaybettim… Bla bla… Resmî unvanı yok. Koruması ise, uzak dur demek. Güvenli mi? Bu şehre rağmen nasıl yaptığı belirsiz kaliteli koruma da işte… Benim çiçeğim de içinden… Bisikletler geçiyor. Tıkırdayan boncukları var tellerinde… Öğreneli yıllar olsa da bisiklet kullanmayı yıllar gibi… En uygun aşktı o de iç çek. Eksiksiz ve tam. Ama onun için öyle miydin? İşte sırf bu yüzden işte… Yaşamadan çok yakın oldukları çalıyor radyoda… Toparlanırken, bak telefona… Sivri burnun, kırkına gelmiş saçların… işte de kendine kendi… İstanbulsuz, aşksız yazar… Gözün tekrar geriye aynı yolu yürümeye kesiyor mu? İşte ben Tolga Demir…
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
            <div className="sticky top-24 self-start mt-32">
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
