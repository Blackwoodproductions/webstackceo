import { memo, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { loadCachedMapEmbed, saveCachedMapEmbed } from "@/lib/persistentCache";

interface BronCachedMapProps {
  address?: string;
  domain?: string; // Add domain for cache key
}

/**
 * Stable cached map component - defined as a separate module to prevent re-renders.
 * Uses localStorage caching to persist map embeds across hard refreshes.
 */
export const BronCachedMap = memo(({ address, domain }: BronCachedMapProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Use a stable key based on address to avoid iframe remounting
  const mapKey = useMemo(() => address ? `map-${address}` : 'map-empty', [address]);
  
  // Generate embed URL - check persistent cache first
  const embedUrl = useMemo(() => {
    if (!address) return null;
    
    // Check persistent cache first
    if (domain) {
      const cached = loadCachedMapEmbed(domain);
      if (cached && cached.address === address) {
        console.log('[BronCachedMap] Using cached embed URL for', domain);
        return cached.embedUrl;
      }
    }
    
    // Generate new URL with zoom level 14 for better fit
    const encoded = encodeURIComponent(address);
    const url = `https://www.google.com/maps?q=${encoded}&z=14&output=embed`;
    
    // Save to persistent cache
    if (domain) {
      saveCachedMapEmbed(domain, url, address);
    }
    
    return url;
  }, [address, domain]);

  if (!address || !embedUrl) {
    return (
      <div className="relative w-full h-full min-h-[220px] bg-muted/30 flex items-center justify-center">
        <MapPin className="w-8 h-8 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full min-h-[220px]" 
      style={{ contain: 'layout paint' }}
    >
      {/* Loading / fallback overlay */}
      {(!isLoaded || hasError) && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/20">
          <div className="text-center px-4">
            <div className="mx-auto mb-2 w-10 h-10 rounded-full bg-background/70 border border-border flex items-center justify-center">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              {hasError ? "Map unavailable" : "Loading map…"}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex mt-2 text-xs text-primary hover:underline"
            >
              Open in Maps
            </a>
          </div>
        </div>
      )}

      <iframe
        key={mapKey}
        src={embedUrl}
        className="absolute inset-0 w-full h-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Business Location"
        onLoad={() => {
          setIsLoaded(true);
          setHasError(false);
        }}
        onError={() => {
          setHasError(true);
        }}
        style={{ 
          minHeight: '220px',
          // Prevent any transform/animation interference
          transform: 'translateZ(0)',
          willChange: 'auto'
        }}
      />
      {/* View larger map link overlay */}
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 z-20 text-[10px] text-primary hover:underline bg-background/90 border border-border/60 px-1.5 py-0.5 rounded"
      >
        View larger map
      </a>
    </div>
  );
});

BronCachedMap.displayName = 'BronCachedMap';
