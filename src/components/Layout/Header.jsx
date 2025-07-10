import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import useStore from '../../store/useStore';

const { FiArrowLeft, FiMenu, FiUser, FiSettings } = FiIcons;

const Header = ({ title, showBack = false, actions = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useStore();
  
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };
  
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-3">
          {showBack ? (
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <SafeIcon icon={FiArrowLeft} className="w-5 h-5 text-gray-600" />
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-lg text-gray-900">Shelfie</span>
            </div>
          )}
          
          {title && (
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h1>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`p-2 rounded-full transition-colors ${
                action.variant === 'primary'
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'hover:bg-gray-100 text-gray-600'
              } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <SafeIcon icon={action.icon} className="w-5 h-5" />
            </button>
          ))}
          
          {location.pathname === '/' && (
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isAuthenticated ? (
                <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {user?.name?.[0] || 'U'}
                  </span>
                </div>
              ) : (
                <SafeIcon icon={FiUser} className="w-5 h-5 text-gray-600" />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;