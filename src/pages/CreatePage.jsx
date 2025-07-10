import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import PhotoUpload from '../components/Create/PhotoUpload';
import ListingGenerator from '../components/Create/ListingGenerator';
import Button from '../components/common/Button';
import useStore from '../store/useStore';

const CreatePage = () => {
  const navigate = useNavigate();
  const { addListing } = useStore();
  const [photos, setPhotos] = useState([]);
  const [generatedListing, setGeneratedListing] = useState(null);
  const [step, setStep] = useState(1); // 1: photos, 2: analyze, 3: generate

  const handlePhotosChange = (newPhotos) => {
    setPhotos(newPhotos);
  };

  const handleListingGenerated = (listingData) => {
    setGeneratedListing(listingData);
    
    // Save to store with proper type categorization
    addListing({
      ...listingData.listing,
      photos: listingData.photos,
      analysis: listingData.analysis,
      pricing: listingData.pricing,
      status: 'draft',
      createdAt: new Date().toISOString(),
      price: listingData.pricing.suggestedPrice,
      type: listingData.type, // This will be 'fb' or 'general'
      fbData: listingData.fbData, // FB-specific data if applicable
      category: listingData.analysis.category,
      brand: listingData.analysis.brand,
      condition: listingData.analysis.condition
    });
  };

  const canProceed = photos.length > 0;

  // Determine current step based on state
  const getCurrentStep = () => {
    if (generatedListing) return 3;
    if (photos.length > 0) return 2;
    return 1;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Create Listing" showBack={true} />
      
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-6 pb-24"
      >
        {/* Progress Indicator - 3 Steps */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {/* Step 1: Add Photos */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 1 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-2 rounded-full ${
              currentStep >= 2 ? 'bg-primary-500' : 'bg-gray-200'
            }`} />
            
            {/* Step 2: Analyze */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 2 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`flex-1 h-2 rounded-full ${
              currentStep >= 3 ? 'bg-primary-500' : 'bg-gray-200'
            }`} />
            
            {/* Step 3: Generate */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep >= 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              3
            </div>
          </div>
          
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Add Photos</span>
            <span>Analyze</span>
            <span>Generate</span>
          </div>
        </div>

        {/* Step 1: Photo Upload */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <PhotoUpload
              photos={photos}
              onPhotosChange={handlePhotosChange}
              maxPhotos={4}
            />
            
            {canProceed && (
              <Button
                onClick={() => setStep(2)}
                variant="primary"
                size="lg"
                fullWidth
              >
                Continue to Analyze
              </Button>
            )}
          </motion.div>
        )}

        {/* Step 2 & 3: Analyze and Generate Listing */}
        {currentStep >= 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <ListingGenerator
              photos={photos}
              onListingGenerated={handleListingGenerated}
            />
            
            {generatedListing && (
              <div className="flex space-x-3">
                <Button
                  onClick={() => navigate('/listings')}
                  variant="outline"
                  fullWidth
                >
                  View All Listings
                </Button>
                <Button
                  onClick={() => {
                    setPhotos([]);
                    setGeneratedListing(null);
                    setStep(1);
                  }}
                  variant="primary"
                  fullWidth
                >
                  Create Another
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </motion.main>
      
      <BottomNav />
    </div>
  );
};

export default CreatePage;