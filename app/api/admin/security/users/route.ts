import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import bcrypt from 'bcryptjs';

// GET: Admin kullanıcıları getir
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const users = await executeQuery(
      'SELECT id, username, email, role, is_active, created_at FROM admins ORDER BY created_at DESC'
    );

    return NextResponse.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    return NextResponse.json(
      { success: false, error: 'Kullanıcılar alınamadı' },
      { status: 500 }
    );
  }
}

// POST: Yeni admin kullanıcısı oluştur
export async function POST(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { username, email, password, role } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı, e-posta ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Kullanıcı adı kontrolü
    const existingUser = await executeQuery(
      'SELECT id FROM admins WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Yeni kullanıcı oluştur
    const result = await executeQuery(
      'INSERT INTO admins (username, email, password_hash, role, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
      [username, email, hashedPassword, role || 'admin']
    );

    // Güvenlik logu
    await executeQuery(
      'INSERT INTO security_logs (type, message, ip, user_agent, severity, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      ['system_access', `Yeni admin kullanıcısı oluşturuldu: ${username}`, null, null, 'low']
    );

    return NextResponse.json({
      success: true,
      data: {
        id: (result as any).insertId,
        username,
        email,
        role: role || 'Admin'
      },
      message: 'Kullanıcı başarıyla oluşturuldu'
    });
  } catch (error) {
    console.error('Create admin user error:', error);
    return NextResponse.json(
      { success: false, error: 'Kullanıcı oluşturulamadı' },
      { status: 500 }
    );
  }
}

// PUT: Admin kullanıcısını güncelle
export async function PUT(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { id, username, email, role, is_active } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı ID gerekli' },
        { status: 400 }
      );
    }

    await executeQuery(
      'UPDATE admins SET username = ?, email = ?, role = ?, is_active = ? WHERE id = ?',
      [username, email, role, is_active ? 1 : 0, id]
    );

    // Güvenlik logu
    await executeQuery(
      'INSERT INTO security_logs (type, message, ip, user_agent, severity, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      ['system_access', `Admin kullanıcısı güncellendi: ${username}`, null, null, 'low']
    );

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı güncellendi'
    });
  } catch (error) {
    console.error('Update admin user error:', error);
    return NextResponse.json(
      { success: false, error: 'Kullanıcı güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE: Admin kullanıcısını sil
export async function DELETE(request: NextRequest) {
  try {
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı ID gerekli' },
        { status: 400 }
      );
    }

    // ID 1 olan kullanıcı silinemez (super admin)
    if (userId === '1') {
      return NextResponse.json(
        { success: false, error: 'Super admin kullanıcısı silinemez' },
        { status: 403 }
      );
    }

    await executeQuery('DELETE FROM admins WHERE id = ?', [userId]);

    // Güvenlik logu
    await executeQuery(
      'INSERT INTO security_logs (type, message, ip, user_agent, severity, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      ['system_access', `Admin kullanıcısı silindi (ID: ${userId})`, null, null, 'medium']
    );

    return NextResponse.json({
      success: true,
      message: 'Kullanıcı silindi'
    });
  } catch (error) {
    console.error('Delete admin user error:', error);
    return NextResponse.json(
      { success: false, error: 'Kullanıcı silinemedi' },
      { status: 500 }
    );
  }
}

