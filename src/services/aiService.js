import OpenAI from 'openai';

// Helper function to introduce a small delay for UX purposes
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get the OpenAI API key for the current user
 */
const getApiKey = () => {
  try {
    // Get user ID from auth
    const authData = JSON.parse(localStorage.getItem('shelfie-auth-storage'));
    const userId = authData?.currentSession?.user?.id;
    
    if (userId) {
      // Get user-specific API key
      const userSettings = JSON.parse(localStorage.getItem(`shelfie-user-${userId}-settings`)) || {};
      return userSettings.openaiApiKey;
    }
    
    // Fallback to global settings
    const storeData = JSON.parse(localStorage.getItem('shelfie-storage'));
    return storeData?.state?.settings?.openaiApiKey || import.meta.env.VITE_OPENAI_API_KEY;
  } catch (e) {
    return import.meta.env.VITE_OPENAI_API_KEY;
  }
};

/**
 * Get AI settings for the current user
 */
const getAISettings = () => {
  try {
    // Get user ID from auth
    const authData = JSON.parse(localStorage.getItem('shelfie-auth-storage'));
    const userId = authData?.currentSession?.user?.id;
    
    if (userId) {
      // Get user-specific settings
      const userSettings = JSON.parse(localStorage.getItem(`shelfie-user-${userId}-settings`)) || {};
      return userSettings.aiSettings || {
        listingStyle: 'casual',
        customPrompt: '',
        removeEmojis: false
      };
    }
    
    // Fallback to global settings
    const storeData = JSON.parse(localStorage.getItem('shelfie-storage'));
    return storeData?.state?.settings?.aiSettings || {
      listingStyle: 'casual',
      customPrompt: '',
      removeEmojis: false
    };
  } catch (e) {
    return {
      listingStyle: 'casual',
      customPrompt: '',
      removeEmojis: false
    };
  }
};

// Initialize OpenAI client with the key from storage
const createOpenAIClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please add it in Settings.');
  }
  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Note: In production, API calls should be proxied through a backend
  });
};

/**
 * Analyzes images and extracts information about the item
 * @param {Array} images - Array of image objects with file and preview properties
 * @param {Object} additionalContext - Additional context provided by user
 * @returns {Promise<Object>} - Analysis results
 */
export const analyzeImages = async (images, additionalContext = {}) => {
  try {
    if (!images || images.length === 0) {
      throw new Error('No images provided for analysis');
    }

    // Initialize OpenAI with the current API key
    const openai = createOpenAIClient();

    // Convert the first image to base64 for the vision model
    const imageUrl = images[0].preview.url;
    
    // Ensure we have a valid base64 image
    if (!imageUrl.includes('data:image/')) {
      throw new Error('Invalid image format for analysis');
    }

    // Build comprehensive system prompt
    const systemPrompt = `You are an expert product analyst for online marketplaces. Analyze the provided image carefully and extract detailed, accurate information about the item shown. 

    Your analysis should be thorough and based solely on what you can observe in the image. Do not make assumptions or add generic information.

    Focus on:
    - Exact category/type of item
    - Brand name if visible (look for logos, text, labels)
    - Model/product name if visible
    - Condition assessment based on visible wear, damage, or newness
    - Colors (be specific - not just "blue" but "navy blue" or "royal blue")
    - Materials you can identify
    - Key features, characteristics, or notable details
    - Size indicators if visible
    - Any text, labels, or markings visible

    Be precise and factual. If you cannot determine something from the image, do not guess.`;

    // Build user prompt
    const userPrompt = `Please analyze this product image in detail and provide comprehensive information for creating a marketplace listing. 

    Extract and provide:
    1. Specific category/type of item
    2. Brand name (if visible in image)
    3. Model/product name (if visible)
    4. Condition assessment (New, Like New, Good, Fair, Poor)
    5. All visible colors
    6. Materials you can identify
    7. Key features and characteristics
    8. Any visible text, labels, or markings
    9. Estimated size category if determinable
    10. A suggested title for the listing

    Format your response as JSON with these exact fields:
    {
      "category": "specific item category",
      "brand": "brand name if visible, null if not",
      "model": "model/product name if visible, null if not",
      "condition": "condition assessment",
      "colors": ["array of specific colors"],
      "materials": ["array of materials"],
      "features": ["array of key features"],
      "visibleText": ["any text or labels visible"],
      "sizeCategory": "size indication if determinable",
      "suggestedTitle": "concise listing title",
      "confidence": 0.85
    }

    Be thorough but accurate - only include information you can actually see in the image.`;

    console.log('Sending image to OpenAI Vision API...');

    // Analyze the image with GPT-4o
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userPrompt
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more consistent results
    });

    console.log('Received response from OpenAI Vision API');

    // Parse the JSON response
    const analysisText = visionResponse.choices[0].message.content;
    let analysis;
    
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI analysis response');
    }

    // Validate that we got meaningful data
    if (!analysis.category || analysis.category.toLowerCase().includes('unknown')) {
      throw new Error('AI could not identify the item in the image');
    }

    // Clean up the analysis data
    analysis = {
      category: analysis.category || 'Unknown',
      brand: analysis.brand || null,
      model: analysis.model || null,
      condition: analysis.condition || 'Good',
      colors: Array.isArray(analysis.colors) ? analysis.colors : [],
      materials: Array.isArray(analysis.materials) ? analysis.materials : [],
      features: Array.isArray(analysis.features) ? analysis.features : [],
      visibleText: Array.isArray(analysis.visibleText) ? analysis.visibleText : [],
      sizeCategory: analysis.sizeCategory || null,
      suggestedTitle: analysis.suggestedTitle || `${analysis.brand || ''} ${analysis.category}`.trim(),
      confidence: analysis.confidence || 0.85
    };

    console.log('Analysis completed successfully:', analysis);

    await delay(500); // Small delay for UX
    return analysis;

  } catch (error) {
    console.error("Error analyzing images:", error);
    
    // Don't provide fallback dummy data - let the error propagate
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
};

