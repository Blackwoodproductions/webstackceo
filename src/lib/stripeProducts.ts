// Comprehensive Stripe Product & Price Configuration
// All webstack.ceo services with real Stripe IDs

export interface StripeProduct {
  id: string;
  priceId: string;
  productId: string;
  name: string;
  description: string;
  price: number; // in cents
  currency: string;
  type: 'recurring' | 'one_time';
  interval?: 'month' | 'year';
  category: 'bron' | 'cade' | 'bundle' | 'dax' | 'onpage-seo' | 'vi' | 'aeo-geo' | 'addon';
  tier?: 'boost' | 'surge' | 'power' | 'starter' | 'pro' | 'enterprise' | 'unlimited';
}

// =====================
// BRON (Off-Page SEO)
// =====================
export const BRON_PRODUCTS: StripeProduct[] = [
  {
    id: 'bron-boost',
    priceId: 'price_1RyzFvDhwTkpKWXvcgtkaooq',
    productId: 'prod_SuotRjGSNqlIPz',
    name: 'BRON Boost',
    description: 'Boost your site authority with automated backlinks from real business websites.',
    price: 29900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'bron',
    tier: 'boost',
  },
  {
    id: 'bron-surge',
    priceId: 'price_1RyzH2DhwTkpKWXvh7ExsM48',
    productId: 'prod_SuounsI6U6V9Yl',
    name: 'BRON Surge',
    description: 'Enhanced off-page SEO with increased backlink velocity and authority building.',
    price: 59900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'bron',
    tier: 'surge',
  },
  {
    id: 'bron-power',
    priceId: 'price_1RyzHbDhwTkpKWXv8gvTARPd',
    productId: 'prod_SuovV7wLmFlONA',
    name: 'BRON Power',
    description: 'Maximum off-page authority building with premium backlink network access.',
    price: 89900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'bron',
    tier: 'power',
  },
  {
    id: 'bron-15-keywords',
    priceId: 'price_1ST2P1DhwTkpKWXviUKZcjHg',
    productId: 'prod_TPs99FAUdyhPHW',
    name: 'BRON 15 Keywords',
    description: 'Track 15 keywords for off-page SEO optimization.',
    price: 5000,
    currency: 'usd',
    type: 'one_time',
    category: 'bron',
  },
  {
    id: 'bron-60-keywords',
    priceId: 'price_1SVGnnDhwTkpKWXveaUdIBtn',
    productId: 'prod_TSBAjvIHDqrici',
    name: 'BRON 60 Keywords',
    description: 'Track 60 keywords for comprehensive off-page SEO monitoring.',
    price: 29900,
    currency: 'usd',
    type: 'one_time',
    category: 'bron',
  },
];

// =====================
// CADE (AI Content)
// =====================
export const CADE_PRODUCTS: StripeProduct[] = [
  {
    id: 'cade-boost',
    priceId: 'price_1RyzJXDhwTkpKWXv2DfuGjBp',
    productId: 'prod_SuoxJLlmBjGIA0',
    name: 'CADE Boost',
    description: 'AI-powered content automation with weekly blog drip and FAQs.',
    price: 29900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'cade',
    tier: 'boost',
  },
  {
    id: 'cade-surge',
    priceId: 'price_1RyzKUDhwTkpKWXv7wTFX3gk',
    productId: 'prod_SuoyMCXsYaakym',
    name: 'CADE Surge',
    description: 'Enhanced AI content with bi-weekly articles and knowledge base generation.',
    price: 59900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'cade',
    tier: 'surge',
  },
  {
    id: 'cade-power',
    priceId: 'price_1RyzKzDhwTkpKWXvJ00qMw9k',
    productId: 'prod_SuoyjF1q87Wtot',
    name: 'CADE Power',
    description: 'Maximum AI content generation with daily articles and premium interlinking.',
    price: 89900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'cade',
    tier: 'power',
  },
  {
    id: 'cade-monthly',
    priceId: 'price_1ST2SkDhwTkpKWXv7jSyg5zG',
    productId: 'prod_TPsD0SbpheHZwj',
    name: 'CADE Monthly',
    description: 'Monthly AI content subscription with competitor-informed articles.',
    price: 14900,
    currency: 'usd',
    type: 'one_time',
    category: 'cade',
  },
];

