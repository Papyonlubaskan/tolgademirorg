import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';

// GET: Güvenlik ayarlarını getir
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    // Güvenlik ayarlarını settings tablosundan al
    const settings = await executeQuery(
      'SELECT setting_key as `key`, setting_value as `value` FROM site_settings WHERE setting_key LIKE "security_%"'
    );

    // IP ban listesini al
    const bannedIPs = await executeQuery(
      'SELECT ip_address, subnet, reason FROM banned_ips'
    );

    // Ayarları objeye dönüştür
    const securitySettings: any = {
      ipBlacklist: bannedIPs.map((ip: any) => ip.ip_address),
      ipWhitelist: [],
      twoFactorAuth: false,
      maxLoginAttempts: 5,
      sessionTimeout: 30,
      autoLogout: true,
      notifyOnLogin: true,
      ipAccessControl: false
    };

    settings.forEach((setting: any) => {
      const key = setting.key.replace('security_', '');
      try {
        securitySettings[key] = JSON.parse(setting.value);
      } catch {
        securitySettings[key] = setting.value;
      }
    });

    return NextResponse.json({
      success: true,
      data: securitySettings
    });
  } catch (error) {
    console.error('Get security settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Güvenlik ayarları alınamadı' },
      { status: 500 }
    );
  }
}

// PUT: Güvenlik ayarlarını güncelle
export async function PUT(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const settings = await request.json();

    // Her ayarı settings tablosuna kaydet
    for (const [key, value] of Object.entries(settings)) {
      if (key === 'ipBlacklist' || key === 'ipWhitelist') continue; // IP listeleri ayrı yönetiliyor

      const settingKey = `security_${key}`;
      const settingValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

      await executeQuery(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
        [settingKey, settingValue]
      );
    }

    // Güvenlik logu oluştur
    await executeQuery(
      'INSERT INTO security_logs (type, message, ip, user_agent, severity, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      ['system_access', 'Güvenlik ayarları güncellendi', null, null, 'low']
    );

    return NextResponse.json({
      success: true,
      message: 'Güvenlik ayarları güncellendi'
    });
  } catch (error) {
    console.error('Update security settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Güvenlik ayarları güncellenemedi' },
      { status: 500 }
    );
  }
}

