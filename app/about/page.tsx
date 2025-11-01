
'use client';

import Footer from '../../components/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-amber-50">
      <div className="pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">Hakkımda</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Hikayelerin büyülü dünyasında geçen yazarlık yolculuğum
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 mb-20">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Merhaba, Ben Tolga</h2>
                <div className="prose prose-lg text-gray-600 leading-relaxed space-y-4">
                  <p>
                    Tolga Demir 1991 yılında Aksaray'nın küçük bir ilçesinde doğmuştur. 
                    Çocuk yaşlardan beri yazmaya ilgi duyan yazarın ilk yazım denemeleri 
                    şiir ve öykü üzerine olmuş, ilk romanını ise 2017 yılında yazmaya başlamıştır.
                  </p>
                  <p>
                    Hayatının büyük bir bölümünü yazmaya adayan Tolga Demir, gördüğü, 
                    duyduğu ve yaşildiği her şeyden esinlenmeyi sevmekte. Yazarın basılı 
                    eserleri Ötanazi Okulu, Medusa'nın Ölü Kumları, Öyle Bir Uğradım romanlarıdır.
                  </p>
                  <p>
                    Her hikaye yazdığım da, sadece kendi hayal gücümle değil, aynı zamanda 
                    binlerce okurumun kalbiyle de yazıyorum. Onların yorumları, duygusal 
                    tepkileri ve beklentileri, hikayelerimi şekillendiriyor.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">İstatistiklerim</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">6</div>
                    <div className="text-gray-600">Yayınlanan Kitap</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">250K+</div>
                    <div className="text-gray-600">Toplam Okur</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">15K+</div>
                    <div className="text-gray-600">Yorum</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">5</div>
                    <div className="text-gray-600">Yıllık Deneyim</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <img
                src="https://static.readdy.ai/image/95e17ff92b66fd1dcbe3cf3a194e2fbb/a599980b101fd8dacfcfcbdeed753471.jfif"
                alt="Tolga Demir"
                className="w-full h-96 object-cover object-top rounded-2xl shadow-lg"
              />

              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Yazarlık Felsefem</h3>
                <div className="space-y-4 text-gray-600">
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full mt-1">
                      <i className="ri-heart-line text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Duygusal Bağ</h4>
                      <p className="text-sm">Her karakterim gerçek insanların duygularını taşır</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full mt-1">
                      <i className="ri-community-line text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Okur Etkileşimi</h4>
                      <p className="text-sm">Okurlarımın yorumları hikayelerimi yönlendirir</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 flex items-center justify-center bg-orange-100 text-orange-600 rounded-full mt-1">
                      <i className="ri-lightbulb-line text-sm"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Sürekli Gelişim</h4>
                      <p className="text-sm">Her hikayede kendimi ve yazarlığımı geliştiririm</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
            <h3 className="text-3xl font-bold text-gray-800 mb-8 text-center">Yazarlık Yolculuğum</h3>
            <div className="space-y-8">
              <div className="flex items-start space-x-6">
                <div className="bg-orange-50 dark:bg-gray-800 p-6 rounded-xl">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mr-3">1</div>
                    <h3 className="text-lg font-semibold text-gray-800">2020 - İlk Adım</h3>
                  </div>
                  <p className="text-gray-600">
                    İlk hikayemi yazmaya başladım. Bu yolculuk hayatımı tamamen değiştirdi.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="bg-orange-50 dark:bg-gray-800 p-6 rounded-xl">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mr-3">2</div>
                    <h3 className="text-lg font-semibold text-gray-800">2021 - Gelişim</h3>
                  </div>
                  <p className="text-gray-600">
                    Gizem türüne adım attım. Okur sayım artmaya başladı ve ilk kez profesyonel yazarlığı düşünmeye başladım.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="bg-orange-50 dark:bg-gray-800 p-6 rounded-xl">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mr-3">3</div>
                    <h3 className="text-lg font-semibold text-gray-800">2022-2024 - Bugün</h3>
                  </div>
                  <p className="text-gray-600">
                    Eserlerimle geniş bir okur kitlesine ulaştım. Artık tam zamanlı bir yazarım.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
