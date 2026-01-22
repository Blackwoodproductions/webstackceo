import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle, XCircle, Clock, Trash2, Star, StarOff,
  Building2, Mail, Globe, Phone, MapPin, ChevronDown, ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type DirectoryListing = {
  id: string;
  business_name: string;
  slug: string;
  description: string;
  contact_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  website_url: string | null;
  logo_url: string | null;
  status: string;
  is_featured: boolean;
  subscription_start: string | null;
  subscription_end: string | null;
  created_at: string;
  category_id: string | null;
  directory_categories?: { name: string } | null;
};

interface AdminDirectoryTabProps {
  onUpdate: () => void;
}

const AdminDirectoryTab = ({ onUpdate }: AdminDirectoryTabProps) => {
  const { toast } = useToast();
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("directory_listings")
      .select(`
        *,
        directory_categories (name)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setListings(data as DirectoryListing[]);
    }
    setIsLoading(false);
  };

  const updateStatus = async (id: string, status: "active" | "suspended") => {
    const updates: any = { status };
    
    // Set subscription dates when activating
    if (status === "active") {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      updates.subscription_start = startDate.toISOString().split('T')[0];
      updates.subscription_end = endDate.toISOString().split('T')[0];
    }

    const { error } = await supabase
      .from("directory_listings")
      .update(updates)
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update listing status.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: status === "active" ? "Listing Activated" : "Listing Suspended",
      description: status === "active" 
        ? "The business is now visible in the directory." 
        : "The listing has been suspended.",
    });

    fetchListings();
    onUpdate();
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean) => {
    const { error } = await supabase
      .from("directory_listings")
      .update({ is_featured: !currentFeatured })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update featured status.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: !currentFeatured ? "Listing Featured" : "Feature Removed",
      description: !currentFeatured 
        ? "The listing will appear prominently in the directory." 
        : "The listing is no longer featured.",
    });

    fetchListings();
  };

  const rejectListing = async (id: string) => {
    const { error } = await supabase
      .from("directory_listings")
      .update({ status: "suspended" })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reject listing.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Listing Rejected",
      description: "The submission has been rejected.",
    });

    fetchListings();
    onUpdate();
  };

  const deleteListing = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("directory_listings")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete listing.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Listing Deleted",
      description: "The listing has been removed.",
    });

    setDeleteId(null);
    fetchListings();
    onUpdate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-400 border-yellow-400"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "active":
        return <Badge variant="outline" className="text-green-400 border-green-400"><CheckCircle className="w-3 h-3 mr-1" /> Active</Badge>;
      case "expired":
        return <Badge variant="outline" className="text-orange-400 border-orange-400"><Clock className="w-3 h-3 mr-1" /> Expired</Badge>;
      case "suspended":
        return <Badge variant="outline" className="text-red-400 border-red-400"><XCircle className="w-3 h-3 mr-1" /> Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
            <div className="h-6 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold mb-2">No Directory Listings</h3>
        <p className="text-muted-foreground">No business directory submissions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => (
        <motion.div
          key={listing.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <div 
            className="p-6 cursor-pointer"
            onClick={() => setExpandedId(expandedId === listing.id ? null : listing.id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold">{listing.business_name}</h3>
                  {getStatusBadge(listing.status)}
                  {listing.is_featured && (
                    <Badge className="bg-amber-400/20 text-amber-400 border-amber-400">
                      <Star className="w-3 h-3 mr-1 fill-current" /> Featured
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {listing.email}
                  </span>
                  {listing.directory_categories && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {listing.directory_categories.name}
                    </span>
                  )}
                  {listing.city && listing.state && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {listing.city}, {listing.state}
                    </span>
                  )}
                  <span>
                    {new Date(listing.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {expandedId === listing.id ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          {expandedId === listing.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border"
            >
              <div className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Contact</h4>
                    <p>{listing.contact_name}</p>
                    <p className="text-sm text-muted-foreground">{listing.email}</p>
                    {listing.phone && <p className="text-sm text-muted-foreground">{listing.phone}</p>}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Location</h4>
                    {listing.address && <p className="text-sm">{listing.address}</p>}
                    <p className="text-sm">{listing.city}, {listing.state} {listing.zip_code}</p>
                  </div>
                </div>

                {listing.website_url && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Website</h4>
                    <a href={listing.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      {listing.website_url}
                    </a>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{listing.description}</p>
                </div>

                {listing.subscription_start && listing.subscription_end && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Subscription Period</h4>
                    <p className="text-sm">
                      {new Date(listing.subscription_start).toLocaleDateString()} - {new Date(listing.subscription_end).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                  {listing.status === "pending" && (
                    <>
                      <Button 
                        variant="hero" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(listing.id, "active");
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve & Activate
                      </Button>
                      <Button 
                        variant="heroOutline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          rejectListing(listing.id);
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}

                  {listing.status === "active" && (
                    <Button 
                      variant="heroOutline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(listing.id, "suspended");
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Suspend
                    </Button>
                  )}

                  {listing.status === "suspended" && (
                    <Button 
                      variant="hero" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(listing.id, "active");
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Reactivate
                    </Button>
                  )}

                  {listing.status === "active" && (
                    <Button 
                      variant={listing.is_featured ? "ghost" : "heroOutline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFeatured(listing.id, listing.is_featured);
                      }}
                    >
                      {listing.is_featured ? (
                        <>
                          <StarOff className="w-4 h-4 mr-1" />
                          Remove Feature
                        </>
                      ) : (
                        <>
                          <Star className="w-4 h-4 mr-1" />
                          Feature
                        </>
                      )}
                    </Button>
                  )}

                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(listing.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this directory listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteListing} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDirectoryTab;
