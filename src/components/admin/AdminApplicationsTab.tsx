import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle, XCircle, Clock, Eye, Trash2, 
  Building2, Mail, Globe, FileText, ChevronDown, ChevronUp
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
import type { Database } from "@/integrations/supabase/types";

type Application = Database["public"]["Tables"]["marketplace_applications"]["Row"] & {
  marketplace_categories?: { name: string } | null;
};

interface AdminApplicationsTabProps {
  onUpdate: () => void;
}

const AdminApplicationsTab = ({ onUpdate }: AdminApplicationsTabProps) => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("marketplace_applications")
      .select(`
        *,
        marketplace_categories (name)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setApplications(data);
    }
    setIsLoading(false);
  };

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    const application = applications.find(a => a.id === id);
    if (!application) return;

    if (status === "approved") {
      // Create partner from application
      const slug = application.company_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const { error: partnerError } = await supabase
        .from("marketplace_partners")
        .insert({
          company_name: application.company_name,
          slug: `${slug}-${Date.now()}`,
          description: application.description,
          website_url: application.website_url,
          contact_email: application.contact_email,
          category_id: application.category_id,
          status: "approved",
          rating: 0,
          review_count: 0,
          ranking_score: 0,
        });

      if (partnerError) {
        toast({
          title: "Error",
          description: "Failed to create partner listing.",
          variant: "destructive",
        });
        return;
      }
    }

    const { error } = await supabase
      .from("marketplace_applications")
      .update({ 
        status, 
        reviewed_at: new Date().toISOString() 
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: status === "approved" ? "Application Approved" : "Application Rejected",
      description: status === "approved" 
        ? "Partner has been added to the marketplace." 
        : "Application has been rejected.",
    });

    fetchApplications();
    onUpdate();
  };

  const deleteApplication = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("marketplace_applications")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete application.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Application Deleted",
      description: "The application has been removed.",
    });

    setDeleteId(null);
    fetchApplications();
    onUpdate();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-yellow-400 border-yellow-400"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="text-green-400 border-green-400"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-red-400 border-red-400"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
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

  if (applications.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold mb-2">No Applications</h3>
        <p className="text-muted-foreground">No partner applications have been submitted yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {applications.map((app) => (
        <motion.div
          key={app.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <div 
            className="p-6 cursor-pointer"
            onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold">{app.company_name}</h3>
                  {getStatusBadge(app.status)}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {app.contact_email}
                  </span>
                  {app.marketplace_categories && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {app.marketplace_categories.name}
                    </span>
                  )}
                  <span>
                    {new Date(app.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {expandedId === app.id ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>

          {expandedId === app.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border"
            >
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Contact</h4>
                  <p>{app.contact_name} ({app.contact_email})</p>
                </div>

                {app.website_url && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Website</h4>
                    <a href={app.website_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <Globe className="w-4 h-4" />
                      {app.website_url}
                    </a>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{app.description}</p>
                </div>

                {app.why_join && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Why they want to join</h4>
                    <p className="text-sm">{app.why_join}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-border">
                  {app.status === "pending" && (
                    <>
                      <Button 
                        variant="hero" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(app.id, "approved");
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        variant="heroOutline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(app.id, "rejected");
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(app.id);
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
            <AlertDialogTitle>Delete Application</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this application? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteApplication} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminApplicationsTab;
