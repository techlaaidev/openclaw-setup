import { useState, useEffect } from 'react';
import { skillsApi } from '../services/api';
import { Settings, RefreshCw, ShoppingBag, Check, X, Package } from 'lucide-react';

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [marketplace, setMarketplace] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('installed');

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setLoading(true);
    try {
      const [skillsRes, marketplaceRes] = await Promise.all([
        skillsApi.list(),
        skillsApi.marketplace()
      ]);
      setSkills(skillsRes.data.skills || []);
      setMarketplace(marketplaceRes.data.skills || []);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReload = async () => {
    try {
      await skillsApi.reload();
      await loadSkills();
    } catch (error) {
      console.error('Failed to reload skills:', error);
    }
  };

  const handleToggleSkill = async (skillName, currentEnabled) => {
    try {
      await skillsApi.update(skillName, { enabled: !currentEnabled });
      loadSkills();
    } catch (error) {
      console.error('Failed to toggle skill:', error);
    }
  };

  const isInstalled = (skillName) => skills.some(s => s.name === skillName);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Skills</h1>
          <p className="text-gray-600">Manage OpenClaw skills and plugins</p>
        </div>
        <button
          onClick={handleReload}
          className="btn btn-secondary flex items-center"
        >
          <RefreshCw className="w-5 h-5 mr-2" /> Reload Skills
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('installed')}
            className={`py-4 px-1 border-b-2 font-medium transition-smooth ${
              activeTab === 'installed'
                ? 'border-primary text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Installed ({skills.length})
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`py-4 px-1 border-b-2 font-medium flex items-center transition-smooth ${
              activeTab === 'marketplace'
                ? 'border-primary text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4 mr-2" /> Marketplace
          </button>
        </nav>
      </div>

      {/* Installed Skills */}
      {activeTab === 'installed' && (
        <div>
          {skills.length === 0 ? (
            <div className="card p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">No skills installed</h3>
              <p className="text-gray-600 mb-6">Browse the marketplace to install your first skill</p>
              <button
                onClick={() => setActiveTab('marketplace')}
                className="btn btn-primary inline-flex items-center"
              >
                <ShoppingBag className="w-5 h-5 mr-2" /> Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map(skill => (
                <div key={skill.name} className="card card-hover p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-lg text-gray-900 mb-1">{skill.name}</h3>
                      <p className="text-sm text-gray-600">{skill.description || 'No description'}</p>
                    </div>
                  </div>
                  {skill.author && (
                    <p className="text-xs text-gray-500 mb-4">by {skill.author}</p>
                  )}
                  <button
                    onClick={() => handleToggleSkill(skill.name, skill.enabled)}
                    className={`w-full btn flex items-center justify-center ${
                      skill.enabled ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {skill.enabled ? (
                      <>
                        <Check className="w-4 h-4 mr-2" /> Enabled
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 mr-2" /> Disabled
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Marketplace */}
      {activeTab === 'marketplace' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplace.length === 0 ? (
            <div className="col-span-full card p-12 text-center">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-display font-semibold text-gray-900 mb-2">No skills available</h3>
              <p className="text-gray-600">Check back later for new skills</p>
            </div>
          ) : (
            marketplace.map(skill => {
              const installed = isInstalled(skill.name);
              return (
                <div key={skill.name} className="card card-hover p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-lg text-gray-900 mb-1">{skill.name}</h3>
                      <p className="text-sm text-gray-600">{skill.description}</p>
                    </div>
                  </div>
                  {skill.author && (
                    <p className="text-xs text-gray-500 mb-4">by {skill.author}</p>
                  )}
                  {installed ? (
                    <div className="badge badge-success w-full py-2 text-center">
                      <Check className="w-4 h-4 inline mr-1" /> Installed
                    </div>
                  ) : (
                    <button className="btn btn-primary w-full">
                      Install
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
