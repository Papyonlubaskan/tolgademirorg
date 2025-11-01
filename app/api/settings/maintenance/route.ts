import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET: Maintenance mode durumunu kontrol et
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
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

    // MySQL'den maintenance mode durumunu çek
    const query = 'SELECT setting_value, setting_key FROM site_settings WHERE setting_key = ? LIMIT 1';
    const result = await executeQuery(query, ['maintenance_mode']);
    
    const maintenanceMode = result[0]?.setting_value === 'true' || false;
    const endTime = null;

    return NextResponse.json({
      success: true,
      maintenanceMode,
      endTime,
      message: maintenanceMode ? 'Maintenance mode is active' : 'Site is operational'
    }, {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
    return NextResponse.json({ 
      success: false, 
      maintenanceMode: false,
      error: 'Failed to check maintenance mode' 
    }, { status: 500 });
  }
}

// POST: Maintenance mode'u değiştir (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
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

    // TODO: Admin authentication check
    // const isAdmin = await checkAdminAuth(request);
    // if (!isAdmin) {
    //   return NextResponse.json({ 
    //     success: false, 
    //     error: 'Unauthorized' 
    //   }, { status: 401 });
    // }

    const { maintenanceMode, endTime } = await request.json();
    
    // MySQL'de maintenance mode'u güncelle
    const updateQuery = `
      INSERT INTO site_settings (setting_key, setting_value) 
      VALUES ('maintenance_mode', ?) 
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `;
    
    await executeQuery(updateQuery, [maintenanceMode.toString()]);

    // Cookie set et (middleware için)
    const response = NextResponse.json({
      success: true,
      maintenanceMode,
      endTime,
      message: `Maintenance mode ${maintenanceMode ? 'enabled' : 'disabled'} successfully`
    }, {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    });

    // Bakım modu cookie'si ekle/kaldır
    if (maintenanceMode) {
      response.cookies.set('maintenance_mode', 'true', {
        httpOnly: false, // Client-side'dan okunabilir olmalı
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 gün
      });
    } else {
      response.cookies.delete('maintenance_mode');
    }

    return response;
  } catch (error) {
    console.error('Error updating maintenance mode:', error);
    return errorResponse('Failed to update maintenance mode', 500);
  }
}