/**
 * Generates a professional listing based on item analysis
 * @param {Object} analysis - Item analysis from analyzeImages
 * @param {Object} additionalContext - Additional context provided by user
 * @returns {Promise<Object>} - Generated listing
 */
export const generateListing = async (analysis, additionalContext = {}) => {
  try {
    // Initialize OpenAI with the current API key
    const openai = createOpenAIClient();
    
    // Get AI settings for customization
    const aiSettings = getAISettings();
    
    // Build style-specific prompts
    let stylePrompt = '';
    let emojiInstruction = aiSettings.removeEmojis ? 'Do not use any emojis in the listing.' : 'Use emojis appropriately to enhance readability.';
    
    switch (aiSettings.listingStyle) {
      case 'casual':
        stylePrompt = 'Write in a casual, friendly, conversational tone like you\'re talking to a friend. Keep it brief and relatable. Use everyday language and be personable.';
        break;
      case 'professional':
        stylePrompt = 'Write in a professional, formal tone suitable for business sales. Use proper grammar, detailed descriptions, and marketing language. Focus on features and benefits.';
        break;
      case 'other':
        stylePrompt = aiSettings.customPrompt || 'Write in a balanced tone that is both informative and engaging.';
        break;
      default:
        stylePrompt = 'Write in a casual, friendly tone that appeals to everyday buyers.';
    }

    // Build comprehensive prompt
    const prompt = `Create a high-quality marketplace listing based on this detailed item analysis:

ITEM DETAILS:
- Category: ${analysis.category}
- Brand: ${analysis.brand || 'Not specified'}
- Model: ${analysis.model || 'Not specified'}
- Condition: ${analysis.condition}
- Colors: ${analysis.colors.join(', ')}
- Materials: ${analysis.materials.join(', ')}
- Features: ${analysis.features.join(', ')}
- Visible Text/Labels: ${analysis.visibleText.join(', ')}
${analysis.sizeCategory ? `- Size Category: ${analysis.sizeCategory}` : ''}

ADDITIONAL CONTEXT:
${additionalContext.brand ? `- User specified brand: ${additionalContext.brand}` : ''}
${additionalContext.model ? `- User specified model: ${additionalContext.model}` : ''}
${additionalContext.yearMade ? `- Year made: ${additionalContext.yearMade}` : ''}
${additionalContext.category ? `- User specified category: ${additionalContext.category}` : ''}
${additionalContext.additionalDetails ? `- Additional details: ${additionalContext.additionalDetails}` : ''}

STYLE INSTRUCTIONS:
${stylePrompt}
${emojiInstruction}

MARKETPLACE TYPE:
${additionalContext.isFacebookListing ? 'This is for Facebook Marketplace - follow their best practices.' : 'This is for general online marketplaces.'}

Generate a listing with:
1. A compelling, SEO-friendly title (max 60 characters)
2. A detailed, engaging description that highlights the item's key features and condition
3. 5 relevant keywords for searchability

Format as JSON:
{
  "title": "compelling title under 60 chars",
  "description": "detailed description following the style guide",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Make the listing compelling and accurate based on the actual analysis provided.`;

    console.log('Generating listing with AI...');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert e-commerce listing writer who creates compelling, accurate marketplace listings. You follow style guidelines precisely and create listings that convert browsers into buyers."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1200,
      temperature: 0.7,
    });

    console.log('Listing generation completed');

    // Parse the JSON response
    const generatedContent = JSON.parse(response.choices[0].message.content);

    await delay(500); // Small delay for UX

    return {
      title: generatedContent.title.substring(0, 60), // Ensure title length restriction
      description: generatedContent.description,
      keywords: generatedContent.keywords || [],
      confidence: 0.9 + Math.random() * 0.1
    };

  } catch (error) {
    console.error("Error generating listing:", error);
    throw new Error(`Failed to generate listing: ${error.message}`);
  }
};

