import React from 'react';
import { motion } from 'framer-motion';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import WelcomeSection from '../components/Home/WelcomeSection';
import StatsSection from '../components/Home/StatsSection';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pb-20"
      >
        <WelcomeSection />
        <StatsSection />
      </motion.main>
      
      <BottomNav />
    </div>
  );
};

export default HomePage;