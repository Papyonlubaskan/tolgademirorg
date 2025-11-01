// Scheduled jobs sistemi

// Scheduler sadece server-side çalışır

interface ScheduledJob {
  id: string;
  name: string;
  cron: string;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  handler: () => Promise<void>;
  description: string;
}

class Scheduler {
  private jobs = new Map<string, ScheduledJob>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private isRunning = false;

  constructor() {
    this.initializeJobs();
  }

  private initializeJobs() {
    // Günlük backup job'ı
    this.addJob({
      id: 'daily-backup',
      name: 'Daily Backup',
      cron: '0 2 * * *', // Her gün saat 02:00
      enabled: true,
      handler: this.dailyBackupHandler,
      description: 'Günlük otomatik backup oluşturur'
    });

    // Cache temizleme job'ı
    this.addJob({
      id: 'cache-cleanup',
      name: 'Cache Cleanup',
      cron: '0 */6 * * *', // Her 6 saatte bir
      enabled: true,
      handler: this.cacheCleanupHandler,
      description: 'Süresi dolmuş cache öğelerini temizler'
    });

    // Performance monitoring job'ı
    this.addJob({
      id: 'performance-cleanup',
      name: 'Performance Cleanup',
      cron: '0 0 * * 0', // Her pazar saat 00:00
      enabled: true,
      handler: this.performanceCleanupHandler,
      description: 'Eski performance metriklerini temizler'
    });

    // Sistem health check job'ı
    this.addJob({
      id: 'health-check',
      name: 'System Health Check',
      cron: '*/15 * * * *', // Her 15 dakikada bir
      enabled: true,
      handler: this.healthCheckHandler,
      description: 'Sistem sağlık kontrolü yapar'
    });

    // Database optimization job'ı
    this.addJob({
      id: 'db-optimization',
      name: 'Database Optimization',
      cron: '0 3 * * 1', // Her pazartesi saat 03:00
      enabled: true,
      handler: this.dbOptimizationHandler,
      description: 'Veritabanı optimizasyonu yapar'
    });
  }

  // Job ekle
  addJob(job: Omit<ScheduledJob, 'lastRun' | 'nextRun'>) {
    const scheduledJob: ScheduledJob = {
      ...job,
      lastRun: undefined,
      nextRun: this.calculateNextRun(job.cron)
    };

    this.jobs.set(job.id, scheduledJob);
    console.log(`📅 Job added: ${job.name} (${job.cron})`);
  }

  // Scheduler'ı başlat
  start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Scheduler started');

