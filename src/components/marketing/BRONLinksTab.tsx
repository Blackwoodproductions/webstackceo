import { motion } from "framer-motion";
import { 
  Link2, RefreshCw, Search, ArrowDownLeft, ArrowUpRight, ExternalLink
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BronLink } from "@/hooks/use-bron-api";

interface BRONLinksTabProps {
  linksIn: BronLink[];
  linksOut: BronLink[];
  selectedDomain?: string;
  isLoading: boolean;
  onRefreshIn: () => void;
  onRefreshOut: () => void;
  errorIn?: string | null;
  errorOut?: string | null;
}

export const BRONLinksTab = ({
  linksIn,
  linksOut,
  selectedDomain,
  isLoading,
  onRefreshIn,
  onRefreshOut,
  errorIn,
  errorOut,
}: BRONLinksTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [linkType, setLinkType] = useState<"in" | "out">("in");

  const links = linkType === "in" ? linksIn : linksOut;
  
  const filteredLinks = links.filter(l => 
    l.source_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.target_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.anchor_text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.domain?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => {
    if (linkType === "in") {
      onRefreshIn();
    } else {
      onRefreshOut();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Link2 className="w-5 h-5 text-amber-400" />
              Link Reports
              {selectedDomain && (
                <Badge variant="secondary" className="text-xs ml-2">{selectedDomain}</Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48 h-9 bg-secondary/50"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isLoading || !selectedDomain}
              className="border-amber-500/30 hover:bg-amber-500/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Link Type Tabs */}
          <Tabs value={linkType} onValueChange={(v) => setLinkType(v as "in" | "out")}>
            <TabsList className="grid grid-cols-2 w-fit bg-secondary/30">
              <TabsTrigger 
                value="in" 
                className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
              >
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Inbound ({linksIn.length})
              </TabsTrigger>
              <TabsTrigger 
                value="out"
                className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Outbound ({linksOut.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {!selectedDomain ? (
            <div className="text-center py-12 text-muted-foreground">
              <Link2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Select a domain to view links</p>
              <p className="text-sm mt-1">Use the domain selector above</p>
            </div>
          ) : isLoading && links.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (linkType === "in" ? errorIn : errorOut) ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-amber-500/60" />
              </div>
              <p className="text-foreground font-medium mb-1">Link data temporarily unavailable</p>
              <p className="text-sm text-muted-foreground mb-2 max-w-sm mx-auto">
                The external link analysis service is experiencing issues. This usually resolves within a few minutes.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="border-amber-500/30 hover:bg-amber-500/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : filteredLinks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Link2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No {linkType === "in" ? "inbound" : "outbound"} links found</p>
              <p className="text-sm mt-1">Link data will appear here when available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLinks.map((link, index) => (
                <motion.div
                  key={`${link.source_url}-${link.target_url}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group flex items-start justify-between p-4 rounded-lg border bg-secondary/30 border-border hover:border-amber-500/30 hover:bg-amber-500/5 transition-all"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      linkType === "in" 
                        ? "bg-gradient-to-br from-emerald-500/20 to-green-500/20" 
                        : "bg-gradient-to-br from-amber-500/20 to-orange-500/20"
                    }`}>
                      {linkType === "in" ? (
                        <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Source/Target */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {linkType === "in" ? "From:" : "To:"}
                        </span>
                        <a 
                          href={linkType === "in" ? link.source_url : link.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:text-amber-400 truncate"
                        >
                          {(linkType === "in" ? link.source_url : link.target_url)?.replace(/^https?:\/\//, '') || link.domain}
                        </a>
                      </div>
                      
                      {/* Anchor Text */}
                      {link.anchor_text && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Anchor:</span>
                          <Badge variant="secondary" className="text-xs max-w-[200px] truncate">
                            {link.anchor_text}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Target URL for inbound */}
                      {linkType === "in" && link.target_url && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">To:</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {link.target_url.replace(/^https?:\/\//, '')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {link.status && (
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          link.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                          link.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-secondary'
                        }`}
                      >
                        {link.status}
                      </Badge>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(linkType === "in" ? link.source_url : link.target_url, '_blank')}
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
