import { useEffect, useState } from 'react';
import { statusApi, processApi } from '../services/api';
import { Play, Pause, RotateCcw, Wifi, WifiOff } from 'lucide-react';

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
      <div className="bg-white rounded-xl shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const isRunning = status?.running;
  const uptime = status?.uptime || 0;
  const uptimeText = uptime > 0 ?
    `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m` :
    '-';

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">OpenClaw Status</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`text-sm font-medium ${isRunning ? 'text-green-700' : 'text-red-700'}`}>
            {isRunning ? 'Running' : 'Stopped'}
          </span>
          {status?.gatewayConnected && (
            <Wifi className="w-4 h-4 text-green-500" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">CPU</p>
          <p className="text-lg font-semibold">{status?.cpu || 0}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Memory</p>
          <p className="text-lg font-semibold">{status?.memory || 0} MB</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">PID</p>
          <p className="text-lg font-semibold">{status?.pid || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Uptime</p>
          <p className="text-lg font-semibold">{uptimeText}</p>
        </div>
      </div>

      <div className="flex space-x-3">
        {!isRunning ? (
          <button
            onClick={() => handleAction('start')}
            disabled={actionLoading === 'start'}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
          >
            <Play className="w-4 h-4 mr-2" />
            {actionLoading === 'start' ? 'Starting...' : 'Start'}
          </button>
        ) : (
          <>
            <button
              onClick={() => handleAction('stop')}
              disabled={actionLoading === 'stop'}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
            >
              <Pause className="w-4 h-4 mr-2" />
              {actionLoading === 'stop' ? 'Stopping...' : 'Stop'}
            </button>
            <button
              onClick={() => handleAction('restart')}
              disabled={actionLoading === 'restart'}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
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
