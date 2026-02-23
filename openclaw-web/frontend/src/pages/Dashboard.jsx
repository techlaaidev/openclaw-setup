import StatusCard from '../components/StatusCard';
import { systemApi } from '../services/api';
import { useEffect, useState } from 'react';
import { Server, Activity, Zap, ArrowRight } from 'lucide-react';

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
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Monitor and manage your OpenClaw AI Assistant</p>
      </div>

      {/* Status Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OpenClaw Status */}
        <div className="lg:col-span-2">
          <StatusCard />
        </div>

        {/* System Info Card */}
        {systemInfo ? (
          <div className="card card-hover p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-info-50 rounded-lg flex items-center justify-center mr-3">
                <Server className="w-5 h-5 text-info-600" />
              </div>
              <h3 className="text-lg font-display font-semibold text-gray-900">System Info</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Hostname</span>
                <span className="text-sm font-medium text-gray-900">{systemInfo.hostname}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Platform</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{systemInfo.platform}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Memory</span>
                <span className="text-sm font-medium text-gray-900">{systemInfo.memory.usedGB}GB / {systemInfo.memory.totalGB}GB</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Load Average</span>
                <span className="text-sm font-medium text-gray-900">{systemInfo.loadavg[0].toFixed(2)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mr-3">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-display font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="group p-4 text-left rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary-50 transition-smooth">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 group-hover:text-primary-700">Configure Provider</h4>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-smooth" />
            </div>
            <p className="text-sm text-gray-600">Set up Kimi or other AI providers</p>
          </button>
          <button className="group p-4 text-left rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary-50 transition-smooth">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 group-hover:text-primary-700">Setup Telegram</h4>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-smooth" />
            </div>
            <p className="text-sm text-gray-600">Connect your Telegram bot</p>
          </button>
          <button className="group p-4 text-left rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary-50 transition-smooth">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 group-hover:text-primary-700">Browse Skills</h4>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-smooth" />
            </div>
            <p className="text-sm text-gray-600">Explore the skill marketplace</p>
          </button>
        </div>
      </div>

      {/* Activity Overview */}
      <div className="card p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center mr-3">
            <Activity className="w-5 h-5 text-success-600" />
          </div>
          <h3 className="text-lg font-display font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No recent activity to display</p>
        </div>
      </div>
    </div>
  );
}