/**
 * Suggests a price based on item analysis
 * @param {Object} analysis - Item analysis data
 * @param {Object} additionalContext - Additional context provided by user
 * @returns {Promise<Object>} - Pricing suggestions
 */
export const suggestPrice = async (analysis, additionalContext = {}) => {
  try {
    // Initialize OpenAI with the current API key
    const openai = createOpenAIClient();

    // Build context-aware prompt
    const prompt = `Based on this detailed item analysis, suggest a fair market price for online marketplace sales:

ITEM ANALYSIS:
- Category: ${analysis.category}
- Brand: ${analysis.brand || 'Generic/Unknown'}
- Model: ${analysis.model || 'Not specified'}
- Condition: ${analysis.condition}
- Features: ${analysis.features.join(', ')}
- Colors: ${analysis.colors.join(', ')}
- Materials: ${analysis.materials.join(', ')}
${analysis.sizeCategory ? `- Size: ${analysis.sizeCategory}` : ''}

ADDITIONAL CONTEXT:
${additionalContext.brand ? `- User specified brand: ${additionalContext.brand}` : ''}
${additionalContext.model ? `- User specified model: ${additionalContext.model}` : ''}
${additionalContext.yearMade ? `- Year made: ${additionalContext.yearMade}` : ''}
${additionalContext.additionalDetails ? `- Additional details: ${additionalContext.additionalDetails}` : ''}

Provide realistic pricing based on current market conditions for similar items. Consider:
- Brand reputation and market value
- Item condition and depreciation
- Category-specific pricing trends
- Marketplace selling patterns

Format as JSON:
{
  "suggestedPrice": 50,
  "priceRange": {
    "min": 40,
    "max": 65
  },
  "confidence": 0.85,
  "reasoning": "Brief explanation of pricing rationale"
}

Be realistic and market-accurate in your pricing suggestions.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert in product valuation and pricing for online marketplaces. You provide accurate, market-based price suggestions with reasonable ranges backed by clear reasoning."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3,
    });

    // Parse the JSON response
    const pricingData = JSON.parse(response.choices[0].message.content);

    await delay(500); // Small delay for UX

    // Format the response to match our expected structure
    return {
      suggestedPrice: pricingData.suggestedPrice,
      priceRange: pricingData.priceRange,
      confidence: pricingData.confidence,
      reasoning: pricingData.reasoning,
      // Mock comparable items (could be replaced with real data in future)
      comparableItems: [
        {
          title: `Similar ${analysis.category}`,
          price: pricingData.priceRange.min,
          sold: true
        },
        {
          title: `${analysis.brand || 'Brand'} ${analysis.category}`,
          price: pricingData.suggestedPrice,
          sold: false
        },
        {
          title: `${analysis.condition} ${analysis.category}`,
          price: pricingData.priceRange.max,
          sold: true
        }
      ]
    };

  } catch (error) {
    console.error("Error suggesting price:", error);
    throw new Error(`Failed to suggest price: ${error.message}`);
  }
};

/**
 * Export multiple listings as a CSV file
 * @param {Array} listings - Array of listing objects
 */
export const exportListingsToCSV = (listings) => {
  if (!listings || !listings.length) return;

  // CSV header
  const header = 'Title,Description,Price,Condition,Category,Brand';

  // CSV rows
  const rows = listings.map(listing => {
    const title = listing.listing?.title || listing.title || '';
    const description = (listing.listing?.description || listing.description || '').replace(/"/g, '""');
    const price = listing.pricing?.suggestedPrice || listing.price || '';
    const condition = listing.analysis?.condition || '';
    const category = listing.analysis?.category || '';
    const brand = listing.analysis?.brand || '';

    return `"${title}","${description}",${price},"${condition}","${category}","${brand}"`;
  });

  // Combine header and rows
  const csvContent = [header, ...rows].join('\n');

  // Create and download the file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `shelfie-listings-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};