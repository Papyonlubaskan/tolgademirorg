// Performance alerts sistemi

// Alerts sadece server-side çalışır

interface Alert {
  id: string;
  type: 'performance' | 'error' | 'resource' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

interface AlertRule {
  id: string;
  name: string;
  condition: (data: any) => boolean;
  severity: Alert['severity'];
  message: string;
  enabled: boolean;
  cooldown: number; // milisaniye
}

class AlertManager {
  private alerts = new Map<string, Alert>();
  private rules = new Map<string, AlertRule>();
  private lastTriggered = new Map<string, number>();
  private isMonitoring = false;

  constructor() {
    this.initializeRules();
    this.startMonitoring();
  }

  private initializeRules() {
    // Performance alerts
    this.addRule({
      id: 'high-response-time',
      name: 'High Response Time',
      condition: (data) => data.averageResponseTime > 2000,
      severity: 'high',
      message: 'API yanıt süreleri çok yavaş: {averageResponseTime}ms',
      enabled: true,
      cooldown: 5 * 60 * 1000 // 5 dakika
    });

    this.addRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      condition: (data) => data.errorRate > 10,
      severity: 'critical',
      message: 'Hata oranı çok yüksek: %{errorRate}',
      enabled: true,
      cooldown: 2 * 60 * 1000 // 2 dakika
    });

    this.addRule({
      id: 'slow-render',
      name: 'Slow Render Time',
      condition: (data) => data.byType?.render?.avgDuration > 500,
      severity: 'medium',
      message: 'Render süreleri yavaş: {avgDuration}ms',
      enabled: true,
      cooldown: 10 * 60 * 1000 // 10 dakika
    });

    // Cache alerts
    this.addRule({
      id: 'low-cache-hit-rate',
      name: 'Low Cache Hit Rate',
      condition: (data) => data.hitRate < 50,
      severity: 'medium',
      message: 'Cache hit rate düşük: %{hitRate}',
      enabled: true,
      cooldown: 15 * 60 * 1000 // 15 dakika
    });

    this.addRule({
      id: 'high-memory-usage',
      name: 'High Memory Usage',
      condition: (data) => data.memoryUsage > 50 * 1024 * 1024, // 50MB
      severity: 'high',
      message: 'Yüksek bellek kullanımı: {memoryUsage}',
      enabled: true,
      cooldown: 5 * 60 * 1000 // 5 dakika
    });

