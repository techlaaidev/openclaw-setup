import { useState, useEffect } from 'react';
import { providersApi } from '../services/api';
import { Plus, Edit, Trash2, PlusCircle, Check } from 'lucide-react';

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);

  useEffect(() => {
    loadProviders();
    loadTypes();
  }, []);

  const loadProviders = async () => {
    try {
      const { data } = await providersApi.list();
      setProviders(data.providers);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const loadTypes = async () => {
    try {
      const { data } = await providersApi.getTypes();
      setTypes(data.types);
    } catch (error) {
      console.error('Failed to load provider types:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    try {
      await providersApi.delete(id);
      loadProviders();
    } catch (error) {
      console.error('Failed to delete provider:', error);
      alert('Failed to delete provider: ' + error.message);
    }
  };

  const handleTest = async (id) => {
    try {
      await providersApi.test(id);
      alert('Provider configuration valid!');
    } catch (error) {
      console.error('Test failed:', error);
      alert('Provider test failed: ' + error.message);
    }
  };

  const ProviderCard = ({ provider }) => {
    const typeInfo = types.find(t => t.id === provider.type);
    return (
      <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">{typeInfo?.icon}</div>
            <div>
              <h3 className="text-lg font-semibold">{provider.name}</h3>
              <p className="text-sm text-gray-600">{typeInfo?.name || provider.type}</p>
            </div>
          </div>
          <div className={`w-3 h-3 rounded-full ${provider.enabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
        </div>

        {provider.model && (
          <div className="mb-4">
            <label className="text-sm text-gray-600">Model</label>
            <p className="font-medium">{provider.model}</p>
          </div>
        )}

        {provider.base_url && (
          <div className="mb-4">
            <label className="text-sm text-gray-600">Base URL</label>
            <p className="text-sm font-medium truncate">{provider.base_url}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => handleTest(provider.id)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            >
              <Check className="w-4 h-4 mr-1" /> Test
            </button>
            <button
              onClick={() => setEditingProvider(provider)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => handleDelete(provider.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Providers</h1>
          <p className="text-gray-600">Configure and manage AI model providers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Provider
        </button>
      </div>

      {/* Kimi Card (Default) */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center">
          <div className="text-3xl mr-4">🌙</div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">Moonshot (Kimi)</h3>
            <p className="text-gray-700 mt-1">Default provider for Vietnamese and Chinese language support</p>
            {providers.find(p => p.type === 'moonshot') ? (
              <p className="text-green-600 mt-2">✓ Configured</p>
            ) : (
              <button
                onClick={() => setShowAddModal({ type: 'moonshot', name: 'Kimi' })}
                className="mt-2 bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-50 flex items-center"
              >
                <PlusCircle className="w-4 h-4 mr-1" /> Add Kimi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Provider Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {providers.map(provider => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>

      {/* Add/Edit Modal (simplified) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingProvider ? 'Edit Provider' : 'Add Provider'}
            </h3>
            {/* Simplified form - would include more fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  defaultValue={editingProvider?.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">API Key</label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Enter API key"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle save
                  setShowAddModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {editingProvider ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
