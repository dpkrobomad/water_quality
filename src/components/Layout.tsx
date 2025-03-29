import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMQTTStore } from '../lib/mqtt';
import { 
  LayoutDashboard, 
  History, 
  Users, 
  LogOut, 
  User,
  WifiOff,
  Wifi,
  Activity,
  Bell,
  ChevronDown
} from 'lucide-react';

export default function Layout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isConnected = useMQTTStore(state => state.isConnected);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/users', icon: Users, label: 'Users' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Activity className="h-6 w-6 text-white mr-2" />
              <span className="text-xl font-semibold text-white">
                Water Quality Monitor
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-1.5 rounded-full ${
                isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span className="ml-2 text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <button className="p-2 text-white hover:bg-blue-700 rounded-full transition-colors duration-200">
                <Bell size={20} />
              </button>
              
              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-white hover:bg-blue-700 px-3 py-2 rounded-md transition-colors duration-200"
                >
                  <User size={20} />
                  <ChevronDown size={16} className={`transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm text-gray-700 font-medium">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <LogOut size={16} className="mr-2" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar and Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-gray-800 to-gray-900 min-h-[calc(100vh-4rem)] text-white">
          <div className="py-6">
            <div className="px-4 mb-6">
              <h2 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                Menu
              </h2>
            </div>
            <div className="space-y-1 px-3">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 mr-3 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 bg-gray-50">
          <Outlet />
        </div>
      </div>
    </div>
  );
}