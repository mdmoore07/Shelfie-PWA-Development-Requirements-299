import * as XLSX from 'xlsx';

/**
 * Exports listings to Excel file (XLSX)
 * @param {Array} listings - Array of listing objects to export
 * @param {String} type - Type of listings to export ('all', 'fb', or 'general')
 * @returns {void}
 */
export const exportListingsToExcel = (listings, type = 'all') => {
  if (!listings || listings.length === 0) {
    console.error('No listings to export');
    return;
  }

  try {
    // Filter listings based on type if needed
    const filteredListings = type === 'all' 
      ? listings 
      : listings.filter(listing => listing.type === type);

    if (filteredListings.length === 0) {
      console.error('No listings match the selected filter');
      return;
    }

    // Format data based on listing type
    const formattedData = filteredListings.map(listing => {
      // Base fields common to all listing types
      const baseFields = {
        'Title': listing.title || '',
        'Price': typeof listing.price === 'number' ? listing.price : parseFloat(listing.price) || 0,
        'Status': listing.status || 'draft',
        'Description': listing.description || '',
        'Category': listing.category || '',
        'Created': listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : '',
      };

      // Add type-specific fields
      if (listing.type === 'fb') {
        return {
          ...baseFields,
          'Platform': 'Facebook Marketplace',
          'Condition': listing.fbData?.condition || listing.condition || '',
          'Brand': listing.brand || '',
        };
      } else {
        return {
          ...baseFields,
          'Platform': 'General Listing',
          'Brand': listing.brand || '',
          'Model': listing.model || '',
          'Condition': listing.condition || '',
          'Additional Details': listing.additionalDetails || '',
        };
      }
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Listings');

    // Set column widths for better readability
    const columnWidths = [
      { wch: 30 }, // Title
      { wch: 10 }, // Price
      { wch: 10 }, // Status
      { wch: 50 }, // Description
      { wch: 15 }, // Category
      { wch: 12 }, // Created
      { wch: 20 }, // Platform
      { wch: 15 }, // Condition/Brand
    ];
    worksheet['!cols'] = columnWidths;

    // Generate filename based on type and current date
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `shelfie-listings-${type}-${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, filename);
    
    // Show success message
    console.log(`Exported ${formattedData.length} listings to ${filename}`);
    return true;
  } catch (error) {
    console.error('Error exporting listings to Excel:', error);
    throw new Error('Failed to export listings. Please try again.');
  }
};