import { utils, writeFile } from 'xlsx';

export const exportListingsToExcel = (listings, type = 'all') => {
  if (!listings || listings.length === 0) return;

  const filteredListings = type === 'all' 
    ? listings 
    : listings.filter(listing => listing.type === type);

  if (filteredListings.length === 0) return;

  // Format data based on listing type
  const formattedData = filteredListings.map(listing => {
    if (listing.type === 'fb') {
      // Facebook Marketplace format
      return {
        'Title': listing.fbData.title || listing.title,
        'Price': listing.fbData.price || listing.price,
        'Condition': listing.fbData.condition,
        'Description': listing.fbData.description || listing.description,
        'Category': listing.fbData.category || listing.category,
        'Image URLs': listing.photos?.map(p => p.preview.url).join(', ') || ''
      };
    } else {
      // General listing format
      return {
        'Title': listing.title,
        'Description': listing.description,
        'Price': listing.price,
        'Category': listing.category,
        'Brand': listing.brand,
        'Condition': listing.condition,
        'Additional Details': listing.additionalDetails,
        'Image URLs': listing.photos?.map(p => p.preview.url).join(', ') || ''
      };
    }
  });

  // Create workbook and worksheet
  const ws = utils.json_to_sheet(formattedData);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Listings');

  // Generate filename based on type
  const filename = `shelfie-listings-${type}-${Date.now()}.xlsx`;

  // Save file
  writeFile(wb, filename);
};