
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
    hero_subtitle: 'Yazar & Hikaye Anlat�c�',
    sections: []
  });

  useEffect(() => {
    loadHeroData();
  }, []);

  const loadHeroData = async () => {
    try {
      // Ana sayfa verilerini settings'ten y�kle
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
      // Hata durumunda varsay�lan de�erler kullan�lacak
    }
  };

  // ��erik paragraflar�
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

            {/* Dinamik ��erik */}
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
                  Say�n Okuyucuma;
                </p>
                <p className="text-base font-medium text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Yeni bir olaydan bahsetmeliyim. Sen veya siz mi demeliyim okuyucuma� ��in i�in mutluyken� ��nk� y�llar sonra; hemen sonra, �imdi, Bug�n, kolay ve huzurlu bir g�ndeyim. Huzurlu, sessiz, sakin; olmak ne g�zel...
                </p>
                <p className="text-base font-medium text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  H�zl� olarak konuya gireyim. �ndirimli bir �eyi yakalam�� sevinciyle� Garantisi mi? Hala o zor g�nlerden sonra hayattay�m� �ncelikle bilin al���lmad�k sese kar�� duyarl�y�m. En az�ndan bug�n bu kanaateyim. �stanbul� �sk�dar'dan Kad�k�y'e Taksi Dolmu�la ge�erken� Birden �ok siren sesi� Metrolpol �ehir'e Anadolu'dan gelen biri i�in al���ld�k de�il. Ba�lamak bitirmenin yar�s�� O g�n Dolmu�tan indim. Bir kovalamaca �ehirde� Bir k��ede A�k ya�ayan gen�ler, Bir k��ede mutlular� Bir k��e para kazanmak isteyenler. Kar, F�rsat, Tasarruf, Sa�l�k Sonucu bekleyenler� Vapur seslerine ge�iyor. Sonu� mu� Bir Kad�k�y turu� Kan�tlanm�� bir �ey ki oras� ba�ka bir �stanbul� Sanki vaha� Ama ona ra�men Kad�k�y Bo�a'n�n oradan girdin mi? Ekstra olarak, M�lteciler �st kat d�kkanlarda� Kazand�ran, Kazan�l� yaz�lar� aras�nda, T�yo s�rlar�n� verenlerin oldu�u bir At yar��� bayisi� Ge� oradan� Y�r� bo�a boyunca� Duyuru yapan anut�ular� �stiklal' Caddesi'ndeki kadar olmasa da bir g�ruh �zerine �zerine geliyor insan�n� Dikkat� Et� Y�r�rken� C�zdan kap�lmas�n� Omuz ata ata yard�r. ��lenin en civcivli saati� Kimse �arp��t���na ald�rm�yor. �zel� Bir yer gibi geliyor. Sahile ula�abilmek. Tiyatrolara gel. Kafeler soka��na bir selam �ak. Uyar�� Zihninden sana: O kadar Tiyatrocun Adams�n. El bro��r� al bari� gir i�eri al bro��r. ��k. �abuk yap. Nefes almak i�in sahile ��kmal�s�n. Uyar� havuza dikket et d��me yaz�s�n� oku� Acele Acele y�r�yen insanlar�n aras�ndan� Yard�m istemek i�in, birisi durduruyor. S�n�rl� zaman� var. Sorup te�ekk�r etmeden gidiyor. Sen ona ne dedi�in bilmiyorsun. �lk� Sa�� Girme� Son soka�� ge� Art�k yoku� a�a��� Sadece Denizi g�rebilmek i�in� K�sa S�reli� Bitiyor yazan milyonculardan a�a��ya� Y�r�� Kat�l kat�la g�lenler� Sokakta ba��� toplayanlar dergiye �ye yapmaya �al���yor. Onlar gibi olsan da bir zamanlar ald�rma� �yelere �zel demelerine ald�rma� Ge� gitsin� Davetlerini geri �evirip, y�r�� Ve iskele g�r�nd�� Art�k daha az kalabal�k� Evleri ge� Sat�l�k evleri ge� Almaya g�c�n yok. Biraz nefes almaya geldin. Zula'dan termosu ��kar. Kar��n�zda Deniz� otur duvara kal�a �st��. �zle Denizi� Bir temiz nefes� Ke�fet yatlar�; benimde olur mu diyerek i� �ek. Kar��la�t�r �ans oyunlar�ndan ��ksa �unu al�r�m �unu lama para de� �nan�lmaz zorlu biraz zorlu bir s�recin ard�ndan nefes al� �nan�lmaz bir huzur� Huzur mu, dediniz. Etkileyici �iftler ge�erken, g�z�n dalmas�n� Senin de bir g�n g�nl�ne g�resi olur de� Arka fonda Biri radyo a�m��. G�ne�imi kaybettim �al�yor. M�thi� o ko�u�turmaca Yorgunlu�una iyi geliyor. Harika dal�yorsun g�z�n� M�kemmel/ �a��rt�c� bir klip �ekiyor zihin� Efsane sevgili k�z� hat�rla� Mucizevi tan��m��t�n� Kli�eydi her �ey... Seni oldu�undan farkl� d���nm��t�. Sen Tiyatro okumak istiyordu. Onunda kocaman sertifikas� vard�. Sertifikal� a�k� Risksizdi ba�lang��ta� Her �ey� Fonda dokunulmaz�ms�n benim� Y�re�ime h�kmedemem� G�ne�imi kaybettim�. Bla Bla� Resmi unvan� yok. Korumas� ise, uzak dur demek. G�venli mi? Bu �ehre ra�men nas�l yapt��� belirsiz kaliteli koruma da i�te� Benim �i�e�im de i�inden� Bisikletler �ekiyor. T�k�rdayan boncuklar� var tellerinde� ��reneli y�llar olsa da bisiklet kullanmay� y�llar gibi� En uygun a�kt� o de i� �ek. Eksiksiz ve tam. Ama onunun i�in �yle miydin? ��te s�rf bu y�zden i�te� Ya�amadan �ok yak�n olduklar� �al�yor radyoda� Toparlan�rken, bak telefona� Sivri burnun, k�rk�na gelmi� sa�lar�n� i�te deki kendine kendi� �stanbulsuz, a�ks�z Yazar� G�z�n tekrar geriye ayn� yolu y�r�meye kesiyor mu? ��te Ben Tolga Demir�
                </p>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/kitaplar" 
                className="bg-orange-600 dark:bg-orange-700 text-white px-8 py-4 rounded-full font-semibold hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors cursor-pointer text-center whitespace-nowrap"
              >
                Kitaplar�m� Ke�fet
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
