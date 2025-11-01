import { MetadataRoute } from 'next';
import { executeQuery } from '@/lib/database/mysql';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = 'https://tolgademir.org';
  
  // Bakım modunu kontrol et
  let isMaintenanceMode = false;
  try {
    const settings = await executeQuery(
      "SELECT value FROM settings WHERE `key` = 'maintenance_mode' LIMIT 1"
    ) as any[];
    
    if (settings.length > 0) {
      isMaintenanceMode = settings[0].value === '1' || settings[0].value === 'true';
    }
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
  }

  // Bakım modundaysa tüm siteyi kapat
  if (isMaintenanceMode) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  // Normal mod - SEO friendly
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/yonetim/',
          '/api/',
          '/_next/',
          '/admin/',
          '/backups/',
        ],
        crawlDelay: 0,
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/kitaplar/',
          '/hakkimda',
          '/iletisim',
        ],
        disallow: [
          '/yonetim/',
          '/admin/',
        ],
        crawlDelay: 0,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/yonetim/',
          '/admin/',
        ],
        crawlDelay: 1,
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/public/sitemap.xml`
    ],
    host: baseUrl,
  };
}