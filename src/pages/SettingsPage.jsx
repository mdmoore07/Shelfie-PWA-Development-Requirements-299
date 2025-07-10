import React from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import Card from '../components/common/Card';
import ApiKeySettings from '../components/Settings/ApiKeySettings';
import useStore from '../store/useStore';

const SettingsPage = () => {
  const { settings, updateSettings } = useStore();
  
  const toggleSetting = (key) => {
    updateSettings({ [key]: !settings[key] });
  };
  
  const appSettings = [
    { id: 'darkMode', label: 'Dark Mode', description: 'Use dark theme throughout the app' },
    { id: 'autoSave', label: 'Auto Save', description: 'Automatically save listings as drafts' },
    { id: 'notifications', label: 'Notifications', description: 'Receive alerts and reminders' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Settings" showBack={true} />
      
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-6 pb-24 space-y-6"
      >
        {/* API Settings */}
        <ApiKeySettings />
        
        {/* App Settings */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">App Settings</h3>
          <div className="space-y-4">
            {appSettings.map((setting) => (
              <div key={setting.id} className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{setting.label}</h4>
                  <p className="text-sm text-gray-600">{setting.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[setting.id] || false}
                    onChange={() => toggleSetting(setting.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Data & Privacy */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Data & Privacy</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Local Storage</h4>
              <p className="text-sm text-gray-600">All your data is stored locally on your device</p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </Card>
      </motion.main>
      
      <BottomNav />
    </div>
  );
};

export default SettingsPage;