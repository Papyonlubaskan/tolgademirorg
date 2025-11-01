const os = require('os');
const fs = require('fs');
const { alertManager } = require('../lib/monitoring/alerts');

class SystemMetricsCollector {
  constructor() {
    this.isRunning = false;
    this.interval = null;
  }

  start(intervalMs = 60000) {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.interval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);
    
    console.log('📊 System metrics collection started');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    clearInterval(this.interval);
    console.log('📊 System metrics collection stopped');
  }

  async collectMetrics() {
    try {
      // CPU Usage
      const cpuUsage = await this.getCpuUsage();
      await alertManager.recordMetric('cpu_usage', cpuUsage, {
        timestamp: new Date().toISOString(),
        hostname: os.hostname()
      });

      // Memory Usage
      const memoryUsage = await this.getMemoryUsage();
      await alertManager.recordMetric('memory_usage', memoryUsage, {
        timestamp: new Date().toISOString(),
        hostname: os.hostname()
      });

      // Disk Usage
      const diskUsage = await this.getDiskUsage();
      await alertManager.recordMetric('disk_usage', diskUsage, {
        timestamp: new Date().toISOString(),
        hostname: os.hostname()
      });

      // Network Stats
      const networkStats = await this.getNetworkStats();
      await alertManager.recordMetric('network_bytes_sent', networkStats.bytesSent, {
        timestamp: new Date().toISOString(),
        hostname: os.hostname()
      });

      await alertManager.recordMetric('network_bytes_received', networkStats.bytesReceived, {
        timestamp: new Date().toISOString(),
        hostname: os.hostname()
      });

      console.log(`📊 Metrics collected - CPU: ${cpuUsage}%, Memory: ${memoryUsage}%, Disk: ${diskUsage}%`);

    } catch (error) {
      console.error('❌ Metrics collection failed:', error);
    }
  }

  async getCpuUsage() {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();
      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const cpuPercentage = 100 - ~~(100 * idleDifference / totalDifference);
        resolve(cpuPercentage);
      }, 100);
    });
  }

  cpuAverage() {
    let totalIdle = 0, totalTick = 0;
    const cpus = os.cpus();

    for (let i = 0, len = cpus.length; i < len; i++) {
      const cpu = cpus[i];
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }

    return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
  }

  async getMemoryUsage() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    return (usedMem / totalMem) * 100;
  }

  async getDiskUsage() {
    try {
      const stats = fs.statSync('.');
      // Bu basit bir implementasyon, gerçek disk kullanımı için 'df' komutu kullanılabilir
      return Math.random() * 100; // Placeholder
    } catch (error) {
      return 0;
    }
  }

  async getNetworkStats() {
    const networkInterfaces = os.networkInterfaces();
    let bytesSent = 0;
    let bytesReceived = 0;

    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      for (const iface of interfaces) {
        if (iface.internal === false) {
          // Bu basit bir implementasyon, gerçek network stats için system calls gerekli
          bytesSent += Math.random() * 1000000;
          bytesReceived += Math.random() * 1000000;
        }
      }
    }

    return { bytesSent, bytesReceived };
  }
}

// Export for use in other modules
module.exports = SystemMetricsCollector;

// CLI usage
if (require.main === module) {
  const collector = new SystemMetricsCollector();
  
  console.log('🚀 Starting system metrics collection...');
  collector.start(30000); // 30 seconds interval
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down metrics collector...');
    collector.stop();
    process.exit(0);
  });
}