// =====================
// BRON + CADE Bundles
// =====================
export const BUNDLE_PRODUCTS: StripeProduct[] = [
  {
    id: 'bundle-boost',
    priceId: 'price_1RyzLXDhwTkpKWXv5XSTefM5',
    productId: 'prod_Suoz9C9L336x3q',
    name: 'BRON + CADE Bundle Boost',
    description: 'Complete SEO package: off-page authority + on-page content optimization.',
    price: 49900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'bundle',
    tier: 'boost',
  },
  {
    id: 'bundle-surge',
    priceId: 'price_1RyzM3DhwTkpKWXvb0SYrZie',
    productId: 'prod_Sup0knVcyUBYLK',
    name: 'BRON + CADE Bundle Surge',
    description: 'Enhanced combined SEO with increased backlinks and content velocity.',
    price: 99900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'bundle',
    tier: 'surge',
  },
  {
    id: 'bundle-power',
    priceId: 'price_1RyzMXDhwTkpKWXvmi9gNbkS',
    productId: 'prod_Sup0yOuNf1Fd4C',
    name: 'BRON + CADE Bundle Power',
    description: 'Maximum combined SEO power with premium backlinks and daily content.',
    price: 149900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'bundle',
    tier: 'power',
  },
];

// =====================
// DAX (Domain Authority)
// =====================
export const DAX_PRODUCTS: StripeProduct[] = [
  {
    id: 'dax-boost',
    priceId: 'price_1SFb5rDhwTkpKWXvevDP1s8u',
    productId: 'prod_TBz3I4Zr5izIjM',
    name: 'DAX Boost',
    description: 'Domain Authority boosting service for DA & DR improvement.',
    price: 14900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'dax',
    tier: 'boost',
  },
  {
    id: 'dax-surge',
    priceId: 'price_1SFb6rDhwTkpKWXvuFV7EFFJ',
    productId: 'prod_TBz5W9FVuZRvsQ',
    name: 'DAX Surge',
    description: 'Enhanced Domain Authority boosting with faster results.',
    price: 22500,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'dax',
    tier: 'surge',
  },
  {
    id: 'dax-power',
    priceId: 'price_1SFb7fDhwTkpKWXvjAjB6Snt',
    productId: 'prod_TBz5VhM1SAepCW',
    name: 'DAX Power',
    description: 'Maximum Domain Authority boosting for competitive niches.',
    price: 29900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'dax',
    tier: 'power',
  },
  {
    id: 'dax-50',
    priceId: 'price_1ST2WCDhwTkpKWXvEaNP2rKP',
    productId: 'prod_TPsGrSQHfjG2iA',
    name: 'DAX 50',
    description: 'One-time DA boost to 50.',
    price: 4900,
    currency: 'usd',
    type: 'one_time',
    category: 'dax',
  },
  {
    id: 'dax-60',
    priceId: 'price_1ST2XTDhwTkpKWXv7Vx663I4',
    productId: 'prod_TPsIyDYbIjDqIY',
    name: 'DAX 60',
    description: 'One-time DA boost to 60.',
    price: 9900,
    currency: 'usd',
    type: 'one_time',
    category: 'dax',
  },
  {
    id: 'dax-70',
    priceId: 'price_1ST2XmDhwTkpKWXvW1kMKl69',
    productId: 'prod_TPsI93Rq3YmOwi',
    name: 'DAX 70',
    description: 'One-time DA boost to 70.',
    price: 19900,
    currency: 'usd',
    type: 'one_time',
    category: 'dax',
  },
];

