import { executeQuery } from '@/lib/database/mysql';

export interface AlertRule {
  id: string;
  name: string;
  type: 'error_rate' | 'response_time' | 'cpu_usage' | 'memory_usage' | 'disk_usage' | 'custom';
  threshold: number;
  operator: '>' | '<' | '=' | '>=' | '<=';
  duration: number; // minutes
  enabled: boolean;
  channels: AlertChannel[];
}

export interface AlertChannel {
  type: 'email' | 'webhook' | 'slack';
  config: {
    email?: string;
    webhook?: string;
    slack?: string;
  };
}

export interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface MetricData {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export class AlertManager {
  private static rules: Map<string, AlertRule> = new Map();
  private static alerts: Map<string, Alert> = new Map();
  private static metrics: Map<string, MetricData[]> = new Map();

  // Alert rule oluştur
  static async createAlertRule(rule: Omit<AlertRule, 'id'>): Promise<string> {
    try {
      const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newRule: AlertRule = { ...rule, id: ruleId };

      // Veritabanına kaydet
      await executeQuery(
        `INSERT INTO alert_rules (id, name, type, threshold, operator, duration, enabled, channels, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          ruleId,
          newRule.name,
          newRule.type,
          newRule.threshold,
          newRule.operator,
          newRule.duration,
          newRule.enabled,
          JSON.stringify(newRule.channels)
        ]
      );

      this.rules.set(ruleId, newRule);
      return ruleId;
    } catch (error) {
      console.error('Alert rule creation failed:', error);
      throw new Error('Alert rule creation failed');
    }
  }

  // Alert rule güncelle
  static async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<boolean> {
    try {
      const rule = this.rules.get(ruleId);
      if (!rule) return false;

      const updatedRule = { ...rule, ...updates };

      // Veritabanını güncelle
      await executeQuery(
        `UPDATE alert_rules SET 
         name = ?, type = ?, threshold = ?, operator = ?, duration = ?, enabled = ?, channels = ?
         WHERE id = ?`,
        [
          updatedRule.name,
          updatedRule.type,
          updatedRule.threshold,
          updatedRule.operator,
          updatedRule.duration,
          updatedRule.enabled,
          JSON.stringify(updatedRule.channels),
          ruleId
        ]
      );

      this.rules.set(ruleId, updatedRule);
      return true;
    } catch (error) {
      console.error('Alert rule update failed:', error);
      return false;
    }
  }

  // Metrik kaydet
  static async recordMetric(
    metricType: string,
    value: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const metric: MetricData = {
        timestamp: new Date(),
        value,
        metadata
      };

      // Memory'de sakla
      if (!this.metrics.has(metricType)) {
        this.metrics.set(metricType, []);
      }
      
      const metrics = this.metrics.get(metricType)!;
      metrics.push(metric);
      
      // Son 1000 metrik sakla
      if (metrics.length > 1000) {
        metrics.splice(0, metrics.length - 1000);
      }

      // Veritabanına kaydet
      await executeQuery(
        `INSERT INTO metrics (type, value, metadata, timestamp) 
         VALUES (?, ?, ?, ?)`,
        [metricType, value, JSON.stringify(metadata || {}), metric.timestamp]
      );

      // Alert kontrolü yap
      await this.checkAlerts(metricType, value, metadata);
    } catch (error) {
      console.error('Metric recording failed:', error);
    }
  }

  // Alert kontrolü
  private static async checkAlerts(
    metricType: string,
    value: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      for (const rule of this.rules.values()) {
        if (!rule.enabled || rule.type !== metricType) continue;

        // Threshold kontrolü
        const shouldTrigger = this.evaluateThreshold(value, rule.threshold, rule.operator);
        
        if (shouldTrigger) {
          // Duration kontrolü (belirli süre boyunca threshold'u aştı mı?)
          const shouldAlert = await this.checkDuration(rule, value);
          
          if (shouldAlert) {
            await this.triggerAlert(rule, value, metadata);
          }
        }
      }
    } catch (error) {
      console.error('Alert check failed:', error);
    }
  }

  // Threshold değerlendirmesi
  private static evaluateThreshold(value: number, threshold: number, operator: string): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '=': return value === threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      default: return false;
    }
  }

  // Duration kontrolü
  private static async checkDuration(rule: AlertRule, currentValue: number): Promise<boolean> {
    try {
      const metrics = this.metrics.get(rule.type) || [];
      const durationMs = rule.duration * 60 * 1000; // minutes to milliseconds
      const cutoffTime = new Date(Date.now() - durationMs);

      // Son duration süresindeki metrikleri filtrele
      const recentMetrics = metrics.filter(m => m.timestamp > cutoffTime);
      
      if (recentMetrics.length === 0) return false;

      // Tüm metrikler threshold'u aşıyor mu?
      return recentMetrics.every(m => 
        this.evaluateThreshold(m.value, rule.threshold, rule.operator)
      );
    } catch (error) {
      console.error('Duration check failed:', error);
      return false;
    }
  }

  // Alert tetikle
  private static async triggerAlert(
    rule: AlertRule,
    value: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const alert: Alert = {
        id: alertId,
        ruleId: rule.id,
        message: `${rule.name}: ${rule.type} is ${rule.operator} ${rule.threshold} (current: ${value})`,
        severity: this.calculateSeverity(rule.type, value, rule.threshold),
        timestamp: new Date(),
        resolved: false,
        metadata: { ...metadata, currentValue: value }
      };

      // Veritabanına kaydet
      await executeQuery(
        `INSERT INTO alerts (id, rule_id, message, severity, timestamp, resolved, metadata) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          alertId,
          rule.id,
          alert.message,
          alert.severity,
          alert.timestamp,
          false,
          JSON.stringify(alert.metadata || {})
        ]
      );

      this.alerts.set(alertId, alert);

      // Alert kanallarına gönder
      await this.sendAlertNotifications(alert, rule);
    } catch (error) {
      console.error('Alert triggering failed:', error);
    }
  }

  // Severity hesapla
  private static calculateSeverity(type: string, value: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = Math.abs(value - threshold) / threshold;
    
    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'high';
    if (ratio > 1) return 'medium';
    return 'low';
  }

  // Alert bildirimleri gönder
  private static async sendAlertNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    try {
      for (const channel of rule.channels) {
        switch (channel.type) {
          case 'email':
            await this.sendEmailAlert(alert, channel.config.email!);
            break;
          case 'webhook':
            console.log('Webhook alert:', alert.message);
            break;
          case 'slack':
            console.log('Slack alert:', alert.message);
            break;
        }
      }
    } catch (error) {
      console.error('Alert notification failed:', error);
    }
  }

  // Email alert gönder
  private static async sendEmailAlert(alert: Alert, email: string): Promise<void> {
    try {
      // Email service - disabled
      console.log('Alert email would be sent to:', email);
      return;
      
      /* Disabled email sending
      */
    } catch (error) {
      console.error('Email alert failed:', error);
    }
  }

  // Webhook alert gönder
  private static async sendWebhookAlert(alert: Alert, webhookUrl: string): Promise<void> {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert: alert,
          timestamp: alert.timestamp.toISOString()
        })
      });
    } catch (error) {
      console.error('Webhook alert failed:', error);
    }
  }

  // Slack alert gönder
  private static async sendSlackAlert(alert: Alert, slackWebhook: string): Promise<void> {
    try {
      const color = this.getSeverityColor(alert.severity);
      
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [{
            color: color,
            title: `🚨 ${alert.message}`,
            fields: [
              { title: 'Severity', value: alert.severity, short: true },
              { title: 'Time', value: alert.timestamp.toISOString(), short: true },
              { title: 'Metadata', value: JSON.stringify(alert.metadata), short: false }
            ]
          }]
        })
      });
    } catch (error) {
      console.error('Slack alert failed:', error);
    }
  }

  // Severity rengi
  private static getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff6600';
      case 'medium': return '#ffaa00';
      case 'low': return '#00aa00';
      default: return '#666666';
    }
  }

  // Alert çöz
  static async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) return false;

      alert.resolved = true;
      alert.resolvedAt = new Date();

      // Veritabanını güncelle
      await executeQuery(
        'UPDATE alerts SET resolved = ?, resolved_at = ? WHERE id = ?',
        [true, alert.resolvedAt, alertId]
      );

      return true;
    } catch (error) {
      console.error('Alert resolution failed:', error);
      return false;
    }
  }

  // Alert istatistikleri
  static getAlertStats(): {
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    alertsBySeverity: Record<string, number>;
  } {
    const totalAlerts = this.alerts.size;
    const activeAlerts = Array.from(this.alerts.values()).filter(a => !a.resolved).length;
    const resolvedAlerts = totalAlerts - activeAlerts;
    
    const alertsBySeverity: Record<string, number> = {};
    for (const alert of this.alerts.values()) {
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    }

    return {
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      alertsBySeverity
    };
  }

  // Metrik istatistikleri
  static getMetricStats(): Record<string, {
    count: number;
    avg: number;
    min: number;
    max: number;
    latest: number;
  }> {
    const stats: Record<string, any> = {};

    for (const [type, metrics] of this.metrics.entries()) {
      if (metrics.length === 0) continue;

      const values = metrics.map(m => m.value);
      stats[type] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1]
      };
    }

    return stats;
  }
}

export const alertManager = AlertManager;
