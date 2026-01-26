import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, Globe, Phone, Clock, Star, MessageCircle, 
  Building, CheckCircle, RefreshCw, ChevronRight, ExternalLink,
  TrendingUp, Users, Eye, MousePointer, Calendar, Sparkles, Radio
} from 'lucide-react';
import { GMBPerformancePanel } from './GMBPerformancePanel';

interface GmbReview {
  name: string;
  reviewId: string;
  reviewer: {
    displayName: string;
    profilePhotoUrl?: string;
  };
  starRating: string;
  comment?: string;
  createTime: string;
  updateTime?: string;
  reviewReply?: {
    comment: string;
    updateTime: string;
  };
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
  categories?: {
    primaryCategory?: {
      displayName?: string;
    };
    additionalCategories?: Array<{ displayName?: string }>;
  };
  reviews?: GmbReview[];
  averageRating?: number;
  totalReviewCount?: number;
}

interface GMBConnectedDashboardProps {
  location: GmbLocation;
  accessToken: string;
  onDisconnect: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const starRatingToNumber = (rating: string): number => {
  const map: Record<string, number> = {
    'ONE': 1,
    'TWO': 2,
    'THREE': 3,
    'FOUR': 4,
    'FIVE': 5,
  };
  return map[rating] || 0;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const formatHours = (time: { hours: number; minutes?: number }) => {
  const h = time.hours;
  const m = time.minutes || 0;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

export function GMBConnectedDashboard({
  location,
  accessToken,
  onDisconnect,
  onRefresh,
  isRefreshing = false,
}: GMBConnectedDashboardProps) {
  const rating = location.averageRating || 0;
  const reviewCount = location.totalReviewCount || 0;
  const reviews = location.reviews || [];
  
  // Group hours by open/close time for display
  const hoursDisplay = useMemo(() => {
    if (!location.regularHours?.periods?.length) return null;
    
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return days.map((day, i) => {
      const period = location.regularHours?.periods.find(p => p.openDay === day);
      if (!period) return { day: shortDays[i], hours: 'Closed' };
      return {
        day: shortDays[i],
        hours: `${formatHours(period.openTime)} - ${formatHours(period.closeTime)}`,
      };
    });
  }, [location.regularHours]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.div
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/20"
            whileHover={{ scale: 1.05, rotate: 3 }}
          >
            <MapPin className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{location.title}</h2>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
              <motion.span
                className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Radio className="w-2 h-2" />
                LIVE
              </motion.span>
            </div>
            {location.categories?.primaryCategory?.displayName && (
              <p className="text-sm text-muted-foreground">{location.categories.primaryCategory.displayName}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDisconnect}
            className="text-muted-foreground hover:text-destructive"
          >
            Disconnect
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: Star,
            label: 'Rating',
            value: rating > 0 ? rating.toFixed(1) : 'No rating',
            sublabel: `${reviewCount} reviews`,
            gradient: 'from-amber-500/20 to-orange-500/10',
            iconColor: 'text-amber-500',
            borderColor: 'border-amber-500/30',
          },
          {
            icon: MessageCircle,
            label: 'Reviews',
            value: reviewCount.toString(),
            sublabel: 'Total reviews',
            gradient: 'from-blue-500/20 to-cyan-500/10',
            iconColor: 'text-blue-500',
            borderColor: 'border-blue-500/30',
          },
          {
            icon: Globe,
            label: 'Website',
            value: location.websiteUri ? 'Active' : 'Not set',
            sublabel: location.websiteUri || 'Add website',
            gradient: 'from-emerald-500/20 to-green-500/10',
            iconColor: 'text-emerald-500',
            borderColor: 'border-emerald-500/30',
          },
          {
            icon: Phone,
            label: 'Phone',
            value: location.phoneNumbers?.primaryPhone ? 'Active' : 'Not set',
            sublabel: location.phoneNumbers?.primaryPhone || 'Add phone',
            gradient: 'from-violet-500/20 to-purple-500/10',
            iconColor: 'text-violet-500',
            borderColor: 'border-violet-500/30',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative p-4 rounded-xl bg-gradient-to-br ${stat.gradient} border ${stat.borderColor} overflow-hidden group`}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <div className="relative z-10">
              <stat.icon className={`w-5 h-5 ${stat.iconColor} mb-2`} />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground truncate">{stat.sublabel}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Info Card */}
        <Card className="lg:col-span-1 border-border bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              Business Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Address */}
            {location.storefrontAddress && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <p className="text-sm font-medium">
                    {location.storefrontAddress.addressLines?.join(', ')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {location.storefrontAddress.locality}, {location.storefrontAddress.administrativeArea} {location.storefrontAddress.postalCode}
                  </p>
                </div>
              </div>
            )}

            <Separator className="my-3" />

            {/* Phone */}
            {location.phoneNumbers?.primaryPhone && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Phone</p>
                  <p className="text-sm font-medium">{location.phoneNumbers.primaryPhone}</p>
                </div>
              </div>
            )}

            {/* Website */}
            {location.websiteUri && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-violet-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Website</p>
                  <a 
                    href={location.websiteUri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline flex items-center gap-1 truncate"
                  >
                    {location.websiteUri.replace(/^https?:\/\/(www\.)?/, '')}
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              </div>
            )}

            <Separator className="my-3" />

            {/* Hours */}
            {hoursDisplay && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-xs text-muted-foreground">Business Hours</p>
                </div>
                <div className="space-y-1.5 ml-10">
                  {hoursDisplay.map(({ day, hours }) => (
                    <div key={day} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{day}</span>
                      <span className={hours === 'Closed' ? 'text-red-400' : 'font-medium'}>{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews Card */}
        <Card className="lg:col-span-2 border-border bg-gradient-to-br from-card to-amber-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Recent Reviews
              </CardTitle>
              {reviewCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold">{rating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({reviewCount})</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {reviews.length > 0 ? (
              <ScrollArea className="h-[320px] pr-4">
                <div className="space-y-4">
                  {reviews.map((review, i) => {
                    const stars = starRatingToNumber(review.starRating);
                    return (
                      <motion.div
                        key={review.reviewId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-4 rounded-xl bg-background/60 border border-border group hover:border-amber-500/30 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {review.reviewer.profilePhotoUrl ? (
                            <img 
                              src={review.reviewer.profilePhotoUrl} 
                              alt={review.reviewer.displayName}
                              className="w-10 h-10 rounded-full object-cover ring-2 ring-amber-500/20"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                              {review.reviewer.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-medium text-sm truncate">{review.reviewer.displayName}</p>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatDate(review.createTime)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mb-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`w-3 h-3 ${star <= stars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
                                />
                              ))}
                            </div>
                            {review.comment && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {review.comment}
                              </p>
                            )}
                            {review.reviewReply && (
                              <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                                <p className="text-xs font-medium text-primary mb-1">Owner response</p>
                                <p className="text-xs text-muted-foreground">{review.reviewReply.comment}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">No reviews yet</p>
                <p className="text-xs text-muted-foreground">Reviews will appear here once customers leave feedback</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Panel */}
      <GMBPerformancePanel
        accessToken={accessToken}
        locationName={location.name}
        locationTitle={location.title}
      />

      {/* CADE Integration Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-pink-500/10 border border-violet-500/20 overflow-hidden"
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-500/5 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold flex items-center gap-2">
                Automated by CADE
                <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 text-[10px]">
                  AI Powered
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                When CADE is active, new articles and FAQs are automatically posted to your GMB listing
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 border-violet-500/30 hover:bg-violet-500/10">
            Configure CADE
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
