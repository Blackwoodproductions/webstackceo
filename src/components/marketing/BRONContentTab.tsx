import { motion } from "framer-motion";
import { 
  FileText, RefreshCw, ExternalLink, Search
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BronPage } from "@/hooks/use-bron-api";

interface BRONContentTabProps {
  pages: BronPage[];
  selectedDomain?: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export const BRONContentTab = ({
  pages,
  selectedDomain,
  isLoading,
  onRefresh,
}: BRONContentTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Support both old and new API formats
  const getTitle = (p: BronPage) => p.post_title || p.title || 'Untitled';
  const getUrl = (p: BronPage) => p.post_uri || p.url || '';
  
  const filteredPages = pages.filter(p => 
    getTitle(p).toLowerCase().includes(searchQuery.toLowerCase()) ||
    getUrl(p).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Removed unused getTypeColor function

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-blue-500/20 bg-gradient-to-br from-background to-blue-500/5">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-blue-400" />
              Pages & Content
              {selectedDomain && (
                <Badge variant="secondary" className="text-xs ml-2">{selectedDomain}</Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48 h-9 bg-secondary/50"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isLoading || !selectedDomain}
              className="border-blue-500/30 hover:bg-blue-500/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedDomain ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Select a domain to view pages</p>
              <p className="text-sm mt-1">Use the domain selector above</p>
            </div>
          ) : isLoading && pages.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No pages found</p>
              <p className="text-sm mt-1">Pages and articles from your domain will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPages.map((page, index) => {
                const title = getTitle(page);
                const url = getUrl(page);
                const excerpt = page.post_excerpt || '';
                
                return (
                  <motion.div
                    key={page.pageid || url || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="group flex items-center justify-between p-4 rounded-lg border bg-secondary/30 border-border hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium truncate">
                            {title}
                          </h4>
                          {page.pageid && (
                            <Badge className="text-xs bg-blue-500/20 text-blue-400">
                              ID: {page.pageid}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {url || excerpt}
                        </p>
                        {page.post_date && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5">
                            {new Date(page.post_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4">
                      {url && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(url.startsWith('http') ? url : `https://${url}`, '_blank')}
                            className="h-8 w-8 p-0"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
