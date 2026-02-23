import { useState, useEffect } from 'react';
import { providersApi } from '../services/api';
import { Plus, Edit, Trash2, PlusCircle, Check, Sparkles } from 'lucide-react';
import ProviderForm from '../components/ProviderForm';
import { ProviderIcon } from '../lib/providerIcons';

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
    } finally {
      setLoading(false);
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
      const { data } = await providersApi.test(id);
      alert('Provider configuration valid!\n\n' + JSON.stringify(data.details, null, 2));
    } catch (error) {
      console.error('Test failed:', error);
      alert('Provider test failed: ' + error.message);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingProvider) {
        await providersApi.update(editingProvider.id, formData);
      } else {
        await providersApi.create(formData);
      }
      setShowForm(false);
      setEditingProvider(null);
      loadProviders();
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message);
    }
  };

  const handleEdit = (provider) => {
    setEditingProvider(provider);
    setShowForm(true);
  };

  const handleAdd = (presetType = null) => {
    setEditingProvider(presetType);
    setShowForm(true);
  };

  const ProviderCard = ({ provider }) => {
    const typeInfo = types.find(t => t.id === provider.type);
    return (
      <div className="card card-hover p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center mr-3">
              <ProviderIcon type={provider.type} className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h3 className="text-lg font-display font-semibold text-gray-900">{provider.name}</h3>
              <p className="text-sm text-gray-600">{typeInfo?.name || provider.type}</p>
            </div>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${provider.enabled ? 'bg-success-500' : 'bg-gray-400'}`}></div>
        </div>

        {provider.model && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <label className="text-xs text-gray-600 font-medium">Model</label>
            <p className="text-sm font-medium text-gray-900 mt-1">{provider.model}</p>
          </div>
        )}

        {provider.base_url && (
          <div className="mb-4">
            <label className="text-xs text-gray-600 font-medium">Base URL</label>
            <p className="text-sm font-medium text-gray-900 truncate mt-1">{provider.base_url}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex space-x-2">
            <button
              onClick={() => handleTest(provider.id)}
              className="btn btn-primary text-sm py-1.5 px-3 flex items-center"
            >
              <Check className="w-4 h-4 mr-1" /> Test
            </button>
            <button
              onClick={() => handleEdit(provider)}
              className="btn btn-ghost text-sm py-1.5 px-3"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => handleDelete(provider.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-smooth"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
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
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">AI Providers</h1>
          <p className="text-gray-600">Configure and manage AI model providers</p>
        </div>
        <button
          onClick={() => handleAdd()}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Provider
        </button>
      </div>

      {/* Kimi Featured Card */}
      <div className="card p-6 border-2 border-primary-200 bg-primary-50">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mr-4 shadow-sm">
            <ProviderIcon type="moonshot" className="w-10 h-10 text-primary-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <h3 className="text-xl font-display font-bold text-gray-900">Moonshot (Kimi)</h3>
              <span className="ml-3 badge badge-primary">Recommended</span>
            </div>
            <p className="text-gray-700 mt-1">Default provider for Vietnamese and Chinese language support</p>
            {providers.find(p => p.type === 'moonshot') ? (
              <div className="flex items-center mt-3 text-success-700">
                <Check className="w-5 h-5 mr-2" />
                <span className="font-medium">Configured</span>
              </div>
            ) : (
              <button
                onClick={() => handleAdd({ type: 'moonshot', name: 'Kimi' })}
                className="mt-3 btn btn-primary flex items-center"
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Add Kimi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Provider Grid */}
      {providers.length > 0 ? (
        <div>
          <h2 className="text-xl font-display font-semibold text-gray-900 mb-4">Configured Providers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {providers.map(provider => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">No providers configured</h3>
          <p className="text-gray-600 mb-6">Add your first AI provider to get started</p>
          <button
            onClick={() => handleAdd()}
            className="btn btn-primary inline-flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Add Provider
          </button>
        </div>
      )}

      {/* Provider Form Modal */}
      {showForm && (
        <ProviderForm
          provider={editingProvider}
          types={types}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingProvider(null);
          }}
        />
      )}
    </div>
  );
}
