// Slug oluşturma fonksiyonu
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '') // Özel karakterleri kaldır
    .replace(/\s+/g, '-') // Boşlukları tire ile değiştir
    .replace(/-+/g, '-') // Çoklu tireleri tek tire yap
    .trim()
    .replace(/^-|-$/g, ''); // Başta ve sonda tire varsa kaldır
}

// Kitap slug'ı oluştur
export function createBookSlug(title: string, id: string): string {
  const slug = createSlug(title);
  return slug || `kitap-${id}`;
}

// Bölüm slug'ı oluştur
export function createChapterSlug(title: string, chapterNumber: number, id: string): string {
  const slug = createSlug(title);
  return slug ? `${slug}-${chapterNumber}` : `bolum-${chapterNumber}-${id}`;
}

// URL'den slug'ı çıkar
export function extractSlugFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

// ID'den slug'a çevir (mevcut ID'ler için)
export function getIdFromSlug(slug: string): string | null {
  // Eğer slug sadece sayı ise, ID olarak döndür
  if (/^\d+$/.test(slug)) {
    return slug;
  }
  
  // Slug'dan ID çıkarmaya çalış (son kısımda sayı varsa)
  const match = slug.match(/-(\d+)$/);
  if (match) {
    return match[1];
  }
  
  return null;
}
