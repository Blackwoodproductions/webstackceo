import { memo } from "react";
import { 
  Loader2, ChevronDown, MapPin, Camera,
  Facebook, Linkedin, Instagram, Twitter, Youtube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BronDomain } from "@/hooks/use-bron-api";
import { BronCachedMap } from "./BronCachedMap";

interface BronDomainProfileProps {
  selectedDomain: string;
  domainInfo: BronDomain | null;
  keywordCount: number;
  screenshotUrl: string | null;
  isCapturingScreenshot: boolean;
  onCaptureScreenshot: () => void;
  onScreenshotError: () => void;
}

// Package name lookup
const PACKAGE_NAMES: Record<string, string> = {
  "383": "SEOM 60",
  "380": "SEOM 30",
  "381": "SEOM 45",
  "382": "SEOM Premium",
};

const getPackageName = (serviceType?: string) => {
  return PACKAGE_NAMES[serviceType || ""] || `Package ${serviceType || "N/A"}`;
};

// Social link component to reduce repetition
interface SocialLinkProps {
  href: string;
  platform: string;
  icon: React.ElementType;
  bgClass: string;
}

const SocialLink = memo(({ href, platform, icon: Icon, bgClass }: SocialLinkProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={`w-6 h-6 rounded-full ${bgClass} flex items-center justify-center hover:opacity-80 transition-opacity`}
    title={platform}
  >
    <Icon className="w-3.5 h-3.5 text-white" />
  </a>
));

SocialLink.displayName = 'SocialLink';

// Build full URL from handle or existing URL
const buildSocialUrl = (value: string, baseUrl: string): string => {
  return value.startsWith('http') ? value : `${baseUrl}${value}`;
};

