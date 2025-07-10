import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import Button from '../common/Button';
import Card from '../common/Card';
import useStore from '../../store/useStore';
import { useAuth } from '../../contexts/AuthContext';

const { FiKey, FiEye, FiEyeOff, FiCheck, FiAlertCircle, FiSettings } = FiIcons;

const ApiKeySettings = () => {
  const { user } = useAuth();
  const { settings, updateSettings } = useStore();
  
  // Get user-specific API key from localStorage
  const getUserApiKey = () => {
    if (!user) return '';
    
    try {
      const userSettings = JSON.parse(localStorage.getItem(`shelfie-user-${user.id}-settings`)) || {};
      return userSettings.openaiApiKey || '';
    } catch (e) {
      return '';
    }
  };
  
  // Save user-specific API key to localStorage
  const saveUserApiKey = (key) => {
    if (!user) return;
    
    try {
      const userSettings = JSON.parse(localStorage.getItem(`shelfie-user-${user.id}-settings`)) || {};
      userSettings.openaiApiKey = key;
      localStorage.setItem(`shelfie-user-${user.id}-settings`, JSON.stringify(userSettings));
      
      // Also update the main settings for current session
      updateSettings({ openaiApiKey: key });
    } catch (e) {
      console.error('Error saving user API key:', e);
    }
  };
  
  // Get user-specific AI settings from localStorage
  const getUserAiSettings = () => {
    if (!user) return settings.aiSettings || { listingStyle: 'casual', customPrompt: '', removeEmojis: false };
    
    try {
      const userSettings = JSON.parse(localStorage.getItem(`shelfie-user-${user.id}-settings`)) || {};
      return userSettings.aiSettings || { listingStyle: 'casual', customPrompt: '', removeEmojis: false };
    } catch (e) {
      return { listingStyle: 'casual', customPrompt: '', removeEmojis: false };
    }
  };
  
  // Save user-specific AI settings to localStorage
  const saveUserAiSettings = (aiSettings) => {
    if (!user) return;
    
    try {
      const userSettings = JSON.parse(localStorage.getItem(`shelfie-user-${user.id}-settings`)) || {};
      userSettings.aiSettings = aiSettings;
      localStorage.setItem(`shelfie-user-${user.id}-settings`, JSON.stringify(userSettings));
      
      // Also update the main settings for current session
      updateSettings({ aiSettings });
    } catch (e) {
      console.error('Error saving user AI settings:', e);
    }
  };

  const [openaiKey, setOpenaiKey] = useState(getUserApiKey() || '');
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState(getUserApiKey() ? 'saved' : 'empty');
  const [isValidating, setIsValidating] = useState(false);

  // AI Settings state
  const [aiSettings, setAiSettings] = useState(getUserAiSettings());

  // Validate OpenAI API key
  const validateOpenAIKey = async (key) => {
    if (!key) {
      setKeyStatus('empty');
      return false;
    }

    setIsValidating(true);
    setKeyStatus('validating');

    try {
      // Simple regex validation for OpenAI key format (sk-...)
      if (!key.startsWith('sk-') || key.length < 20) {
        setKeyStatus('invalid');
        setIsValidating(false);
        return false;
      }

      // In a real app, you'd make a test API call here
      // For now, we'll just simulate a validation
      await new Promise(resolve => setTimeout(resolve, 1000));

      setKeyStatus('valid');
      setIsValidating(false);
      return true;
    } catch (error) {
      console.error('Error validating API key:', error);
      setKeyStatus('invalid');
      setIsValidating(false);
      return false;
    }
  };

  const saveApiKey = async () => {
    const isValid = await validateOpenAIKey(openaiKey);
    if (isValid) {
      // Save to store and local storage (for this specific user)
      saveUserApiKey(openaiKey);
      setKeyStatus('saved');
    }
  };

  const updateAISettings = (newSettings) => {
    const updatedAiSettings = { ...aiSettings, ...newSettings };
    setAiSettings(updatedAiSettings);
    
    // Auto-save AI settings
    saveUserAiSettings(updatedAiSettings);
  };

  const statusIndicators = {
    empty: { color: 'text-gray-400', text: 'No API key set' },
    validating: { color: 'text-blue-500', text: 'Validating...' },
    invalid: { color: 'text-red-500', text: 'Invalid key format' },
    valid: { color: 'text-green-500', text: 'Valid key' },
    saved: { color: 'text-green-500', text: 'API key saved' },
  };

  // If no user is logged in, show message
  if (!user) {
    return (
      <Card className="text-center py-6">
        <SafeIcon icon={FiAlertCircle} className="w-12 h-12 mx-auto text-orange-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign In Required</h3>
        <p className="text-gray-600 mb-4">
          Please sign in to manage your API keys and settings.
        </p>
        <Button 
          onClick={() => window.location.href = '/auth'}
          variant="primary"
        >
          Sign In
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* OpenAI API Key Section */}
      <Card className="space-y-4">
        <h3 className="font-semibold text-gray-900">OpenAI API Key</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <div className="relative">
            <SafeIcon icon={FiKey} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type={showKey ? 'text' : 'password'}
              value={openaiKey}
              onChange={(e) => {
                setOpenaiKey(e.target.value);
                if (keyStatus === 'saved' || keyStatus === 'valid') {
                  setKeyStatus('empty');
                }
              }}
              placeholder="sk-..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <SafeIcon icon={showKey ? FiEyeOff : FiEye} className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-2 flex items-center">
            <SafeIcon
              icon={
                keyStatus === 'validating'
                  ? FiAlertCircle
                  : keyStatus === 'empty'
                  ? FiAlertCircle
                  : keyStatus === 'invalid'
                  ? FiAlertCircle
                  : FiCheck
              }
              className={`w-4 h-4 mr-1 ${statusIndicators[keyStatus].color}`}
            />
            <span className={`text-xs ${statusIndicators[keyStatus].color}`}>
              {statusIndicators[keyStatus].text}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Your API key is stored locally on your device and is never sent to our servers. It is used to make AI requests directly from your browser.
        </p>
        <Button 
          onClick={saveApiKey} 
          variant="primary" 
          loading={isValidating} 
          disabled={!openaiKey || isValidating}
          fullWidth
        >
          Save API Key
        </Button>
      </Card>

      {/* AI Customization Settings */}
      <Card className="space-y-4">
        <div className="flex items-center space-x-2">
          <SafeIcon icon={FiSettings} className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">AI Listing Customization</h3>
        </div>
        <p className="text-sm text-gray-600">
          Customize how AI generates your listings to match your selling style.
        </p>

        {/* Listing Style */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Listing Style
          </label>
          <select
            value={aiSettings.listingStyle}
            onChange={(e) => updateAISettings({ listingStyle: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="casual">Casual - Relaxed, friendly tone</option>
            <option value="professional">Professional - Formal, business-like</option>
            <option value="other">Other - Custom style</option>
          </select>
        </div>

        {/* Custom Prompt for "Other" */}
        {aiSettings.listingStyle === 'other' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Style Instructions (max 150 characters)
            </label>
            <textarea
              value={aiSettings.customPrompt}
              onChange={(e) => {
                if (e.target.value.length <= 150) {
                  updateAISettings({ customPrompt: e.target.value });
                }
              }}
              placeholder="e.g., Write like a vintage collector, use technical terms, be enthusiastic..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {aiSettings.customPrompt.length}/150
            </div>
          </motion.div>
        )}

        {/* Remove Emojis Option */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">Remove Emojis</h4>
            <p className="text-sm text-gray-600">
              Generate listings without emojis for a cleaner look
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={aiSettings.removeEmojis}
              onChange={(e) => updateAISettings({ removeEmojis: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
          </label>
        </div>

        {/* Style Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Style Preview:</h4>
          <div className="text-sm text-gray-700">
            {aiSettings.listingStyle === 'casual' && (
              <p>
                {aiSettings.removeEmojis
                  ? "Hey there! Selling this awesome item that's been great to me. It's in really good condition and ready for a new home. Perfect for anyone looking for quality at a great price!"
                  : "Hey there! 👋 Selling this awesome item that's been great to me. It's in really good condition and ready for a new home. Perfect for anyone looking for quality at a great price! 😊"}
              </p>
            )}
            {aiSettings.listingStyle === 'professional' && (
              <p>
                {aiSettings.removeEmojis
                  ? "This high-quality item is available for purchase. The product features excellent craftsmanship and has been well-maintained. Specifications include premium materials and reliable performance. Ideal for discerning buyers."
                  : "This high-quality item is available for purchase. ✨ The product features excellent craftsmanship and has been well-maintained. Specifications include premium materials and reliable performance. Ideal for discerning buyers. 🏆"}
              </p>
            )}
            {aiSettings.listingStyle === 'other' && (
              <p className="italic">
                Custom style based on your instructions: "{aiSettings.customPrompt || 'No custom instructions provided'}"
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ApiKeySettings;