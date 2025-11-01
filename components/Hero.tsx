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
    hero_subtitle: 'Yazar & Hikaye AnlatÄ±cÄ±',
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

  // Ä°Ã§erik paragraflarÄ±
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

            {/* Dinamik Ä°Ã§erik */}
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
                  SayÄ±n Okuyucuma;
                </p>
                <p className="text-base font-medium text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Yeni bir olaydan bahsetmeliyim. Sen veya siz mi demeliyim okuyucumaâ€¦ Ä°Ã§in iÃ§in mutluykenâ€¦ Ã‡Ã¼nkÃ¼ yÄ±llar sonra; hemen sonra, ÅŸimdi, BugÃ¼n, kolay ve huzurlu bir gÃ¼ndeyim. Huzurlu, sessiz, sakin; olmak ne gÃ¼zel...
                </p>
                <p className="text-base font-medium text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  HÄ±zlÄ± olarak konuya gireyim. Ä°ndirimli bir ÅŸeyi yakalamÄ±ÅŸ sevinciyleâ€¦ Garantisi mi? Hala o zor gÃ¼nlerden sonra hayattayÄ±mâ€¦ Ã–ncelikle bilin alÄ±ÅŸÄ±lmadÄ±k sese karÅŸÄ± duyarlÄ±yÄ±m. En azÄ±ndan bugÃ¼n bu kanaateyim. Ä°stanbulâ€¦ ÃœskÃ¼dar'dan KadÄ±kÃ¶y'e Taksi DolmuÅŸla geÃ§erkenâ€¦ Birden Ã§ok siren sesiâ€¦ Metrolpol ÅŸehir'e Anadolu'dan gelen biri iÃ§in alÄ±ÅŸÄ±ldÄ±k deÄŸil. BaÅŸlamak bitirmenin yarÄ±sÄ±â€¦ O gÃ¼n DolmuÅŸtan indim. Bir kovalamaca ÅŸehirdeâ€¦ Bir kÃ¶ÅŸede AÅŸk yaÅŸayan genÃ§ler, Bir kÃ¶ÅŸede mutlularâ€¦ Bir kÃ¶ÅŸe para kazanmak isteyenler. Kar, FÄ±rsat, Tasarruf, SaÄŸlÄ±k Sonucu bekleyenlerâ€¦ Vapur seslerine geÃ§iyor. SonuÃ§ muâ€¦ Bir KadÄ±kÃ¶y turuâ€¦ KanÄ±tlanmÄ±ÅŸ bir ÅŸey ki orasÄ± baÅŸka bir Ä°stanbulâ€¦ Sanki vahaâ€¦ Ama ona raÄŸmen KadÄ±kÃ¶y BoÄŸa'nÄ±n oradan girdin mi? Ekstra olarak, MÃ¼lteciler Ãœst kat dÃ¼kkanlardaâ€¦ KazandÄ±ran, KazanÃ§lÄ± yazÄ±larÄ± arasÄ±nda, TÃ¼yo sÄ±rlarÄ±nÄ± verenlerin olduÄŸu bir At yarÄ±ÅŸÄ± bayisiâ€¦ GeÃ§ oradanâ€¦ YÃ¼rÃ¼ boÄŸa boyuncaâ€¦ Duyuru yapan anutÃ§ularâ€¦ Ä°stiklal' Caddesi'ndeki kadar olmasa da bir gÃ¼ruh Ã¼zerine Ã¼zerine geliyor insanÄ±nâ€¦ Dikkatâ€¦ Etâ€¦ YÃ¼rÃ¼rkenâ€¦ CÃ¼zdan kapÄ±lmasÄ±nâ€¦ Omuz ata ata yardÄ±r. Ã–ÄŸlenin en civcivli saatiâ€¦ Kimse Ã§arpÄ±ÅŸtÄ±ÄŸÄ±na aldÄ±rmÄ±yor. Ã–zelâ€¦ Bir yer gibi geliyor. Sahile ulaÅŸabilmek. Tiyatrolara gel. Kafeler sokaÄŸÄ±na bir selam Ã§ak. UyarÄ±â€¦ Zihninden sana: O kadar Tiyatrocun AdamsÄ±n. El broÅŸÃ¼rÃ¼ al bariâ€¦ gir iÃ§eri al broÅŸÃ¼r. Ã‡Ä±k. Ã‡abuk yap. Nefes almak iÃ§in sahile Ã§Ä±kmalÄ±sÄ±n. UyarÄ± havuza dikket et dÃ¼ÅŸme yazÄ±sÄ±nÄ± okuâ€¦ Acele Acele yÃ¼rÃ¼yen insanlarÄ±n arasÄ±ndanâ€¦ YardÄ±m istemek iÃ§in, birisi durduruyor. SÄ±nÄ±rlÄ± zamanÄ± var. Sorup teÅŸekkÃ¼r etmeden gidiyor. Sen ona ne dediÄŸin bilmiyorsun. Ä°lkâ€¦ SaÄŸâ€¦ Girmeâ€¦ Son sokaÄŸÄ± geÃ§â€¦ ArtÄ±k yokuÅŸ aÅŸaÄŸÄ±â€¦ Sadece Denizi gÃ¶rebilmek iÃ§inâ€¦ KÄ±sa SÃ¼reliâ€¦ Bitiyor yazan milyonculardan aÅŸaÄŸÄ±yaâ€¦ YÃ¼rÃ¼â€¦ KatÄ±l katÄ±la gÃ¼lenlerâ€¦ Sokakta baÄŸÄ±ÅŸ toplayanlar dergiye Ã¼ye yapmaya Ã§alÄ±ÅŸÄ±yor. Onlar gibi olsan da bir zamanlar aldÄ±rmaâ€¦ Ãœyelere Ã–zel demelerine aldÄ±rmaâ€¦ GeÃ§ gitsinâ€¦ Davetlerini geri Ã§evirip, yÃ¼rÃ¼â€¦ Ve iskele gÃ¶rÃ¼ndÃ¼â€¦ ArtÄ±k daha az kalabalÄ±kâ€¦ Evleri geÃ§â€¦ SatÄ±lÄ±k evleri geÃ§â€¦ Almaya gÃ¼cÃ¼n yok. Biraz nefes almaya geldin. Zula'dan termosu Ã§Ä±kar. KarÅŸÄ±nÄ±zda Denizâ€¦ otur duvara kalÃ§a Ã¼stÃ¼â€¦. Ä°zle Deniziâ€¦ Bir temiz nefesâ€¦ KeÅŸfet yatlarÄ±; benimde olur mu diyerek iÃ§ Ã§ek. KarÅŸÄ±laÅŸtÄ±r Åans oyunlarÄ±ndan Ã§Ä±ksa ÅŸunu alÄ±rÄ±m ÅŸunu lama para deâ€¦ Ä°nanÄ±lmaz zorlu biraz zorlu bir sÃ¼recin ardÄ±ndan nefes alâ€¦ Ä°nanÄ±lmaz bir huzurâ€¦ Huzur mu, dediniz. Etkileyici Ã§iftler geÃ§erken, gÃ¶zÃ¼n dalmasÄ±nâ€¦ Senin de bir gÃ¼n gÃ¶nlÃ¼ne gÃ¶resi olur deâ€¦ Arka fonda Biri radyo aÃ§mÄ±ÅŸ. GÃ¼neÅŸimi kaybettim Ã§alÄ±yor. MÃ¼thiÅŸ o koÅŸuÅŸturmaca YorgunluÄŸuna iyi geliyor. Harika dalÄ±yorsun gÃ¶zÃ¼nâ€¦ MÃ¼kemmel/ ÅaÅŸÄ±rtÄ±cÄ± bir klip Ã§ekiyor zihinâ€¦ Efsane sevgili kÄ±zÄ± hatÄ±rlaâ€¦ Mucizevi tanÄ±ÅŸmÄ±ÅŸtÄ±nâ€¦ KliÅŸeydi her ÅŸey... Seni olduÄŸundan farklÄ± dÃ¼ÅŸÃ¼nmÃ¼ÅŸtÃ¼. Sen Tiyatro okumak istiyordu. Onunda kocaman sertifikasÄ± vardÄ±. SertifikalÄ± aÅŸkâ€¦ Risksizdi baÅŸlangÄ±Ã§taâ€¦ Her ÅŸeyâ€¦ Fonda dokunulmazÄ±msÄ±n benimâ€¦ YÃ¼reÄŸime hÃ¼kmedememâ€¦ GÃ¼neÅŸimi kaybettimâ€¦. Bla Blaâ€¦ Resmi unvanÄ± yok. KorumasÄ± ise, uzak dur demek. GÃ¼venli mi? Bu ÅŸehre raÄŸmen nasÄ±l yaptÄ±ÄŸÄ± belirsiz kaliteli koruma da iÅŸteâ€¦ Benim Ã§iÃ§eÄŸim de iÃ§indenâ€¦ Bisikletler Ã§ekiyor. TÄ±kÄ±rdayan boncuklarÄ± var tellerindeâ€¦ Ã–ÄŸreneli yÄ±llar olsa da bisiklet kullanmayÄ± yÄ±llar gibiâ€¦ En uygun aÅŸktÄ± o de iÃ§ Ã§ek. Eksiksiz ve tam. Ama onunun iÃ§in Ã¶yle miydin? Ä°ÅŸte sÄ±rf bu yÃ¼zden iÅŸteâ€¦ YaÅŸamadan Ã§ok yakÄ±n olduklarÄ± Ã§alÄ±yor radyodaâ€¦ ToparlanÄ±rken, bak telefonaâ€¦ Sivri burnun, kÄ±rkÄ±na gelmiÅŸ saÃ§larÄ±nâ€¦ iÅŸte deki kendine kendiâ€¦ Ä°stanbulsuz, aÅŸksÄ±z Yazarâ€¦ GÃ¶zÃ¼n tekrar geriye aynÄ± yolu yÃ¼rÃ¼meye kesiyor mu? Ä°ÅŸte Ben Tolga Demirâ€¦
                </p>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                href="/kitaplar" 
                className="bg-orange-600 dark:bg-orange-700 text-white px-8 py-4 rounded-full font-semibold hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors cursor-pointer text-center whitespace-nowrap"
              >
                KitaplarÄ±mÄ± KeÅŸfet
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
            <div className="sticky top-24 self-start -mt-64">
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

