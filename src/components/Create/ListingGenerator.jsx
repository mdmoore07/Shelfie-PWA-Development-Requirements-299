import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import Button from '../common/Button';
import Card from '../common/Card';
import ProgressBar from './ProgressBar';
import { analyzeImages, generateListing, suggestPrice } from '../../services/aiService';

const { FiCheck, FiAlertCircle, FiDollarSign } = FiIcons;

// Helper function to get user API key from local storage
const getUserApiKey = () => {
  try {
    const userSettings = JSON.parse(localStorage.getItem('shelfie-settings')) || {};
    return userSettings.openaiApiKey || '';
  } catch (e) {
    console.error('Error getting API key:', e);
    return '';
  }
};

const ListingGenerator = ({ photos, onListingGenerated }) => {
  const [stage, setStage] = useState('idle'); // 'idle', 'analyzing', 'analyzed', 'generating', 'complete'
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [pricing, setPricing] = useState(null);
  
  // Form state
  const [listingType, setListingType] = useState('fb'); // 'fb' or 'general'
  
  const [fbListing, setFbListing] = useState({
    title: '',
    price: '',
    category: '',
    condition: 'used_good',
    description: ''
  });
  
  const [additionalContext, setAdditionalContext] = useState({
    title: '',
    description: '',
    category: '',
    brand: '',
    model: '',
    condition: 'used_good',
    additionalDetails: ''
  });

  // Start analysis when photos are provided
  useEffect(() => {
    if (photos.length > 0 && stage === 'idle') {
      analyzeImagesFirst();
    }
  }, [photos]);

  const analyzeImagesFirst = async () => {
    try {
      // Check for API key - user specific
      const apiKey = getUserApiKey();
      if (!apiKey) {
        setError('Please add your OpenAI API key in Settings to use AI generation');
        return;
      }
      
      setStage('analyzing');
      setProgress(5);
      setError(null);
      
      console.log('Starting image analysis...');
      const [analysisResult, pricingResult] = await Promise.all([
        analyzeImages(photos),
        suggestPrice(photos) // Run price analysis in parallel
      ]);
      
      console.log('Analysis result:', analysisResult);
      console.log('Initial price estimate:', pricingResult);
      
      setAnalysis(analysisResult);
      setPricing(pricingResult); // Store initial pricing data

      // Auto-populate fields based on REAL analysis
      if (listingType === 'fb') {
        setFbListing(prev => ({
          ...prev,
          title: analysisResult.suggestedTitle || `${analysisResult.brand || ''} ${analysisResult.category}`.trim(),
          category: analysisResult.category || prev.category,
          condition: analysisResult.condition || prev.condition,
          price: Math.floor(pricingResult.suggestedPrice) || prev.price // Auto-populate price
        }));
      } else if (listingType === 'general') {
        setAdditionalContext(prev => ({
          ...prev,
          category: analysisResult.category || prev.category,
          brand: analysisResult.brand || prev.brand,
          model: analysisResult.model || prev.model
        }));
      }

      setStage('analyzed');
      setProgress(80);
    } catch (error) {
      console.error('Error analyzing images:', error);
      setError(error.message || 'Error analyzing images. Please check your API key and try again.');
      setStage('idle');
    }
  };

  const generateListingWithAI = async () => {
    try {
      setStage('generating');
      setProgress(85);
      setError(null);

      // Prepare data based on listing type
      const listingData = listingType === 'fb' ? fbListing : additionalContext;
      
      // Generate listing with AI
      const result = await generateListing(photos, listingData, listingType, analysis);
      
      // Set final result
      setProgress(100);
      setStage('complete');
      
      // Call the callback with the generated listing
      onListingGenerated({
        listing: result,
        photos: photos,
        analysis: analysis,
        pricing: pricing,
        type: listingType,
        fbData: listingType === 'fb' ? fbListing : null
      });
    } catch (error) {
      console.error('Error generating listing:', error);
      setError(error.message || 'Error generating listing. Please try again.');
      setStage('analyzed');
    }
  };

  // Handle form input changes
  const handleFbChange = (e) => {
    const { name, value } = e.target;
    setFbListing(prev => ({ ...prev, [name]: value }));
  };

  const handleAdditionalChange = (e) => {
    const { name, value } = e.target;
    setAdditionalContext(prev => ({ ...prev, [name]: value }));
  };

  // Loading stage
  if (stage === 'analyzing' || stage === 'generating') {
    return (
      <div className="space-y-6">
        <Card>
          <div className="py-8 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {stage === 'analyzing' ? 'Analyzing Photos' : 'Generating Listing'}
                </h3>
                <p className="text-gray-600">
                  {stage === 'analyzing' ? 'AI is analyzing your photos...' : 'Creating your perfect listing...'}
                </p>
              </div>
            </div>
            
            <ProgressBar progress={progress} />
            
            <p className="text-sm text-gray-500 italic text-center">
              {stage === 'analyzing' 
                ? 'Identifying item details, condition, and features...'
                : 'Crafting an optimized listing with compelling description...'}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <div className="py-6 space-y-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <SafeIcon icon={FiAlertCircle} className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Something Went Wrong</h3>
                <p className="text-gray-600">We encountered an error</p>
              </div>
            </div>
            
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
              {error}
            </div>
            
            <Button 
              onClick={() => {
                setError(null);
                setStage('idle');
                analyzeImagesFirst();
              }}
              variant="primary"
              fullWidth
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Analysis complete, show form for additional info
  if (stage === 'analyzed') {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <SafeIcon icon={FiCheck} className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Analysis Complete!</h3>
              <p className="text-gray-600">AI has analyzed your photos and identified the item</p>
            </div>
          </div>

          {analysis && (
            <div className="space-y-4">
              {/* Analysis Results */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">What AI Found:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Category:</strong> {analysis.category}</div>
                  <div><strong>Condition:</strong> {analysis.condition}</div>
                  {analysis.brand && <div><strong>Brand:</strong> {analysis.brand}</div>}
                  {analysis.model && <div><strong>Model:</strong> {analysis.model}</div>}
                  {analysis.colors && analysis.colors.length > 0 && (
                    <div><strong>Colors:</strong> {analysis.colors.join(', ')}</div>
                  )}
                  {analysis.materials && analysis.materials.length > 0 && (
                    <div><strong>Materials:</strong> {analysis.materials.join(', ')}</div>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Confidence: {Math.round((analysis.confidence || 0.7) * 100)}%
                </div>
              </div>

              {/* Price Estimate */}
              {pricing && (
                <div className="bg-primary-50 rounded-lg p-4">
                  <h4 className="font-medium text-primary-900 mb-2">
                    <SafeIcon icon={FiDollarSign} className="w-5 h-5 inline-block mr-1" />
                    Estimated Price Range
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-primary-600">
                        ${pricing.suggestedPrice}
                      </div>
                      <div className="text-sm text-primary-700">Suggested Price</div>
                    </div>
                    <div>
                      <div className="text-lg font-medium text-primary-800">
                        ${pricing.priceRange.min} - ${pricing.priceRange.max}
                      </div>
                      <div className="text-sm text-primary-700">Market Range</div>
                    </div>
                  </div>
                  {pricing.reasoning && (
                    <div className="mt-2 text-sm text-primary-700">
                      <strong>Why?</strong> {pricing.reasoning}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Listing Type Selector */}
        <Card>
          <h4 className="font-medium text-gray-900 mb-4">Where Are You Selling?</h4>
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

        {/* Listing Form Based on Type */}
        {listingType === 'fb' ? (
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">Facebook Marketplace Details</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={fbListing.title}
                  onChange={handleFbChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Brand Name Item in Great Condition"
                />
                <div className="mt-1 text-xs text-gray-500">
                  {fbListing.title.length}/100 characters (recommended: 5-15 words)
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input
                  type="number"
                  name="price"
                  value={fbListing.price}
                  onChange={handleFbChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={fbListing.category}
                  onChange={handleFbChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Furniture, Electronics, Clothing"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  name="condition"
                  value={fbListing.condition}
                  onChange={handleFbChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="new">New</option>
                  <option value="used_like_new">Used - Like New</option>
                  <option value="used_good">Used - Good</option>
                  <option value="used_fair">Used - Fair</option>
                  <option value="used_poor">Used - Poor</option>
                </select>
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">General Listing Details</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={additionalContext.category}
                  onChange={handleAdditionalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Furniture, Electronics, Clothing"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand/Make</label>
                <input
                  type="text"
                  name="brand"
                  value={additionalContext.brand}
                  onChange={handleAdditionalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Samsung, IKEA, Nike"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model/Style</label>
                <input
                  type="text"
                  name="model"
                  value={additionalContext.model}
                  onChange={handleAdditionalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Galaxy S21, MALM, Air Force 1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                <select
                  name="condition"
                  value={additionalContext.condition}
                  onChange={handleAdditionalChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details (optional)</label>
                <textarea
                  name="additionalDetails"
                  value={additionalContext.additionalDetails}
                  onChange={handleAdditionalChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Any special features, history, or details about the item..."
                ></textarea>
              </div>
            </div>
          </Card>
        )}

        <div className="flex space-x-3">
          <Button
            onClick={() => setStage('idle')}
            variant="outline"
            fullWidth
          >
            Back to Photos
          </Button>
          <Button
            onClick={generateListingWithAI}
            variant="primary"
            fullWidth
            disabled={listingType === 'fb' && (!fbListing.title || !fbListing.price)}
          >
            Generate Listing
          </Button>
        </div>
      </div>
    );
  }

  // Default/initial state (should not normally be visible due to auto-start)
  return (
    <div className="space-y-6">
      <Card>
        <div className="py-6 text-center">
          <Button onClick={analyzeImagesFirst} variant="primary" fullWidth>
            Analyze Photos
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ListingGenerator;