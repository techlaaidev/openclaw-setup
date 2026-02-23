import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  List,
  FileText,
  Cog,
  X,
  Terminal,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/providers', icon: Terminal, label: 'Providers' },
  { path: '/channels', icon: List, label: 'Channels' },
  { path: '/skills', icon: Settings, label: 'Skills' },
  { path: '/logs', icon: FileText, label: 'Logs' },
  { path: '/settings', icon: Cog, label: 'Settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Terminal className="w-8 h-8 text-primary" />
          <span className="ml-3 text-xl font-display font-bold text-gray-900">OpenClaw</span>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center px-4 py-3 rounded-lg transition-smooth group
                ${isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 transition-smooth ${isActive ? 'text-primary-700' : 'text-gray-500 group-hover:text-gray-700'}`} />
                  <span className="ml-3">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-display font-semibold text-primary-700">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.username || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || 'User'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-smooth"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
