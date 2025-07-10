import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiHome, FiPlus, FiList, FiBarChart3, FiUser } = FiIcons;

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: FiHome, label: 'Home' },
    { path: '/create', icon: FiPlus, label: 'Create' },
    { path: '/listings', icon: FiList, label: 'Listings' },
    { path: '/analytics', icon: FiBarChart3, label: 'Analytics' },
    { path: '/profile', icon: FiUser, label: 'Profile' },
  ];
  
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };
  
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50"
    >
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-all ${
              isActive(item.path)
                ? 'text-primary-500 bg-primary-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <SafeIcon
              icon={item.icon}
              className={`w-6 h-6 ${
                item.path === '/create' && isActive(item.path)
                  ? 'bg-primary-500 text-white rounded-full p-1 w-8 h-8'
                  : ''
              }`}
            />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </motion.nav>
  );
};

export default BottomNav;