import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search, MapPin, Star, Phone, Globe, ChevronRight,
  Loader2, X, CheckCircle, ExternalLink, Building,
  ArrowLeft, ShieldCheck, Info
} from 'lucide-react';

interface BusinessSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  business_status?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: {
    location: { lat: number; lng: number };
  };
}

interface BusinessDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  phone?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  business_status?: string;
  types?: string[];
  google_maps_url?: string;
  opening_hours?: {
    weekday_text?: string[];
    open_now?: boolean;
  };
  address_components?: {
    street_number?: string;
    route?: string;
    locality?: string;
    administrative_area_level_1?: string;
    postal_code?: string;
    country?: string;
  };
}

interface GMBClaimListingFlowProps {
  domain: string;
  accessToken: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function GMBClaimListingFlow({ 
  domain, 
  accessToken, 
  onComplete, 
  onCancel 
}: GMBClaimListingFlowProps) {
  const [step, setStep] = useState<'search' | 'select' | 'claim'>('search');
  const [searchQuery, setSearchQuery] = useState(domain || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<BusinessSearchResult[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Auto-search on mount if domain provided
  useEffect(() => {
    if (domain && searchQuery === domain) {
      handleSearch();
    }
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      toast.error('Please enter a business name or address to search');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('places-autocomplete', {
        body: {
          action: 'searchBusiness',
          query: searchQuery,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSearchResults(data.results || []);
      
      if (!data.results?.length) {
        toast.info('No businesses found. Try a different search term.');
      } else {
        setStep('select');
      }
    } catch (err) {
      console.error('Business search error:', err);
      toast.error('Failed to search for businesses');
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSelectBusiness = useCallback(async (business: BusinessSearchResult) => {
    setIsLoadingDetails(true);

    try {
      const { data, error } = await supabase.functions.invoke('places-autocomplete', {
        body: {
          action: 'getBusinessDetails',
          placeId: business.place_id,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSelectedBusiness(data.business);
      setStep('claim');
    } catch (err) {
      console.error('Get business details error:', err);
      toast.error('Failed to load business details');
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  const handleClaimBusiness = useCallback(async () => {
    if (!selectedBusiness) return;

    setIsClaiming(true);

    try {
      // The GMB API doesn't have a direct "claim" endpoint that we can call.
      // The claiming process must go through Google's verification flow.
      // We'll open the claim URL in a popup and poll for the listing to appear.
      
      // Build the claim URL for Google Business Profile
      const claimUrl = `https://business.google.com/add?hl=en&place_id=${selectedBusiness.place_id}`;
      
      const width = 600;
      const height = 700;
      const left = (window.screenX ?? 0) + (window.outerWidth - width) / 2;
      const top = (window.screenY ?? 0) + (window.outerHeight - height) / 2;

      const popup = window.open(
        claimUrl,
        'ClaimGMBBusiness',
        `popup=yes,width=${width},height=${height},left=${Math.max(0, left)},top=${Math.max(0, top)}`
      );

      if (!popup) {
        toast.error('Popup blocked. Please allow popups and try again.');
        setIsClaiming(false);
        return;
      }

      // Show toast about the process
      toast.info('Complete the verification in the popup. We\'ll sync your listings when you\'re done.');

      // Poll for popup closure
      const pollInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollInterval);
          setIsClaiming(false);
          toast.success('Claim process initiated! Your listing will appear after Google verification.');
          onComplete();
        }
      }, 1000);

    } catch (err) {
      console.error('Claim error:', err);
      toast.error('Failed to initiate claim process');
      setIsClaiming(false);
    }
  }, [selectedBusiness, onComplete]);

  const getBusinessTypeLabel = (types?: string[]) => {
    if (!types?.length) return null;
    const typeMap: Record<string, string> = {
      restaurant: 'Restaurant',
      store: 'Store',
      establishment: 'Business',
      point_of_interest: 'Point of Interest',
      food: 'Food',
      health: 'Health',
      finance: 'Finance',
      lodging: 'Lodging',
      real_estate_agency: 'Real Estate',
      car_dealer: 'Automotive',
      car_repair: 'Auto Service',
      beauty_salon: 'Beauty',
      gym: 'Fitness',
      lawyer: 'Legal',
      doctor: 'Medical',
      dentist: 'Dental',
      hospital: 'Healthcare',
    };
    
    for (const type of types) {
      if (typeMap[type]) return typeMap[type];
    }
    return types[0]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {step !== 'search' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (step === 'claim') {
                  setStep('select');
                  setSelectedBusiness(null);
                } else {
                  setStep('search');
                  setSearchResults([]);
                }
              }}
              className="h-8"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Search className="w-5 h-5 text-green-500" />
              {step === 'search' && 'Search for Your Business'}
              {step === 'select' && 'Select Your Business'}
              {step === 'claim' && 'Claim This Listing'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {step === 'search' && 'Find your business on Google Maps to claim it'}
              {step === 'select' && `Found ${searchResults.length} results for "${searchQuery}"`}
              {step === 'claim' && 'Review and claim this business listing'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {['search', 'select', 'claim'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              step === s 
                ? 'bg-green-500 text-white' 
                : ['search', 'select', 'claim'].indexOf(step) > i
                  ? 'bg-green-500/20 text-green-500'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {['search', 'select', 'claim'].indexOf(step) > i ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div className={`w-8 h-0.5 ${
                ['search', 'select', 'claim'].indexOf(step) > i
                  ? 'bg-green-500/50'
                  : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Search Step */}
        {step === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter business name, address, or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isSearching || searchQuery.length < 2}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            <Alert className="border-blue-500/30 bg-blue-500/10">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm">
                Search for your business by name, address, or phone number. If found, you can claim it directly from here.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Select Step */}
        {step === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            <ScrollArea className="h-[350px] pr-2">
              <div className="space-y-2">
                {searchResults.map((business, i) => (
                  <motion.button
                    key={business.place_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelectBusiness(business)}
                    disabled={isLoadingDetails}
                    className="w-full flex items-start gap-3 p-4 rounded-xl border border-border bg-card hover:border-green-500/50 hover:bg-green-500/5 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{business.name}</span>
                        {business.rating && (
                          <Badge variant="outline" className="text-[10px] py-0 h-4 border-amber-500/30 text-amber-500">
                            <Star className="w-2.5 h-2.5 mr-0.5 fill-amber-500" />
                            {business.rating}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {business.formatted_address}
                      </p>
                      {business.types && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {getBusinessTypeLabel(business.types)}
                        </p>
                      )}
                    </div>
                    {isLoadingDetails ? (
                      <Loader2 className="w-4 h-4 text-green-500 animate-spin" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-green-500 transition-colors" />
                    )}
                  </motion.button>
                ))}
              </div>
            </ScrollArea>

            {/* Can't find business */}
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Can't find your business?{' '}
                <button 
                  onClick={() => setStep('search')} 
                  className="text-green-500 hover:underline"
                >
                  Try a different search
                </button>
                {' '}or{' '}
                <button 
                  onClick={() => {
                    onCancel();
                    // Trigger create new flow
                    window.open('https://business.google.com/create', '_blank');
                  }} 
                  className="text-blue-500 hover:underline"
                >
                  create a new listing
                </button>
              </p>
            </div>
          </motion.div>
        )}

        {/* Claim Step */}
        {step === 'claim' && selectedBusiness && (
          <motion.div
            key="claim"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <Card className="border-green-500/30 bg-gradient-to-br from-card to-green-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building className="w-4 h-4 text-green-500" />
                  {selectedBusiness.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Address */}
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    {selectedBusiness.formatted_address}
                  </p>
                </div>

                {/* Rating */}
                {selectedBusiness.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={`w-3.5 h-3.5 ${s <= Math.round(selectedBusiness.rating!) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{selectedBusiness.rating}</span>
                    {selectedBusiness.user_ratings_total && (
                      <span className="text-xs text-muted-foreground">
                        ({selectedBusiness.user_ratings_total} reviews)
                      </span>
                    )}
                  </div>
                )}

                {/* Phone */}
                {selectedBusiness.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{selectedBusiness.phone}</span>
                  </div>
                )}

                {/* Website */}
                {selectedBusiness.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <a 
                      href={selectedBusiness.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline truncate"
                    >
                      {selectedBusiness.website}
                    </a>
                  </div>
                )}

                {/* Google Maps Link */}
                {selectedBusiness.google_maps_url && (
                  <a
                    href={selectedBusiness.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View on Google Maps
                  </a>
                )}
              </CardContent>
            </Card>

            <Alert className="border-green-500/30 bg-green-500/10">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-sm">
                <span className="font-semibold text-green-400">Ready to Claim: </span>
                You'll be redirected to Google Business Profile to verify your ownership. This may require verification via postcard, phone, or email.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep('select');
                  setSelectedBusiness(null);
                }}
                className="flex-1"
              >
                Choose Different Business
              </Button>
              <Button
                onClick={handleClaimBusiness}
                disabled={isClaiming}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
              >
                {isClaiming ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ShieldCheck className="w-4 h-4 mr-2" />
                )}
                Claim This Business
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
