import { useState, useEffect } from 'react';
import { channelsApi } from '../services/api';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, MessageSquare } from 'lucide-react';

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
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Channels</h1>
          <p className="text-gray-600">Manage messaging platforms (Telegram, Zalo, WhatsApp)</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Channel
        </button>
      </div>

      {/* Channel Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {types.map(type => {
          const hasChannel = channels.some(c => c.type === type.id);
          return (
            <div
              key={type.id}
              className={`card p-6 border-2 transition-smooth ${
                hasChannel
                  ? 'border-success-200 bg-success-50'
                  : 'border-gray-200 hover:border-primary-200'
              }`}
            >
              <div className="flex items-start mb-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-3xl mr-3 shadow-sm">
                  {type.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-lg text-gray-900">{type.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                </div>
              </div>
              {hasChannel ? (
                <div className="flex items-center text-success-700">
                  <div className="w-2 h-2 bg-success-500 rounded-full mr-2"></div>
                  <span className="text-sm font-medium">Configured</span>
                </div>
              ) : (
                <button
                  onClick={() => setShowModal({ type: type.id })}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Setup {type.name} →
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Channel List */}
      {channels.length > 0 ? (
        <div>
          <h2 className="text-xl font-display font-semibold text-gray-900 mb-4">Active Channels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {channels.map(channel => (
              <div key={channel.id} className="card card-hover p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-2xl mr-3">
                      {getTypeInfo(channel.type)?.icon}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-gray-900">{channel.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{channel.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(channel)}
                    className="transition-smooth"
                  >
                    {channel.enabled ? (
                      <ToggleRight className="w-10 h-10 text-success-600" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setEditingChannel(channel)}
                    className="btn btn-secondary flex-1 flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(channel.id)}
                    className="p-2 border-2 border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-smooth"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">No channels configured</h3>
          <p className="text-gray-600 mb-6">Add your first messaging channel to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Channel
          </button>
        </div>
      )}

      {/* Modal */}
      {(showModal || editingChannel) && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card w-full max-w-lg p-6 animate-slide-in">
            <h3 className="text-xl font-display font-bold text-gray-900 mb-6">
              {editingChannel ? 'Edit Channel' : 'Add Channel'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  className="input"
                  defaultValue={editingChannel?.name}
                  placeholder="My Telegram Bot"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  className="input"
                  defaultValue={editingChannel?.type || showModal?.type}
                >
                  {types.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              {(!showModal || showModal?.type === 'telegram') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bot Token</label>
                  <input
                    type="password"
                    className="input"
                    placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                  />
                </div>
              )}
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setEditingChannel(null); }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowModal(false); setEditingChannel(null); }}
                className="btn btn-primary flex-1"
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
