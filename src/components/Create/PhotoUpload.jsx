import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import Button from '../common/Button';
import { validateImageFile, createImagePreview } from '../../services/imageService';

const { FiCamera, FiUpload, FiX, FiImage } = FiIcons;

const PhotoUpload = ({ photos, onPhotosChange, maxPhotos = 4 }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    
    for (const file of fileArray) {
      try {
        validateImageFile(file);
        const preview = await createImagePreview(file);
        validFiles.push({ file, preview });
      } catch (error) {
        console.error('Invalid file:', error.message);
      }
    }
    
    const newPhotos = [...photos, ...validFiles].slice(0, maxPhotos);
    onPhotosChange(newPhotos);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };
  
  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };
  
  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };
  
  const canAddMore = photos.length < maxPhotos;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Photos ({photos.length}/{maxPhotos})
        </h3>
        <span className="text-sm text-gray-500">
          {photos.length === 0 ? 'Add at least 1 photo' : 'Looking good!'}
        </span>
      </div>
      
      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence>
          {photos.map((photo, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
            >
              <img
                src={photo.preview.url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <SafeIcon icon={FiX} className="w-4 h-4" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs rounded">
                  Main
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Upload Area */}
        {canAddMore && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`aspect-square rounded-lg border-2 border-dashed transition-colors ${
              dragActive
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 bg-gray-50'
            }`}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="h-full flex flex-col items-center justify-center p-4 text-center">
              <SafeIcon icon={FiImage} className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Drop photo here
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-2 py-1 bg-primary-500 text-white text-xs rounded hover:bg-primary-600 transition-colors"
                >
                  Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                >
                  Gallery
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Action Buttons */}
      {photos.length === 0 && (
        <div className="flex space-x-3">
          <Button
            onClick={() => cameraInputRef.current?.click()}
            variant="primary"
            fullWidth
            icon={FiCamera}
          >
            Take Photo
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            fullWidth
            icon={FiUpload}
          >
            Upload
          </Button>
        </div>
      )}
      
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

export default PhotoUpload;