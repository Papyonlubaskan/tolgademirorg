const http = require('http');
const { alertManager } = require('../lib/monitoring/alerts');

class HealthChecker {
  constructor() {
    this.checks = [
      { name: 'Homepage', url: 'http://localhost:3000', expectedStatus: 200 },
      { name: 'Books Page', url: 'http://localhost:3000/kitaplar', expectedStatus: 200 },
      { name: 'About Page', url: 'http://localhost:3000/hakkimda', expectedStatus: 200 },
      { name: 'Contact Page', url: 'http://localhost:3000/iletisim', expectedStatus: 200 },
      { name: 'API Health', url: 'http://localhost:3000/api/health', expectedStatus: 200 }
    ];
    this.isRunning = false;
    this.interval = null;
  }

  start(intervalMs = 60000) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.runChecks();
    }, intervalMs);
    
    console.log('🔍 Health checks started');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    clearInterval(this.interval);
    console.log('🔍 Health checks stopped');
  }

  async runChecks() {
    const results = [];
    
    for (const check of this.checks) {
      const result = await this.checkEndpoint(check);
      results.push(result);
    }

    const successfulChecks = results.filter(r => r.success).length;
    const totalChecks = results.length;
    const successRate = (successfulChecks / totalChecks) * 100;

    // Metrics kaydet
    await alertManager.recordMetric('health_check_success_rate', successRate, {
      timestamp: new Date().toISOString(),
      totalChecks,
      successfulChecks,
      failedChecks: totalChecks - successfulChecks
    });

    console.log(`🔍 Health check results - Success Rate: ${successRate.toFixed(2)}% (${successfulChecks}/${totalChecks})`);

    // Başarısız check'ler varsa log
    const failedChecks = results.filter(r => !r.success);
    if (failedChecks.length > 0) {
      console.warn('⚠️ Failed health checks:', failedChecks.map(c => c.name).join(', '));
    }
  }

  async checkEndpoint(check) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const req = http.get(check.url, (res) => {
        const responseTime = Date.now() - startTime;
        
        resolve({
          name: check.name,
          success: res.statusCode === check.expectedStatus,
          statusCode: res.statusCode,
          responseTime,
          url: check.url
        });
      });

      req.on('error', (error) => {
        resolve({
          name: check.name,
          success: false,
          error: error.message,
          url: check.url
        });
      });

      req.setTimeout(5000, () => {
        req.destroy();
        resolve({
          name: check.name,
          success: false,
          error: 'Timeout',
          url: check.url
        });
      });
    });
  }
}

module.exports = HealthChecker;

// CLI usage
if (require.main === module) {
  const healthChecker = new HealthChecker();
  
  console.log('🚀 Starting health checks...');
  healthChecker.start(60000); // 1 minute interval
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down health checker...');
    healthChecker.stop();
    process.exit(0);
  });
}