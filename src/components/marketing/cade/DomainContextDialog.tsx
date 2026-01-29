import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Loader2, Building2, MapPin, Phone,
  FileText, Target, Award, MessageSquare, Sparkles,
  RefreshCw, Brain
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  DomainContext,
  TOTAL_FIELDS,
  calculateFilledCount,
} from "@/hooks/use-domain-context";

interface DomainContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: string;
  // Pass context state and callbacks from parent
  context: DomainContext | null;
  loading: boolean;
  saving: boolean;
  autoFilling: boolean;
  onUpdateContext: (updates: Partial<DomainContext>) => Promise<boolean>;
  onAutoFillContext: () => Promise<boolean>;
  filledCount: number;
  progressPercent: number;
}

// Group fields by category for better UX
const FIELD_GROUPS = {
  business: {
    label: "Business Info",
    icon: Building2,
    fields: [
      { key: "business_name", label: "Business Name", type: "text" },
      { key: "year_established", label: "Year Established", type: "number" },
      { key: "short_description", label: "Short Description", type: "textarea" },
      { key: "business_model", label: "Business Model", type: "text" },
      { key: "primary_keyword", label: "Primary Keyword", type: "text" },
      { key: "unique_selling_points", label: "Unique Selling Points", type: "textarea" },
      { key: "guarantees_warranties", label: "Guarantees & Warranties", type: "textarea" },
      { key: "pricing_approach", label: "Pricing Approach", type: "text" },
    ],
  },
  services: {
    label: "Services",
    icon: Target,
    fields: [
      { key: "services_offered", label: "Services Offered", type: "array" },
      { key: "services_not_offered", label: "Services NOT Offered", type: "array" },
      { key: "licenses_certifications", label: "Licenses & Certifications", type: "array" },
      { key: "brands_equipment", label: "Brands/Equipment Used", type: "array" },
      { key: "awards_associations", label: "Awards & Associations", type: "array" },
    ],
  },
  location: {
    label: "Location",
    icon: MapPin,
    fields: [
      { key: "primary_city", label: "Primary City", type: "text" },
      { key: "service_areas", label: "Service Areas", type: "array" },
      { key: "service_radius", label: "Service Radius", type: "text" },
      { key: "local_landmarks", label: "Local Landmarks", type: "array" },
      { key: "business_address", label: "Business Address", type: "text" },
    ],
  },
  contact: {
    label: "Contact",
    icon: Phone,
    fields: [
      { key: "phone_number", label: "Phone Number", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "business_hours", label: "Business Hours", type: "array" },
      { key: "social_links", label: "Social Links", type: "array" },
    ],
  },
  content: {
    label: "Content Style",
    icon: FileText,
    fields: [
      { key: "writing_tone", label: "Writing Tone", type: "text" },
      { key: "point_of_view", label: "Point of View", type: "text" },
      { key: "key_phrases", label: "Key Phrases to Use", type: "array" },
      { key: "phrases_to_avoid", label: "Phrases to Avoid", type: "array" },
      { key: "style_references", label: "Style References", type: "array" },
      { key: "authors", label: "Authors / Bylines", type: "array" },
    ],
  },
  topics: {
    label: "Topics & SEO",
    icon: MessageSquare,
    fields: [
      { key: "topics_to_cover", label: "Topics to Cover", type: "array" },
      { key: "topics_to_avoid", label: "Topics to Avoid", type: "array" },
      { key: "common_faqs", label: "Common FAQs", type: "array" },
      { key: "target_keywords", label: "Target Keywords", type: "array" },
      { key: "competitors", label: "Competitors", type: "text" },
      { key: "resource_sites", label: "Resource Sites", type: "array" },
    ],
  },
  compliance: {
    label: "Compliance",
    icon: Award,
    fields: [
      { key: "claims_to_avoid", label: "Claims to Avoid", type: "array" },
      { key: "required_disclaimers", label: "Required Disclaimers", type: "array" },
      { key: "trademark_guidelines", label: "Trademark Guidelines", type: "array" },
    ],
  },
};

type FieldGroupKey = keyof typeof FIELD_GROUPS;

