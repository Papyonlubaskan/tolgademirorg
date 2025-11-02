import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET: Güvenlik loglarını getir
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const severity = searchParams.get('severity');
    const type = searchParams.get('type');

    // Query oluştur
    let query = 'SELECT * FROM security_logs WHERE 1=1';
    const params: any[] = [];

    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = await executeQuery(query, params);

    // Toplam sayı
    let countQuery = 'SELECT COUNT(*) as total FROM security_logs WHERE 1=1';
    const countParams: any[] = [];
    
    if (severity) {
      countQuery += ' AND severity = ?';
      countParams.push(severity);
    }
    
    if (type) {
      countQuery += ' AND type = ?';
      countParams.push(type);
    }

    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    return successResponse({
      logs: logs || [],
      total,
      limit,
      offset
    });

  } catch (error) {
    console.error('Security logs fetch error:', error);
    return errorResponse('Güvenlik logları alınamadı', 500);
  }
}

// POST: Yeni güvenlik logu ekle
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { type, message, ip, userAgent, userId, severity, metadata } = await request.json();

    if (!type || !message) {
      return errorResponse('Type ve message gerekli', 400);
    }

    const clientIP = ip || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const ua = userAgent || request.headers.get('user-agent') || 'unknown';

    await executeQuery(
      `INSERT INTO security_logs (type, message, ip_address, user_agent, user_id, severity, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        type,
        message,
        clientIP,
        ua,
        userId || null,
        severity || 'low',
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    return successResponse({ message: 'Güvenlik logu kaydedildi' });

  } catch (error) {
    console.error('Security log create error:', error);
    return errorResponse('Güvenlik logu kaydedilemedi', 500);
  }
}

// DELETE: Eski logları temizle
export async function DELETE(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get('daysOld') || '30');

    // 30 gün önceki logları sil
    await executeQuery(
      'DELETE FROM security_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [daysOld]
    );

    return successResponse({ message: `${daysOld} gün önceki loglar temizlendi` });

  } catch (error) {
    console.error('Security logs delete error:', error);
    return errorResponse('Loglar temizlenemedi', 500);
  }
}

