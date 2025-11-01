import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET: Site ayarlarını al
export async function GET(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = apiRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many requests' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    let query: string;
    let params: any[];

    if (key) {
      // Belirli bir ayarı getir
      query = 'SELECT * FROM site_settings WHERE setting_key = ?';
      params = [key];
    } else {
      // Tüm ayarları getir
      query = 'SELECT * FROM site_settings';
      params = [];
    }

    const settings = await executeQuery(query, params);
    
    if (key && settings.length === 0) {
      return errorResponse('Setting not found', 404);
    }

    const result = key ? settings[0] : settings;

    return successResponse(result, undefined, {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimit.resetTime.toString()
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return errorResponse('Failed to fetch settings', 500);
  }
}

// PUT: Tüm site ayarlarını toplu güncelle (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Admin authentication check
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const settingsData = await request.json();
    
    // Site ayarlarını settings tablosuna kaydet
    const settingsMap: { [key: string]: string } = {
      'site_name': settingsData.site_name || '',
      'site_description': settingsData.site_description || '',
      'site_logo': settingsData.site_logo || '',
      'contact_email': settingsData.contact_email || '',
      'contact_phone': settingsData.phone || '',
      'contact_address': settingsData.address || '',
      'social_instagram': settingsData.social_links?.instagram || '',
      'social_twitter': settingsData.social_links?.twitter || '',
      'social_facebook': settingsData.social_links?.facebook || '',
      'social_youtube': settingsData.social_links?.youtube || '',
      'social_whatsapp': settingsData.social_links?.whatsapp || '',
      'social_spotify': settingsData.social_links?.spotify || '',
      'seo_meta_title': settingsData.seo_settings?.meta_title || '',
      'seo_meta_description': settingsData.seo_settings?.meta_description || '',
      'seo_meta_keywords': settingsData.seo_settings?.meta_keywords || '',
      'seo_google_analytics': settingsData.seo_settings?.google_analytics_id || '',
      'seo_google_tag_manager': settingsData.seo_settings?.google_tag_manager_id || '',
      'seo_google_verification': settingsData.seo_settings?.google_verification || '',
      'seo_canonical_url': settingsData.seo_settings?.canonical_url || '',
      'maintenance_mode': settingsData.general_settings?.maintenance_mode ? '1' : '0',
      'allow_comments': settingsData.general_settings?.allow_comments ? '1' : '0',
      'newsletter_enabled': settingsData.general_settings?.newsletter_enabled ? '1' : '0',
      'cookie_consent': settingsData.general_settings?.cookie_consent ? '1' : '0',
      'two_factor_enabled': settingsData.general_settings?.two_factor_enabled ? '1' : '0'
    };

    // Her ayarı upsert et
    const upsertQuery = `
      INSERT INTO site_settings (setting_key, setting_value) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE 
      setting_value = VALUES(setting_value)
    `;

    for (const [key, value] of Object.entries(settingsMap)) {
      await executeQuery(upsertQuery, [key, value]);
    }

    return successResponse(
      { message: 'Ayarlar başarıyla kaydedildi' },
      'Settings updated successfully'
    );
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return errorResponse('Ayarlar kaydedilirken hata oluştu: ' + error.message, 500);
  }
}

// POST: Tekil ayar güncelle (Admin only)
export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = apiRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many requests' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    // Admin authentication check
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { key, value, description } = await request.json();
    
    if (!key || value === undefined) {
      return errorResponse('Key and value are required', 400);
    }

    // Ayarı güncelle veya oluştur
    const upsertQuery = `
      INSERT INTO site_settings (setting_key, setting_value, description) 
      VALUES (?, ?, ?) 
      ON DUPLICATE KEY UPDATE 
      setting_value = VALUES(setting_value), 
      description = VALUES(description)
    `;
    
    await executeQuery(upsertQuery, [key, value, description || null]);

    return successResponse(
      { key, value, description },
      'Setting updated successfully',
      {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    );
  } catch (error) {
    console.error('Error updating setting:', error);
    return errorResponse('Failed to update setting', 500);
  }
}

// DELETE: Site ayarını sil (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = apiRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many requests' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    // Admin authentication check
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return errorResponse('Key is required', 400);
    }

    const deleteQuery = 'DELETE FROM site_settings WHERE setting_key = ?';
    const result = await executeQuery(deleteQuery, [key]);

    return successResponse(
      { deletedKey: key },
      'Setting deleted successfully',
      {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    );
  } catch (error) {
    console.error('Error deleting setting:', error);
    return errorResponse('Failed to delete setting', 500);
  }
}