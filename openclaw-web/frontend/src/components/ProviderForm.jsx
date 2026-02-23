import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function ProviderForm({ provider, types, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'anthropic',
    apiKey: '',
    baseUrl: '',
    model: '',
    enabled: true,
  });
  const [errors, setErrors] = useState({});
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    if (provider) {
      setFormData({
        name: provider.name || '',
        type: provider.type || 'anthropic',
        apiKey: '',
        baseUrl: provider.base_url || '',
        model: provider.model || '',
        enabled: provider.enabled !== undefined ? provider.enabled : true,
      });
    }

    // Set initial type info
    const typeInfo = types.find(t => t.id === (provider?.type || 'anthropic'));
    setSelectedType(typeInfo);
  }, [provider, types]);

  const handleTypeChange = (type) => {
    const typeInfo = types.find(t => t.id === type);
    setSelectedType(typeInfo);

    setFormData(prev => ({
      ...prev,
      type,
      baseUrl: typeInfo?.defaultBaseUrl || '',
      model: typeInfo?.defaultModelId || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (selectedType?.requiresApiKey && !formData.apiKey && !provider) {
      newErrors.apiKey = 'API key is required';
    }
    if (selectedType?.showBaseUrl && !formData.baseUrl) {
      newErrors.baseUrl = 'Base URL is required';
    }
    if (selectedType?.showModelId && !formData.model) {
      newErrors.model = 'Model ID is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      setErrors({ submit: error.message });
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card w-full max-w-2xl p-6 animate-slide-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold text-gray-900">
            {provider ? 'Edit Provider' : 'Add Provider'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-smooth"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Provider Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {types.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleTypeChange(type.id)}
                  className={`p-3 rounded-lg border-2 transition-smooth text-center ${
                    formData.type === type.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-xs font-medium text-gray-900">{type.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Provider Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`input ${errors.name ? 'border-red-500' : ''}`}
              placeholder={`My ${selectedType?.name || 'Provider'}`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.name}
              </p>
            )}
          </div>

          {/* API Key */}
          {selectedType?.requiresApiKey && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
                {provider && <span className="text-gray-500 ml-2">(leave blank to keep existing)</span>}
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                className={`input ${errors.apiKey ? 'border-red-500' : ''}`}
                placeholder={selectedType?.placeholder || 'Enter API key'}
              />
              {errors.apiKey && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.apiKey}
                </p>
              )}
            </div>
          )}

          {/* Base URL */}
          {selectedType?.showBaseUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Base URL
              </label>
              <input
                type="url"
                value={formData.baseUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                className={`input ${errors.baseUrl ? 'border-red-500' : ''}`}
                placeholder={selectedType?.defaultBaseUrl || 'https://api.example.com/v1'}
              />
              {errors.baseUrl && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.baseUrl}
                </p>
              )}
            </div>
          )}

          {/* Model ID */}
          {selectedType?.showModelId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model ID
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                className={`input ${errors.model ? 'border-red-500' : ''}`}
                placeholder={selectedType?.defaultModelId || 'model-name'}
              />
              {errors.model && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.model}
                </p>
              )}
            </div>
          )}

          {/* Enabled Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-900">Enable Provider</label>
              <p className="text-xs text-gray-600 mt-1">Make this provider available for use</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-smooth ${
                formData.enabled ? 'bg-primary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-smooth ${
                  formData.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                {errors.submit}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              {provider ? 'Update Provider' : 'Add Provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
