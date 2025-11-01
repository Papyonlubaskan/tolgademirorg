import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return errorResponse('Kullanıcı ID ve yeni şifre gerekli', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse('Şifre en az 6 karakter olmalı', 400);
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Şifreyi güncelle
    const result = await executeQuery(
      'UPDATE admins SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    if ((result as any).affectedRows === 0) {
      return errorResponse('Kullanıcı bulunamadı', 404);
    }

    // Güvenlik logu
    await executeQuery(
      'INSERT INTO security_logs (type, message, ip, severity, created_at) VALUES (?, ?, ?, ?, NOW())',
      ['system_access', `Admin kullanıcı şifresi değiştirildi (ID: ${userId})`, null, 'medium']
    );

    return successResponse({ 
      message: 'Şifre başarıyla değiştirildi'
    });

  } catch (error: any) {
    console.error('Password change error:', error);
    return errorResponse(`Şifre değiştirilemedi: ${error.message}`, 500);
  }
}

