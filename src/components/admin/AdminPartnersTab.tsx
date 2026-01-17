import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, Edit, Trash2, Star, Award, ExternalLink,
  Search, ChevronDown, ChevronUp, Save, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type Partner = Database["public"]["Tables"]["marketplace_partners"]["Row"] & {
  marketplace_categories?: { name: string } | null;
};

type Category = Database["public"]["Tables"]["marketplace_categories"]["Row"];

interface AdminPartnersTabProps {
  onUpdate: () => void;
}

const AdminPartnersTab = ({ onUpdate }: AdminPartnersTabProps) => {
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    company_name: "",
    description: "",
    website_url: "",
    contact_email: "",
    logo_url: "",
    category_id: "",
    is_sponsored: false,
    rating: 0,
    ranking_score: 0,
    status: "approved" as const,
  });

  useEffect(() => {
    fetchPartners();
    fetchCategories();
  }, []);

  const fetchPartners = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("marketplace_partners")
      .select(`
        *,
        marketplace_categories (name)
      `)
      .order("is_sponsored", { ascending: false })
      .order("ranking_score", { ascending: false });

    if (!error && data) {
      setPartners(data);
    }
    setIsLoading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("marketplace_categories")
      .select("*")
      .order("display_order");

    if (!error && data) {
      setCategories(data);
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: "",
      description: "",
      website_url: "",
      contact_email: "",
      logo_url: "",
      category_id: "",
      is_sponsored: false,
      rating: 0,
      ranking_score: 0,
      status: "approved",
    });
  };

  const openEditDialog = (partner: Partner) => {
    setFormData({
      company_name: partner.company_name,
      description: partner.description,
      website_url: partner.website_url || "",
      contact_email: partner.contact_email,
      logo_url: partner.logo_url || "",
      category_id: partner.category_id || "",
      is_sponsored: partner.is_sponsored,
      rating: Number(partner.rating),
      ranking_score: partner.ranking_score,
      status: "approved",
    });
    setEditingPartner(partner);
  };

  const handleSave = async () => {
    const slug = formData.company_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const partnerData = {
      company_name: formData.company_name,
      slug: editingPartner ? editingPartner.slug : `${slug}-${Date.now()}`,
      description: formData.description,
      website_url: formData.website_url || null,
      contact_email: formData.contact_email,
      logo_url: formData.logo_url || null,
      category_id: formData.category_id || null,
      is_sponsored: formData.is_sponsored,
      rating: formData.rating,
      ranking_score: formData.ranking_score,
      status: formData.status,
    };

    if (editingPartner) {
      const { error } = await supabase
        .from("marketplace_partners")
        .update(partnerData)
        .eq("id", editingPartner.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update partner.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Partner Updated",
        description: "The partner has been updated successfully.",
      });
    } else {
      const { error } = await supabase
        .from("marketplace_partners")
        .insert(partnerData);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create partner.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Partner Created",
        description: "The partner has been added to the marketplace.",
      });
    }

    setEditingPartner(null);
    setIsAddDialogOpen(false);
    resetForm();
    fetchPartners();
    onUpdate();
  };

  const deletePartner = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("marketplace_partners")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete partner.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Partner Deleted",
      description: "The partner has been removed from the marketplace.",
    });

    setDeleteId(null);
    fetchPartners();
    onUpdate();
  };

  const filteredPartners = partners.filter(
    (p) =>
      p.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const PartnerForm = () => (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Company Name *</Label>
          <Input
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="Company name"
          />
        </div>
        <div>
          <Label>Contact Email *</Label>
          <Input
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            placeholder="email@example.com"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Website URL</Label>
          <Input
            value={formData.website_url}
            onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
            placeholder="https://example.com"
          />
        </div>
        <div>
          <Label>Logo URL</Label>
          <Input
            value={formData.logo_url}
            onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
            placeholder="https://example.com/logo.png"
          />
        </div>
      </div>

      <div>
        <Label>Category</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => setFormData({ ...formData, category_id: value })}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border">
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Description *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the partner's services..."
          className="min-h-[100px]"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>Rating (0-5)</Label>
          <Input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label>Ranking Score</Label>
          <Input
            type="number"
            min="0"
            value={formData.ranking_score}
            onChange={(e) => setFormData({ ...formData, ranking_score: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch
            id="sponsored"
            checked={formData.is_sponsored}
            onCheckedChange={(checked) => setFormData({ ...formData, is_sponsored: checked })}
          />
          <Label htmlFor="sponsored" className="flex items-center gap-1">
            <Award className="w-4 h-4 text-primary" />
            Sponsored
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="heroOutline"
          onClick={() => {
            setEditingPartner(null);
            setIsAddDialogOpen(false);
            resetForm();
          }}
        >
          Cancel
        </Button>
        <Button variant="hero" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          {editingPartner ? "Update Partner" : "Add Partner"}
        </Button>
      </div>
    </div>
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search partners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="hero" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Partner
        </Button>
      </div>

      {/* Partners List */}
      {filteredPartners.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2">No Partners Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Try a different search term" : "Add your first partner to get started"}
          </p>
          <Button variant="hero" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Partner
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPartners.map((partner) => (
            <motion.div
              key={partner.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-4 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-500/20 flex items-center justify-center shrink-0">
                {partner.logo_url ? (
                  <img src={partner.logo_url} alt="" className="w-8 h-8 object-contain rounded" />
                ) : (
                  <span className="text-lg font-bold text-primary">
                    {partner.company_name.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold truncate">{partner.company_name}</h3>
                  {partner.is_sponsored && (
                    <Badge className="bg-gradient-to-r from-cyan-400 to-violet-500 text-white">
                      <Award className="w-3 h-3 mr-1" />
                      Sponsored
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {partner.marketplace_categories && (
                    <span>{partner.marketplace_categories.name}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    {Number(partner.rating).toFixed(1)}
                  </span>
                  <span>Score: {partner.ranking_score}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {partner.website_url && (
                  <Button variant="ghost" size="icon" asChild>
                    <a href={partner.website_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => openEditDialog(partner)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteId(partner.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || !!editingPartner} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingPartner(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? "Edit Partner" : "Add New Partner"}
            </DialogTitle>
            <DialogDescription>
              {editingPartner 
                ? "Update the partner's information below." 
                : "Fill in the details to add a new partner to the marketplace."}
            </DialogDescription>
          </DialogHeader>
          <PartnerForm />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Partner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this partner? This will remove them from the marketplace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deletePartner} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPartnersTab;
