import fs from 'fs/promises';
import path from 'path';

export interface BackupOptions {
  includeData: boolean;
  includeImages: boolean;
  backupName?: string;
}

export class BackupManager {
  private dataDir: string;
  private backupDir: string;

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    this.backupDir = path.join(process.cwd(), 'backups');
  }

  async createBackup(options: BackupOptions = { includeData: true, includeImages: false }): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = options.backupName || `backup-${timestamp}`;
      const backupPath = path.join(this.backupDir, backupName);

      // Backup dizinini oluştur
      await fs.mkdir(backupPath, { recursive: true });

      if (options.includeData) {
        // JSON dosyalarını yedekle
        await this.backupJsonFiles(backupPath);
      }

      if (options.includeImages) {
        // Resim dosyalarını yedekle
        await this.backupImages(backupPath);
      }

      // Backup metadata'sını oluştur
      await this.createBackupMetadata(backupPath, options);

      console.log(`Backup created: ${backupName}`);
      return backupName;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw new Error('Backup creation failed');
    }
  }

  private async backupJsonFiles(backupPath: string): Promise<void> {
    const jsonFiles = ['books.json', 'settings.json', 'likes.json', 'users.json'];
    
    for (const file of jsonFiles) {
      const sourcePath = path.join(this.dataDir, file);
      const destPath = path.join(backupPath, file);
      
      try {
        await fs.copyFile(sourcePath, destPath);
      } catch (error) {
        // Dosya yoksa devam et
        console.warn(`File not found: ${file}`);
      }
    }

    // Content klasörünü de yedekle
    const contentDir = path.join(this.dataDir, 'content');
    const backupContentDir = path.join(backupPath, 'content');
    
    try {
      await fs.mkdir(backupContentDir, { recursive: true });
      const contentFiles = await fs.readdir(contentDir);
      
      for (const file of contentFiles) {
        if (file.endsWith('.json')) {
          const sourcePath = path.join(contentDir, file);
          const destPath = path.join(backupContentDir, file);
          await fs.copyFile(sourcePath, destPath);
        }
      }
    } catch (error) {
      console.warn('Content directory backup failed:', error);
    }
  }

  private async backupImages(backupPath: string): Promise<void> {
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    const backupImagesDir = path.join(backupPath, 'images');
    
    try {
      await fs.mkdir(backupImagesDir, { recursive: true });
      
      const imageFiles = await fs.readdir(imagesDir);
      
      for (const file of imageFiles) {
        const sourcePath = path.join(imagesDir, file);
        const destPath = path.join(backupImagesDir, file);
        
        const stat = await fs.stat(sourcePath);
        if (stat.isFile()) {
          await fs.copyFile(sourcePath, destPath);
        }
      }
    } catch (error) {
      console.warn('Images backup failed:', error);
    }
  }

  private async createBackupMetadata(backupPath: string, options: BackupOptions): Promise<void> {
    const metadata = {
      createdAt: new Date().toISOString(),
      version: '1.0.0',
      options,
      files: await this.getBackupFiles(backupPath)
    };

    const metadataPath = path.join(backupPath, 'backup-metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  private async getBackupFiles(backupPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(backupPath, { recursive: true });
      return files.filter(file => typeof file === 'string' && file !== 'backup-metadata.json');
    } catch (error) {
      return [];
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const backups = await fs.readdir(this.backupDir);
      return backups.filter(backup => {
        return fs.stat(path.join(this.backupDir, backup)).then(stat => stat.isDirectory()).catch(() => false);
      });
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  async restoreBackup(backupName: string): Promise<boolean> {
    try {
      const backupPath = path.join(this.backupDir, backupName);
      
      // Backup metadata'sını kontrol et
      const metadataPath = path.join(backupPath, 'backup-metadata.json');
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      
      // Mevcut veriyi yedekle
      await this.createBackup({ 
        includeData: true,
        includeImages: false,
        backupName: `pre-restore-${Date.now()}` 
      });

      // Backup'tan geri yükle
      if (metadata.options.includeData) {
        await this.restoreJsonFiles(backupPath);
      }

      console.log(`Backup restored: ${backupName}`);
      return true;
    } catch (error) {
      console.error('Backup restore failed:', error);
      return false;
    }
  }

  private async restoreJsonFiles(backupPath: string): Promise<void> {
    const jsonFiles = ['books.json', 'settings.json', 'likes.json', 'users.json'];
    
    for (const file of jsonFiles) {
      const sourcePath = path.join(backupPath, file);
      const destPath = path.join(this.dataDir, file);
      
      try {
        await fs.copyFile(sourcePath, destPath);
      } catch (error) {
        console.warn(`Failed to restore file: ${file}`);
      }
    }

    // Content klasörünü geri yükle
    const contentDir = path.join(this.dataDir, 'content');
    const backupContentDir = path.join(backupPath, 'content');
    
    try {
      await fs.mkdir(contentDir, { recursive: true });
      const contentFiles = await fs.readdir(backupContentDir);
      
      for (const file of contentFiles) {
        if (file.endsWith('.json')) {
          const sourcePath = path.join(backupContentDir, file);
          const destPath = path.join(contentDir, file);
          await fs.copyFile(sourcePath, destPath);
        }
      }
    } catch (error) {
      console.warn('Content directory restore failed:', error);
    }
  }

  async deleteBackup(backupName: string): Promise<boolean> {
    try {
      const backupPath = path.join(this.backupDir, backupName);
      await fs.rm(backupPath, { recursive: true, force: true });
      console.log(`Backup deleted: ${backupName}`);
      return true;
    } catch (error) {
      console.error('Backup deletion failed:', error);
      return false;
    }
  }

  async cleanupOldBackups(keepCount: number = 10): Promise<number> {
    try {
      const backups = await this.listBackups();
      const backupStats = await Promise.all(
        backups.map(async (backup) => {
          const backupPath = path.join(this.backupDir, backup);
          const stat = await fs.stat(backupPath);
          return { name: backup, createdAt: stat.birthtime };
        })
      );

      // En eski backup'ları sırala
      backupStats.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      // Fazla backup'ları sil
      const toDelete = backupStats.slice(0, Math.max(0, backupStats.length - keepCount));
      let deletedCount = 0;

      for (const backup of toDelete) {
        if (await this.deleteBackup(backup.name)) {
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Backup cleanup failed:', error);
      return 0;
    }
  }
}

export const backupManager = new BackupManager();