import { NextRequest, NextResponse } from 'next/server';
import { backupManager } from '@/lib/backup';
import { requireAdmin } from '@/lib/middleware/admin-auth';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Admin kontrolü
    const authError = await requireAdmin(request);
    if (authError) {
      return authError;
    }

    // Tüm yedekleri listele
    const backups = await backupManager.listBackups();
    
    // Her yedek için metadata bilgisini getir
    const backupDetails = await Promise.all(
      backups.map(async (backupName) => {
        try {
          const backupPath = path.join(process.cwd(), 'backups', backupName);
          const metadataPath = path.join(backupPath, 'backup-metadata.json');
          
          try {
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            const metadata = JSON.parse(metadataContent);
            
            return {
              name: backupName,
              createdAt: metadata.createdAt,
              files: metadata.files?.length || 0,
              options: metadata.options,
              size: await getDirectorySize(backupPath)
            };
          } catch (error) {
            // Metadata dosyası yoksa basit bilgi döndür
            const stats = await fs.stat(backupPath);
            return {
              name: backupName,
              createdAt: stats.birthtime.toISOString(),
              files: 'unknown',
              options: {},
              size: await getDirectorySize(backupPath)
            };
          }
        } catch (error) {
          console.error(`Error processing backup ${backupName}:`, error);
          return {
            name: backupName,
            createdAt: 'unknown',
            files: 'unknown',
            options: {},
            size: 0
          };
        }
      })
    );
    
    // Tarihe göre sırala (en yeni önce)
    backupDetails.sort((a, b) => {
      try {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } catch (error) {
        return 0;
      }
    });

    return NextResponse.json({
      success: true,
      data: backupDetails
    });
  } catch (error) {
    console.error('Backup list error:', error);
    return NextResponse.json(
      { success: false, error: 'Yedek listesi alınamadı' },
      { status: 500 }
    );
  }
}

async function getDirectorySize(dirPath: string): Promise<number> {
  try {
    let size = 0;
    const files = await fs.readdir(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isDirectory()) {
        size += await getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }
    
    return size;
  } catch (error) {
    console.error(`Error calculating directory size for ${dirPath}:`, error);
    return 0;
  }
}

