import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import Card from '../common/Card';

const { FiEdit3, FiTrash2, FiCopy, FiEye, FiShare2, FiMoreVertical } = FiIcons;

const ListingCard = ({ listing, onEdit, onDelete, onCopy, onView, onShare, onStatusChange }) => {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    posted: 'bg-green-100 text-green-800',
    sold: 'bg-purple-100 text-purple-800',
    archived: 'bg-gray-100 text-gray-600'
  };

  const statusLabels = {
    draft: 'Draft',
    posted: 'Posted',
    sold: 'Sold',
    archived: 'Archived'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <Card hover className="overflow-hidden">
        <div className="flex space-x-3">
          {/* Photo */}
          <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            {listing.photos && listing.photos.length > 0 ? (
              <img
                src={listing.photos[0].preview.url}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <SafeIcon icon={FiEye} className="w-6 h-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900 truncate pr-2">
                {listing.title || 'Untitled Listing'}
              </h3>
              <div className="flex items-center space-x-2">
                <select
                  value={listing.status}
                  onChange={(e) => onStatusChange(e.target.value)}
                  className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${statusColors[listing.status]}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="draft">Draft</option>
                  <option value="posted">Posted</option>
                  <option value="sold">Sold</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
              <span className="font-medium text-primary-600">
                ${listing.price || '0'}
              </span>
              <span>
                {listing.createdAt ? format(new Date(listing.createdAt), 'MMM d') : 'Unknown'}
              </span>
            </div>

            {/* Description Preview */}
            {listing.description && (
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {listing.description.substring(0, 100)}...
              </p>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(listing);
                }}
                className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                title="View Details"
              >
                <SafeIcon icon={FiEye} className="w-4 h-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(listing);
                }}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit"
              >
                <SafeIcon icon={FiEdit3} className="w-4 h-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy(listing);
                }}
                className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Copy"
              >
                <SafeIcon icon={FiCopy} className="w-4 h-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(listing);
                }}
                className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                title="Share"
              >
                <SafeIcon icon={FiShare2} className="w-4 h-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(listing);
                }}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <SafeIcon icon={FiTrash2} className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ListingCard;