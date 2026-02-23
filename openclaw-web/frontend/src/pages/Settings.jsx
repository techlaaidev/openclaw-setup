import { useState, useEffect } from 'react';
import { configApi, systemApi, authApi } from '../services/api';
import { Save, Key, Terminal, Shield, Info } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState({});
  const [systemInfo, setSystemInfo] = useState(null);
  const [paths, setPaths] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [configRes, systemRes, pathsRes] = await Promise.all([
        configApi.get(),
        systemApi.info(),
        systemApi.paths()
      ]);
      setConfig(configRes.data.config || {});
      setSystemInfo(systemRes.data);
      setPaths(pathsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await configApi.update(config);
      alert('Configuration saved!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      alert('Passwords do not match');
      return;
    }
    if (passwordData.new.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }
    try {
      await authApi.changePassword(passwordData.current, passwordData.new);
      setPasswordData({ current: '', new: '', confirm: '' });
      alert('Password changed successfully!');
    } catch (error) {
      alert('Failed to change password: ' + error.message);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Terminal },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'paths', label: 'System', icon: Info },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="card p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure OpenClaw Web Dashboard</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-1 py-4 border-b-2 font-medium transition-smooth ${
                activeTab === tab.id
                  ? 'border-primary text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">OpenClaw Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">App Name</label>
                <input
                  type="text"
                  value={config.app?.name || ''}
                  onChange={(e) => setConfig({ ...config, app: { ...config.app, name: e.target.value } })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Log Level</label>
                <select
                  value={config.app?.log_level || 'info'}
                  onChange={(e) => setConfig({ ...config, app: { ...config.app, log_level: e.target.value } })}
                  className="input"
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="btn btn-primary flex items-center disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="input"
                />
              </div>
              <button
                onClick={handlePasswordChange}
                className="btn btn-primary"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Info & Paths */}
      {activeTab === 'paths' && (
        <div className="space-y-6">
          {/* Paths */}
          <div className="card p-6">
            <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">OpenClaw Paths</h3>
            <div className="space-y-3">
              {paths && Object.entries(paths).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <p className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm text-gray-600 font-mono">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* System Information */}
          {systemInfo && (
            <div className="card p-6">
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-4">System Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary">
                  <p className="text-xs text-gray-600 font-medium mb-1">Hostname</p>
                  <p className="font-display font-semibold text-gray-900">{systemInfo.hostname}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-info-500">
                  <p className="text-xs text-gray-600 font-medium mb-1">Platform</p>
                  <p className="font-display font-semibold text-gray-900 capitalize">{systemInfo.platform}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-warning-500">
                  <p className="text-xs text-gray-600 font-medium mb-1">Architecture</p>
                  <p className="font-display font-semibold text-gray-900">{systemInfo.arch}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-success-500">
                  <p className="text-xs text-gray-600 font-medium mb-1">Uptime</p>
                  <p className="font-display font-semibold text-gray-900">{Math.floor(systemInfo.uptime / 3600)}h</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
