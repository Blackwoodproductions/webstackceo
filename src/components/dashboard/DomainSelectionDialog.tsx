import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Check, Globe, Star, Lock, Sparkles, Crown, FlaskConical } from 'lucide-react';
import { UserDomain } from '@/hooks/use-user-domains';

interface DomainSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domains: UserDomain[];
  gscSites?: { siteUrl: string }[];
  onSelectPrimary: (domainId: string) => Promise<boolean>;
  isLoading?: boolean;
}

export function DomainSelectionDialog({
  open,
  onOpenChange,
  domains,
  gscSites = [],
  onSelectPrimary,
  isLoading = false,
}: DomainSelectionDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedId) return;
    
    setIsSubmitting(true);
    const success = await onSelectPrimary(selectedId);
    setIsSubmitting(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const hasPrimary = domains.some(d => d.is_primary);
  
  // Build normalized GSC domain set for filtering
  const gscDomainSet = new Set(
    gscSites.map(site => 
      site.siteUrl.toLowerCase().trim()
        .replace('sc-domain:', '')
        .replace(/^(https?:\/\/)?(www\.)?/, '')
        .replace(/\/$/, '')
        .split('/')[0]
    )
  );
  
  // Only show domains that are verified in GSC (not demos)
  const verifiedDomains = domains.filter(d => {
    const normalized = d.domain.toLowerCase().trim()
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0];
    return gscDomainSet.has(normalized) || d.source === 'gsc';
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20">
              <Crown className="w-5 h-5 text-amber-500" />
            </div>
            Select Your Free Domain
          </DialogTitle>
          <DialogDescription>
            Choose one domain from your Google Search Console to use for free.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : verifiedDomains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>No verified domains found</p>
              <p className="text-sm mt-1">Connect your Google Search Console to import your domains</p>
            </div>
          ) : (
            verifiedDomains.map((domain, index) => (
              <motion.div
                key={domain.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    selectedId === domain.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : domain.is_primary
                      ? 'ring-2 ring-amber-500/50 bg-amber-500/5'
                      : 'hover:bg-accent/50'
                  }`}
                  onClick={() => !domain.is_primary && setSelectedId(domain.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        domain.is_primary 
                          ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20'
                          : 'bg-primary/10'
                      }`}>
                        <Globe className={`w-4 h-4 ${
                          domain.is_primary ? 'text-amber-500' : 'text-primary'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium">{domain.domain}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[10px]">
                            {domain.source.toUpperCase()}
                          </Badge>
                          {domain.is_primary && (
                            <Badge className="text-[10px] bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
                              <Star className="w-3 h-3 mr-1" />
                              FREE
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {domain.is_primary ? (
                      <Check className="w-5 h-5 text-amber-500" />
                    ) : selectedId === domain.id ? (
                      <Check className="w-5 h-5 text-primary" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground/50" />
                    )}
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        <DialogFooter>
          {!hasPrimary && (
            <Button
              onClick={handleConfirm}
              disabled={!selectedId || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Selecting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Confirm Free Domain
                </>
              )}
            </Button>
          )}
          {hasPrimary && (
            <p className="text-sm text-muted-foreground text-center w-full">
              You've already selected your free domain. Upgrade to access additional domains.
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DomainSelectionDialog;
