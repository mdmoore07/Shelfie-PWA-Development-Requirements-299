import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import Card from '../common/Card';
import { useAuth } from '../../contexts/AuthContext';

const { FiSettings, FiHelpCircle, FiStar, FiShare2, FiKey, FiLogOut, FiLogIn } = FiIcons;

const ProfileMenu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const isAuthenticated = !!user;
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    {
      icon: FiSettings,
      label: 'Settings',
      action: () => navigate('/settings')
    },
    {
      icon: FiKey,
      label: 'AI Integration',
      description: 'Set up OpenAI API key',
      action: () => navigate('/settings')
    },
    {
      icon: FiHelpCircle,
      label: 'Help & Support',
      action: () => console.log('Help')
    },
    {
      icon: FiStar,
      label: 'Rate Shelfie',
      action: () => console.log('Rate')
    },
    {
      icon: FiShare2,
      label: 'Share with Friends',
      action: () => console.log('Share')
    },
  ];
  
  // Add auth-specific items
  if (isAuthenticated) {
    menuItems.push({
      icon: FiLogOut,
      label: 'Sign Out',
      action: handleSignOut
    });
  } else {
    menuItems.push({
      icon: FiLogIn,
      label: 'Sign In',
      action: () => navigate('/auth')
    });
  }

  return (
    <Card padding="none">
      <div className="divide-y divide-gray-200">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className="w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors"
          >
            <SafeIcon icon={item.icon} className="w-5 h-5 text-gray-600" />
            <div className="text-left">
              <span className="text-gray-900 font-medium">{item.label}</span>
              {item.description && (
                <p className="text-xs text-gray-500">{item.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
};

export default ProfileMenu;