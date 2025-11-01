import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';

// GET: Aktif admin kullanıcılarını listele
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    // Son 5 dakikada aktif olan sessionları getir
    const query = `
      SELECT 
        s.id,
        s.admin_id,
        s.last_activity,
        s.ip_address,
        s.user_agent,
        a.username,
        a.email
      FROM admin_sessions s
      LEFT JOIN admins a ON s.admin_id = a.id
      WHERE s.is_active = 1 
        AND s.expires_at > NOW()
        AND s.last_activity > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      ORDER BY s.last_activity DESC
    `;

    const activeSessions = await executeQuery(query);

    return NextResponse.json({
      success: true,
      data: activeSessions,
      count: activeSessions.length
    });
  } catch (error) {
    console.error('Get active users error:', error);
    return NextResponse.json(
      { success: false, error: 'Aktif kullanıcılar alınamadı' },
      { status: 500 }
    );
  }
}

// POST: Session aktivite güncelle (heartbeat)
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID gerekli' },
        { status: 400 }
      );
    }

    // IP ve user agent bilgisi al
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Session aktivitesini güncelle
    await executeQuery(
      `UPDATE admin_sessions 
       SET last_activity = NOW(),
           ip_address = ?,
           user_agent = ?
       WHERE token = ? AND is_active = 1`,
      [clientIP, userAgent, sessionId]
    );

    return NextResponse.json({
      success: true,
      message: 'Session güncellendi'
    });
  } catch (error) {
    console.error('Update session activity error:', error);
    return NextResponse.json(
      { success: false, error: 'Session güncellenemedi' },
      { status: 500 }
    );
  }
}

