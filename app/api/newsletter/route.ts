import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { emailService } from '@/lib/email';
import { Validator } from '@/lib/validations';
import { apiRateLimiter } from '@/lib/rateLimiter';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-response';

// GET: Newsletter abonelerini listele (Admin)
export async function GET(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = 'SELECT * FROM newsletter_subscribers';
    const params: any[] = [];

    if (status !== 'all') {
      query += ' WHERE status = ?';
      params.push(status);
    }

    // Toplam sayıyı al
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const countResult = await executeQuery(countQuery, params) as any[];
    const total = countResult[0]?.total || 0;

    // Aboneleri çek
    query += ' ORDER BY subscribed_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const subscribers = await executeQuery(query, params);

    return paginatedResponse(subscribers, total, limit, offset);
  } catch (error) {
    console.error('Newsletter list error:', error);
    return errorResponse('Aboneler yüklenirken hata oluştu', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimit = apiRateLimiter.check(clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' 
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetTime.toString()
        }
      });
    }

    const { email, name } = await request.json();

    // Input validation
    const emailValidation = Validator.validateEmail(email);
    if (!emailValidation.isValid) {
      return errorResponse(emailValidation.errors.join(', '), 400);
    }

    // Name validation (optional)
    let nameValidation: { isValid: boolean; errors: string[] } = { isValid: true, errors: [] };
    if (name && name.trim()) {
      nameValidation = Validator.validateName(name, 'İsim');
      if (!nameValidation.isValid) {
        return errorResponse(nameValidation.errors.join(', '), 400);
      }
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name ? Validator.sanitizeInput(name.trim()) : null;

    // Check if email already exists
    const existingSubscriber = await executeQuery(
      'SELECT id FROM newsletter_subscribers WHERE email = ?',
      [sanitizedEmail]
    );

    if (existingSubscriber.length > 0) {
      return errorResponse('Bu e-posta adresi zaten kayıtlı', 400);
    }

    // Add to newsletter subscribers
    await executeQuery(
      'INSERT INTO newsletter_subscribers (email, name, subscribed_at, status) VALUES (?, ?, NOW(), "active")',
      [sanitizedEmail, sanitizedName]
    );

    // Send confirmation email
    await emailService.sendNewsletterConfirmation(sanitizedEmail, sanitizedName || undefined);

    return successResponse(
      { message: 'Newsletter\'a başarıyla kaydoldunuz!' },
      'Newsletter aboneliği başarılı',
      {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetTime.toString()
      }
    );

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return errorResponse('Bir hata oluştu. Lütfen tekrar deneyin.', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return errorResponse('E-posta adresi gerekli', 400);
    }

    const emailValidation = Validator.validateEmail(email);
    if (!emailValidation.isValid) {
      return errorResponse(emailValidation.errors.join(', '), 400);
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Remove from newsletter
    const result = await executeQuery(
      'DELETE FROM newsletter_subscribers WHERE email = ?',
      [sanitizedEmail]
    );

    if (result.affectedRows === 0) {
      return errorResponse('Bu e-posta adresi kayıtlı değil', 404);
    }

    return successResponse(
      { message: 'Newsletter aboneliğiniz iptal edildi' },
      'Newsletter aboneliğinden çıkıldı'
    );

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return errorResponse('Bir hata oluştu. Lütfen tekrar deneyin.', 500);
  }
}
