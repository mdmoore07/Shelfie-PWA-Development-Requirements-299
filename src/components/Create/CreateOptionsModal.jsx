import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import Button from '../common/Button';
import Card from '../common/Card';

const { FiImage, FiImages, FiList } = FiIcons;

const CreateOptionsModal = ({ onSelect, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Create New Listing(s)
          </h2>
          
          <div className="space-y-4">
            <button
              onClick={() => onSelect('single')}
              className="w-full p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <SafeIcon icon={FiImage} className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Single Listing</h3>
                  <p className="text-sm text-gray-600">
                    Create one listing at a time
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onSelect('bulk')}
              className="w-full p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <SafeIcon icon={FiImages} className="w-6 h-6 text-primary-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Bulk Upload</h3>
                  <p className="text-sm text-gray-600">
                    Create multiple listings at once
                  </p>
                </div>
              </div>
            </button>
          </div>

          <Button
            onClick={onClose}
            variant="outline"
            fullWidth
            className="mt-4"
          >
            Cancel
          </Button>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default CreateOptionsModal;