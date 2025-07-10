import React from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import Card from '../components/common/Card';
import useStore from '../store/useStore';

const AnalyticsPage = () => {
  const { listings } = useStore();
  
  const stats = {
    totalListings: listings.length,
    totalValue: listings.reduce((sum, listing) => sum + (listing.price || 0), 0),
    averagePrice: listings.length > 0 ? Math.round(listings.reduce((sum, listing) => sum + (listing.price || 0), 0) / listings.length) : 0,
    soldValue: listings.filter(l => l.status === 'sold').reduce((sum, listing) => sum + (listing.price || 0), 0),
  };
  
  const statusBreakdown = {
    draft: listings.filter(l => l.status === 'draft').length,
    posted: listings.filter(l => l.status === 'posted').length,
    sold: listings.filter(l => l.status === 'sold').length,
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Analytics" />
      
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-6 pb-24 space-y-6"
      >
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {stats.totalListings}
            </div>
            <div className="text-sm text-gray-600">Total Listings</div>
          </Card>
          
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalValue}
            </div>
            <div className="text-sm text-gray-600">Total Value</div>
          </Card>
          
          <Card className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              ${stats.averagePrice}
            </div>
            <div className="text-sm text-gray-600">Average Price</div>
          </Card>
          
          <Card className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ${stats.soldValue}
            </div>
            <div className="text-sm text-gray-600">Sold Value</div>
          </Card>
        </div>
        
        {/* Status Breakdown */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Listing Status</h3>
          <div className="space-y-3">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="capitalize text-gray-700">{status}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        status === 'draft' ? 'bg-gray-500' :
                        status === 'posted' ? 'bg-green-500' :
                        'bg-purple-500'
                      }`}
                      style={{ width: `${stats.totalListings > 0 ? (count / stats.totalListings) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Coming Soon */}
        <Card className="text-center py-8">
          <h3 className="font-semibold text-gray-900 mb-2">More Analytics Coming Soon</h3>
          <p className="text-gray-600 text-sm">
            Performance tracking, price optimization insights, and market trends will be available in future updates.
          </p>
        </Card>
      </motion.main>
      
      <BottomNav />
    </div>
  );
};

export default AnalyticsPage;