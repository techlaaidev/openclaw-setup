import { useState, useEffect } from 'react';
import { skillsApi } from '../services/api';
import { Settings, RefreshCw, ShoppingBag, Check, X } from 'lucide-react';

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
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Skills</h1>
          <p className="text-gray-600">Manage OpenClaw skills and plugins</p>
        </div>
        <button
          onClick={handleReload}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center"
        >
          <RefreshCw className="w-5 h-5 mr-2" /> Reload Skills
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('installed')}
            className={`py-4 px-1 border-b-2 font-medium ${activeTab === 'installed' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Installed ({skills.length})
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`py-4 px-1 border-b-2 font-medium flex items-center ${activeTab === 'marketplace' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <ShoppingBag className="w-4 h-4 mr-2" /> Marketplace
          </button>
        </nav>
      </div>

      {/* Installed Skills */}
      {activeTab === 'installed' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No skills installed yet
            </div>
          ) : (
            skills.map(skill => (
              <div key={skill.name} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{skill.name}</h3>
                    <p className="text-sm text-gray-600">{skill.description || 'No description'}</p>
                  </div>
                  <button
                    onClick={() => handleToggleSkill(skill.name, skill.enabled)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${skill.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {skill.enabled ? <><Check className="w-3 h-3 inline mr-1" /> Enabled</> : <><X className="w-3 h-3 inline mr-1" /> Disabled</>}
                  </button>
                </div>
                {skill.author && (
                  <p className="text-xs text-gray-500">by {skill.author}</p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Marketplace */}
      {activeTab === 'marketplace' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketplace.map(skill => {
            const installed = isInstalled(skill.name);
            return (
              <div key={skill.name} className="bg-white rounded-xl shadow p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{skill.name}</h3>
                    <p className="text-sm text-gray-600">{skill.description}</p>
                  </div>
                  {installed ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                      Installed
                    </span>
                  ) : (
                    <button className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700">
                      Install
                    </button>
                  )}
                </div>
                {skill.author && (
                  <p className="text-xs text-gray-500">by {skill.author}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