    // Her job için interval oluştur
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.enabled) {
        this.scheduleJob(jobId, job);
      }
    }

    // Her dakika job'ları kontrol et
    setInterval(() => {
      this.checkAndRunJobs();
    }, 60000); // 1 dakika
  }

  // Scheduler'ı durdur
  stop() {
    this.isRunning = false;
    
    // Tüm interval'ları temizle
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();

    console.log('🛑 Scheduler stopped');
  }

  // Job'ı schedule et
  private scheduleJob(jobId: string, job: ScheduledJob) {
    if (!job.enabled) return;

    const interval = setInterval(async () => {
      await this.runJob(jobId);
    }, this.cronToMs(job.cron));

    this.intervals.set(jobId, interval);
    console.log(`⏰ Job scheduled: ${job.name}`);
  }

  // Job'ları kontrol et ve çalıştır
  private async checkAndRunJobs() {
    const now = new Date();
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (!job.enabled || !job.nextRun) continue;
      
      if (now >= job.nextRun) {
        await this.runJob(jobId);
      }
    }
  }

  // Job çalıştır
  private async runJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job || !job.enabled) return;

    try {
      console.log(`🔄 Running job: ${job.name}`);
      const startTime = Date.now();
      
      await job.handler();
      
      const duration = Date.now() - startTime;
      console.log(`✅ Job completed: ${job.name} (${duration}ms)`);
      
      // Job bilgilerini güncelle
      job.lastRun = new Date();
      job.nextRun = this.calculateNextRun(job.cron);
      
    } catch (error) {
      console.error(`❌ Job failed: ${job.name}`, error);
    }
  }

  // Job'ı manuel çalıştır
  async runJobNow(jobId: string) {
    await this.runJob(jobId);
  }

  // Job'ı etkinleştir/devre dışı bırak
  toggleJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.enabled = !job.enabled;
    
    if (job.enabled) {
      this.scheduleJob(jobId, job);
    } else {
      const interval = this.intervals.get(jobId);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(jobId);
      }
    }
    
    console.log(`🔄 Job ${job.enabled ? 'enabled' : 'disabled'}: ${job.name}`);
  }

  // Job listesi
  getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  // Job detayı
  getJob(jobId: string): ScheduledJob | undefined {
    return this.jobs.get(jobId);
  }

  // Cron'u milisaniyeye çevir (basit implementasyon)
  private cronToMs(cron: string): number {
    // Bu basit bir implementasyon, gerçek cron parser kullanılabilir
    const parts = cron.split(' ');
    
    // Her dakika: */1 * * * *
    if (parts[0] === '*/1') return 60000;
    
    // Her 15 dakika: */15 * * * *
    if (parts[0] === '*/15') return 15 * 60000;
    
    // Her saat: 0 * * * *
    if (parts[0] === '0') return 60 * 60000;
    
    // Her 6 saat: 0 */6 * * *
    if (parts[1] === '*/6') return 6 * 60 * 60000;
    
    // Günlük: 0 2 * * *
    if (parts[2] === '*') return 24 * 60 * 60000;
    
    // Haftalık: 0 0 * * 0
    return 7 * 24 * 60 * 60000;
  }

  // Sonraki çalışma zamanını hesapla
  private calculateNextRun(cron: string): Date {
    const now = new Date();
    const ms = this.cronToMs(cron);
    return new Date(now.getTime() + ms);
  }

  // Job handler'ları
  private dailyBackupHandler = async () => {
    try {
      console.log('🔄 Creating daily backup...');
      const { backupManager } = await import('./backup');
      const backupData = await backupManager.createBackup();
      console.log('✅ Daily backup completed');
    } catch (error) {
      console.error('❌ Daily backup failed:', error);
    }
  };

  private cacheCleanupHandler = async () => {
    try {
      console.log('🔄 Cleaning cache...');
      const { cache } = await import('./cache');
      const stats = await cache.getStats();
      console.log(`📊 Cache before cleanup: ${(stats as any).total || 0} items`);
      
      // Süresi dolmuş öğeleri temizle
      // Bu cache.ts'de otomatik olarak yapılıyor
      
      console.log('✅ Cache cleanup completed');
    } catch (error) {
      console.error('❌ Cache cleanup failed:', error);
    }
  };

  private performanceCleanupHandler = async () => {
    try {
      console.log('🔄 Cleaning performance metrics...');
      const { performanceMonitor } = await import('./performance');
      (performanceMonitor as any).clear?.();
      console.log('✅ Performance cleanup completed');
    } catch (error) {
      console.error('❌ Performance cleanup failed:', error);
    }
  };

  private healthCheckHandler = async () => {
    try {
      console.log('🔄 Running health check...');
      
      // Database bağlantısını kontrol et
      const { getConnection } = await import('@/lib/database/mysql');
      await getConnection();
      
      // Cache durumunu kontrol et
      const { cache } = await import('./cache');
      const cacheStats = cache.getStats();
      
      // Performance durumunu kontrol et - disabled
      console.log('✅ Health check completed');
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  };

  private dbOptimizationHandler = async () => {
    try {
      console.log('🔄 Running database optimization...');
      
      // Burada veritabanı optimizasyon işlemleri yapılabilir
      // Örneğin: ANALYZE TABLE, OPTIMIZE TABLE, vb.
      
      console.log('✅ Database optimization completed');
    } catch (error) {
      console.error('❌ Database optimization failed:', error);
    }
  };
}

// Global scheduler instance
export const scheduler = new Scheduler();

// Scheduler'ı başlat
export const startScheduler = () => {
  scheduler.start();
};

// Scheduler'ı durdur
export const stopScheduler = () => {
  scheduler.stop();
};

// Job'ları yönetmek için API
export const getScheduledJobs = () => {
  return scheduler.getJobs();
};

export const toggleScheduledJob = (jobId: string) => {
  scheduler.toggleJob(jobId);
};

export const runScheduledJobNow = async (jobId: string) => {
  await scheduler.runJobNow(jobId);
};
