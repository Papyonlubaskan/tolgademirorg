
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
    hero_subtitle: 'Yazar & Hikaye Anlatýcý',
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
      // Hata durumunda varsayýlan deðerler kullanýlacak
    }
  };

  // Ýçerik paragraflarý
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

            {/* Dinamik Ýçerik */}
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
                  Sayýn Okuyucuma;
                </p>
                <p className="text-base font-medium text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Yeni bir olaydan bahsetmeliyim. Sen veya siz mi demeliyim okuyucuma… Ýçin için mutluyken… Çünkü yýllar sonra; hemen sonra, þimdi, Bugün, kolay ve huzurlu bir gündeyim. Huzurlu, sessiz, sakin; olmak ne güzel...
                </p>
                <p className="text-base font-medium text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Hýzlý olarak konuya gireyim. Ýndirimli bir þeyi yakalamýþ sevinciyle… Garantisi mi? Hala o zor günlerden sonra hayattayým… Öncelikle bilin alýþýlmadýk sese karþý duyarlýyým. En azýndan bugün bu kanaateyim. Ýstanbul… Üsküdar'dan Kadýköy'e Taksi Dolmuþla geçerken… Birden çok siren sesi… Metrolpol þehir'e Anadolu'dan gelen biri için alýþýldýk deðil. Baþlamak bitirmenin yarýsý… O gün Dolmuþtan indim. Bir kovalamaca þehirde… Bir köþede Aþk yaþayan gençler, Bir köþede mutlular… Bir köþe para kazanmak isteyenler. Kar, Fýrsat, Tasarruf, Saðlýk Sonucu bekleyenler… Vapur seslerine geçiyor. Sonuç mu… Bir Kadýköy turu… Kanýtlanmýþ bir þey ki orasý baþka bir Ýstanbul… Sanki vaha… Ama ona raðmen Kadýköy Boða'nýn oradan girdin mi? Ekstra olarak, Mülteciler Üst kat dükkanlarda… Kazandýran, Kazançlý yazýlarý arasýnda, Tüyo sýrlarýný verenlerin olduðu bir At yarýþý bayisi… Geç oradan… Yürü boða boyunca… Duyuru yapan anutçular… Ýstiklal' Caddesi'ndeki kadar olmasa da bir güruh üzerine üzerine geliyor insanýn… Dikkat… Et… Yürürken… Cüzdan kapýlmasýn… Omuz ata ata yardýr. Öðlenin en civcivli saati… Kimse çarpýþtýðýna aldýrmýyor. Özel… Bir yer gibi geliyor. Sahile ulaþabilmek. Tiyatrolara gel. Kafeler sokaðýna bir selam çak. Uyarý… Zihninden sana: O kadar Tiyatrocun Adamsýn. El broþürü al bari… gir içeri al broþür. Çýk. Çabuk yap. Nefes almak için sahile çýkmalýsýn. Uyarý havuza dikket et düþme yazýsýný oku… Acele Acele yürüyen insanlarýn arasýndan… Yardým istemek için, birisi durduruyor. Sýnýrlý zamaný var. Sorup teþekkür etmeden gidiyor. Sen ona ne dediðin bilmiyorsun. Ýlk… Sað… Girme… Son sokaðý geç… Artýk yokuþ aþaðý… Sadece Denizi görebilmek için… Kýsa Süreli… Bitiyor yazan milyonculardan aþaðýya… Yürü… Katýl katýla gülenler… Sokakta baðýþ toplayanlar dergiye üye yapmaya çalýþýyor. Onlar gibi olsan da bir zamanlar aldýrma… Üyelere Özel demelerine aldýrma… Geç gitsin… Davetlerini geri çevirip, yürü… Ve iskele göründü… Artýk daha az kalabalýk… Evleri geç… Satýlýk evleri geç… Almaya gücün yok. Biraz nefes almaya geldin. Zula'dan termosu çýkar. Karþýnýzda Deniz… otur duvara kalça üstü…. Ýzle Denizi… Bir temiz nefes… Keþfet yatlarý; benimde olur mu diyerek iç çek. Karþýlaþtýr Þans oyunlarýndan çýksa þunu alýrým þunu lama para de… Ýnanýlmaz zorlu biraz zorlu bir sürecin ardýndan nefes al… Ýnanýlmaz bir huzur… Huzur mu, dediniz. Etkileyici çiftler geçerken, gözün dalmasýn… Senin de bir gün gönlüne göresi olur de… Arka fonda Biri radyo açmýþ. Güneþimi kaybettim çalýyor. Müthiþ o koþuþturmaca Yorgunluðuna iyi geliyor. Harika dalýyorsun gözün… Mükemmel/ Þaþýrtýcý bir klip çekiyor zihin… Efsane sevgili kýzý hatýrla… Mucizevi tanýþmýþtýn… Kliþeydi her þey... Seni olduðundan farklý düþünmüþtü. Sen Tiyatro okumak istiyordu. Onunda kocaman sertifikasý vardý. Sertifikalý aþk… Risksizdi baþlangýçta… Her þey… Fonda dokunulmazýmsýn benim… Yüreðime hükmedemem… Güneþimi kaybettim…. Bla Bla… Resmi unvaný yok. Korumasý ise, uzak dur demek. Güvenli mi? Bu þehre raðmen nasýl yaptýðý belirsiz kaliteli koruma da iþte… Benim çiçeðim de içinden… Bisikletler çekiyor. Týkýrdayan boncuklarý var tellerinde… Öðreneli yýllar olsa da bisiklet kullanmayý yýllar gibi… En uygun aþktý o de iç çek. Eksiksiz ve tam. Ama onunun için öyle miydin? Ýþte sýrf bu yüzden iþte… Yaþamadan çok yakýn olduklarý çalýyor radyoda… Toparlanýrken, bak telefona… Sivri burnun, kýrkýna gelmiþ saçlarýn… iþte deki kendine kendi… Ýstanbulsuz, aþksýz Yazar… Gözün tekrar geriye ayný yolu yürümeye kesiyor mu? Ýþte Ben Tolga Demir…
                </p>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/kitaplar" 
                className="bg-orange-600 dark:bg-orange-700 text-white px-8 py-4 rounded-full font-semibold hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors cursor-pointer text-center whitespace-nowrap"
              >
                Kitaplarýmý Keþfet
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
