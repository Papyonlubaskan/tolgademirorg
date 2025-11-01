import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.startSystemMonitoring();
  }

  recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }

    (logger as any).performanceMetric?.(name, value, unit, { tags });
  }

  async getSystemMetrics(): Promise<any> {
    const os = require('os');
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      cpu: {
        usage: 0,
        load: os.loadavg()
      },
      memory: {
        used: usedMemory,
        total: totalMemory,
        free: freeMemory,
        percentage: (usedMemory / totalMemory) * 100
      },
      uptime: Date.now() - this.startTime
    };
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }
    
    const allMetrics: PerformanceMetric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }
    
    return allMetrics.sort((a, b) => b.timestamp - a.timestamp);
  }

  private startSystemMonitoring(): void {
    setInterval(async () => {
      try {
        const systemMetrics = await this.getSystemMetrics();
        
        this.recordMetric('system_memory_usage', systemMetrics.memory.percentage, 'percent');
        this.recordMetric('system_uptime', systemMetrics.uptime, 'ms');
        
      } catch (error) {
        logger.error('PERFORMANCE', 'Failed to collect system metrics', { error: error.message });
      }
    }, 30000);
  }

  async getHealthStatus(): Promise<any> {
    const systemMetrics = await this.getSystemMetrics();
    
    return {
      status: systemMetrics.memory.percentage > 90 ? 'critical' : 'healthy',
      checks: [{
        name: 'memory',
        status: systemMetrics.memory.percentage > 90 ? 'fail' : 'pass',
        message: `Memory usage: ${systemMetrics.memory.percentage.toFixed(2)}%`,
        value: systemMetrics.memory.percentage
      }]
    };
  }
}

const performanceMonitor = new PerformanceMonitor();

export { performanceMonitor };
export default performanceMonitor;

// Export as monitoring for API routes
export const monitoring = performanceMonitor;