export function DomainContextDialog({ 
  open, 
  onOpenChange, 
  domain,
  context,
  loading,
  saving,
  autoFilling,
  onUpdateContext,
  onAutoFillContext,
  filledCount,
  progressPercent,
}: DomainContextDialogProps) {

  const [formData, setFormData] = useState<Partial<DomainContext>>({});
  const [activeTab, setActiveTab] = useState<FieldGroupKey>("business");

  // Sync form with context whenever context changes (including after auto-fill)
  useEffect(() => {
    if (context) {
      setFormData(context);
    }
  }, [context]);

  // Handle recrawl
  const handleRecrawl = async () => {
    const success = await onAutoFillContext();
    if (success) {
      toast.success("Website re-analyzed! Fields have been updated.");
    } else {
      toast.error("Failed to re-analyze website.");
    }
  };

  const handleFieldChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleArrayChange = (key: string, value: string) => {
    // Split by comma or newline
    const arr = value
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, [key]: arr }));
  };

  const handleSave = async () => {
    const success = await onUpdateContext(formData);
    if (success) {
      toast.success("Domain context saved successfully!");
      onOpenChange(false);
    } else {
      toast.error("Failed to save domain context");
    }
  };

  const currentFilledCount = calculateFilledCount(formData as DomainContext);
  const currentProgress = Math.round((currentFilledCount / TOTAL_FIELDS) * 100);

  // If we already have cached/context data, don't block the UI with a full-screen loader
  // while we fetch the latest version from the backend.
  const showBlockingLoader = loading && currentFilledCount === 0;

  const renderField = (field: { key: string; label: string; type: string }) => {
    const value = formData[field.key as keyof DomainContext];

    if (field.type === "textarea") {
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
          </Label>
          <Textarea
            id={field.key}
            value={(value as string) || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className="min-h-[80px] bg-secondary/50 border-border resize-none"
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        </div>
      );
    }

    if (field.type === "array") {
      const arrValue = Array.isArray(value) ? value.join(", ") : "";
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
            <span className="text-xs text-muted-foreground ml-2">(comma or newline separated)</span>
          </Label>
          <Textarea
            id={field.key}
            value={arrValue}
            onChange={(e) => handleArrayChange(field.key, e.target.value)}
            className="min-h-[60px] bg-secondary/50 border-border resize-none"
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        </div>
      );
    }

    if (field.type === "number") {
      return (
        <div key={field.key} className="space-y-2">
          <Label htmlFor={field.key} className="text-sm font-medium">
            {field.label}
          </Label>
          <Input
            id={field.key}
            type="number"
            value={(value as number) || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value ? parseInt(e.target.value) : null)}
            className="bg-secondary/50 border-border"
            placeholder={`Enter ${field.label.toLowerCase()}...`}
          />
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-2">
        <Label htmlFor={field.key} className="text-sm font-medium">
          {field.label}
        </Label>
        <Input
          id={field.key}
          value={(value as string) || ""}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          className="bg-secondary/50 border-border"
          placeholder={`Enter ${field.label.toLowerCase()}...`}
        />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 bg-background border-border overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">Domain Context Setup</DialogTitle>
                <p className="text-sm text-muted-foreground">{domain}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Recrawl Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecrawl}
                disabled={autoFilling}
                className="text-cyan-500 border-cyan-500/30 hover:bg-cyan-500/10"
              >
                {autoFilling ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                )}
                Re-analyze
              </Button>

              {!showBlockingLoader && loading && (
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Syncing…</span>
                </div>
              )}
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{currentFilledCount}/{TOTAL_FIELDS}</span>
                  <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                    {currentProgress}%
                  </Badge>
                </div>
                <Progress value={currentProgress} className="w-32 h-2 mt-1" />
              </div>
            </div>
          </div>
        </DialogHeader>


        {/* Auto-filling Overlay */}
        <AnimatePresence>
          {autoFilling && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 animate-pulse" />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-500/30 animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <div className="absolute inset-4 rounded-full bg-background flex items-center justify-center">
                    <Brain className="w-10 h-10 text-cyan-400 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">Analyzing Website...</h3>
                <p className="text-muted-foreground">
                  Crawling {domain} and extracting business information
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {showBlockingLoader ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Tab Navigation - Sidebar */}
            <div className="w-48 border-r border-border bg-secondary/20 flex-shrink-0">
              <div className="py-4 space-y-1">
                {(Object.keys(FIELD_GROUPS) as FieldGroupKey[]).map((key) => {
                  const group = FIELD_GROUPS[key];
                  const Icon = group.icon;
                  const groupFilledCount = group.fields.filter((f) =>
                    formData[f.key as keyof DomainContext] !== undefined &&
                    formData[f.key as keyof DomainContext] !== null &&
                    formData[f.key as keyof DomainContext] !== "" &&
                    !(Array.isArray(formData[f.key as keyof DomainContext]) && (formData[f.key as keyof DomainContext] as unknown[]).length === 0)
                  ).length;

                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                        activeTab === key
                          ? "bg-primary/10 text-primary border-r-2 border-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{group.label}</span>
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {groupFilledCount}/{group.fields.length}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Content */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      {(() => {
                        const Icon = FIELD_GROUPS[activeTab].icon;
                        return <Icon className="w-5 h-5 text-primary" />;
                      })()}
                      <h3 className="text-lg font-semibold">{FIELD_GROUPS[activeTab].label}</h3>
                    </div>
                    <div className="grid gap-4">
                      {FIELD_GROUPS[activeTab].fields.map((field) => renderField(field))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-shrink-0 bg-secondary/30">
          <p className="text-xs text-muted-foreground">
            Complete all fields to optimize AI content generation
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-600 hover:to-cyan-600 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Context
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