export const BronDomainProfile = memo(({
  selectedDomain,
  domainInfo,
  keywordCount,
  screenshotUrl,
  isCapturingScreenshot,
  onCaptureScreenshot,
  onScreenshotError,
}: BronDomainProfileProps) => {
  const keywordProgress = Math.min(keywordCount, 37);
  
  // Check if any social links exist
  const hasSocialLinks = !!(
    domainInfo?.wr_facebook || 
    domainInfo?.wr_linkedin || 
    domainInfo?.wr_instagram || 
    domainInfo?.wr_twitter || 
    domainInfo?.wr_video
  );

  return (
    <Card 
      className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm no-theme-transition"
      data-no-theme-transition
      style={{ contain: 'layout style paint' }}
    >
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* LEFT: Website Screenshot with Domain Options */}
          <div className="lg:col-span-3 p-4 border-r border-border/30">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border/50 bg-muted/30 mb-3">
              {/* Loading overlay */}
              {isCapturingScreenshot && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-md" />
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin motion-reduce:animate-none" />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-foreground">Capturing screenshot...</span>
                  </div>
                </div>
              )}
              
              {/* Screenshot image with fallbacks */}
              <img 
                src={screenshotUrl || `https://api.microlink.io/?url=https://${selectedDomain}&screenshot=true&meta=false&embed=screenshot.url`}
                alt={`${selectedDomain} preview`}
                className="w-full h-full object-cover object-top"
                loading="lazy"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (screenshotUrl) {
                    onScreenshotError();
                    return;
                  }
                  if (!target.dataset.fallback) {
                    target.dataset.fallback = "1";
                    target.src = `https://image.thum.io/get/width/400/crop/300/https://${selectedDomain}`;
                  } else if (target.dataset.fallback === "1") {
                    target.dataset.fallback = "2";
                    target.src = `https://s.wordpress.com/mshots/v1/https%3A%2F%2F${selectedDomain}?w=400&h=300`;
                  } else {
                    target.dataset.fallback = "3";
                    target.src = `https://www.google.com/s2/favicons?domain=${selectedDomain}&sz=128`;
                    target.className = "w-20 h-20 object-contain mx-auto mt-12";
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
              
              {/* Recapture button */}
              {!isCapturingScreenshot && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-background/90 hover:bg-background border border-border/50 shadow-sm transition-all"
                  onClick={onCaptureScreenshot}
                  title="Recapture screenshot"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            <Button 
              variant="default" 
              size="sm" 
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              onClick={() => window.open(`https://${selectedDomain}`, '_blank')}
            >
              <span className="mr-2">⋮</span>
              Domain Options
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* MIDDLE: Domain Info Fields */}
          <div className="lg:col-span-4 p-4 border-r border-border/30 flex items-center">
            <div className="space-y-3 w-full">
              <InfoRow label="Domain Info">
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-8 bg-secondary/50 rounded border border-border/50 flex items-center px-3">
                    <span className="text-sm">{keywordProgress}/37</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">0%</Badge>
                </div>
              </InfoRow>

              <InfoRow label="Domain Status">
                <Badge 
                  variant="secondary" 
                  className="bg-secondary/80 text-foreground border-border/50"
                >
                  LIVE
                </Badge>
              </InfoRow>

              <InfoRow label="Package">
                <span className="text-sm font-medium">{getPackageName(domainInfo?.servicetype)}</span>
              </InfoRow>

              <InfoRow label="Last Feed Check">
                <span className="text-sm font-medium">
                  {domainInfo?.updated_at 
                    ? new Date(domainInfo.updated_at).toLocaleDateString()
                    : "1 month ago"}
                </span>
              </InfoRow>

              <InfoRow label="Domain Category">
                <span className="text-sm font-medium">
                  {domainInfo?.wr_name 
                    ? `${domainInfo.wr_name.split(' ').slice(-1)[0]} Services` 
                    : "Business Services"}
                </span>
              </InfoRow>
            </div>
          </div>

          {/* RIGHT: Google My Business Card with Map */}
          <div className="lg:col-span-5 p-4">
            <div className="rounded-lg border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-cyan-600/10 overflow-hidden h-full">
              {/* GMB Header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-background/50 border-b border-cyan-500/20">
                <MapPin className="w-4 h-4 text-red-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Google My Business
                </span>
              </div>

              <div className="grid grid-cols-2 gap-0 h-[calc(100%-36px)]">
                {/* Business Info */}
                <div className="p-3 space-y-2 border-r border-cyan-500/20">
                  <h4 className="font-semibold text-sm">
                    {domainInfo?.wr_name || selectedDomain}
                  </h4>
                  {domainInfo?.wr_address && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {domainInfo.wr_address}
                    </p>
                  )}
                  {domainInfo?.wr_phone && (
                    <p className="text-xs text-muted-foreground">
                      {domainInfo.wr_phone}
                    </p>
                  )}
                  <a 
                    href={`https://${selectedDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    {selectedDomain}
                  </a>
                  
                  {/* Social Media Icons */}
                  {hasSocialLinks && (
                    <div className="flex items-center gap-2 pt-2 mt-1 border-t border-border/30">
                      {domainInfo?.wr_facebook && (
                        <SocialLink 
                          href={buildSocialUrl(domainInfo.wr_facebook, 'https://facebook.com/')}
                          platform="Facebook"
                          icon={Facebook}
                          bgClass="bg-[#1877F2]"
                        />
                      )}
                      {domainInfo?.wr_linkedin && (
                        <SocialLink 
                          href={buildSocialUrl(domainInfo.wr_linkedin, 'https://linkedin.com/company/')}
                          platform="LinkedIn"
                          icon={Linkedin}
                          bgClass="bg-[#0A66C2]"
                        />
                      )}
                      {domainInfo?.wr_instagram && (
                        <SocialLink 
                          href={buildSocialUrl(domainInfo.wr_instagram, 'https://instagram.com/')}
                          platform="Instagram"
                          icon={Instagram}
                          bgClass="bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]"
                        />
                      )}
                      {domainInfo?.wr_twitter && (
                        <SocialLink 
                          href={buildSocialUrl(domainInfo.wr_twitter, 'https://twitter.com/')}
                          platform="X (Twitter)"
                          icon={Twitter}
                          bgClass="bg-black"
                        />
                      )}
                      {domainInfo?.wr_video && (
                        <SocialLink 
                          href={buildSocialUrl(domainInfo.wr_video, 'https://youtube.com/')}
                          platform="YouTube"
                          icon={Youtube}
                          bgClass="bg-[#FF0000]"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Google Maps */}
                <BronCachedMap address={domainInfo?.wr_address} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

BronDomainProfile.displayName = 'BronDomainProfile';

// Helper component for info rows
interface InfoRowProps {
  label: string;
  children: React.ReactNode;
}

const InfoRow = memo(({ label, children }: InfoRowProps) => (
  <div className="flex items-center gap-3">
    <span className="text-muted-foreground text-sm min-w-[110px]">{label} :</span>
    {children}
  </div>
));

InfoRow.displayName = 'InfoRow';
