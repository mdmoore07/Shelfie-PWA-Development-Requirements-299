import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import Button from '../common/Button';
import Card from '../common/Card';
import useStore from '../../store/useStore';

const { FiKey, FiEye, FiEyeOff, FiCheck, FiAlertCircle } = FiIcons;

const ApiKeySettings = () => {
  const { settings, updateSettings } = useStore();
  const [openaiKey, setOpenaiKey] = useState(settings.openaiApiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState(settings.openaiApiKey ? 'saved' : 'empty');
  const [isValidating, setIsValidating] = useState(false);
  const [aiStyle, setAiStyle] = useState(settings.aiSettings?.listingStyle || 'casual');
  const [customPrompt, setCustomPrompt] = useState(settings.aiSettings?.customPrompt || '');
  const [removeEmojis, setRemoveEmojis] = useState(settings.aiSettings?.removeEmojis || false);

  // Validate OpenAI API key format
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

  const saveSettings = async () => {
    const isValid = await validateOpenAIKey(openaiKey);
    if (isValid) {
      // Save all settings together
      updateSettings({
        openaiApiKey: openaiKey,
        aiSettings: {
          listingStyle: aiStyle,
          customPrompt,
          removeEmojis
        }
      });

      // Save to localStorage for persistence
      const settings = JSON.parse(localStorage.getItem('shelfie-settings') || '{}');
      settings.openaiApiKey = openaiKey;
      settings.aiSettings = {
        listingStyle: aiStyle,
        customPrompt,
        removeEmojis
      };
      localStorage.setItem('shelfie-settings', JSON.stringify(settings));
      setKeyStatus('saved');
    }
  };

  const statusIndicators = {
    empty: { color: 'text-gray-400', text: 'No API key set' },
    validating: { color: 'text-blue-500', text: 'Validating...' },
    invalid: { color: 'text-red-500', text: 'Invalid key format' },
    valid: { color: 'text-green-500', text: 'Valid key' },
    saved: { color: 'text-green-500', text: 'API key saved' },
  };

  return (
    <div className="space-y-6">
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
              icon={keyStatus === 'validating' ? FiAlertCircle : keyStatus === 'empty' ? FiAlertCircle : keyStatus === 'invalid' ? FiAlertCircle : FiCheck}
              className={`w-4 h-4 mr-1 ${statusIndicators[keyStatus].color}`}
            />
            <span className={`text-xs ${statusIndicators[keyStatus].color}`}>
              {statusIndicators[keyStatus].text}
            </span>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="font-semibold text-gray-900">AI Writing Style</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Listing Style
            </label>
            <select
              value={aiStyle}
              onChange={(e) => setAiStyle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="casual">Casual & Friendly</option>
              <option value="professional">Professional & Formal</option>
              <option value="custom">Custom Style</option>
            </select>
          </div>

          {aiStyle === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Writing Instructions
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter custom instructions for the AI..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Remove Emojis
              </label>
              <p className="text-xs text-gray-500">
                Don't include emojis in generated listings
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={removeEmojis}
                onChange={(e) => setRemoveEmojis(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </Card>

      <Button
        onClick={saveSettings}
        variant="primary"
        loading={isValidating}
        disabled={!openaiKey || isValidating}
        fullWidth
      >
        Save Settings
      </Button>
    </div>
  );
};

export default ApiKeySettings;