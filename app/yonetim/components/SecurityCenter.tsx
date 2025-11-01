
'use client';

import { useState, useEffect } from 'react';

interface SecurityLog {
  id: number;
  type: 'login' | 'failed_login' | 'suspicious_activity' | 'system_access' | 'ip_blocked';
  message: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  ipWhitelist: string[];
  ipBlacklist: string[];
  maxLoginAttempts: number;
  sessionTimeout: number;
  autoLogout: boolean;
  notifyOnLogin: boolean;
  ipAccessControl: boolean;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
}

export default function SecurityCenter() {
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    ipWhitelist: [],
    ipBlacklist: [],
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    autoLogout: true,
    notifyOnLogin: true,
    ipAccessControl: false
  });

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  const [activeTab, setActiveTab] = useState('logs');
  const [newIpRange, setNewIpRange] = useState('');
  const [showAddIp, setShowAddIp] = useState(false);
  const [ipListType, setIpListType] = useState<'whitelist' | 'blacklist'>('whitelist');
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'Admin'
  });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorQR, setTwoFactorQR] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordChangeUser, setPasswordChangeUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Verileri yükle
  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('admin_token');
      
      // Güvenlik loglarını yükle
      const logsRes = await fetch('/api/admin/security/logs?limit=100', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.success) {
          setSecurityLogs(logsData.data.map((log: any) => ({
            id: log.id,
            type: log.type,
            message: log.message,
            ip: log.ip || 'N/A',
            userAgent: log.user_agent || 'N/A',
            timestamp: log.created_at,
            severity: log.severity
          })));
        }
      }

      // Güvenlik ayarlarını yükle
      const settingsRes = await fetch('/api/admin/security/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.success) {
          setSecuritySettings(settingsData.data);
          // 2FA durumunu kontrol et
          setTwoFactorEnabled(settingsData.data.twoFactorAuth || false);
        }
      }
      
      // Admin kullanıcısının 2FA secret'ını kontrol et
      const adminRes = await fetch('/api/admin/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        if (adminData.success && adminData.user?.two_factor_secret) {
          setTwoFactorEnabled(true);
        }
      }

      // Admin kullanıcıları yükle
      const usersRes = await fetch('/api/admin/security/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success) {
          setAdminUsers(usersData.data);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Güvenlik verileri yükleme hatası:', error);
      setLoading(false);
    }
  };

  const severityColors = {
    low: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    medium: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
    high: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
  };

  const typeIcons = {
    login: 'ri-login-circle-line',
    failed_login: 'ri-error-warning-line',
    suspicious_activity: 'ri-alarm-warning-line',
    system_access: 'ri-shield-check-line',
    ip_blocked: 'ri-forbid-line'
  };

  const handleSettingChange = async (key: keyof SecuritySettings, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: value
    }));

    // Ayarları API'ye kaydet
    try {
      const token = sessionStorage.getItem('admin_token');
      await fetch('/api/admin/security/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...securitySettings,
          [key]: value
        })
      });
    } catch (error) {
      console.error('Ayar kaydetme hatası:', error);
    }
  };

  const addIpToList = () => {
    if (newIpRange.trim()) {
      const listKey = ipListType === 'whitelist' ? 'ipWhitelist' : 'ipBlacklist';
      setSecuritySettings(prev => ({
        ...prev,
        [listKey]: [...prev[listKey], newIpRange.trim()]
      }));
      setNewIpRange('');
      setShowAddIp(false);

      // Log the action
      const newLog: SecurityLog = {
        id: Date.now(),
        type: 'system_access',
        message: `IP ${newIpRange} ${ipListType === 'whitelist' ? 'beyaz' : 'kara'} listeye eklendi`,
        ip: newIpRange,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        severity: 'low'
      };
      setSecurityLogs(prev => [newLog, ...prev]);
    }
  };

  const removeIpFromList = (ip: string, listType: 'whitelist' | 'blacklist') => {
    const listKey = listType === 'whitelist' ? 'ipWhitelist' : 'ipBlacklist';
    setSecuritySettings(prev => ({
      ...prev,
      [listKey]: prev[listKey].filter(item => item !== ip)
    }));

    // Log the action
    const newLog: SecurityLog = {
      id: Date.now(),
      type: 'system_access',
      message: `IP ${ip} ${listType === 'whitelist' ? 'beyaz' : 'kara'} listeden kaldırıldı`,
      ip: ip,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      severity: 'low'
    };
    setSecurityLogs(prev => [newLog, ...prev]);
  };

  const clearSecurityLogs = async () => {
    if (!confirm('Tüm eski güvenlik loglarını temizlemek istediğinizden emin misiniz?')) return;
    
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch('/api/admin/security/logs?all=true', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await loadSecurityData();
        alert('Eski güvenlik logları temizlendi');
      } else {
        alert('Loglar temizlenirken hata oluştu');
      }
    } catch (error) {
      console.error('Log temizleme hatası:', error);
      alert('Loglar temizlenirken hata oluştu');
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(securityLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      alert('Tüm alanlar doldurulmalıdır!');
      return;
    }

    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch('/api/admin/security/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setNewUser({ username: '', email: '', password: '', role: 'Admin' });
        setShowUserForm(false);
        await loadSecurityData();
        alert('Kullanıcı başarıyla oluşturuldu');
      } else {
        alert(data.error || 'Kullanıcı oluşturulamadı');
      }
    } catch (error) {
      console.error('Kullanıcı oluşturma hatası:', error);
      alert('Kullanıcı oluşturulamadı');
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      const user = adminUsers.find(u => u.id === userId);
      if (!user) return;

      const token = sessionStorage.getItem('admin_token');
      const response = await fetch('/api/admin/security/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: userId,
          username: user.username,
          email: user.email,
          role: user.role,
          is_active: !user.is_active
        })
      });

      if (response.ok) {
        await loadSecurityData();
      } else {
        alert('Kullanıcı durumu güncellenemedi');
      }
    } catch (error) {
      console.error('Kullanıcı durumu güncelleme hatası:', error);
      alert('Kullanıcı durumu güncellenemedi');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/security/users?id=${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        await loadSecurityData();
        alert('Kullanıcı silindi');
      } else {
        alert(data.error || 'Kullanıcı silinemedi');
      }
    } catch (error) {
      console.error('Kullanıcı silme hatası:', error);
      alert('Kullanıcı silinemedi');
    }
  };

  const changePassword = async () => {
    if (!passwordChangeUser || !newPassword.trim()) {
      alert('Lütfen yeni şifre girin');
      return;
    }

    if (newPassword.length < 6) {
      alert('Şifre en az 6 karakter olmalı');
      return;
    }

    try {
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch(`/api/admin/security/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: passwordChangeUser.id,
          newPassword: newPassword
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert('✅ Şifre başarıyla değiştirildi!');
        setShowPasswordChange(false);
        setPasswordChangeUser(null);
        setNewPassword('');
      } else {
        alert('❌ ' + (data.error || 'Şifre değiştirilemedi'));
      }
    } catch (error) {
      console.error('Şifre değiştirme hatası:', error);
      alert('❌ Şifre değiştirilemedi');
    }
  };

  const generateTwoFactorSecret = async () => {
    try {
      // Backend'den secret ve QR kod oluştur
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch('/api/admin/2fa/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setTwoFactorSecret(data.secret);
        setTwoFactorQR(data.qrCode); // Base64 data URL
        setShowTwoFactorSetup(true);
      } else {
        alert('QR kod oluşturulamadı: ' + (data.error || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('QR kod oluşturma hatası:', error);
      alert('QR kod oluşturulurken bir hata oluştu.');
    }
  };

  const setupTwoFactor = async () => {
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      alert('Lütfen 6 haneli doğrulama kodunu girin!');
      return;
    }

    try {
      // Backend'e secret'i kaydet ve kodu doğrula
      const token = sessionStorage.getItem('admin_token');
      const response = await fetch('/api/admin/2fa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secret: twoFactorSecret,
          code: twoFactorCode
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTwoFactorEnabled(true);
        setSecuritySettings(prev => ({ ...prev, twoFactorAuth: true }));
        setShowTwoFactorSetup(false);
        setTwoFactorCode('');
        setTwoFactorSecret('');
        setTwoFactorQR('');
        alert('✅ 2FA başarıyla kuruldu ve aktif edildi! Artık giriş yaparken telefonunuzdaki kodu kullanacaksınız.');
      } else {
        alert(data.error || 'Doğrulama kodu geçersiz! Lütfen tekrar deneyin.');
      }
    } catch (error) {
      console.error('2FA kurulum hatası:', error);
      alert('2FA kurulumu sırasında bir hata oluştu.');
    }
  };

  const blockSuspiciousIp = (ip: string) => {
    setSecuritySettings(prev => ({
      ...prev,
      ipBlacklist: [...prev.ipBlacklist, ip]
    }));

    const newLog: SecurityLog = {
      id: Date.now(),
      type: 'ip_blocked',
      message: `Şüpheli IP otomatik olarak engellendi: ${ip}`,
      ip: ip,
      userAgent: 'System',
      timestamp: new Date().toISOString(),
      severity: 'high'
    };
    setSecurityLogs(prev => [newLog, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Güvenlik Merkezi</h1>
          <p className="text-gray-700 dark:text-gray-300">Sistem güvenliği, IP kontrolü ve kullanıcı yönetimi</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-lg">
            <i className="ri-shield-check-line"></i>
            <span className="text-sm font-medium">Sistem Güvenli</span>
          </div>
          {securitySettings.twoFactorAuth && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg">
              <i className="ri-key-2-line"></i>
              <span className="text-sm font-medium">2FA Aktif</span>
            </div>
          )}
        </div>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Başarılı Girişler</p>
              <p className="text-2xl font-bold text-green-600">147</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Son 30 gün</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <i className="ri-login-circle-line text-xl text-green-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Başarısız Denemeler</p>
              <p className="text-2xl font-bold text-orange-600">12</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Son 7 gün</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
              <i className="ri-error-warning-line text-xl text-orange-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Engellenen IP</p>
              <p className="text-2xl font-bold text-red-600">{securitySettings.ipBlacklist.length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Kara liste</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <i className="ri-forbid-line text-xl text-red-600"></i>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Aktif Kullanıcı</p>
              <p className="text-2xl font-bold text-blue-600">{adminUsers.filter(u => u.is_active).length}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Admin hesabı</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <i className="ri-user-line text-xl text-blue-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                activeTab === 'logs'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <i className="ri-file-list-line mr-2"></i>
              Güvenlik Logları
            </button>
            <button
              onClick={() => setActiveTab('ip-control')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                activeTab === 'ip-control'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <i className="ri-global-line mr-2"></i>
              IP Ban Sistemi
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                activeTab === 'users'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <i className="ri-team-line mr-2"></i>
              Kullanıcı Yönetimi
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                activeTab === 'settings'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <i className="ri-settings-line mr-2"></i>
              Güvenlik Ayarları
            </button>
            <button
              onClick={() => setActiveTab('monitoring')}
              className={`py-4 px-2 border-b-2 font-medium text-sm whitespace-nowrap cursor-pointer ${
                activeTab === 'monitoring'
                  ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <i className="ri-eye-line mr-2"></i>
              Canlı İzleme
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Güvenlik Logları</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={exportLogs}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer text-sm whitespace-nowrap"
                  >
                    <i className="ri-download-line mr-2"></i>
                    Dışarı Aktar
                  </button>
                  <button
                    onClick={clearSecurityLogs}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors cursor-pointer text-sm whitespace-nowrap"
                  >
                    <i className="ri-delete-bin-line mr-2"></i>
                    Temizle
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {securityLogs.map((log) => (
                  <div key={log.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          log.severity === 'high' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                          log.severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' :
                          'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        }`}>
                          <i className={typeIcons[log.type]}></i>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">{log.message}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[log.severity]}`}>
                              {log.severity === 'high' ? 'Yüksek' : 
                               log.severity === 'medium' ? 'Orta' : 'Düşük'}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                            <div className="flex items-center space-x-4">
                              <span><i className="ri-global-line mr-1"></i>IP: {log.ip}</span>
                              <span><i className="ri-computer-line mr-1"></i>{log.userAgent}</span>
                            </div>
                            <div>
                              <i className="ri-time-line mr-1"></i>
                              {new Date(log.timestamp).toLocaleString('tr-TR')}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {log.severity === 'high' && log.type === 'suspicious_activity' && (
                        <button
                          onClick={() => blockSuspiciousIp(log.ip)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-forbid-line mr-1"></i>
                          IP'yi Engelle
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ip-control' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">IP Ban Sistemi</h3>

              {/* IP Control Toggle */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">IP Erişim Kontrolü</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">Sadece izin verilen IP'lerden admin paneline erişimi etkinleştir</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={securitySettings.ipAccessControl}
                      onChange={(e) => handleSettingChange('ipAccessControl', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* IP Whitelist */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Beyaz Liste (İzin Verilenler)</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">Bu IP'lerden erişim her zaman izinli</p>
                    </div>
                    <button
                      onClick={() => {
                        setIpListType('whitelist');
                        setShowAddIp(true);
                      }}
                      className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors cursor-pointer text-sm whitespace-nowrap"
                    >
                      <i className="ri-add-line mr-1"></i>
                      IP Ekle
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {securitySettings.ipWhitelist.map((ip, index) => (
                      <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <i className="ri-shield-check-line text-green-500"></i>
                          <span className="font-mono text-sm text-gray-900 dark:text-gray-200">{ip}</span>
                        </div>
                        <button
                          onClick={() => removeIpFromList(ip, 'whitelist')}
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* IP Blacklist */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Kara Liste (Engellenenler)</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">Bu IP'lerden erişim tamamen engelli</p>
                    </div>
                    <button
                      onClick={() => {
                        setIpListType('blacklist');
                        setShowAddIp(true);
                      }}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors cursor-pointer text-sm whitespace-nowrap"
                    >
                      <i className="ri-forbid-line mr-1"></i>
                      IP Engelle
                    </button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {securitySettings.ipBlacklist.map((ip, index) => (
                      <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <i className="ri-forbid-line text-red-500"></i>
                          <span className="font-mono text-sm text-gray-900 dark:text-gray-200">{ip}</span>
                        </div>
                        <button
                          onClick={() => removeIpFromList(ip, 'blacklist')}
                          className="text-green-500 hover:text-green-700 cursor-pointer"
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {showAddIp && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                    {ipListType === 'whitelist' ? 'Beyaz Listeye' : 'Kara Listeye'} IP Ekle
                  </h4>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newIpRange}
                      onChange={(e) => setNewIpRange(e.target.value)}
                      placeholder="IP adresi (örn: 192.168.1.100) veya aralığı (örn: 192.168.1.0/24)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      onClick={addIpToList}
                      className={`px-4 py-2 rounded-lg text-white cursor-pointer whitespace-nowrap ${
                        ipListType === 'whitelist' 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      Ekle
                    </button>
                    <button
                      onClick={() => {
                        setShowAddIp(false);
                        setNewIpRange('');
                      }}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Kullanıcı Yönetimi</h3>
                <button
                  onClick={() => setShowUserForm(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-user-add-line mr-2"></i>
                  Yeni Kullanıcı
                </button>
              </div>

              <div className="grid gap-4">
                {adminUsers.map((user) => (
                  <div key={user.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <i className="ri-user-line text-white"></i>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">{user.username}</h4>
                            <span className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs">{user.role}</span>
                            {user.is_active ? (
                              <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs">Aktif</span>
                            ) : (
                              <span className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs">Pasif</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            Son giriş: {user.last_login ? new Date(user.last_login).toLocaleDateString('tr-TR') : 'Hiç'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleUserStatus(user.id)}
                          className={`px-3 py-1 rounded text-sm cursor-pointer whitespace-nowrap ${
                            user.is_active 
                              ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800/30' 
                              : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/30'
                          }`}
                        >
                          {user.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                        </button>
                        <button
                          onClick={() => {
                            setPasswordChangeUser(user);
                            setShowPasswordChange(true);
                            setNewPassword('');
                          }}
                          className="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-1 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-800/30 cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-lock-password-line mr-1"></i>
                          Şifre Değiştir
                        </button>
                        {user.id !== '1' && (
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-1 rounded text-sm hover:bg-red-200 dark:hover:bg-red-800/30 cursor-pointer whitespace-nowrap"
                          >
                            Sil
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {showUserForm && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Yeni Admin Kullanıcısı</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      placeholder="Kullanıcı adı"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="E-posta"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="Şifre"
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Editor">Editor</option>
                      <option value="Moderator">Moderator</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    <button
                      onClick={handleCreateUser}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 cursor-pointer whitespace-nowrap"
                    >
                      Kullanıcı Oluştur
                    </button>
                    <button
                      onClick={() => setShowUserForm(false)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 cursor-pointer whitespace-nowrap"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Güvenlik Ayarları</h3>

              {/* Two-Factor Authentication */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">İki Faktörlü Doğrulama (2FA)</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {twoFactorEnabled ? '✅ Kurulu ve Aktif' : '⚠️ Kurulmamış - Extra güvenlik katmanı ekleyin'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {!twoFactorEnabled ? (
                      <button
                        onClick={generateTwoFactorSecret}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 cursor-pointer whitespace-nowrap font-medium"
                      >
                        <i className="ri-qr-code-line mr-1"></i>
                        2FA Kur
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          if (confirm('2FA devre dışı bırakılacak. Emin misiniz?')) {
                            try {
                              const token = sessionStorage.getItem('admin_token');
                              const response = await fetch('/api/admin/2fa/disable', {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json'
                                }
                              });
                              
                              if (response.ok) {
                                setTwoFactorEnabled(false);
                                setSecuritySettings(prev => ({ ...prev, twoFactorAuth: false }));
                                alert('✅ 2FA devre dışı bırakıldı');
                              } else {
                                alert('❌ 2FA kapatılamadı');
                              }
                            } catch (error) {
                              alert('❌ Hata oluştu');
                            }
                          }
                        }}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 cursor-pointer whitespace-nowrap font-medium"
                      >
                        <i className="ri-shield-cross-line mr-1"></i>
                        2FA Kapat
                      </button>
                    )}
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={twoFactorEnabled}
                        disabled
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 opacity-75 cursor-not-allowed"></div>
                    </label>
                  </div>
                </div>
              </div>

              {showTwoFactorSetup && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                    <i className="ri-shield-check-line text-blue-500 mr-2"></i>
                    2FA Kurulumu
                  </h4>
                  <div className="space-y-6">
                    {/* Adım 1: QR Kod */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
                      <div className="text-center">
                        <div className="inline-block bg-white p-4 rounded-lg shadow-md mb-4">
                          {twoFactorQR ? (
                            <img 
                              src={twoFactorQR} 
                              alt="2FA QR Code" 
                              className="w-48 h-48"
                            />
                          ) : (
                            <div className="w-48 h-48 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            </div>
                          )}
                        </div>
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2">Adım 1: QR Kodu Tarayın</h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                          <strong>Google Authenticator</strong> veya <strong>Microsoft Authenticator</strong> uygulamasını açın ve bu QR kodu tarayın
                        </p>
                        {twoFactorSecret && (
                          <div className="bg-white dark:bg-gray-800 rounded p-3 mt-3">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Manuel giriş için Secret Key:</p>
                            <code className="text-sm font-mono text-blue-600 dark:text-blue-400 break-all">{twoFactorSecret}</code>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Adım 2: Kod Girişi */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        <i className="ri-key-2-line mr-1"></i>
                        Adım 2: Doğrulama Kodunu Girin
                      </label>
                      <input
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6 haneli kod girin"
                        maxLength={6}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-2xl tracking-widest font-mono"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <i className="ri-information-line mr-1"></i>
                        Authenticator uygulamanızda gördüğünüz 6 haneli kodu girin
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={setupTwoFactor}
                        disabled={twoFactorCode.length !== 6}
                        className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                          twoFactorCode.length === 6
                            ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <i className="ri-shield-check-line mr-2"></i>
                        Doğrula ve Etkinleştir
                      </button>
                      <button
                        onClick={() => {
                          setShowTwoFactorSetup(false);
                          setTwoFactorCode('');
                          setTwoFactorSecret('');
                          setTwoFactorQR('');
                        }}
                        className="px-6 py-3 rounded-lg font-semibold bg-gray-500 hover:bg-gray-600 text-white cursor-pointer transition-all"
                      >
                        <i className="ri-close-line mr-2"></i>
                        İptal
                      </button>
                    </div>
                    
                    {/* Yardım Bilgisi */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                      <h6 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                        <i className="ri-question-line mr-2"></i>
                        Authenticator Uygulaması Nasıl İndirilir?
                      </h6>
                      <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                        <li className="flex items-start">
                          <i className="ri-smartphone-line mr-2 mt-0.5"></i>
                          <span><strong>Android:</strong> Play Store'dan "Google Authenticator" indirin</span>
                        </li>
                        <li className="flex items-start">
                          <i className="ri-apple-line mr-2 mt-0.5"></i>
                          <span><strong>iOS:</strong> App Store'dan "Google Authenticator" indirin</span>
                        </li>
                        <li className="flex items-start">
                          <i className="ri-information-line mr-2 mt-0.5"></i>
                          <span>Alternatif: Microsoft Authenticator, Authy veya benzeri TOTP uygulamaları</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Session Settings */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">Oturum Ayarları</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Maksimum Giriş Denemesi
                    </label>
                    <input
                      type="number"
                      value={securitySettings.maxLoginAttempts}
                      onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="3"
                      max="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Oturum Zaman Aşımı (dakika)
                    </label>
                    <input
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="15"
                      max="120"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">Otomatik Çıkış</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">Hareketsizlik durumunda otomatik çıkış</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.autoLogout}
                        onChange={(e) => handleSettingChange('autoLogout', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white">Giriş Bildirimi</h5>
                      <p className="text-sm text-gray-700 dark:text-gray-300">Her girişte e-posta bildirimi</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securitySettings.notifyOnLogin}
                        onChange={(e) => handleSettingChange('notifyOnLogin', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Canlı Güvenlik İzleme</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Aktif Oturumlar</h4>
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">Mevcut Oturum</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">192.168.1.100 - Chrome</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600">Aktif</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-4">Son Aktiviteler</h4>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <i className="ri-time-line mr-1"></i>
                      {new Date().toLocaleTimeString('tr-TR')} - Sayfa görüntülendi
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <i className="ri-time-line mr-1"></i>
                      {new Date(Date.now() - 300000).toLocaleTimeString('tr-TR')} - Ayarlar güncellendi
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <i className="ri-alert-line text-yellow-600 mr-3 mt-1"></i>
                  <div>
                    <h4 className="text-yellow-800 font-medium mb-2">Güvenlik Önerileri</h4>
                    <ul className="text-yellow-700 text-sm space-y-1">
                      <li>• İki faktörlü doğrulamayı etkinleştirin</li>
                      <li>• IP erişim kontrolünü açın</li>
                      <li>• Düzenli olarak şifrenizi değiştirin</li>
                      <li>• Güvenlik loglarını periyodik olarak kontrol edin</li>
                      <li>• Sadece güvenilir ağlardan erişim sağlayın</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Şifre Değiştirme Modal */}
      {showPasswordChange && passwordChangeUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                <i className="ri-lock-password-line mr-2 text-blue-600"></i>
                Şifre Değiştir
              </h3>
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordChangeUser(null);
                  setNewPassword('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <i className="ri-user-line mr-2"></i>
                  <strong>{passwordChangeUser.username}</strong> ({passwordChangeUser.email})
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Yeni Şifre (minimum 6 karakter)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Yeni şifreyi girin"
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Güçlü bir şifre kullanın (harf, rakam, özel karakter)
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  onClick={changePassword}
                  disabled={!newPassword || newPassword.length < 6}
                  className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium cursor-pointer"
                >
                  <i className="ri-check-line mr-2"></i>
                  Şifreyi Değiştir
                </button>
                <button
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordChangeUser(null);
                    setNewPassword('');
                  }}
                  className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 font-medium cursor-pointer"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
