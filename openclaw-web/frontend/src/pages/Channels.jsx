import { useState, useEffect } from 'react';
import { channelsApi } from '../services/api';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function Channels() {
  const [channels, setChannels] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [channelsRes, typesRes] = await Promise.all([
        channelsApi.list(),
        channelsApi.getTypes()
      ]);
      setChannels(channelsRes.data.channels);
      setTypes(typesRes.data.types);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (channel) => {
    try {
      if (channel.enabled) {
        await channelsApi.disable(channel.id);
      } else {
        await channelsApi.enable(channel.id);
      }
      loadData();
    } catch (error) {
      console.error('Failed to toggle channel:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this channel?')) return;
    try {
      await channelsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getTypeInfo = (type) => types.find(t => t.id === type) || {};

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Channels</h1>
          <p className="text-gray-600">Manage messaging platforms (Telegram, Zalo, WhatsApp)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Channel
        </button>
      </div>

      {/* Channel Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {types.map(type => {
          const hasChannel = channels.some(c => c.type === type.id);
          return (
            <div key={type.id} className={`rounded-xl p-6 border-2 ${hasChannel ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">{type.icon}</span>
                <div>
                  <h3 className="font-semibold text-lg">{type.name}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              </div>
              {hasChannel ? (
                <p className="text-green-600 text-sm">✓ Configured</p>
              ) : (
                <button
                  onClick={() => setShowModal({ type: type.id })}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Setup {type.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Channel List */}
      {channels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map(channel => (
            <div key={channel.id} className="bg-white rounded-xl shadow p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getTypeInfo(channel.type)?.icon}</span>
                  <div>
                    <h3 className="font-semibold">{channel.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{channel.type}</p>
                  </div>
                </div>
                <button onClick={() => handleToggle(channel)}>
                  {channel.enabled ? (
                    <ToggleRight className="w-8 h-8 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={() => setEditingChannel(channel)}
                  className="flex-1 px-3 py-2 border rounded hover:bg-gray-50 flex items-center justify-center"
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(channel.id)}
                  className="px-3 py-2 border border-red-200 text-red-600 rounded hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {(showModal || editingChannel) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">
              {editingChannel ? 'Edit Channel' : 'Add Channel'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  defaultValue={editingChannel?.name}
                  placeholder="My Telegram Bot"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  defaultValue={editingChannel?.type || showModal?.type}
                >
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              {/* Dynamic fields based on type */}
              {(!showModal || showModal?.type === 'telegram') && (
                <div>
                  <label className="block text-sm font-medium mb-1">Bot Token</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded"
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  />
                </div>
              )}
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setEditingChannel(null); }}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowModal(false); setEditingChannel(null); }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editingChannel ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
