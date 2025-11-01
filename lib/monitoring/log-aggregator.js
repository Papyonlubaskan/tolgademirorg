const fs = require('fs');
const path = require('path');
const { alertManager } = require('../lib/monitoring/alerts');

class LogAggregator {
  constructor() {
    this.logFiles = [
      'logs/app.log',
      'logs/error.log',
      'logs/access.log'
    ];
    this.errorPatterns = [
      /error/i,
      /exception/i,
      /fatal/i,
      /critical/i,
      /failed/i
    ];
    this.isRunning = false;
    this.interval = null;
  }

  start(intervalMs = 30000) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.analyzeLogs();
    }, intervalMs);
    
    console.log('📝 Log aggregation started');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    clearInterval(this.interval);
    console.log('📝 Log aggregation stopped');
  }

  async analyzeLogs() {
    try {
      let totalErrors = 0;
      let totalWarnings = 0;
      let totalRequests = 0;

      for (const logFile of this.logFiles) {
        if (fs.existsSync(logFile)) {
          const stats = await this.analyzeLogFile(logFile);
          totalErrors += stats.errors;
          totalWarnings += stats.warnings;
          totalRequests += stats.requests;
        }
      }

      // Error rate hesapla
      const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

      // Metrics kaydet
      await alertManager.recordMetric('error_rate', errorRate, {
        timestamp: new Date().toISOString(),
        totalErrors,
        totalWarnings,
        totalRequests
      });

      await alertManager.recordMetric('log_errors', totalErrors, {
        timestamp: new Date().toISOString()
      });

      await alertManager.recordMetric('log_warnings', totalWarnings, {
        timestamp: new Date().toISOString()
      });

      console.log(`📝 Log analysis - Errors: ${totalErrors}, Warnings: ${totalWarnings}, Requests: ${totalRequests}, Error Rate: ${errorRate.toFixed(2)}%`);

    } catch (error) {
      console.error('❌ Log analysis failed:', error);
    }
  }

  async analyzeLogFile(logFile) {
    return new Promise((resolve) => {
      let errors = 0;
      let warnings = 0;
      let requests = 0;

      try {
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.split('\n');

        for (const line of lines) {
          if (line.includes('ERROR') || line.includes('FATAL') || line.includes('CRITICAL')) {
            errors++;
          } else if (line.includes('WARN')) {
            warnings++;
          } else if (line.includes('GET ') || line.includes('POST ') || line.includes('PUT ') || line.includes('DELETE ')) {
            requests++;
          }
        }

        resolve({ errors, warnings, requests });
      } catch (error) {
        resolve({ errors: 0, warnings: 0, requests: 0 });
      }
    });
  }
}

module.exports = LogAggregator;

// CLI usage
if (require.main === module) {
  const aggregator = new LogAggregator();
  
  console.log('🚀 Starting log aggregation...');
  aggregator.start(30000); // 30 seconds interval
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down log aggregator...');
    aggregator.stop();
    process.exit(0);
  });
}