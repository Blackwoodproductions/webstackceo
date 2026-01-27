import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Building, MapPin, Phone, Globe, Clock, Save, X, Loader2, 
  Edit, Check, ChevronDown, ChevronUp 
} from 'lucide-react';

interface BusinessHour {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface GmbLocation {
  name: string;
  title: string;
  websiteUri?: string;
  phoneNumbers?: {
    primaryPhone?: string;
  };
  storefrontAddress?: {
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
    addressLines?: string[];
  };
  regularHours?: {
    periods: Array<{
      openDay: string;
      openTime: { hours: number; minutes?: number };
      closeDay: string;
      closeTime: { hours: number; minutes?: number };
    }>;
  };
  profile?: {
    description?: string;
  };
  categories?: {
    primaryCategory?: {
      displayName?: string;
    };
  };
}

interface GMBBusinessInfoEditorProps {
  location: GmbLocation;
  onSave: (data: {
    title?: string;
    websiteUri?: string;
    phoneNumber?: string;
    description?: string;
    regularHours?: BusinessHour[];
  }) => Promise<boolean>;
  isLoading: boolean;
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_LABELS: Record<string, string> = {
  'MONDAY': 'Mon', 'TUESDAY': 'Tue', 'WEDNESDAY': 'Wed', 'THURSDAY': 'Thu',
  'FRIDAY': 'Fri', 'SATURDAY': 'Sat', 'SUNDAY': 'Sun'
};

function formatTimeFromParts(time?: { hours: number; minutes?: number }): string {
  if (!time) return '09:00';
  const h = time.hours.toString().padStart(2, '0');
  const m = (time.minutes || 0).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function GMBBusinessInfoEditor({ location, onSave, isLoading }: GMBBusinessInfoEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const [formData, setFormData] = useState({
    title: location.title || '',
    websiteUri: location.websiteUri || '',
    phoneNumber: location.phoneNumbers?.primaryPhone || '',
    description: location.profile?.description || '',
  });
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize hours from location data
  useEffect(() => {
    const initialHours: BusinessHour[] = DAYS.map(day => {
      const period = location.regularHours?.periods.find(p => p.openDay === day);
      return {
        day,
        openTime: period ? formatTimeFromParts(period.openTime) : '09:00',
        closeTime: period ? formatTimeFromParts(period.closeTime) : '17:00',
        isClosed: !period,
      };
    });
    setHours(initialHours);
  }, [location]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleHourChange = (dayIndex: number, field: keyof BusinessHour, value: string | boolean) => {
    setHours(prev => {
      const updated = [...prev];
      updated[dayIndex] = { ...updated[dayIndex], [field]: value };
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    const updateData: Record<string, unknown> = {};
    
    if (formData.title !== location.title) {
      updateData.title = formData.title;
    }
    if (formData.websiteUri !== (location.websiteUri || '')) {
      updateData.websiteUri = formData.websiteUri;
    }
    if (formData.phoneNumber !== (location.phoneNumbers?.primaryPhone || '')) {
      updateData.phoneNumber = formData.phoneNumber;
    }
    if (formData.description !== (location.profile?.description || '')) {
      updateData.description = formData.description;
    }
    
    // Check if hours changed
    const hoursChanged = hours.some((h, i) => {
      const originalPeriod = location.regularHours?.periods.find(p => p.openDay === h.day);
      if (!originalPeriod && !h.isClosed) return true;
      if (originalPeriod && h.isClosed) return true;
      if (originalPeriod) {
        const origOpen = formatTimeFromParts(originalPeriod.openTime);
        const origClose = formatTimeFromParts(originalPeriod.closeTime);
        if (origOpen !== h.openTime || origClose !== h.closeTime) return true;
      }
      return false;
    });
    
    if (hoursChanged) {
      updateData.regularHours = hours;
    }

    if (Object.keys(updateData).length === 0) {
      setIsEditing(false);
      return;
    }

    const success = await onSave(updateData as Parameters<typeof onSave>[0]);
    if (success) {
      setIsEditing(false);
      setHasChanges(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      title: location.title || '',
      websiteUri: location.websiteUri || '',
      phoneNumber: location.phoneNumbers?.primaryPhone || '',
      description: location.profile?.description || '',
    });
    setIsEditing(false);
    setHasChanges(false);
  };

  return (
    <Card className="border-violet-500/20 bg-gradient-to-br from-card to-violet-500/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Building className="w-4 h-4 text-violet-500" />
            Business Information
          </CardTitle>
          {!isEditing ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="border-violet-500/30 hover:bg-violet-500/10 text-xs"
            >
              <Edit className="w-3 h-3 mr-1" />Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCancel}
                disabled={isLoading}
                className="text-xs"
              >
                <X className="w-3 h-3 mr-1" />Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleSave}
                disabled={isLoading || !hasChanges}
                className="bg-gradient-to-r from-violet-600 to-purple-600 text-xs"
              >
                {isLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Business Name */}
          <div className="p-4 rounded-xl bg-background/50 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Building className="w-5 h-5 text-violet-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Business Name</p>
                {isEditing ? (
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Business name"
                  />
                ) : (
                  <p className="text-sm font-medium">{location.title}</p>
                )}
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="p-4 rounded-xl bg-background/50 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                {isEditing ? (
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="h-8 text-sm"
                    placeholder="+1 (555) 123-4567"
                  />
                ) : (
                  <p className="text-sm font-medium">{location.phoneNumbers?.primaryPhone || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Website */}
          <div className="p-4 rounded-xl bg-background/50 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Website</p>
                {isEditing ? (
                  <Input
                    value={formData.websiteUri}
                    onChange={(e) => handleInputChange('websiteUri', e.target.value)}
                    className="h-8 text-sm"
                    placeholder="https://example.com"
                  />
                ) : (
                  <p className="text-sm font-medium truncate">{location.websiteUri || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address (read-only) */}
          <div className="p-4 rounded-xl bg-background/50 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Address</p>
                <p className="text-sm font-medium">{location.storefrontAddress?.addressLines?.join(', ')}</p>
                <p className="text-xs text-muted-foreground">
                  {location.storefrontAddress?.locality}, {location.storefrontAddress?.administrativeArea} {location.storefrontAddress?.postalCode}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 rounded-xl bg-background/50 border border-border">
          <p className="text-xs text-muted-foreground mb-2">Business Description</p>
          {isEditing ? (
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="text-sm min-h-[80px]"
              placeholder="Describe your business..."
              maxLength={750}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {location.profile?.description || 'No description set. Add one to help customers understand your business.'}
            </p>
          )}
          {isEditing && (
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {formData.description.length}/750 characters
            </p>
          )}
        </div>

        {/* Business Hours */}
        <div className="p-4 rounded-xl bg-background/50 border border-border">
          <button 
            onClick={() => setShowHours(!showHours)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium">Business Hours</span>
            </div>
            {showHours ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showHours && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-2"
            >
              {hours.map((hour, index) => (
                <div key={hour.day} className="flex items-center gap-3 text-sm">
                  <span className="w-12 text-muted-foreground">{DAY_LABELS[hour.day]}</span>
                  
                  {isEditing ? (
                    <>
                      <Switch
                        checked={!hour.isClosed}
                        onCheckedChange={(checked) => handleHourChange(index, 'isClosed', !checked)}
                      />
                      {!hour.isClosed && (
                        <>
                          <Input
                            type="time"
                            value={hour.openTime}
                            onChange={(e) => handleHourChange(index, 'openTime', e.target.value)}
                            className="w-24 h-7 text-xs"
                          />
                          <span className="text-muted-foreground">to</span>
                          <Input
                            type="time"
                            value={hour.closeTime}
                            onChange={(e) => handleHourChange(index, 'closeTime', e.target.value)}
                            className="w-24 h-7 text-xs"
                          />
                        </>
                      )}
                      {hour.isClosed && (
                        <Badge variant="outline" className="text-red-400 border-red-500/30 text-xs">
                          Closed
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className={hour.isClosed ? 'text-red-400' : ''}>
                      {hour.isClosed ? 'Closed' : `${hour.openTime} - ${hour.closeTime}`}
                    </span>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
