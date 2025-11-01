import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { executeQuery } from '@/lib/database/mysql';

const JWT_SECRET = process.env.JWT_SECRET || 'tolgademir-super-secret-jwt-key-2024';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Admin authentication middleware
 * Kullanım: API route'larında admin kontrolü için
 * ⚠️ GELİŞTİRME MODUNDA DEVRE DIŞI
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Token'ı al
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('⚠️ No token provided - auth geçici olarak devre dışı');
      return null; // Geçici olarak auth'u bypass et
      // return NextResponse.json({ 
      //   success: false, 
      //   error: 'Unauthorized - No token provided' 
      // }, { status: 401 });
    }

    // Token'ı doğrula
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - Invalid token' 
      }, { status: 401 });
    }

    // Kullanıcıyı veritabanından kontrol et
    const query = 'SELECT id, email, username FROM admins WHERE id = ? AND is_active = 1 LIMIT 1';
    const result = await executeQuery(query, [decoded.id]);
    
    if (!result || result.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized - User not found or inactive' 
      }, { status: 401 });
    }

    const user = result[0];

    // Admins tablosundaki tüm kullanıcılar admin'dir
    // Role kontrolüne gerek yok

    // Auth successful - null döndür (devam et)
    return null;

  } catch (error) {
    console.error('Admin auth middleware error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Authentication failed' 
    }, { status: 500 });
  }
}

/**
 * Helper function - Token'dan kullanıcı bilgisi çıkar
 */
export async function getUserFromToken(token: string): Promise<any | null> {
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    
    const query = 'SELECT id, email, username FROM admins WHERE id = ? AND is_active = 1 LIMIT 1';
    const result = await executeQuery(query, [decoded.id]);
    
    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    return null;
  }
}
