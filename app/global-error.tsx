'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-r from-orange-100 to-pink-100 rounded-full flex items-center justify-center">
                <span className="text-5xl">⚠️</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Kritik Hata
            </h1>

            <p className="text-gray-600 mb-8">
              Bir sistem hatası oluştu. Lütfen sayfayı yenileyin.
            </p>

            <button
              onClick={reset}
              className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 shadow-md hover:shadow-xl"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
