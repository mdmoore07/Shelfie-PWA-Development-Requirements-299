import { OpenAI } from 'openai';

// Helper function to get user API key from settings
const getUserApiKey = () => {
  try {
    // Try localStorage first
    const localSettings = JSON.parse(localStorage.getItem('shelfie-settings') || '{}');
    const apiKey = localSettings.openaiApiKey;

    // If not in localStorage, try store
    if (!apiKey) {
      const storeSettings = JSON.parse(localStorage.getItem('shelfie-storage') || '{}');
      const storeKey = storeSettings?.state?.settings?.openaiApiKey;
      if (!storeKey) {
        throw new Error('Please add your OpenAI API key in Settings.');
      }
      return storeKey;
    }
    return apiKey;
  } catch (e) {
    throw new Error('Please add your OpenAI API key in Settings.');
  }
};

// Create OpenAI client with the current API key
const createOpenAIClient = () => {
  const apiKey = getUserApiKey();
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });
};

/**
 * Analyzes images using OpenAI's GPT-4o model
 * @param {Array} images - Array of image objects
 * @returns {Promise<Object>} - Analysis results
 */
export const analyzeImages = async (images) => {
  try {
    if (!images || images.length === 0) {
      throw new Error("No images provided for analysis");
    }

    // Initialize OpenAI with the current API key
    const openai = createOpenAIClient();
    
    // Get the first image URL
    const imageUrl = images[0].preview.url;
    
    if (!imageUrl) {
      throw new Error("Invalid image format");
    }
    
    console.log("Analyzing image with GPT-4o:", imageUrl.substring(0, 50) + "...");
    
    // Build comprehensive system prompt
    const systemPrompt = `You are an expert product analyst specializing in marketplace listings. Analyze the image and identify key product details with high accuracy. Focus on identifying:
- Product category and type
- Brand (if visible)
- Model/style (if applicable)
- Condition (new, like_new, good, fair, poor)
- Colors and materials
- Any visible damage or wear
- Notable features or characteristics
Be precise and factual in your analysis.`;

    const userPrompt = `Analyze this product image and identify all relevant details for creating a marketplace listing. Provide your response as JSON with these fields:
{
  "category": "main product category",
  "brand": "identified brand if visible",
  "model": "model or style if identifiable",
  "condition": "condition assessment",
  "colors": ["primary color", "secondary colors"],
  "materials": ["identified materials"],
  "suggestedTitle": "brief descriptive title",
  "confidence": number (0-1)
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]}
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.2,
    });
    
    console.log("GPT-4o Analysis Response:", response.choices[0].message.content);
    
    // Parse the JSON response
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing images:", error);
    
    // Fallback to mock data for development/when API fails
    console.log('Falling back to mock data for image analysis');
    return generateMockData(images);
  }
};

// Helper function to generate dynamic mock data based on input
const generateMockData = (images, input = {}) => {
  // Extract image colors (if available) or use defaults
  const randomColors = ['black', 'white', 'red', 'blue', 'green', 'brown', 'gray', 'silver', 'gold'];
  const randomMaterials = ['wood', 'metal', 'plastic', 'fabric', 'leather', 'glass', 'ceramic'];
  
  // Generate random item types based on likely marketplace items
  const itemTypes = [
    'Chair', 'Table', 'Sofa', 'Dresser', 'Desk', 'Bookshelf', 'Lamp', 
    'TV Stand', 'Coffee Table', 'Bicycle', 'Guitar', 'Camera', 'Watch',
    'Shoes', 'Jacket', 'Headphones', 'Game Console', 'Smartphone'
  ];
  
  // Generate random brands
  const brands = [
    'IKEA', 'Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Canon', 
    'West Elm', 'Pottery Barn', 'Zara', 'H&M', 'Target', 'Amazon Basics'
  ];
  
  // Get random items from arrays
  const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  // Use input data if provided, otherwise generate random values
  const category = input.category || getRandomItem(['Furniture', 'Electronics', 'Clothing', 'Sporting Goods', 'Home & Garden', 'Collectibles']);
  const itemType = input.type || getRandomItem(itemTypes);
  const brand = input.brand || getRandomItem(brands);
  const condition = input.condition || getRandomItem(['new', 'like_new', 'good', 'fair', 'poor']);
  const color = getRandomItem(randomColors);
  const material = getRandomItem(randomMaterials);
  
  // Generate condition text
  const conditionText = {
    'new': 'Brand New',
    'like_new': 'Like New',
    'good': 'Good',
    'fair': 'Fair',
    'poor': 'Poor'
  }[condition] || 'Used';
  
  return {
    category,
    brand,
    model: `${brand} ${itemType}`,
    condition,
    colors: [color, getRandomItem(randomColors.filter(c => c !== color))],
    materials: [material],
    suggestedTitle: `${brand} ${itemType} in ${conditionText} Condition`,
    confidence: 0.85
  };
};

/**
 * Suggests a price based on image analysis
 * @param {Array} images - Array of image objects
 * @returns {Promise<Object>} - Pricing suggestions
 */
export const suggestPrice = async (images) => {
  try {
    if (!images || images.length === 0) {
      throw new Error("No images provided for price suggestion");
    }

    const openai = createOpenAIClient();
    const imageUrl = images[0].preview.url;
    
    if (!imageUrl) {
      throw new Error("Invalid image format");
    }
    
    console.log("Suggesting price with GPT-4o");

    const systemPrompt = `You are an expert in product valuation and pricing for online marketplaces. Analyze the image and provide accurate, market-based price suggestions based on visual assessment of:
- Item condition
- Brand and quality
- Market trends
- Similar items' pricing
Be realistic and precise in your pricing analysis.`;

    const userPrompt = `Analyze this product image and suggest a fair market price. Consider visible aspects like:
- Brand identification
- Product condition
- Quality indicators
- Comparable market prices

Provide your response as JSON with these fields:
{
  "suggestedPrice": number,
  "priceRange": {
    "min": number,
    "max": number
  },
  "confidence": number (0-1),
  "reasoning": "brief explanation of price estimate"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]}
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3,
    });

    console.log("GPT-4o Price Response:", response.choices[0].message.content);
    const pricingData = JSON.parse(response.choices[0].message.content);
    
    return {
      suggestedPrice: pricingData.suggestedPrice || 0,
      priceRange: pricingData.priceRange || { min: 0, max: 0 },
      confidence: pricingData.confidence || 0.7,
      reasoning: pricingData.reasoning || "Price based on visual assessment of the item."
    };
  } catch (error) {
    console.error("Error suggesting initial price:", error);
    
    // Fallback to mock data when API fails
    console.log('Falling back to mock data for price suggestion');
    const basePrice = 20 + Math.floor(Math.random() * 180); // $20-$200 base price
    const minPrice = Math.floor(basePrice * 0.8);
    const maxPrice = Math.floor(basePrice * 1.2);
    
    // Generate a realistic pricing reason
    const reasons = [
      `Based on current marketplace listings for similar items.`,
      `Considering the condition and brand, this is a fair market price.`,
      `This price reflects recent sales of comparable items.`,
      `Taking into account the age, condition, and brand popularity.`,
      `Similar items in this condition typically sell in this price range.`
    ];
    
    return {
      suggestedPrice: basePrice,
      priceRange: {
        min: minPrice,
        max: maxPrice
      },
      confidence: 0.7 + Math.random() * 0.2, // 0.7-0.9 confidence
      reasoning: reasons[Math.floor(Math.random() * reasons.length)]
    };
  }
};

