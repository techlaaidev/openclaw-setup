import { useEffect, useState } from 'react';
import { statusApi, processApi } from '../services/api';
import { Play, Pause, RotateCcw, Wifi, WifiOff, Cpu, HardDrive, Clock, Hash } from 'lucide-react';

export default function StatusCard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchStatus = async () => {
    try {
      const { data } = await statusApi.get();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Set up SSE for real-time updates
    const eventSource = statusApi.stream();

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'status') {
        const { cpu, memory, pid, uptime, running, gatewayConnected } = data;
        setStatus(prev => ({
          ...prev,
          cpu,
          memory,
          pid,
          uptime,
          running,
          gatewayConnected
        }));
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };

    return () => eventSource.close();
  }, []);

  const handleAction = async (action) => {
    setActionLoading(action);
    try {
      if (action === 'start') {
        await processApi.start();
      } else if (action === 'stop') {
        await processApi.stop();
      } else if (action === 'restart') {
        await processApi.restart();
      }
      setTimeout(fetchStatus, 1000);
    } catch (error) {
      console.error(`Failed to ${action}:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const isRunning = status?.running;
  const uptime = status?.uptime || 0;
  const uptimeText = uptime > 0 ?
    `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m` :
    '-';

  return (
    <div className="card card-hover p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-semibold text-gray-900">OpenClaw Status</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-success-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className={`text-sm font-medium ${isRunning ? 'text-success-700' : 'text-gray-600'}`}>
            {isRunning ? 'Running' : 'Stopped'}
          </span>
          {isRunning && status?.gatewayConnected && (
            <Wifi className="w-4 h-4 text-success-500" />
          )}
          {isRunning && !status?.gatewayConnected && (
            <WifiOff className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-primary">
          <div className="flex items-center text-gray-600 mb-1">
            <Cpu className="w-4 h-4 mr-2" />
            <p className="text-xs font-medium">CPU</p>
          </div>
          <p className="text-2xl font-display font-bold text-gray-900">{status?.cpu || 0}%</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-info-500">
          <div className="flex items-center text-gray-600 mb-1">
            <HardDrive className="w-4 h-4 mr-2" />
            <p className="text-xs font-medium">Memory</p>
          </div>
          <p className="text-2xl font-display font-bold text-gray-900">{status?.memory || 0} MB</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-warning-500">
          <div className="flex items-center text-gray-600 mb-1">
            <Hash className="w-4 h-4 mr-2" />
            <p className="text-xs font-medium">PID</p>
          </div>
          <p className="text-2xl font-display font-bold text-gray-900">{status?.pid || '-'}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-success-500">
          <div className="flex items-center text-gray-600 mb-1">
            <Clock className="w-4 h-4 mr-2" />
            <p className="text-xs font-medium">Uptime</p>
          </div>
          <p className="text-2xl font-display font-bold text-gray-900">{uptimeText}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {!isRunning ? (
          <button
            onClick={() => handleAction('start')}
            disabled={actionLoading === 'start'}
            className="flex-1 bg-success-600 text-white px-4 py-2.5 rounded-lg hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-smooth active:scale-95"
          >
            <Play className="w-4 h-4 mr-2" />
            {actionLoading === 'start' ? 'Starting...' : 'Start'}
          </button>
        ) : (
          <>
            <button
              onClick={() => handleAction('stop')}
              disabled={actionLoading === 'stop'}
              className="flex-1 bg-gray-600 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-medium transition-smooth active:scale-95"
            >
              <Pause className="w-4 h-4 mr-2" />
              {actionLoading === 'stop' ? 'Stopping...' : 'Stop'}
            </button>
            <button
              onClick={() => handleAction('restart')}
              disabled={actionLoading === 'restart'}
              className="flex-1 btn btn-primary py-2.5 flex items-center justify-center font-medium"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              {actionLoading === 'restart' ? 'Restarting...' : 'Restart'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
