import StatusCard from '../components/StatusCard';
import { systemApi } from '../services/api';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [systemInfo, setSystemInfo] = useState(null);

  useEffect(() => {
    loadSystemInfo();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const { data } = await systemApi.info();
      setSystemInfo(data);
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">OpenClaw AI Assistant Management</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatusCard />

        {systemInfo && (
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Hostname</span>
                <span className="font-medium">{systemInfo.hostname}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform</span>
                <span className="font-medium">{systemInfo.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Memory</span>
                <span className="font-medium">{systemInfo.memory.usedGB}GB / {systemInfo.memory.totalGB}GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Load</span>
                <span className="font-medium">{systemInfo.loadavg[0]}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 border border-gray-200">
              Configure Kimi Provider
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 border border-gray-200">
              Setup Telegram Bot
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 border border-gray-200">
              Browse Skill Marketplace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