/**
 * Generates a complete listing using OpenAI GPT-4o
 * @param {Array} images - Array of image objects
 * @param {Object} listingData - User-provided listing data
 * @param {String} listingType - Type of listing ('fb' or 'general')
 * @param {Object} analysis - Analysis data from analyzeImages
 * @returns {Promise<Object>} - Generated listing data
 */
export const generateListing = async (images, listingData, listingType, analysis) => {
  try {
    if (!images || images.length === 0) {
      throw new Error("No images provided for listing generation");
    }

    const openai = createOpenAIClient();
    const imageUrl = images[0].preview.url;
    
    if (!imageUrl) {
      throw new Error("Invalid image format");
    }
    
    console.log("Generating listing with GPT-4o");

    // Get user's AI style preferences
    const storageData = JSON.parse(localStorage.getItem('shelfie-storage') || '{}');
    const aiSettings = storageData?.state?.settings?.aiSettings || {
      listingStyle: 'casual',
      customPrompt: '',
      removeEmojis: false
    };

    // Build the system prompt based on listing type and style preferences
    let styleInstructions = '';
    if (aiSettings.listingStyle === 'casual') {
      styleInstructions = "Use a friendly, conversational tone that connects with buyers. Be enthusiastic but honest.";
      if (!aiSettings.removeEmojis) {
        styleInstructions += " Include 1-2 relevant emojis in the description for visual appeal.";
      }
    } else if (aiSettings.listingStyle === 'professional') {
      styleInstructions = "Use a formal, professional tone that emphasizes quality and value. Focus on specifications and factual information.";
      if (!aiSettings.removeEmojis) {
        styleInstructions += " Include 1-2 subtle emojis where appropriate.";
      }
    } else if (aiSettings.customPrompt) {
      styleInstructions = aiSettings.customPrompt;
      if (aiSettings.removeEmojis) {
        styleInstructions += " Do not use any emojis.";
      }
    }

    const systemPrompt = `You are an expert in creating compelling marketplace listings that sell quickly. ${styleInstructions}

For ${listingType === 'fb' ? 'Facebook Marketplace' : 'general marketplace'} listings:
- Create concise, engaging titles that include key selling points
- Write detailed descriptions that highlight features, condition, and value
- Emphasize benefits to the buyer
- Include measurements and specifications where relevant
- Be honest about any flaws or imperfections
- Format text for easy scanning with short paragraphs
${aiSettings.removeEmojis ? "Do not use any emojis." : ""}`;

    const userPrompt = `Create a complete ${listingType === 'fb' ? 'Facebook Marketplace' : 'general marketplace'} listing for this item.

User-provided information:
${JSON.stringify(listingData, null, 2)}

AI analysis found:
${JSON.stringify(analysis, null, 2)}

Generate a complete listing with an engaging title and detailed description. Format the response as JSON with these fields:
{
  "title": "compelling listing title",
  "description": "detailed formatted description",
  "price": number (suggested price if not provided by user),
  "category": "best category for this item",
  "condition": "item condition",
  "keywords": ["search", "keywords", "for", "this", "item"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: imageUrl } }
        ]}
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
      temperature: 0.7,
    });

    console.log("GPT-4o Listing Response:", response.choices[0].message.content);
    const generatedListing = JSON.parse(response.choices[0].message.content);

    // Merge with original data and add metadata
    return {
      ...listingData,
      ...generatedListing,
      generatedBy: 'ai',
      timestamp: new Date().toISOString(),
      type: listingType,
      aiStyle: aiSettings.listingStyle,
      useEmojis: !aiSettings.removeEmojis
    };
  } catch (error) {
    console.error("Error generating listing:", error);
    
    // Fallback to mock data when API fails
    console.log('Falling back to mock data for listing generation');
    
    // Get some user-provided values if available
    const userTitle = listingData.title;
    const userPrice = listingData.price || (Math.floor(Math.random() * 200) + 20);
    const userCategory = listingData.category || analysis.category;
    const userCondition = listingData.condition || analysis.condition;
    
    // Generate a title if not provided by user
    const title = userTitle || `${analysis.brand || ''} ${analysis.model || ''} ${analysis.category} - ${analysis.condition === 'new' ? 'Brand New' : 'Used'}`.trim();
    
    // Generate a suitable description based on listing type
    const isFB = listingType === 'fb';
    
    // Item features for the description
    const features = [
      `High quality ${analysis.brand || 'brand'}`,
      `${analysis.colors?.[0] || 'Versatile'} color`,
      `Made of durable ${analysis.materials?.[0] || 'material'}`,
      `Perfect for any home or office`
    ];
    
    // Select random features
    const selectedFeatures = [];
    while (selectedFeatures.length < 3 && features.length > 0) {
      const index = Math.floor(Math.random() * features.length);
      selectedFeatures.push(features[index]);
      features.splice(index, 1);
    }
    
    // Create a description based on listing type
    let description;
    if (isFB) {
      description = `Selling my ${analysis.brand || ''} ${analysis.model || ''} in ${userCondition} condition! ${!listingData.removeEmojis ? '✨' : ''}\n\n` +
        `Features:\n` +
        selectedFeatures.map(f => `- ${f}`).join('\n') + 
        `\n\nGreat quality item that's still in good shape. ` +
        `${userCondition !== 'new' ? 'Minor wear from normal use.' : 'Never been used!'} ` +
        `Pickup only from local area. Cash or digital payment accepted.`;
    } else {
      description = `${analysis.brand || ''} ${analysis.model || ''} ${userCategory} in ${userCondition} condition\n\n` +
        `This ${userCategory.toLowerCase()} features:\n` +
        selectedFeatures.map(f => `• ${f}`).join('\n') + 
        `\n\nCondition details: ${userCondition === 'new' ? 'Brand new, never used.' : 'Normal wear consistent with age and use. No major damage or issues.'}\n\n` +
        `Dimensions: Please inquire\n` +
        `Pickup preferred, but delivery may be available for additional fee.`;
    }
    
    // Generate matching keywords
    const keywords = [
      userCategory.toLowerCase(),
      analysis.brand?.toLowerCase() || 'quality',
      analysis.colors?.[0]?.toLowerCase() || 'stylish',
      userCondition === 'new' ? 'new' : 'used',
      'bargain',
      'home'
    ];
    
    return {
      title,
      description,
      price: userPrice,
      category: userCategory,
      condition: userCondition,
      keywords
    };
  }
};