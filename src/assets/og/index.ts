// Open Graph images for social sharing
import ogHome from './og-home.jpg';
import ogAbout from './og-about.jpg';
import ogFeatures from './og-features.jpg';
import ogPricing from './og-pricing.jpg';
import ogFaq from './og-faq.jpg';
import ogContact from './og-contact.jpg';
import ogCareers from './og-careers.jpg';
import ogMarketplace from './og-marketplace.jpg';
import ogDirectory from './og-directory.jpg';
import ogAnalytics from './og-analytics.jpg';

// Site URL for absolute paths
const SITE_URL = 'https://webstackceo.lovable.app';

// Helper to get absolute URL for OG images
export const getOgImageUrl = (imagePath: string): string => {
  // For imported images, they're already bundled - we need to use the relative path
  // In production, these will be hashed URLs from the build
  return imagePath;
};

export const ogImages = {
  home: ogHome,
  about: ogAbout,
  features: ogFeatures,
  pricing: ogPricing,
  faq: ogFaq,
  contact: ogContact,
  careers: ogCareers,
  marketplace: ogMarketplace,
  directory: ogDirectory,
  analytics: ogAnalytics,
  // Use analytics image as default for feature pages
  defaultFeature: ogAnalytics,
} as const;

export default ogImages;
