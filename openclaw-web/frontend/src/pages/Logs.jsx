import { useState, useEffect, useRef } from 'react';
import { logsApi } from '../services/api';
import { RefreshCw, Download, Search, Trash2 } from 'lucide-react';

export default function Logs() {
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [filter, setFilter] = useState('');
  const [lines, setLines] = useState(100);
  const logsEndRef = useRef(null);

  useEffect(() => {
    loadLogs();
  }, [lines]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadLogs, 2000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadLogs = async () => {
    try {
      const { data } = await logsApi.get(lines);
      setLogs(data.logs || '');
    } catch (error) {
      console.error('Failed to load logs:', error);
      setLogs('Failed to load logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openclaw-logs-${new Date().toISOString()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = filter
    ? logs.split('\n').filter(line => line.toLowerCase().includes(filter.toLowerCase())).join('\n')
    : logs;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Logs</h1>
          <p className="text-gray-600">View OpenClaw application logs</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={lines}
            onChange={(e) => setLines(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg"
          >
            <option value={50}>50 lines</option>
            <option value={100}>100 lines</option>
            <option value={200}>200 lines</option>
            <option value={500}>500 lines</option>
          </select>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-lg flex items-center ${autoRefresh ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto
          </button>
          <button
            onClick={loadLogs}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" /> Download
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter logs..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
        />
      </div>

      {/* Log Viewer */}
      <div className="flex-1 bg-gray-900 rounded-xl p-4 overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="text-gray-400">Loading logs...</div>
        ) : (
          <pre className="text-green-400 text-sm font-mono overflow-auto h-full whitespace-pre-wrap">
            {filteredLogs || 'No logs available'}
          </pre>
        )}
      </div>
    </div>
  );
}
