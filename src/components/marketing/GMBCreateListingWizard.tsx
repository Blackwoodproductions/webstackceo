import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Building, MapPin, Phone, Globe, Clock, FileText,
  ChevronRight, ChevronLeft, Loader2, X, CheckCircle,
  ArrowLeft, Info, Sparkles, Search
} from 'lucide-react';

interface BusinessHours {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface GMBCreateListingWizardProps {
  domain: string;
  accessToken: string;
  accountId: string | null;
  onComplete: () => void;
  onCancel: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_HOURS: BusinessHours[] = DAYS.map(day => ({
  day,
  openTime: '09:00',
  closeTime: '17:00',
  isClosed: day === 'Saturday' || day === 'Sunday',
}));

// Common business categories
const POPULAR_CATEGORIES = [
  'Restaurant', 'Cafe', 'Bar', 'Bakery',
  'Retail store', 'Clothing store', 'Grocery store',
  'Hair salon', 'Spa', 'Gym', 'Yoga studio',
  'Doctor', 'Dentist', 'Lawyer', 'Accountant',
  'Real estate agency', 'Insurance agency',
  'Auto repair shop', 'Car dealer',
  'Hotel', 'Bed & breakfast',
  'IT services', 'Web design', 'Marketing agency',
  'Construction company', 'Electrician', 'Plumber',
];

export function GMBCreateListingWizard({
  domain,
  accessToken,
  accountId,
  onComplete,
  onCancel,
}: GMBCreateListingWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategorySearch, setShowCategorySearch] = useState(false);

  // Form data
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState(domain ? `https://${domain}` : '');
  const [description, setDescription] = useState('');
  
  // Address
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country] = useState('US');

  // Hours
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(DEFAULT_HOURS);
  const [use24Hours, setUse24Hours] = useState(false);

