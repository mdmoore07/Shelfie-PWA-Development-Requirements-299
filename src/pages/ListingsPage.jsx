import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import Header from '../components/Layout/Header';
import BottomNav from '../components/Layout/BottomNav';
import ListingCard from '../components/Listings/ListingCard';
import Button from '../components/common/Button';
import SafeIcon from '../components/common/SafeIcon';
import Card from '../components/common/Card';
import useStore from '../store/useStore';
import { exportListingsToExcel } from '../services/exportService';

const { FiFilter, FiPlus, FiSearch, FiDownload, FiEdit3, FiTrash2, FiCopy, FiEye, FiShare2 } = FiIcons;

const ListingsPage = () => {
  const navigate = useNavigate();
  const { listings, deleteListing, updateListing } = useStore();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportType, setExportType] = useState('all');
  const [selectedListing, setSelectedListing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'view', 'edit', 'delete'
  
  const filters = [
    { key: 'all', label: 'All', count: listings.length },
    { key: 'fb', label: 'FB Marketplace', count: listings.filter(l => l.type === 'fb').length },
    { key: 'general', label: 'General', count: listings.filter(l => l.type === 'general').length },
    { key: 'draft', label: 'Drafts', count: listings.filter(l => l.status === 'draft').length },
    { key: 'posted', label: 'Posted', count: listings.filter(l => l.status === 'posted').length },
    { key: 'sold', label: 'Sold', count: listings.filter(l => l.status === 'sold').length },
  ];

  const filteredListings = listings.filter(listing => {
    const matchesFilter = filter === 'all' || 
      (filter === 'fb' || filter === 'general' ? listing.type === filter : listing.status === filter);
    const matchesSearch = !searchTerm || 
      (listing.title && listing.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (listing.description && listing.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleExport = () => {
    exportListingsToExcel(filteredListings, exportType);
  };

  const handleView = (listing) => {
    setSelectedListing(listing);
    setModalType('view');
    setShowModal(true);
  };

  const handleEdit = (listing) => {
    setSelectedListing(listing);
    setModalType('edit');
    setShowModal(true);
  };

  const handleDelete = (listing) => {
    setSelectedListing(listing);
    setModalType('delete');
    setShowModal(true);
  };

  const handleCopy = (listing) => {
    const copyText = `${listing.title}\n\n${listing.description}\n\nPrice: $${listing.price}`;
    navigator.clipboard.writeText(copyText);
    alert('Listing copied to clipboard!');
  };

  const handleShare = (listing) => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: listing.description,
        url: window.location.href
      });
    } else {
      handleCopy(listing);
    }
  };

  const confirmDelete = () => {
    if (selectedListing) {
      deleteListing(selectedListing.id);
      setShowModal(false);
      setSelectedListing(null);
    }
  };

  const saveEdit = (updatedListing) => {
    updateListing(selectedListing.id, updatedListing);
    setShowModal(false);
    setSelectedListing(null);
  };

  const changeStatus = (listingId, newStatus) => {
    updateListing(listingId, { status: newStatus });
  };

  const Modal = ({ children, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {children}
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="My Listings" 
        actions={[
          { 
            icon: FiDownload, 
            onClick: handleExport,
            disabled: filteredListings.length === 0
          },
          { 
            icon: FiPlus, 
            onClick: () => navigate('/create'), 
            variant: 'primary' 
          }
        ]} 
      />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="pb-20"
      >
        <div className="px-4 py-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <SafeIcon
              icon={FiSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
            />
            <input
              type="text"
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Export Options */}
          {filteredListings.length > 0 && (
            <div className="flex items-center justify-end space-x-2">
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Listings</option>
                <option value="fb">FB Marketplace Only</option>
                <option value="general">General Listings Only</option>
              </select>
              <Button
                onClick={handleExport}
                variant="secondary"
                size="sm"
                icon={FiDownload}
              >
                Export
              </Button>
            </div>
          )}

          {/* Filters */}
          <div className="flex space-x-2 overflow-x-auto">
            {filters.map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === filterOption.key
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {filterOption.label} ({filterOption.count})
              </button>
            ))}
          </div>

          {/* Listings */}
          <div className="space-y-4">
            {filteredListings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SafeIcon icon={FiPlus} className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No listings found' : 'No listings yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Create your first listing to get started selling'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => navigate('/create')}
                    variant="primary"
                    icon={FiPlus}
                  >
                    Create First Listing
                  </Button>
                )}
              </motion.div>
            ) : (
              filteredListings.map((listing) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <ListingCard
                    listing={listing}
                    onEdit={() => handleEdit(listing)}
                    onDelete={() => handleDelete(listing)}
                    onCopy={() => handleCopy(listing)}
                    onView={() => handleView(listing)}
                    onShare={() => handleShare(listing)}
                    onStatusChange={(newStatus) => changeStatus(listing.id, newStatus)}
                  />
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.main>

      {/* Modals */}
      {showModal && selectedListing && (
        <Modal onClose={() => setShowModal(false)}>
          {modalType === 'view' && (
            <ViewListingModal 
              listing={selectedListing} 
              onClose={() => setShowModal(false)}
              onEdit={() => {
                setModalType('edit');
              }}
              onShare={() => handleShare(selectedListing)}
            />
          )}
          
          {modalType === 'edit' && (
            <EditListingModal 
              listing={selectedListing} 
              onClose={() => setShowModal(false)}
              onSave={saveEdit}
            />
          )}
          
          {modalType === 'delete' && (
            <DeleteConfirmModal 
              listing={selectedListing} 
              onClose={() => setShowModal(false)}
              onConfirm={confirmDelete}
            />
          )}
        </Modal>
      )}

      <BottomNav />
    </div>
  );
};

