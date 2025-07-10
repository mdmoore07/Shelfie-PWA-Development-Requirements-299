import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';
import Card from '../common/Card';
import { analyzeImages, generateListing, suggestPrice } from '../../services/aiService';
import useStore from '../../store/useStore';
import ProgressBar from './ProgressBar';
import { useAuth } from '../../contexts/AuthContext';
import { createListing } from '../../services/listingService';

const { FiEdit3, FiDollarSign, FiCopy, FiCheck, FiRefreshCw, FiDownload, FiEye, FiCamera, FiAlertCircle } = FiIcons;

const FB_CONDITIONS = [
  "New",
  "Used - Like New",
  "Used - Good",
  "Used - Fair"
];

const ListingGenerator = ({ photos, onListingGenerated }) => {
  const { settings } = useStore();
  const { user } = useAuth();
  
  const [stage, setStage] = useState('idle'); // idle, analyzing, analyzed, generating, complete
  const [analysis, setAnalysis] = useState(null);
  const [listing, setListing] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedListing, setEditedListing] = useState(null);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const [listingType, setListingType] = useState('');
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState(null);

  // FB Marketplace specific state
  const [fbListing, setFbListing] = useState({
    title: '',
    price: '',
    condition: 'Used - Good',
    description: '',
    category: ''
  });

  // General listing state
  const [additionalContext, setAdditionalContext] = useState({
    category: '',
    brand: '',
    model: '',
    yearMade: '',
    additionalDetails: ''
  });

  // Progress simulation with detailed steps
  useEffect(() => {
    let interval;
    if (stage === 'analyzing') {
      const steps = [
        { progress: 10, step: 'Processing images...' },
        { progress: 25, step: 'Identifying product...' },
        { progress: 40, step: 'Analyzing condition...' },
        { progress: 60, step: 'Extracting details...' },
        { progress: 80, step: 'Finalizing analysis...' }
      ];
      let stepIndex = 0;
      interval = setInterval(() => {
        if (stepIndex < steps.length) {
          setProgress(steps[stepIndex].progress);
          setCurrentStep(steps[stepIndex].step);
          stepIndex++;
        } else {
          clearInterval(interval);
        }
      }, 800);
    } else if (stage === 'generating') {
      const steps = [
        { progress: 85, step: 'Generating title...' },
        { progress: 90, step: 'Writing description...' },
        { progress: 95, step: 'Calculating price...' },
        { progress: 100, step: 'Finalizing listing...' }
      ];
      let stepIndex = 0;
      interval = setInterval(() => {
        if (stepIndex < steps.length) {
          setProgress(steps[stepIndex].progress);
          setCurrentStep(steps[stepIndex].step);
          stepIndex++;
        } else {
          clearInterval(interval);
        }
      }, 600);
    } else if (stage === 'complete') {
      setProgress(100);
      setCurrentStep('Complete!');
    } else {
      setProgress(0);
      setCurrentStep('');
    }

    return () => clearInterval(interval);
  }, [stage]);

  const handleListingTypeChange = (type) => {
    setListingType(type);
    setError(null);
    
    // Reset forms when switching types
    setFbListing({
      title: '',
      price: '',
      condition: 'Used - Good',
      description: '',
      category: ''
    });
    setAdditionalContext({
      category: '',
      brand: '',
      model: '',
      yearMade: '',
      additionalDetails: ''
    });
  };

  // Check for user API key
  const getUserApiKey = () => {
    if (!user) return null;
    
    try {
      const userSettings = JSON.parse(localStorage.getItem(`shelfie-user-${user.id}-settings`)) || {};
      return userSettings.openaiApiKey;
    } catch (e) {
      return null;
    }
  };

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
      const analysisResult = await analyzeImages(photos);
      console.log('Analysis result:', analysisResult);
      
      setAnalysis(analysisResult);

      // Auto-populate fields based on REAL analysis
      if (listingType === 'fb') {
        setFbListing(prev => ({
          ...prev,
          title: analysisResult.suggestedTitle || `${analysisResult.brand || ''} ${analysisResult.category}`.trim(),
          category: analysisResult.category || prev.category,
          condition: analysisResult.condition || prev.condition
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
      setProgress(82);
      setError(null);

      const contextData = listingType === 'fb' ? { ...fbListing, isFacebookListing: true } : additionalContext;
      console.log('Generating listing with context:', contextData);
      
      const [listingResult, pricingResult] = await Promise.all([
        generateListing(analysis, contextData),
        suggestPrice(analysis, contextData)
      ]);

      console.log('Generated listing:', listingResult);
      console.log('Generated pricing:', pricingResult);

      // Update form fields with AI-generated content
      if (listingType === 'fb') {
        setFbListing(prev => ({
          ...prev,
          title: listingResult.title || prev.title,
          description: listingResult.description || prev.description,
          price: Math.floor(pricingResult.suggestedPrice) || prev.price,
        }));
      }

      setListing(listingResult);
      setPricing(pricingResult);
      setEditedListing(listingResult);
      setStage('complete');
      setProgress(100);

      const listingData = {
        analysis: analysis,
        listing: listingResult,
        pricing: pricingResult,
        photos: photos,
        type: listingType,
        fbData: listingType === 'fb' ? fbListing : null
      };

      // Save to database if user is authenticated
      if (user) {
        try {
          const { data: dbListing, error } = await createListing({
            user_id: user.id,
            title: listingResult.title,
            description: listingResult.description,
            price: pricingResult.suggestedPrice,
            status: 'draft',
            category: analysis.category,
            brand: analysis.brand,
            condition: analysis.condition,
            type: listingType,
            photos: JSON.stringify(photos.map(p => ({ preview: p.preview }))),
            analysis: JSON.stringify(analysis),
            pricing: JSON.stringify(pricingResult)
          });
          
          if (error) throw error;
          
          // Update with database ID
          listingData.id = dbListing.id;
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          // Continue with local storage fallback
        }
      }

      onListingGenerated(listingData);
    } catch (error) {
      console.error('Error generating listing:', error);
      setError(error.message || 'Error generating listing. Please check your API key and try again.');
      setStage('analyzed');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (stage === 'idle') {
    return (
      <Card className="text-center py-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <SafeIcon icon={FiCamera} className="w-8 h-8 text-primary-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ready to Analyze Your Photos?
        </h3>
        <p className="text-gray-600 mb-6">
          AI will analyze your photos and auto-fill the listing details
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Listing Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Listing Type
          </label>
          <select
            value={listingType}
            onChange={(e) => handleListingTypeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a type...</option>
            <option value="fb">FB Marketplace</option>
            <option value="general">General Listing</option>
          </select>
        </div>

        {!user && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <SafeIcon icon={FiAlertCircle} className="w-5 h-5 text-yellow-500 mr-2" />
              <span className="text-yellow-700 text-sm">
                Sign in to save your listings to your account
              </span>
            </div>
          </div>
        )}

        {listingType && (
          <Button
            onClick={analyzeImagesFirst}
            variant="primary"
            size="lg"
            fullWidth
            disabled={photos.length === 0}
            icon={FiEye}
          >
            Analyze Photos with AI
          </Button>
        )}
      </Card>
    );
  }

  if (stage === 'analyzing') {
    return (
      <Card className="text-center py-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LoadingSpinner size="lg" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Analyzing Your Photos
        </h3>
        <p className="text-gray-600 mb-4">{currentStep}</p>
        <ProgressBar progress={progress} />
        <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
      </Card>
    );
  }

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
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
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
                Confidence: {Math.round(analysis.confidence * 100)}%
              </div>
            </div>
          )}
        </Card>

        {listingType === 'fb' ? (
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">Facebook Marketplace Details</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title (Required - max 150 characters)
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={fbListing.title}
                  onChange={(e) => setFbListing(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (Required - whole number in $)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={fbListing.price}
                  onChange={(e) => setFbListing(prev => ({ ...prev, price: Math.floor(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition (Required)
                </label>
                <select
                  value={fbListing.condition}
                  onChange={(e) => setFbListing(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                >
                  {FB_CONDITIONS.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category (Optional - max 150 characters)
                </label>
                <input
                  type="text"
                  maxLength={150}
                  value={fbListing.category}
                  onChange={(e) => setFbListing(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional - max 5000 characters)
                </label>
                <textarea
                  maxLength={5000}
                  value={fbListing.description}
                  onChange={(e) => setFbListing(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </Card>
        ) : (
          <Card>
            <h4 className="font-medium text-gray-900 mb-4">General Listing Details</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                  <select
                    value={additionalContext.category}
                    onChange={(e) => setAdditionalContext(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Collectibles">Collectibles</option>
                    <option value="Toys & Games">Toys & Games</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Sporting Goods">Sporting Goods</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Brand</label>
                  <input
                    type="text"
                    value={additionalContext.brand}
                    onChange={(e) => setAdditionalContext(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g., Apple, Nike"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Model</label>
                  <input
                    type="text"
                    value={additionalContext.model}
                    onChange={(e) => setAdditionalContext(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g., iPhone 13, Air Jordan 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Year Made</label>
                  <input
                    type="text"
                    value={additionalContext.yearMade}
                    onChange={(e) => setAdditionalContext(prev => ({ ...prev, yearMade: e.target.value }))}
                    placeholder="e.g., 2021"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Additional Details</label>
                <textarea
                  value={additionalContext.additionalDetails}
                  onChange={(e) => setAdditionalContext(prev => ({ ...prev, additionalDetails: e.target.value }))}
                  placeholder="Any other details about the item..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
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

  if (stage === 'generating') {
    return (
      <Card className="text-center py-8">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LoadingSpinner size="lg" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Generating Your Listing
        </h3>
        <p className="text-gray-600 mb-4">{currentStep}</p>
        <ProgressBar progress={progress} />
        <p className="text-sm text-gray-500 mt-2">{progress}% complete</p>
      </Card>
    );
  }

  if (stage === 'complete') {
    return (
      <div className="space-y-6">
        <Card>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <SafeIcon icon={FiCheck} className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Listing Generated!</h3>
              <p className="text-gray-600">Your professional listing is ready</p>
            </div>
          </div>

          {listing && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <button
                    onClick={() => copyToClipboard(listing.title)}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{listing.title}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <button
                    onClick={() => copyToClipboard(listing.description)}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">{listing.description}</p>
                </div>
              </div>

              {pricing && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Suggested Price</label>
                    <div className="text-2xl font-bold text-primary-600">
                      ${pricing.suggestedPrice}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                    <div className="text-sm text-gray-600">
                      ${pricing.priceRange?.min} - ${pricing.priceRange?.max}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="flex space-x-3">
          <Button
            onClick={() => {
              setStage('idle');
              setAnalysis(null);
              setListing(null);
              setPricing(null);
            }}
            variant="outline"
            fullWidth
          >
            Create Another
          </Button>
          <Button
            onClick={() => copyToClipboard(`${listing.title}\n\n${listing.description}\n\nPrice: $${pricing?.suggestedPrice || 'TBD'}`)}
            variant="primary"
            fullWidth
            icon={copied ? FiCheck : FiCopy}
          >
            {copied ? 'Copied!' : 'Copy All'}
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

export default ListingGenerator;