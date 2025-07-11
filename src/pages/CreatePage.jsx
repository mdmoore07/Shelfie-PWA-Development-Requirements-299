import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import PhotoUpload from '../components/Create/PhotoUpload';
import ListingGenerator from '../components/Create/ListingGenerator';
import CreateOptionsModal from '../components/Create/CreateOptionsModal';
import Button from '../components/common/Button';
import useStore from '../store/useStore';

const CreatePage = () => {
  const navigate = useNavigate();
  const { addListing } = useStore();
  const [showOptionsModal, setShowOptionsModal] = useState(true);
  const [photos, setPhotos] = useState([]);
  const [generatedListing, setGeneratedListing] = useState(null);
  const [step, setStep] = useState(1); // 1: photos, 2: analyze, 3: generate

  const handleOptionsSelect = (option) => {
    setShowOptionsModal(false);
    if (option === 'bulk') {
      navigate('/bulk-create');
    }
  };

  const handlePhotosChange = (newPhotos) => {
    setPhotos(newPhotos);
  };

  const handleListingGenerated = (listingData) => {
    setGeneratedListing(listingData);
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
      
      {showOptionsModal && (
        <CreateOptionsModal
          onSelect={handleOptionsSelect}
          onClose={() => setShowOptionsModal(false)}
        />
      )}

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-6 pb-24"
      >
        {/* Rest of the CreatePage component remains the same */}
        {/* Progress Indicator - 3 Steps */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {/* Step indicators remain the same */}
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