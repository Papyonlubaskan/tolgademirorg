import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';

// POST: IP adresini yasakla
export async function POST(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { ipAddress, reason } = await request.json();
    
    if (!ipAddress) {
      return NextResponse.json(
        { success: false, error: 'IP adresi gerekli' },
        { status: 400 }
      );
    }

    // IP'yi yasakla
    const insertQuery = `
      INSERT INTO banned_ips (ip_address, reason, banned_by, created_at)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE reason = VALUES(reason), banned_by = VALUES(banned_by)
    `;
    
    await executeQuery(insertQuery, [
      ipAddress,
      reason || 'Spam/Kötüye kullanım',
      'admin' // Gelecekte admin kullanıcı adı eklenebilir
    ]);

    return NextResponse.json({
      success: true,
      message: `IP ${ipAddress} başarıyla yasaklandı`
    });
  } catch (error) {
    console.error('IP ban error:', error);
    return NextResponse.json(
      { success: false, error: 'IP yasaklanamadı' },
      { status: 500 }
    );
  }
}

// GET: Yasaklı IP'leri listele
export async function GET(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const bannedIPs = await executeQuery(
      'SELECT * FROM banned_ips ORDER BY created_at DESC'
    );

    return NextResponse.json({
      success: true,
      data: bannedIPs
    });
  } catch (error) {
    console.error('Get banned IPs error:', error);
    return NextResponse.json(
      { success: false, error: 'Yasaklı IP\'ler alınamadı' },
      { status: 500 }
    );
  }
}

// DELETE: IP yasağını kaldır
export async function DELETE(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const ipAddress = searchParams.get('ip');
    
    if (!ipAddress) {
      return NextResponse.json(
        { success: false, error: 'IP adresi gerekli' },
        { status: 400 }
      );
    }

    await executeQuery('DELETE FROM banned_ips WHERE ip_address = ?', [ipAddress]);

    return NextResponse.json({
      success: true,
      message: `IP ${ipAddress} yasağı kaldırıldı`
    });
  } catch (error) {
    console.error('IP unban error:', error);
    return NextResponse.json(
      { success: false, error: 'IP yasağı kaldırılamadı' },
      { status: 500 }
    );
  }
}

