import { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, Globe, Star, FlaskConical, Plus, Search, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const RECENT_DOMAINS_KEY = 'webstack_recent_domains';
const MAX_RECENT = 5;

interface DomainItem {
  id: string;
  domain: string;
  normalized: string;
  is_primary: boolean;
  isDemo?: boolean;
}

interface DomainSearchDropdownProps {
  domains: DomainItem[];
  selectedDomain: string;
  onSelectDomain: (domain: string) => void;
  onAddDomain: () => void;
  isLoading?: boolean;
  isSuperAdmin?: boolean;
}

export function DomainSearchDropdown({
  domains,
  selectedDomain,
  onSelectDomain,
  onAddDomain,
  isLoading = false,
  isSuperAdmin = false,
}: DomainSearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [recentDomains, setRecentDomains] = useState<string[]>([]);

  // Load recent domains from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_DOMAINS_KEY);
      if (stored) {
        setRecentDomains(JSON.parse(stored));
      }
    } catch {
      setRecentDomains([]);
    }
  }, []);

  // Save to recent when selecting
  const handleSelect = useCallback((domain: string) => {
    onSelectDomain(domain);
    setOpen(false);
    setSearchValue('');
    
    // Update recent domains
    setRecentDomains(prev => {
      const filtered = prev.filter(d => d !== domain);
      const updated = [domain, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_DOMAINS_KEY, JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  }, [onSelectDomain]);

  // Clear a single recent item
  const clearRecent = useCallback((domain: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentDomains(prev => {
      const updated = prev.filter(d => d !== domain);
      try {
        localStorage.setItem(RECENT_DOMAINS_KEY, JSON.stringify(updated));
      } catch { /* ignore */ }
      return updated;
    });
  }, []);

  // Get domain display info
  const getDomainInfo = useCallback((domainName: string) => {
    return domains.find(d => d.normalized === domainName || d.domain === domainName);
  }, [domains]);

  // Filter domains by search
  const filteredDomains = useMemo(() => {
    if (!searchValue.trim()) return domains;
    const search = searchValue.toLowerCase();
    return domains.filter(d => 
      d.domain.toLowerCase().includes(search) || 
      d.normalized.includes(search)
    );
  }, [domains, searchValue]);

  // Recent domains that exist in the current list
  const validRecentDomains = useMemo(() => {
    const domainSet = new Set(domains.map(d => d.normalized));
    return recentDomains.filter(r => domainSet.has(r) && r !== selectedDomain);
  }, [recentDomains, domains, selectedDomain]);

  // Find current selection
  const currentDomain = getDomainInfo(selectedDomain);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] h-8 justify-between bg-background/80 border-border/50 hover:bg-background hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            {currentDomain ? (
              <>
                {currentDomain.is_primary ? (
                  <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                ) : currentDomain.isDemo ? (
                  <FlaskConical className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                )}
                <span className="truncate text-sm">{currentDomain.domain}</span>
              </>
            ) : (
              <span className="text-muted-foreground text-sm">Select domain...</span>
            )}
          </div>
          <Search className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[280px] p-0 bg-popover/95 backdrop-blur-xl border border-border shadow-2xl"
        style={{ zIndex: 9999 }}
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search domains..." 
            value={searchValue}
            onValueChange={setSearchValue}
            className="h-9"
          />
          <CommandList className="max-h-[300px]">
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading domains...
              </div>
            ) : (
              <>
                <CommandEmpty>No domains found.</CommandEmpty>
                
                {/* Recent Searches */}
                {validRecentDomains.length > 0 && !searchValue && (
                  <>
                    <CommandGroup heading="Recent">
                      {validRecentDomains.map(recentDomain => {
                        const info = getDomainInfo(recentDomain);
                        const canAccess = isSuperAdmin || info?.is_primary;
                        
                        return (
                          <CommandItem
                            key={`recent-${recentDomain}`}
                            value={recentDomain}
                            onSelect={() => canAccess && handleSelect(recentDomain)}
                            disabled={!canAccess}
                            className={cn(
                              "flex items-center justify-between group",
                              !canAccess && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="truncate">{recentDomain}</span>
                            </div>
                            <button
                              onClick={(e) => clearRecent(recentDomain, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
                            >
                              <X className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}

                {/* All Domains */}
                <CommandGroup heading="All Domains">
                  {filteredDomains.map((domain) => {
                    const canAccess = isSuperAdmin || domain.is_primary;
                    const isSelected = selectedDomain === domain.normalized;
                    
                    return (
                      <CommandItem
                        key={domain.id}
                        value={domain.normalized}
                        onSelect={() => canAccess && handleSelect(domain.normalized)}
                        disabled={!canAccess}
                        className={cn(
                          "flex items-center justify-between",
                          !canAccess && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {domain.is_primary ? (
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                          ) : domain.isDemo ? (
                            <FlaskConical className="w-3.5 h-3.5 text-violet-400" />
                          ) : (
                            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                          <span className="truncate max-w-[140px]">{domain.domain}</span>
                          {domain.isDemo && (
                            <Badge className="text-[8px] px-1 py-0 bg-violet-500/20 text-violet-400 border-violet-500/30">
                              DEMO
                            </Badge>
                          )}
                          {domain.is_primary && !domain.isDemo && (
                            <Badge className="text-[8px] px-1 py-0 bg-amber-500/20 text-amber-600 border-amber-500/30">
                              FREE
                            </Badge>
                          )}
                          {!canAccess && !domain.isDemo && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0">
                              Upgrade
                            </Badge>
                          )}
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                
                <CommandSeparator />
                
                {/* Add Domain Action */}
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      onAddDomain();
                    }}
                    className="flex items-center gap-2 text-primary cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add domain
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default DomainSearchDropdown;
