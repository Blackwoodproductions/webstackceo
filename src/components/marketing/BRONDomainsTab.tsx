import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Globe, RefreshCw, Edit2, Trash2, RotateCcw, Check, X, 
  ExternalLink, Search, MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BronDomain } from "@/hooks/use-bron-api";

interface BRONDomainsTabProps {
  domains: BronDomain[];
  isLoading: boolean;
  onRefresh: () => void;
  onUpdate: (domain: string, data: Record<string, unknown>) => Promise<boolean>;
  onDelete: (domain: string) => Promise<boolean>;
  onRestore: (domain: string) => Promise<boolean>;
}

export const BRONDomainsTab = ({
  domains,
  isLoading,
  onRefresh,
  onUpdate,
  onDelete,
  onRestore,
}: BRONDomainsTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredDomains = domains.filter(d => 
    d.domain?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (domain: BronDomain) => {
    setEditingDomain(domain.domain);
    setEditValue(domain.domain);
  };

  const handleSaveEdit = async (originalDomain: string) => {
    if (editValue && editValue !== originalDomain) {
      await onUpdate(originalDomain, { new_domain: editValue });
    }
    setEditingDomain(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingDomain(null);
    setEditValue("");
  };

  const handleDelete = async (domain: string) => {
    await onDelete(domain);
    setDeleteConfirm(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="border-cyan-500/20 bg-gradient-to-br from-background to-cyan-500/5">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-cyan-400" />
              Your Domains
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48 h-9 bg-secondary/50"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isLoading}
              className="border-cyan-500/30 hover:bg-cyan-500/10"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && domains.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredDomains.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No domains found</p>
              <p className="text-sm mt-1">Your connected domains will appear here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDomains.map((domain, index) => (
                <motion.div
                  key={domain.domain}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group flex items-center justify-between p-4 rounded-lg border transition-all
                    ${domain.is_deleted 
                      ? 'bg-red-500/5 border-red-500/20 opacity-60' 
                      : 'bg-secondary/30 border-border hover:border-cyan-500/30 hover:bg-cyan-500/5'
                    }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-cyan-400" />
                    </div>
                    
                    {editingDomain === domain.domain ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 max-w-xs"
                          autoFocus
                        />
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleSaveEdit(domain.domain)}
                          className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-400"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 p-0 text-muted-foreground"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{domain.domain}</span>
                          {domain.is_deleted && (
                            <Badge variant="destructive" className="text-xs">Deleted</Badge>
                          )}
                          {domain.status && (
                            <Badge variant="secondary" className="text-xs">{domain.status}</Badge>
                          )}
                        </div>
                        {domain.created_at && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Added {new Date(domain.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(`https://${domain.domain}`, '_blank')}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!domain.is_deleted ? (
                          <>
                            <DropdownMenuItem onClick={() => handleEdit(domain)}>
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit Domain
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirm(domain.domain)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Domain
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={() => onRestore(domain.domain)}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Restore Domain
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Domain?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteConfirm}</strong>? 
              This is a soft delete and can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};
