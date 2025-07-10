import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import SafeIcon from '../components/common/SafeIcon';
import ProfileMenu from '../components/Profile/ProfileMenu';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { fetchUserListings } from '../services/listingService';

const { FiUser, FiLogOut, FiEdit3, FiBox } = FiIcons;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState({
    totalListings: 0,
    draftListings: 0,
    postedListings: 0,
    soldListings: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user listings stats
  useEffect(() => {
    if (user) {
      const loadListingStats = async () => {
        setIsLoading(true);
        try {
          const { data, error } = await fetchUserListings();
          if (error) throw error;
          
          setStats({
            totalListings: data.length,
            draftListings: data.filter(l => l.status === 'draft').length,
            postedListings: data.filter(l => l.status === 'posted').length,
            soldListings: data.filter(l => l.status === 'sold').length
          });
        } catch (error) {
          console.error('Error loading listing stats:', error);
          // Set default stats
          setStats({
            totalListings: 0,
            draftListings: 0,
            postedListings: 0,
            soldListings: 0
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      loadListingStats();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Profile" />
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-6 pb-24 space-y-6"
      >
        {/* User Profile */}
        <Card>
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-bold">
                  {profile?.full_name?.[0] || user.email?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">{profile?.full_name || 'User'}</h2>
                <p className="text-gray-600">{user.email}</p>
                <p className="text-sm text-gray-500">
                  Member since {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
              <Button 
                onClick={() => navigate('/settings')} 
                variant="outline" 
                size="sm"
                icon={FiEdit3}
              >
                Edit
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <SafeIcon icon={FiUser} className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sign in to Shelfie
              </h3>
              <p className="text-gray-600 mb-6">
                Save your listings, track your progress, and access premium features
              </p>
              <Button onClick={() => navigate('/auth')} variant="primary" fullWidth>
                Sign In
              </Button>
            </div>
          )}
        </Card>

        {/* User Stats (only if logged in) */}
        {user && (
          <Card>
            <h3 className="font-semibold text-gray-900 mb-4">Your Activity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-primary-600">{stats.totalListings}</div>
                <div className="text-xs text-gray-600">Total Listings</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{stats.postedListings}</div>
                <div className="text-xs text-gray-600">Active Listings</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.soldListings}</div>
                <div className="text-xs text-gray-600">Sold Items</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.draftListings}</div>
                <div className="text-xs text-gray-600">Drafts</div>
              </div>
            </div>
            <div className="mt-4">
              <Button 
                onClick={() => navigate('/listings')} 
                variant="outline" 
                fullWidth 
                icon={FiBox}
              >
                View All Listings
              </Button>
            </div>
          </Card>
        )}

        {/* Menu Items */}
        <ProfileMenu />

        {/* App Info */}
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">About Shelfie</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Version 1.0.0</p>
            <p>AI-powered listing generator for online marketplaces</p>
            <p>Made with ❤️ for sellers everywhere</p>
          </div>
        </Card>
      </motion.main>
      <BottomNav />
    </div>
  );
};

export default ProfilePage;