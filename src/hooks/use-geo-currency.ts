import { useState, useEffect } from 'react';

interface GeoData {
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  exchangeRate: number;
}

// Currency mappings by country code
const CURRENCY_MAP: Record<string, { currency: string; symbol: string; rate: number }> = {
  US: { currency: 'USD', symbol: '$', rate: 1 },
  CA: { currency: 'CAD', symbol: 'C$', rate: 1.36 },
  GB: { currency: 'GBP', symbol: '£', rate: 0.79 },
  EU: { currency: 'EUR', symbol: '€', rate: 0.92 },
  AU: { currency: 'AUD', symbol: 'A$', rate: 1.53 },
  NZ: { currency: 'NZD', symbol: 'NZ$', rate: 1.67 },
  JP: { currency: 'JPY', symbol: '¥', rate: 149 },
  CN: { currency: 'CNY', symbol: '¥', rate: 7.24 },
  IN: { currency: 'INR', symbol: '₹', rate: 83.12 },
  MX: { currency: 'MXN', symbol: 'MX$', rate: 17.15 },
  BR: { currency: 'BRL', symbol: 'R$', rate: 4.97 },
  CH: { currency: 'CHF', symbol: 'CHF', rate: 0.88 },
  SE: { currency: 'SEK', symbol: 'kr', rate: 10.42 },
  NO: { currency: 'NOK', symbol: 'kr', rate: 10.67 },
  DK: { currency: 'DKK', symbol: 'kr', rate: 6.87 },
  PL: { currency: 'PLN', symbol: 'zł', rate: 3.96 },
  ZA: { currency: 'ZAR', symbol: 'R', rate: 18.65 },
  SG: { currency: 'SGD', symbol: 'S$', rate: 1.34 },
  HK: { currency: 'HKD', symbol: 'HK$', rate: 7.82 },
  KR: { currency: 'KRW', symbol: '₩', rate: 1320 },
  AE: { currency: 'AED', symbol: 'د.إ', rate: 3.67 },
  IL: { currency: 'ILS', symbol: '₪', rate: 3.65 },
  TH: { currency: 'THB', symbol: '฿', rate: 35.5 },
  MY: { currency: 'MYR', symbol: 'RM', rate: 4.72 },
  PH: { currency: 'PHP', symbol: '₱', rate: 55.8 },
  ID: { currency: 'IDR', symbol: 'Rp', rate: 15850 },
  VN: { currency: 'VND', symbol: '₫', rate: 24500 },
  // EU countries
  DE: { currency: 'EUR', symbol: '€', rate: 0.92 },
  FR: { currency: 'EUR', symbol: '€', rate: 0.92 },
  IT: { currency: 'EUR', symbol: '€', rate: 0.92 },
  ES: { currency: 'EUR', symbol: '€', rate: 0.92 },
  NL: { currency: 'EUR', symbol: '€', rate: 0.92 },
  BE: { currency: 'EUR', symbol: '€', rate: 0.92 },
  AT: { currency: 'EUR', symbol: '€', rate: 0.92 },
  PT: { currency: 'EUR', symbol: '€', rate: 0.92 },
  IE: { currency: 'EUR', symbol: '€', rate: 0.92 },
  FI: { currency: 'EUR', symbol: '€', rate: 0.92 },
  GR: { currency: 'EUR', symbol: '€', rate: 0.92 },
};

const DEFAULT_GEO: GeoData = {
  country: 'United States',
  countryCode: 'US',
  currency: 'USD',
  currencySymbol: '$',
  exchangeRate: 1,
};

export function useGeoCurrency() {
  const [geoData, setGeoData] = useState<GeoData>(DEFAULT_GEO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Check localStorage cache first (valid for 24 hours)
        const cached = localStorage.getItem('geo_currency_data');
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
            setGeoData(data);
            setLoading(false);
            return;
          }
        }

        // Use free IP geolocation API
        const response = await fetch('https://ipapi.co/json/', {
          signal: AbortSignal.timeout(3000),
        });
        
        if (!response.ok) throw new Error('Geo lookup failed');
        
        const data = await response.json();
        const countryCode = data.country_code || 'US';
        const countryName = data.country_name || 'United States';
        
        const currencyInfo = CURRENCY_MAP[countryCode] || CURRENCY_MAP.US;
        
        const geoInfo: GeoData = {
          country: countryName,
          countryCode,
          currency: currencyInfo.currency,
          currencySymbol: currencyInfo.symbol,
          exchangeRate: currencyInfo.rate,
        };
        
        // Cache the result
        localStorage.setItem('geo_currency_data', JSON.stringify({
          data: geoInfo,
          timestamp: Date.now(),
        }));
        
        setGeoData(geoInfo);
      } catch (error) {
        console.log('Geo detection fallback to USD:', error);
        // Fallback to browser locale
        try {
          const locale = navigator.language;
          const region = locale.split('-')[1] || 'US';
          const currencyInfo = CURRENCY_MAP[region] || CURRENCY_MAP.US;
          setGeoData({
            country: region,
            countryCode: region,
            currency: currencyInfo.currency,
            currencySymbol: currencyInfo.symbol,
            exchangeRate: currencyInfo.rate,
          });
        } catch {
          setGeoData(DEFAULT_GEO);
        }
      } finally {
        setLoading(false);
      }
    };

    detectLocation();
  }, []);

  // Convert USD cents to local currency
  const convertPrice = (usdCents: number): number => {
    return Math.round(usdCents * geoData.exchangeRate);
  };

  // Format price in local currency
  const formatLocalPrice = (usdCents: number): string => {
    const localAmount = convertPrice(usdCents) / 100;
    
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: geoData.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: geoData.currency === 'JPY' || geoData.currency === 'KRW' ? 0 : 2,
      }).format(localAmount);
    } catch {
      return `${geoData.currencySymbol}${localAmount.toFixed(0)}`;
    }
  };

  // Get the equivalent display (e.g., "≈ €92" for USD $100)
  const getEquivalent = (usdCents: number): string | null => {
    if (geoData.currency === 'USD') return null;
    return formatLocalPrice(usdCents);
  };

  return {
    ...geoData,
    loading,
    convertPrice,
    formatLocalPrice,
    getEquivalent,
    isUSD: geoData.currency === 'USD',
  };
}

export default useGeoCurrency;
