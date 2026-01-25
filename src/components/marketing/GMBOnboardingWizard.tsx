import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CheckCircle, ChevronLeft, ChevronRight, ArrowRight, MapPin, 
  Clock, Globe, Phone, Building, FileText, Loader2, AlertCircle,
  Store, Briefcase, Utensils, Wrench, Heart, Home, Car, Scissors,
  Dumbbell, Laptop, GraduationCap, Camera
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface BusinessHours {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface GMBOnboardingWizardProps {
  domain: string;
  accessToken: string;
  accountId: string | null;
  accounts: { name: string; accountName: string; type: string }[];
  onComplete: () => void;
  onCancel: () => void;
}

const BUSINESS_CATEGORIES = [
  { value: 'Restaurant', label: 'Restaurant', icon: Utensils },
  { value: 'Retail store', label: 'Retail Store', icon: Store },
  { value: 'Professional services', label: 'Professional Services', icon: Briefcase },
  { value: 'Health & medical', label: 'Healthcare', icon: Heart },
  { value: 'Real estate agency', label: 'Real Estate', icon: Home },
  { value: 'Automotive repair shop', label: 'Automotive', icon: Car },
  { value: 'Beauty salon', label: 'Beauty & Spa', icon: Scissors },
  { value: 'Gym', label: 'Fitness & Gym', icon: Dumbbell },
  { value: 'Computer repair service', label: 'Technology', icon: Laptop },
  { value: 'Educational institution', label: 'Education', icon: GraduationCap },
  { value: 'Photographer', label: 'Photography', icon: Camera },
  { value: 'Home services', label: 'Home Services', icon: Wrench },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const DEFAULT_HOURS: BusinessHours[] = DAYS_OF_WEEK.map(day => ({
  day,
  openTime: '09:00',
  closeTime: '17:00',
  isClosed: day === 'SATURDAY' || day === 'SUNDAY',
}));

export const GMBOnboardingWizard = ({
  domain,
  accessToken,
  accountId,
  accounts,
  onComplete,
  onCancel,
}: GMBOnboardingWizardProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Form state
  const [selectedAccountId, setSelectedAccountId] = useState(accountId || '');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  
  // Address
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  // Hours
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>(DEFAULT_HOURS);
  const [useDefaultHours, setUseDefaultHours] = useState(true);

  const totalSteps = 5;

  const updateHours = (dayIndex: number, field: keyof BusinessHours, value: string | boolean) => {
    setBusinessHours(prev => prev.map((h, i) => 
      i === dayIndex ? { ...h, [field]: value } : h
    ));
  };

  const applyToAllDays = (sourceIndex: number) => {
    const source = businessHours[sourceIndex];
    setBusinessHours(prev => prev.map(h => ({
      ...h,
      openTime: source.openTime,
      closeTime: source.closeTime,
      isClosed: h.day === 'SATURDAY' || h.day === 'SUNDAY' ? h.isClosed : source.isClosed,
    })));
    toast.success('Hours applied to weekdays');
  };

  const handleSubmit = async () => {
    if (!selectedAccountId) {
      toast.error('Please select a business account');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { data, error } = await supabase.functions.invoke('gmb-create-location', {
        body: {
          accessToken,
          accountId: selectedAccountId,
          businessName,
          primaryCategory: category,
          phoneNumber: phone || undefined,
          websiteUri: domain,
          address: {
            streetAddress,
            city,
            state,
            postalCode,
            country: 'US',
          },
          description: description || undefined,
          businessHours: useDefaultHours ? undefined : businessHours,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to create business listing');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('Business listing created successfully!');
      setStep(6); // Success step
    } catch (err) {
      console.error('GMB creation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create business listing';
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedAccountId;
      case 2: return businessName.trim().length >= 2 && !!category;
      case 3: return streetAddress.trim() && city.trim() && state && postalCode.trim();
      case 4: return true; // Hours are optional
      case 5: return true; // Review step
      default: return false;
    }
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Add Business to Google Maps
          </h2>
          <Badge variant="outline" className="text-xs">
            Step {Math.min(step, 5)} of {totalSteps}
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                step > i ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6">
        {/* Step 1: Select Account */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Select Business Account</h3>
              <p className="text-sm text-muted-foreground">
                Choose the Google Business account to add your new location to
              </p>
            </div>

            {accounts.length > 0 ? (
              <div className="space-y-3 max-w-md mx-auto">
                {accounts.map((account) => (
                  <div
                    key={account.name}
                    onClick={() => setSelectedAccountId(account.name)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedAccountId === account.name
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-green-400 flex items-center justify-center">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{account.accountName}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {account.type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      {selectedAccountId === account.name && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-w-md mx-auto text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
                <h4 className="font-bold text-lg mb-2">No Business Accounts Found</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  You need a Google Business account to add a location. Create one first in Google Business Profile.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => window.open('https://business.google.com/create', '_blank')}
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Create Business Account in Google
                  </Button>
                  <Button variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Business Info */}
        {step === 2 && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Business Information</h3>
              <p className="text-sm text-muted-foreground">
                Tell us about your business for <span className="font-medium text-foreground">{domain}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Business Name *
                </Label>
                <Input
                  placeholder="e.g., Acme Corporation"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="text-base"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Business Category *
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="text-base">
                    <SelectValue placeholder="Select your primary category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-4 h-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  type="tel"
                  placeholder="e.g., (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-base"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-1.5 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Business Description
                </Label>
                <Textarea
                  placeholder="Describe your business, services, and what makes you unique..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="text-base resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length}/750 characters
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Address */}
        {step === 3 && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Business Location</h3>
              <p className="text-sm text-muted-foreground">
                Enter the address where customers can find you
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1.5">Street Address *</Label>
                <Input
                  placeholder="123 Main Street, Suite 100"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5">City *</Label>
                  <Input
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="text-base"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5">State *</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger className="text-base">
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="w-1/2">
                <Label className="text-sm font-medium mb-1.5">ZIP Code *</Label>
                <Input
                  placeholder="12345"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="text-base"
                  maxLength={10}
                />
              </div>

              <div className="bg-muted/30 rounded-lg p-4 mt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" />
                  Website
                </h4>
                <p className="text-sm">
                  <span className="font-medium">https://{domain}</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Business Hours */}
        {step === 4 && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Business Hours</h3>
              <p className="text-sm text-muted-foreground">
                Set your regular operating hours
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
              <div>
                <p className="font-medium">Use Default Hours</p>
                <p className="text-sm text-muted-foreground">Mon-Fri 9am-5pm, weekends closed</p>
              </div>
              <Switch
                checked={useDefaultHours}
                onCheckedChange={setUseDefaultHours}
              />
            </div>

            {!useDefaultHours && (
              <div className="space-y-3">
                {businessHours.map((hours, index) => (
                  <div
                    key={hours.day}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      hours.isClosed ? 'bg-muted/30 border-border' : 'bg-card border-border'
                    }`}
                  >
                    <div className="w-24">
                      <span className="text-sm font-medium capitalize">
                        {hours.day.toLowerCase().slice(0, 3)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!hours.isClosed}
                        onCheckedChange={(open) => updateHours(index, 'isClosed', !open)}
                      />
                      <span className="text-xs text-muted-foreground w-12">
                        {hours.isClosed ? 'Closed' : 'Open'}
                      </span>
                    </div>

                    {!hours.isClosed && (
                      <>
                        <Input
                          type="time"
                          value={hours.openTime}
                          onChange={(e) => updateHours(index, 'openTime', e.target.value)}
                          className="w-28 text-sm"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={hours.closeTime}
                          onChange={(e) => updateHours(index, 'closeTime', e.target.value)}
                          className="w-28 text-sm"
                        />
                        {index === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => applyToAllDays(0)}
                            className="text-xs text-primary"
                          >
                            Apply to all
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-6 max-w-xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Review Your Listing</h3>
              <p className="text-sm text-muted-foreground">
                Confirm your business details before submitting
              </p>
            </div>

            <div className="bg-muted/30 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Business Name</span>
                <span className="text-sm font-medium text-right">{businessName}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="text-sm font-medium text-right">{category}</span>
              </div>
              {phone && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">Phone</span>
                  <span className="text-sm font-medium text-right">{phone}</span>
                </div>
              )}
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Website</span>
                <span className="text-sm font-medium text-right">{domain}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Address</span>
                <span className="text-sm font-medium text-right max-w-[200px]">
                  {streetAddress}, {city}, {state} {postalCode}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Hours</span>
                <span className="text-sm font-medium text-right">
                  {useDefaultHours ? 'Mon-Fri 9am-5pm' : 'Custom hours set'}
                </span>
              </div>
              {description && (
                <div className="pt-3 border-t border-border">
                  <span className="text-sm text-muted-foreground block mb-1">Description</span>
                  <p className="text-sm">{description}</p>
                </div>
              )}
            </div>

            {submitError && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Submission Failed</p>
                  <p className="text-sm text-destructive/80">{submitError}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Note:</strong> After submission, Google will require verification of your business ownership. This typically involves a postcard, phone call, or email verification.
              </p>
            </div>
          </div>
        )}

        {/* Step 6: Success */}
        {step === 6 && (
          <div className="space-y-6 max-w-xl mx-auto text-center py-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold">Business Created Successfully!</h3>
            <p className="text-muted-foreground">
              Your business listing for <span className="font-medium text-foreground">{businessName}</span> has been submitted to Google.
            </p>
            
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-left">
              <h4 className="font-medium text-amber-600 dark:text-amber-400 mb-2">Next Steps:</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Google will review your listing (usually within 3-5 business days)</li>
                <li>You'll receive a verification request via mail, phone, or email</li>
                <li>Complete verification to make your listing live on Google Maps</li>
                <li>Add photos, posts, and respond to reviews to optimize your profile</li>
              </ol>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                size="lg"
                onClick={() => window.open('https://business.google.com/locations', '_blank')}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 mr-2" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Manage in Google Business
              </Button>
              <Button variant="outline" onClick={onComplete}>
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer - Hide when no accounts on step 1 */}
      {step < 6 && !(step === 1 && accounts.length === 0) && (
        <div className="border-t border-border p-4 bg-muted/20">
          <div className="flex justify-between max-w-xl mx-auto">
            <Button
              variant="outline"
              onClick={() => step === 1 ? onCancel() : setStep(step - 1)}
              disabled={isSubmitting}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>

            {step < 5 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed() || isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                Continue
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Listing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create Business Listing
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