  const filteredCategories = POPULAR_CATEGORIES.filter(cat =>
    cat.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const updateHours = useCallback((index: number, field: keyof BusinessHours, value: string | boolean) => {
    setBusinessHours(prev => prev.map((h, i) => 
      i === index ? { ...h, [field]: value } : h
    ));
  }, []);

  const handleSubmit = useCallback(async () => {
    // Validation
    if (!businessName.trim()) {
      toast.error('Please enter your business name');
      setStep(1);
      return;
    }
    if (!category.trim()) {
      toast.error('Please select a business category');
      setStep(1);
      return;
    }
    if (!streetAddress.trim() || !city.trim() || !state.trim() || !postalCode.trim()) {
      toast.error('Please complete the address information');
      setStep(2);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('gmb-create-location', {
        body: {
          accessToken,
          accountId: accountId || 'accounts/me', // Use 'accounts/me' if no specific account
          businessName: businessName.trim(),
          primaryCategory: category,
          phoneNumber: phone.trim() || undefined,
          websiteUri: website.trim() || undefined,
          address: {
            streetAddress: streetAddress.trim(),
            city: city.trim(),
            state: state.trim(),
            postalCode: postalCode.trim(),
            country,
          },
          description: description.trim() || undefined,
          businessHours: businessHours.filter(h => !h.isClosed),
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Business listing created! Google will require verification.');
      onComplete();
    } catch (err) {
      console.error('Create listing error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  }, [accessToken, accountId, businessName, category, phone, website, streetAddress, city, state, postalCode, country, description, businessHours, onComplete]);

  const canProceedStep1 = businessName.trim() && category.trim();
  const canProceedStep2 = streetAddress.trim() && city.trim() && state.trim() && postalCode.trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {step > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(s => s - 1)}
              className="h-8"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-500" />
              Create New Business Listing
            </h3>
            <p className="text-xs text-muted-foreground">
              Step {step} of 4 • {step === 1 ? 'Business Info' : step === 2 ? 'Location' : step === 3 ? 'Hours' : 'Review'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <button
              onClick={() => step > s && setStep(s)}
              disabled={step < s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                step === s 
                  ? 'bg-blue-500 text-white' 
                  : step > s
                    ? 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 cursor-pointer'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > s ? <CheckCircle className="w-4 h-4" /> : s}
            </button>
            {s < 4 && (
              <div className={`w-8 h-0.5 ${step > s ? 'bg-blue-500/50' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Business Info */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="space-y-3">
              <div>
                <Label htmlFor="businessName" className="text-sm font-medium">
                  Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Enter your business name"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">
                  Business Category <span className="text-destructive">*</span>
                </Label>
                <div className="mt-1.5 relative">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={category || categorySearch}
                        onChange={(e) => {
                          setCategorySearch(e.target.value);
                          setCategory('');
                          setShowCategorySearch(true);
                        }}
                        onFocus={() => setShowCategorySearch(true)}
                        placeholder="Search or select a category..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  {showCategorySearch && (
                    <Card className="absolute z-10 mt-1 w-full max-h-48 overflow-hidden">
                      <ScrollArea className="h-48">
                        <div className="p-2 space-y-1">
                          {filteredCategories.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => {
                                setCategory(cat);
                                setCategorySearch('');
                                setShowCategorySearch(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors ${
                                category === cat ? 'bg-blue-500/10 text-blue-500' : ''
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                          {categorySearch && !filteredCategories.includes(categorySearch) && (
                            <button
                              onClick={() => {
                                setCategory(categorySearch);
                                setCategorySearch('');
                                setShowCategorySearch(false);
                              }}
                              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-accent transition-colors text-blue-500"
                            >
                              Use "{categorySearch}"
                            </button>
                          )}
                        </div>
                      </ScrollArea>
                    </Card>
                  )}
                </div>
                {category && (
                  <Badge className="mt-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                    {category}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="website" className="text-sm font-medium">Website</Label>
                  <div className="relative mt-1.5">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://example.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">Business Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your business, products, or services..."
                  className="mt-1.5 resize-none h-20"
                  maxLength={750}
                />
                <p className="text-[10px] text-muted-foreground mt-1">{description.length}/750 characters</p>
              </div>
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              Continue to Location
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <Alert className="border-blue-500/30 bg-blue-500/10">
              <MapPin className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm">
                Enter the physical address where customers can visit your business.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <Label htmlFor="streetAddress" className="text-sm font-medium">
                  Street Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="streetAddress"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="123 Main Street"
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="state" className="text-sm font-medium">
                    State <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="NY"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="postalCode" className="text-sm font-medium">
                    ZIP Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="10001"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Country</Label>
                  <Input
                    value="United States"
                    disabled
                    className="mt-1.5 bg-muted"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600"
              >
                Continue to Hours
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Business Hours */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Business Hours</span>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="24hours" className="text-xs text-muted-foreground">Open 24 hours</Label>
                <Switch
                  id="24hours"
                  checked={use24Hours}
                  onCheckedChange={(checked) => {
                    setUse24Hours(checked);
                    if (checked) {
                      setBusinessHours(DAYS.map(day => ({
                        day,
                        openTime: '00:00',
                        closeTime: '23:59',
                        isClosed: false,
                      })));
                    } else {
                      setBusinessHours(DEFAULT_HOURS);
                    }
                  }}
                />
              </div>
            </div>

            <ScrollArea className="h-[280px] pr-3">
              <div className="space-y-2">
                {businessHours.map((hours, index) => (
                  <div
                    key={hours.day}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      hours.isClosed ? 'bg-muted/50 border-muted' : 'border-border'
                    }`}
                  >
                    <div className="w-24">
                      <span className={`text-sm font-medium ${hours.isClosed ? 'text-muted-foreground' : ''}`}>
                        {hours.day.slice(0, 3)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!hours.isClosed}
                        onCheckedChange={(checked) => updateHours(index, 'isClosed', !checked)}
                      />
                      <span className="text-xs text-muted-foreground w-12">
                        {hours.isClosed ? 'Closed' : 'Open'}
                      </span>
                    </div>

                    {!hours.isClosed && !use24Hours && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={hours.openTime}
                          onChange={(e) => updateHours(index, 'openTime', e.target.value)}
                          className="w-28 h-8 text-xs"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={hours.closeTime}
                          onChange={(e) => updateHours(index, 'closeTime', e.target.value)}
                          className="w-28 h-8 text-xs"
                        />
                      </div>
                    )}
                    
                    {use24Hours && !hours.isClosed && (
                      <span className="text-xs text-muted-foreground">24 hours</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600"
              >
                Review & Submit
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <Alert className="border-green-500/30 bg-green-500/10">
              <Sparkles className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-sm">
                Review your business information before creating your listing.
              </AlertDescription>
            </Alert>

            <Card className="border-blue-500/20 bg-gradient-to-br from-card to-blue-500/5">
              <CardContent className="p-4 space-y-4">
                {/* Business Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Business Details</span>
                  </div>
                  <div className="pl-6 space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {businessName}</p>
                    <p><span className="text-muted-foreground">Category:</span> {category}</p>
                    {phone && <p><span className="text-muted-foreground">Phone:</span> {phone}</p>}
                    {website && <p><span className="text-muted-foreground">Website:</span> {website}</p>}
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Location</span>
                  </div>
                  <div className="pl-6 text-sm text-muted-foreground">
                    <p>{streetAddress}</p>
                    <p>{city}, {state} {postalCode}</p>
                  </div>
                </div>

                {/* Hours Summary */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">Hours</span>
                  </div>
                  <div className="pl-6 text-sm text-muted-foreground">
                    {use24Hours ? (
                      <p>Open 24 hours</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-1">
                        {businessHours.map(h => (
                          <p key={h.day} className="text-xs">
                            <span className="font-medium">{h.day.slice(0, 3)}:</span>{' '}
                            {h.isClosed ? 'Closed' : `${h.openTime} - ${h.closeTime}`}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {description && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-violet-500" />
                      <span className="text-sm font-medium">Description</span>
                    </div>
                    <p className="pl-6 text-sm text-muted-foreground line-clamp-2">{description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert className="border-amber-500/30 bg-amber-500/10">
              <Info className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-xs">
                After submission, Google will require you to verify ownership of this business via postcard, phone, or email.
              </AlertDescription>
            </Alert>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Create Listing
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
