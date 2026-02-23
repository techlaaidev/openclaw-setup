import { useState, useEffect, useRef } from 'react';
import { logsApi } from '../services/api';
import { RefreshCw, Download, Search, FileText } from 'lucide-react';

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
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Logs</h1>
          <p className="text-gray-600">View OpenClaw application logs in real-time</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={lines}
            onChange={(e) => setLines(Number(e.target.value))}
            className="input py-2"
          >
            <option value={50}>50 lines</option>
            <option value={100}>100 lines</option>
            <option value={200}>200 lines</option>
            <option value={500}>500 lines</option>
          </select>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn flex items-center ${autoRefresh ? 'btn-primary' : 'btn-secondary'}`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto
          </button>
          <button
            onClick={loadLogs}
            className="btn btn-ghost"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleDownload}
            className="btn btn-secondary flex items-center"
          >
            <Download className="w-4 h-4 mr-2" /> Download
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter logs..."
          className="input pl-12"
        />
      </div>

      {/* Log Viewer */}
      <div className="flex-1 bg-gray-900 rounded-xl p-6 overflow-hidden min-h-[500px] card border-2 border-gray-800">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-600 animate-pulse" />
              <p className="text-gray-400">Loading logs...</p>
            </div>
          </div>
        ) : (
          <pre className="text-green-400 text-sm font-mono overflow-auto h-full whitespace-pre-wrap leading-relaxed">
            {filteredLogs || 'No logs available'}
          </pre>
        )}
      </div>
    </div>
  );
}