// =====================
// On-Page SEO Tiers
// =====================
export const ONPAGE_SEO_PRODUCTS: StripeProduct[] = [
  {
    id: 'onpage-starter',
    priceId: 'price_1SvOegDhwTkpKWXvhdtOLVST',
    productId: 'prod_TtB03wiEu1PUeM',
    name: 'On-Page SEO Starter',
    description: 'AI-powered on-page optimization for sites up to 500 pages.',
    price: 9900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'onpage-seo',
    tier: 'starter',
  },
  {
    id: 'onpage-pro',
    priceId: 'price_1SvOkWDhwTkpKWXvZmIk2GlJ',
    productId: 'prod_TtB6aUtfuWXJRP',
    name: 'On-Page SEO Pro',
    description: 'AI-powered on-page optimization for sites with 501-2000 pages.',
    price: 19900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'onpage-seo',
    tier: 'pro',
  },
  {
    id: 'onpage-enterprise',
    priceId: 'price_1SvOkpDhwTkpKWXvwZWsflJA',
    productId: 'prod_TtB7I2SfEbK0Zr',
    name: 'On-Page SEO Enterprise',
    description: 'AI-powered on-page optimization for sites with 2001-5000 pages.',
    price: 29900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'onpage-seo',
    tier: 'enterprise',
  },
  {
    id: 'onpage-unlimited',
    priceId: 'price_1SvOl4DhwTkpKWXv8YqYLlJU',
    productId: 'prod_TtB73CXo6jDJ3O',
    name: 'On-Page SEO Unlimited',
    description: 'AI-powered on-page optimization for sites with 5000+ pages.',
    price: 49900,
    currency: 'usd',
    type: 'recurring',
    interval: 'month',
    category: 'onpage-seo',
    tier: 'unlimited',
  },
];

// =====================
// Visitor Intelligence Add-ons
// =====================
export const VI_ADDON_PRODUCTS: StripeProduct[] = [
  {
    id: 'vi-domain-addon',
    priceId: 'price_1RGLeTDhwTkpKWXvUE214Xqr', // $2/domain
    productId: 'prod_SAh2LhPb8MjufT',
    name: 'Additional VI Domain',
    description: 'Add another domain to your Visitor Intelligence dashboard.',
    price: 200,
    currency: 'usd',
    type: 'one_time',
    category: 'vi',
  },
];

// =====================
// AEO/GEO Keywords
// =====================
export const AEO_GEO_PRODUCTS: StripeProduct[] = [
  {
    id: 'aeo-geo-keyword',
    priceId: 'price_1RGLeTDhwTkpKWXvUE214Xqr',
    productId: 'prod_SAh2LhPb8MjufT',
    name: 'AEO/GEO Keyword',
    description: 'Track a keyword for AI Engine Optimization visibility.',
    price: 200,
    currency: 'usd',
    type: 'one_time',
    category: 'aeo-geo',
  },
];

// =====================
// PPC Landing Pages
// =====================
export const PPC_PRODUCTS: StripeProduct[] = [
  {
    id: 'ppc-keyword-ab-test',
    priceId: 'price_1SvPAUDhwTkpKWXvBY3aJiCt',
    productId: 'prod_TtBXrEm6rL7K4d',
    name: 'PPC Keyword A/B Testing',
    description: 'A/B tested landing page per keyword with heatmapping and conversion analytics.',
    price: 2500,
    currency: 'usd',
    type: 'one_time',
    category: 'addon',
  },
  {
    id: 'ppc-page-editor-session',
    priceId: 'price_1SvPAjDhwTkpKWXv57mbSW0h',
    productId: 'prod_TtBXTbm9dAm8uo',
    name: 'PPC Page Editor Session',
    description: 'AI page editing session - design changes, copy updates, and conversion optimizations.',
    price: 25000,
    currency: 'usd',
    type: 'one_time',
    category: 'addon',
  },
];

// =====================
// All Products Combined
// =====================
export const ALL_PRODUCTS: StripeProduct[] = [
  ...BRON_PRODUCTS,
  ...CADE_PRODUCTS,
  ...BUNDLE_PRODUCTS,
  ...DAX_PRODUCTS,
  ...ONPAGE_SEO_PRODUCTS,
  ...VI_ADDON_PRODUCTS,
  ...AEO_GEO_PRODUCTS,
  ...PPC_PRODUCTS,
];

// Helper to get product by ID
export const getProductById = (id: string): StripeProduct | undefined => {
  return ALL_PRODUCTS.find(p => p.id === id);
};

// Helper to get products by category
export const getProductsByCategory = (category: StripeProduct['category']): StripeProduct[] => {
  return ALL_PRODUCTS.filter(p => p.category === category);
};

// Helper to format price
export const formatPrice = (cents: number, currency: string = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(cents / 100);
};
