import { NextRequest } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { successResponse, errorResponse } from '@/lib/api-response';

// GET: Abonelikten çık
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return errorResponse('Unsubscribe token required', 400);
    }

    // Token ile subscriber bul
    const subscribers = await executeQuery(
      'SELECT id, email FROM newsletter_subscribers WHERE unsubscribe_token = ? LIMIT 1',
      [token]
    ) as any[];

    if (subscribers.length === 0) {
      return errorResponse('Invalid or expired unsubscribe link', 404);
    }

    // Aboneliği iptal et
    await executeQuery(
      "UPDATE newsletter_subscribers SET status = 'unsubscribed', updated_at = NOW() WHERE id = ?",
      [subscribers[0].id]
    );

    return successResponse(
      { email: subscribers[0].email },
      'Successfully unsubscribed from newsletter'
    );

  } catch (error) {
    console.error('Unsubscribe error:', error);
    return errorResponse('Failed to unsubscribe', 500);
  }
}

