import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin, getUserFromToken } from '@/lib/middleware/admin-auth';

// Kayıt kilit sistemi - eş zamanlı düzenlemeyi önler

// POST: Kaydı kilitle (book, comment, setting vb.)
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { resourceType, resourceId } = await request.json();

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { success: false, error: 'Resource type ve ID gerekli' },
        { status: 400 }
      );
    }

    // Token'dan kullanıcı bilgisi al
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = token ? await getUserFromToken(token) : null;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 401 }
      );
    }

    // Kayıt zaten kilitli mi kontrol et
    const existingLock = await executeQuery(
      `SELECT * FROM concurrent_locks 
       WHERE resource_type = ? AND resource_id = ? 
       AND locked_until > NOW()
       LIMIT 1`,
      [resourceType, resourceId]
    );

    if (existingLock && existingLock.length > 0) {
      const lock = existingLock[0];
      
      // Başka biri kilitlemişse izin verme
      if (lock.admin_id !== user.id) {
        return NextResponse.json({
          success: false,
          locked: true,
          lockedBy: lock.admin_username,
          message: `Bu kayıt şu anda ${lock.admin_username} tarafından düzenleniyor`
        }, { status: 423 }); // 423 Locked
      }

      // Aynı kullanıcı ise kilit süresini uzat
      await executeQuery(
        `UPDATE concurrent_locks 
         SET locked_until = DATE_ADD(NOW(), INTERVAL 5 MINUTE),
             updated_at = NOW()
         WHERE id = ?`,
        [lock.id]
      );

      return NextResponse.json({
        success: true,
        locked: true,
        lockId: lock.id,
        message: 'Kilit süreniz uzatıldı'
      });
    }

    // Yeni kilit oluştur (5 dakika)
    const result = await executeQuery(
      `INSERT INTO concurrent_locks 
       (resource_type, resource_id, admin_id, admin_username, locked_until, created_at)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), NOW())`,
      [resourceType, resourceId, user.id, user.username]
    );

    return NextResponse.json({
      success: true,
      locked: true,
      lockId: result.insertId,
      message: 'Kayıt kilitlendi'
    });
  } catch (error) {
    console.error('Lock error:', error);
    return NextResponse.json(
      { success: false, error: 'Kilitleme başarısız' },
      { status: 500 }
    );
  }
}

// DELETE: Kilidi serbest bırak
export async function DELETE(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { resourceType, resourceId } = await request.json();

    if (!resourceType || !resourceId) {
      return NextResponse.json(
        { success: false, error: 'Resource type ve ID gerekli' },
        { status: 400 }
      );
    }

    // Token'dan kullanıcı bilgisi al
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const user = token ? await getUserFromToken(token) : null;

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı' },
        { status: 401 }
      );
    }

    // Kilidi sil (sadece kendi kilitleri silinebilir)
    await executeQuery(
      `DELETE FROM concurrent_locks 
       WHERE resource_type = ? AND resource_id = ? AND admin_id = ?`,
      [resourceType, resourceId, user.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Kilit serbest bırakıldı'
    });
  } catch (error) {
    console.error('Unlock error:', error);
    return NextResponse.json(
      { success: false, error: 'Kilit açma başarısız' },
      { status: 500 }
    );
  }
}

// GET: Aktif kilitleri listele
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('type');

    let query = `
      SELECT * FROM concurrent_locks 
      WHERE locked_until > NOW()
    `;
    const params: any[] = [];

    if (resourceType) {
      query += ` AND resource_type = ?`;
      params.push(resourceType);
    }

    query += ` ORDER BY created_at DESC`;

    const locks = await executeQuery(query, params);

    return NextResponse.json({
      success: true,
      data: locks,
      count: locks.length
    });
  } catch (error) {
    console.error('Get locks error:', error);
    return NextResponse.json(
      { success: false, error: 'Kilitler alınamadı' },
      { status: 500 }
    );
  }
}