// View Modal Component
const ViewListingModal = ({ listing, onClose, onEdit, onShare }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Listing Details</h3>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600"
      >
        <SafeIcon icon={FiIcons.FiX} className="w-6 h-6" />
      </button>
    </div>
    
    {listing.photos && listing.photos.length > 0 && (
      <div className="mb-4">
        <img 
          src={listing.photos[0].preview.url} 
          alt={listing.title}
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>
    )}
    
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-900">{listing.title}</h4>
        <p className="text-2xl font-bold text-primary-600">${listing.price}</p>
      </div>
      
      <div>
        <h5 className="font-medium text-gray-700 mb-2">Description</h5>
        <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
      </div>
      
      <div className="flex space-x-3">
        <Button onClick={onEdit} variant="primary" fullWidth icon={FiEdit3}>
          Edit
        </Button>
        <Button onClick={onShare} variant="outline" fullWidth icon={FiShare2}>
          Share
        </Button>
      </div>
    </div>
  </div>
);

// Edit Modal Component
const EditListingModal = ({ listing, onClose, onSave }) => {
  const [editedListing, setEditedListing] = useState({
    title: listing.title || '',
    description: listing.description || '',
    price: listing.price || '',
    status: listing.status || 'draft'
  });

  const handleSave = () => {
    onSave(editedListing);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Edit Listing</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <SafeIcon icon={FiIcons.FiX} className="w-6 h-6" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={editedListing.title}
            onChange={(e) => setEditedListing(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <input
            type="number"
            value={editedListing.price}
            onChange={(e) => setEditedListing(prev => ({ ...prev, price: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={editedListing.status}
            onChange={(e) => setEditedListing(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="draft">Draft</option>
            <option value="posted">Posted</option>
            <option value="sold">Sold</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={editedListing.description}
            onChange={(e) => setEditedListing(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="flex space-x-3">
          <Button onClick={onClose} variant="outline" fullWidth>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="primary" fullWidth>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ listing, onClose, onConfirm }) => (
  <div className="p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Delete Listing</h3>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600"
      >
        <SafeIcon icon={FiIcons.FiX} className="w-6 h-6" />
      </button>
    </div>
    
    <div className="mb-6">
      <p className="text-gray-600">
        Are you sure you want to delete "{listing.title}"? This action cannot be undone.
      </p>
    </div>
    
    <div className="flex space-x-3">
      <Button onClick={onClose} variant="outline" fullWidth>
        Cancel
      </Button>
      <Button onClick={onConfirm} variant="danger" fullWidth>
        Delete
      </Button>
    </div>
  </div>
);

export default ListingsPage;