import { useState, useEffect } from 'react';
import { configApi, systemApi, authApi } from '../services/api';
import { Save, RotateCcw, Key, Terminal, Shield, Bell } from 'lucide-react';

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
    { id: 'paths', label: 'Paths', icon: Key },
  ];

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure OpenClaw Web Dashboard</p>
      </div>

      <div className="flex border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-6 py-3 border-b-2 font-medium ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">OpenClaw Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">App Name</label>
                <input
                  type="text"
                  value={config.app?.name || ''}
                  onChange={(e) => setConfig({ ...config, app: { ...config.app, name: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Log Level</label>
                <select
                  value={config.app?.log_level || 'info'}
                  onChange={(e) => setConfig({ ...config, app: { ...config.app, log_level: e.target.value } })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Security Settings */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <button
                onClick={handlePasswordChange}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paths Settings */}
      {activeTab === 'paths' && (
        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <h3 className="text-lg font-semibold mb-4">OpenClaw Paths</h3>
          <div className="space-y-4">
            {paths && Object.entries(paths).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm text-gray-500">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {systemInfo && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">System Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Hostname</p>
                  <p className="font-semibold">{systemInfo.hostname}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Platform</p>
                  <p className="font-semibold">{systemInfo.platform}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Architecture</p>
                  <p className="font-semibold">{systemInfo.arch}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Uptime</p>
                  <p className="font-semibold">{Math.floor(systemInfo.uptime / 3600)}h</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
