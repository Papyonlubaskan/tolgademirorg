import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    // Mock admin user (tablo henüz yok)
    const mockAdmin = {
      id: 1,
      username: 'admin',
      email: 'admin@tolgademir.org',
      two_factor_secret: null,
      is_active: true,
      created_at: new Date().toISOString()
    };

    return successResponse({ user: mockAdmin });
  } catch (error) {
    console.error('Get admin user error:', error);
    return errorResponse('Kullanıcı bilgileri alınamadı', 500);
  }
}

