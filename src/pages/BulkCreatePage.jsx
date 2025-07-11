import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import Header from '../components/Layout/Header';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import SafeIcon from '../components/common/SafeIcon';
import useStore from '../store/useStore';
import { analyzeImages, generateListing } from '../services/aiService';
import { validateImageFile, createImagePreview } from '../services/imageService';

const { FiPlus, FiTrash2, FiLoader, FiCheck, FiImage, FiX, FiCamera, FiUpload, FiCheckCircle } = FiIcons;

const BulkCreatePage = () => {
  const navigate = useNavigate();
  const { addListing } = useStore();
  const [listingType, setListingType] = useState('fb');
  const [bulkListings, setBulkListings] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [processingComplete, setProcessingComplete] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Initialize with one empty listing
  useEffect(() => {
    if (bulkListings.length === 0) {
      addNewListing();
    }
  }, []);

  const addNewListing = () => {
    setBulkListings([
      ...bulkListings,
      {
        id: Date.now(),
        photos: [],
        status: 'pending' // pending, analyzing, completed, error
      }
    ]);
  };

  const removeListing = (id) => {
    setBulkListings(bulkListings.filter(listing => listing.id !== id));
  };

  const handlePhotosChange = (id, photos) => {
    setBulkListings(bulkListings.map(listing => 
      listing.id === id ? { ...listing, photos } : listing
    ));
  };

  const handleFiles = async (files, listingId) => {
    const fileArray = Array.from(files);
    const validFiles = [];

    for (const file of fileArray) {
      try {
        validateImageFile(file);
        const preview = await createImagePreview(file);
        validFiles.push({ file, preview });
      } catch (error) {
        console.error('Invalid file:', error.message);
        setErrorMessage(error.message);
      }
    }

    if (validFiles.length > 0) {
      const listing = bulkListings.find(l => l.id === listingId);
      if (listing) {
        const newPhotos = [...listing.photos, ...validFiles].slice(0, 4);
        handlePhotosChange(listingId, newPhotos);
      }
    }
  };

  const processListings = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setCompletedCount(0);
    setCurrentProgress(0);
    setProcessingComplete(false);

    const listingsWithPhotos = bulkListings.filter(listing => listing.photos.length > 0);
    const total = listingsWithPhotos.length;
    let processed = 0;
    let successful = 0;

    if (total === 0) {
      setErrorMessage('Please add photos to at least one listing before processing.');
      setIsProcessing(false);
      return;
    }

    try {
      // Process each listing sequentially
      for (const listing of listingsWithPhotos) {
        // Update status to analyzing
        setBulkListings(prev => prev.map(l => 
          l.id === listing.id ? { ...l, status: 'analyzing' } : l
        ));

        try {
          console.log(`Processing listing ${processed + 1}/${total}`);
          
          // Analyze images
          console.log("Starting image analysis...");
          const analysis = await analyzeImages(listing.photos);
          console.log("Analysis complete:", analysis);

          // Generate listing
          console.log("Generating listing...");
          const generatedListing = await generateListing(
            listing.photos,
            { type: listingType },
            listingType,
            analysis
          );
          console.log("Listing generated:", generatedListing);

          // Add to store
          addListing({
            ...generatedListing,
            photos: listing.photos,
            status: 'draft',
            createdAt: new Date().toISOString(),
            price: generatedListing.price || 0,
            type: listingType,
            category: analysis.category || "Other",
            brand: analysis.brand || "",
            condition: analysis.condition || "used_good"
          });

          // Update status to completed
          setBulkListings(prev => prev.map(l => 
            l.id === listing.id ? { ...l, status: 'completed' } : l
          ));

          successful++;
          setCompletedCount(successful);
        } catch (error) {
          console.error('Error processing listing:', error);
          setBulkListings(prev => prev.map(l => 
            l.id === listing.id ? { 
              ...l, 
              status: 'error', 
              error: error.message || 'Processing failed' 
            } : l
          ));
        }

        processed++;
        setCurrentProgress((processed / total) * 100);
        
        // Small delay between processing to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Processing complete
      setProcessingComplete(true);
      
      if (successful > 0) {
        setSuccessMessage(`Successfully processed ${successful} of ${total} listings! All listings have been saved as drafts.`);
        
        // Auto-redirect to home after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setErrorMessage('No listings were successfully processed. Please check your photos and try again.');
      }

    } catch (error) {
      console.error('Bulk processing error:', error);
      setErrorMessage(error.message || 'An error occurred during processing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddPhoto = (listingId) => {
    fileInputRef.current?.click();
    fileInputRef.current.dataset.listingId = listingId;
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    const listingId = parseInt(e.target.dataset.listingId);
    if (files.length > 0 && listingId) {
      handleFiles(files, listingId);
    }
  };

  // Success completion screen
  if (processingComplete && successMessage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Bulk Processing Complete" showBack={false} />
        <motion.main 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-6 pb-24"
        >
          <Card className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <SafeIcon icon={FiCheckCircle} className="w-10 h-10 text-green-600" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Listings Created Successfully!
            </h2>
            
            <p className="text-gray-600 mb-6">
              {successMessage}
            </p>
            
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                {completedCount} listing{completedCount !== 1 ? 's' : ''} ready to review
              </p>
              <p className="text-green-600 text-sm mt-1">
                All listings have been saved as drafts in your account
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button 
                onClick={() => navigate('/listings')} 
                variant="primary" 
                fullWidth
              >
                View My Listings
              </Button>
              <Button 
                onClick={() => navigate('/')} 
                variant="outline" 
                fullWidth
              >
                Back to Home
              </Button>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to home in 3 seconds...
            </p>
          </Card>
        </motion.main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Bulk Create Listings" showBack={true} />
      
      <motion.main 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4 py-6 pb-24"
      >
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <Card className="mb-6">
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Processing Your Listings
              </h3>
              <p className="text-gray-600 mb-4">
                Please wait while we analyze and generate your listings...
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <motion.div 
                  className="bg-primary-500 h-2 rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${currentProgress}%` }}
                  transition={{ type: "spring", damping: 25, stiffness: 120 }}
                />
              </div>
              
              <p className="text-sm text-gray-500">
                {Math.round(currentProgress)}% Complete • {completedCount} listings processed
              </p>
            </div>
          </Card>
        )}

        {/* Listing Type Selection */}
        {!isProcessing && (
          <Card className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Select Listing Type</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setListingType('fb')}
                className={`p-4 border rounded-lg text-center ${
                  listingType === 'fb' 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-semibold mb-1">Facebook Marketplace</div>
                <div className="text-xs">Optimized for FB format</div>
              </button>
              <button
                onClick={() => setListingType('general')}
                className={`p-4 border rounded-lg text-center ${
                  listingType === 'general' 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-semibold mb-1">General Listing</div>
                <div className="text-xs">Works with any platform</div>
              </button>
            </div>
          </Card>
        )}

        {/* Listings */}
        {!isProcessing && (
          <div className="space-y-4 mb-6">
            {bulkListings.map((listing) => (
              <Card key={listing.id} className="relative">
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={() => removeListing(listing.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    disabled={isProcessing}
                  >
                    <SafeIcon icon={FiTrash2} className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Listing #{bulkListings.indexOf(listing) + 1}
                  </span>
                  {listing.status === 'analyzing' && (
                    <span className="ml-2 text-sm text-blue-600">
                      <SafeIcon icon={FiLoader} className="w-4 h-4 inline animate-spin" />
                      {' '}Analyzing...
                    </span>
                  )}
                  {listing.status === 'completed' && (
                    <span className="ml-2 text-sm text-green-600">
                      <SafeIcon icon={FiCheck} className="w-4 h-4 inline" />
                      {' '}Completed
                    </span>
                  )}
                  {listing.status === 'error' && (
                    <span className="ml-2 text-sm text-red-600">
                      Error: {listing.error}
                    </span>
                  )}
                </div>

                {/* Photo Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {listing.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      <img
                        src={photo.preview.url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          const newPhotos = listing.photos.filter((_, i) => i !== index);
                          handlePhotosChange(listing.id, newPhotos);
                        }}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                      >
                        <SafeIcon icon={FiX} className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs rounded">
                          Main
                        </div>
                      )}
                    </div>
                  ))}

                  {listing.photos.length < 4 && (
                    <button
                      onClick={() => handleAddPhoto(listing.id)}
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-primary-500 hover:bg-primary-50 transition-colors"
                      disabled={isProcessing}
                    >
                      <SafeIcon icon={FiPlus} className="w-6 h-6 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Photo Actions */}
                {listing.photos.length === 0 && (
                  <div className="mt-3 flex space-x-2">
                    <Button
                      onClick={() => {
                        cameraInputRef.current.dataset.listingId = listing.id;
                        cameraInputRef.current?.click();
                      }}
                      variant="outline"
                      size="sm"
                      icon={FiCamera}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      Camera
                    </Button>
                    <Button
                      onClick={() => handleAddPhoto(listing.id)}
                      variant="outline"
                      size="sm"
                      icon={FiUpload}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      Upload
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Add More Button */}
        {!isProcessing && (
          <Button
            onClick={addNewListing}
            variant="outline"
            fullWidth
            icon={FiPlus}
            className="mb-6"
            disabled={isProcessing}
          >
            Add Another Listing
          </Button>
        )}

        {/* Process Button */}
        {!isProcessing && (
          <Button
            onClick={processListings}
            variant="primary"
            fullWidth
            disabled={
              bulkListings.length === 0 || 
              isProcessing || 
              !bulkListings.some(listing => listing.photos.length > 0)
            }
            loading={isProcessing}
          >
            {isProcessing 
              ? `Processing... ${Math.round(currentProgress)}%` 
              : 'Analyze & Create Listings'
            }
          </Button>
        )}
      </motion.main>

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
};

export default BulkCreatePage;