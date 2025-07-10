import React from 'react';
import { motion } from 'framer-motion';
import useStore from '../../store/useStore';
import Card from '../common/Card';

const StatsSection = () => {
  const { getStats } = useStore();
  const stats = getStats();
  
  const statItems = [
    { label: 'Total Listings', value: stats.totalListings, color: 'text-blue-600' },
    { label: 'Active', value: stats.postedListings, color: 'text-green-600' },
    { label: 'Sold', value: stats.soldListings, color: 'text-purple-600' },
    { label: 'Drafts', value: stats.draftListings, color: 'text-orange-600' },
  ];
  
  if (stats.totalListings === 0) {
    return null;
  }
  
  return (
    <div className="px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Stats</h2>
        
        <div className="grid grid-cols-4 gap-3">
          {statItems.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="text-center py-3">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {stat.label}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default StatsSection;