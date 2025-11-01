import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const adminUser = (request as any).user;
    
    // Admin kullanıcısının 2FA secret'ını sil
    await executeQuery(
      'UPDATE admins SET two_factor_secret = NULL WHERE id = ?',
      [adminUser.id]
    );

    // Security settings'te de kapat
    await executeQuery(
      `INSERT INTO site_settings (setting_key, setting_value) 
       VALUES ('security_2fa_enabled', 'false') 
       ON DUPLICATE KEY UPDATE setting_value = 'false'`
    );

    return successResponse({ 
      message: '2FA devre dışı bırakıldı',
      twoFactorAuth: false 
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return errorResponse('2FA kapatılamadı', 500);
  }
}

