import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import Button from '../common/Button';
import useStore from '../../store/useStore';

const { FiCamera, FiZap, FiDollarSign, FiClock } = FiIcons;

const WelcomeSection = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useStore();
  
  const features = [
    {
      icon: FiCamera,
      title: 'Photo Magic',
      description: 'Snap a photo and watch AI create your listing'
    },
    {
      icon: FiZap,
      title: 'Instant Results',
      description: 'Professional listings in under 60 seconds'
    },
    {
      icon: FiDollarSign,
      title: 'Smart Pricing',
      description: 'Market-based price suggestions that sell'
    },
    {
      icon: FiClock,
      title: 'Save Time',
      description: 'From 30 minutes to 3 minutes per listing'
    }
  ];
  
  return (
    <div className="px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Transform Photos into Listings
        </h1>
        <p className="text-gray-600 text-lg">
          Use AI to create professional marketplace listings instantly
        </p>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <Button
          onClick={() => navigate('/create')}
          variant="primary"
          size="lg"
          fullWidth
          icon={FiCamera}
          className="mb-4"
        >
          Create Your First Listing
        </Button>
        <p className="text-center text-sm text-gray-500">
          Free • No signup required • Works with all marketplaces
        </p>
      </motion.div>
      
      <div className="grid grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="text-center p-4 rounded-lg bg-gray-50"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <SafeIcon icon={feature.icon} className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </motion.div>
        ))}
      </div>
      
      {isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 p-4 bg-primary-50 rounded-lg border border-primary-200"
        >
          <h3 className="font-semibold text-primary-900 mb-2">
            Welcome back, {user?.name || 'User'}!
          </h3>
          <p className="text-primary-700 text-sm mb-3">
            Ready to create more amazing listings?
          </p>
          <Button
            onClick={() => navigate('/listings')}
            variant="outline"
            size="sm"
            fullWidth
          >
            View Your Listings
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default WelcomeSection;