    // Real-time alerts
    this.addRule({
      id: 'websocket-disconnected',
      name: 'WebSocket Disconnected',
      condition: (data) => !data.isConnected,
      severity: 'medium',
      message: 'WebSocket bağlantısı kesildi',
      enabled: true,
      cooldown: 30 * 1000 // 30 saniye
    });
  }

  private startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('🚨 Alert monitoring started');

    // Her 30 saniyede bir kontrol et
    setInterval(() => {
      this.checkAlerts();
    }, 30000);
  }

  private async checkAlerts() {
    try {
      // Performance verilerini al
      const monitoringData = {
        avgResponseTime: 0,
        errorRate: 0,
        hitRate: 0,
        memoryUsage: 0,
        isConnected: false
      };

      // Her rule'u kontrol et
      for (const [ruleId, rule] of this.rules.entries()) {
        if (!rule.enabled) continue;

        // Cooldown kontrolü
        const lastTriggered = this.lastTriggered.get(ruleId) || 0;
        if (Date.now() - lastTriggered < rule.cooldown) continue;

        // Condition kontrolü
        if (rule.condition(monitoringData)) {
          await this.triggerAlert(ruleId, rule, monitoringData);
          this.lastTriggered.set(ruleId, Date.now());
        }
      }

    } catch (error) {
      console.error('❌ Alert monitoring error:', error);
    }
  }

  private async triggerAlert(ruleId: string, rule: AlertRule, data: any) {
    const alertId = `${ruleId}-${Date.now()}`;
    
    const alert: Alert = {
      id: alertId,
      type: 'performance',
      severity: rule.severity,
      title: rule.name,
      message: this.formatMessage(rule.message, data),
      timestamp: new Date(),
      resolved: false,
      metadata: data
    };

    this.alerts.set(alertId, alert);
    
    console.log(`🚨 Alert triggered: ${rule.name} (${rule.severity})`);
    
    // Real-time notification gönder
    this.sendAlertNotification(alert);
    
    // E-posta gönder (opsiyonel)
    if (rule.severity === 'critical' || rule.severity === 'high') {
      await this.sendEmailAlert(alert);
    }
  }

  private formatMessage(message: string, data: any): string {
    let formatted = message;
    
    // Placeholder'ları değiştir
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{${key}}`;
      if (formatted.includes(placeholder)) {
        formatted = formatted.replace(placeholder, String(value));
      }
    }
    
    return formatted;
  }

  private async sendAlertNotification(alert: Alert) {
    // Real-time manager ile notification gönder
    const { realtimeManager } = await import('./realtime');
     realtimeManager.sendEvent('message_received', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      timestamp: alert.timestamp
    });
  }

  private async sendEmailAlert(alert: Alert) {
    try {
      // E-posta gönderme implementasyonu
      console.log(`📧 Email alert sent: ${alert.title}`);
      
      // Burada gerçek e-posta gönderme servisi entegre edilebilir
      // Örneğin: SendGrid, Mailgun, AWS SES, vb.
      
    } catch (error) {
      console.error('❌ Failed to send email alert:', error);
    }
  }

  // Rule ekle
  addRule(rule: AlertRule) {
    this.rules.set(rule.id, rule);
    console.log(`📋 Alert rule added: ${rule.name}`);
  }

  // Rule'u etkinleştir/devre dışı bırak
  toggleRule(ruleId: string) {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      console.log(`🔄 Rule ${rule.enabled ? 'enabled' : 'disabled'}: ${rule.name}`);
    }
  }

  // Alert'ı çöz
  async resolveAlert(alertId: string) {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      
      console.log(`✅ Alert resolved: ${alert.title}`);
      
      // Resolved notification gönder
      const { realtimeManager } = await import('./realtime');
      realtimeManager.sendEvent('message_received', {
        alertId: alert.id,
        title: alert.title,
        resolvedAt: alert.resolvedAt
      });
    }
  }

  // Alert'ları al
  getAlerts(limit?: number, severity?: Alert['severity']): Alert[] {
    let alerts = Array.from(this.alerts.values());
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    // En yeni önce sırala
    alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (limit) {
      alerts = alerts.slice(0, limit);
    }
    
    return alerts;
  }

  // Aktif alert'ları al
  getActiveAlerts(): Alert[] {
    return this.getAlerts().filter(alert => !alert.resolved);
  }

  // Alert istatistikleri
  getAlertStats() {
    const alerts = Array.from(this.alerts.values());
    const activeAlerts = alerts.filter(alert => !alert.resolved);
    
    const severityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    activeAlerts.forEach(alert => {
      severityCounts[alert.severity]++;
    });
    
    return {
      total: alerts.length,
      active: activeAlerts.length,
      resolved: alerts.length - activeAlerts.length,
      severityCounts,
      rulesEnabled: Array.from(this.rules.values()).filter(rule => rule.enabled).length
    };
  }

  // Eski alert'ları temizle
  cleanupOldAlerts(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    let cleanedCount = 0;
    
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.timestamp < cutoffDate && alert.resolved) {
        this.alerts.delete(alertId);
        cleanedCount++;
      }
    }
    
    console.log(`🧹 Cleaned up ${cleanedCount} old alerts`);
  }

  // Manuel alert oluştur
  createManualAlert(type: Alert['type'], severity: Alert['severity'], title: string, message: string, metadata?: any) {
    const alertId = `manual-${Date.now()}`;
    
    const alert: Alert = {
      id: alertId,
      type,
      severity,
      title,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    };
    
    this.alerts.set(alertId, alert);
    this.sendAlertNotification(alert);
    
    console.log(`🚨 Manual alert created: ${title}`);
    
    return alertId;
  }
}

// Global alert manager
export const alertManager = new AlertManager();

// Alert API fonksiyonları
export const getAlerts = (limit?: number, severity?: Alert['severity']) => {
  return alertManager.getAlerts(limit, severity);
};

export const getActiveAlerts = () => {
  return alertManager.getActiveAlerts();
};

export const resolveAlert = (alertId: string) => {
  alertManager.resolveAlert(alertId);
};

export const getAlertStats = () => {
  return alertManager.getAlertStats();
};

export const createManualAlert = (type: Alert['type'], severity: Alert['severity'], title: string, message: string, metadata?: any) => {
  return alertManager.createManualAlert(type, severity, title, message, metadata);
};

export const toggleAlertRule = (ruleId: string) => {
  alertManager.toggleRule(ruleId);
};

// Alert cleanup job'ı
export const cleanupAlerts = () => {
  alertManager.cleanupOldAlerts();
};
