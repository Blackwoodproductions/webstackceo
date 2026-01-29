import { memo, useMemo } from "react";
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
      <div className="relative min-h-[140px] w-full h-full bg-muted/30 flex items-center justify-center">
        <MapPin className="w-8 h-8 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div 
      className="relative min-h-[140px]" 
      style={{ contain: 'layout paint' }}
    >
      <iframe
        key={mapKey}
        src={embedUrl}
        className="w-full h-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Business Location"
        style={{ 
          minHeight: '140px',
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
        className="absolute top-2 right-2 text-[10px] text-cyan-500 hover:underline bg-white/90 px-1.5 py-0.5 rounded"
      >
        View larger map
      </a>
    </div>
  );
});

BronCachedMap.displayName = 'BronCachedMap';
