import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database/mysql';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

// PUT: Sayfayı güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const pageId = (await params).id;
    const data = await request.json();

    // Sistem sayfaları için settings'e kaydet
    if (pageId.startsWith('page_')) {
      const settingsKey = `page_${pageId}`;
      const settingsValue = JSON.stringify(data);

      await executeQuery(
        `INSERT INTO site_settings (setting_key, setting_value) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [settingsKey, settingsValue, settingsValue]
      );

      return successResponse({ message: 'Sayfa güncellendi' });
    }

    // Özel sayfalar için DB'ye kaydet
    const { title, slug, content, meta_title, meta_description, is_active } = data;

    const updateQuery = `
      UPDATE pages 
      SET title = ?, slug = ?, content = ?, meta_title = ?, meta_description = ?, is_active = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await executeQuery(updateQuery, [
      title,
      slug,
      content || '',
      meta_title || title,
      meta_description || '',
      is_active ? 1 : 0,
      pageId
    ]);

    return successResponse({ message: 'Sayfa güncellendi' });
  } catch (error) {
    console.error('Page update error:', error);
    return errorResponse('Sayfa güncellenemedi', 500);
  }
}

// DELETE: Sayfayı sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const pageId = (await params).id;

    await executeQuery('DELETE FROM pages WHERE id = ?', [pageId]);

    return successResponse({ message: 'Sayfa silindi' });
  } catch (error) {
    console.error('Page delete error:', error);
    return errorResponse('Sayfa silinemedi', 500);
  }
}

