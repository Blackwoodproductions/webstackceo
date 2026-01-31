import { Building2, MapPin, User, Mail, Phone, Globe, Sparkles, RefreshCw, Linkedin, Server } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { VisitorEnrichment, triggerEnrichment } from "@/hooks/use-visitor-enrichments";
import { useState } from "react";
import { toast } from "sonner";

interface VisitorEnrichmentCardProps {
  enrichment: VisitorEnrichment | null;
  sessionId: string;
  domain: string;
  isLoading?: boolean;
  visitorEmail?: string;
}

export const VisitorEnrichmentCard = ({
  enrichment,
  sessionId,
  domain,
  isLoading,
  visitorEmail,
}: VisitorEnrichmentCardProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await triggerEnrichment(sessionId, domain, visitorEmail);
      toast.success("Enrichment triggered - data will update shortly");
    } catch (error) {
      toast.error("Failed to trigger enrichment");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  const hasCompanyData = enrichment?.company_name || enrichment?.ip_org;
  const hasContactData = enrichment?.contact_name || enrichment?.contact_email;
  const hasLocationData = enrichment?.ip_city || enrichment?.ip_country;
  const confidence = enrichment?.enrichment_confidence || 0;

  const confidenceColor =
    confidence >= 0.8
      ? "text-green-500"
      : confidence >= 0.5
        ? "text-yellow-500"
        : "text-muted-foreground";

  const confidenceLabel =
    confidence >= 0.8
      ? "High confidence"
      : confidence >= 0.5
        ? "Medium confidence"
        : "Low confidence";

  return (
    <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Visitor Intelligence
        </CardTitle>
        <div className="flex items-center gap-2">
          {enrichment && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className={`text-xs ${confidenceColor}`}>
                    {Math.round(confidence * 100)}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{confidenceLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    Source: {enrichment.enrichment_source || "unknown"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Company Section */}
        {hasCompanyData && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <Building2 className="h-3 w-3" />
              Company
            </div>
            <div className="space-y-1">
              {(enrichment?.company_name || enrichment?.ip_org) && (
                <p className="text-sm font-medium">
                  {enrichment.company_name || enrichment.ip_org}
                </p>
              )}
              {enrichment?.company_industry && (
                <p className="text-xs text-muted-foreground">{enrichment.company_industry}</p>
              )}
              {enrichment?.company_size && (
                <Badge variant="secondary" className="text-xs">
                  {enrichment.company_size} employees
                </Badge>
              )}
              {enrichment?.company_website && (
                <a
                  href={enrichment.company_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Globe className="h-3 w-3" />
                  {enrichment.company_domain || enrichment.company_website}
                </a>
              )}
              {enrichment?.company_linkedin && (
                <a
                  href={enrichment.company_linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Linkedin className="h-3 w-3" />
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        )}

        {/* Contact Section */}
        {hasContactData && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <User className="h-3 w-3" />
              Contact
            </div>
            <div className="space-y-1">
              {enrichment?.contact_name && (
                <p className="text-sm font-medium">{enrichment.contact_name}</p>
              )}
              {enrichment?.contact_title && (
                <p className="text-xs text-muted-foreground">{enrichment.contact_title}</p>
              )}
              {enrichment?.contact_email && (
                <a
                  href={`mailto:${enrichment.contact_email}`}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  {enrichment.contact_email}
                </a>
              )}
              {enrichment?.contact_phone && (
                <a
                  href={`tel:${enrichment.contact_phone}`}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  {enrichment.contact_phone}
                </a>
              )}
              {enrichment?.contact_linkedin && (
                <a
                  href={enrichment.contact_linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Linkedin className="h-3 w-3" />
                  LinkedIn Profile
                </a>
              )}
              {enrichment?.match_type && (
                <Badge variant="outline" className="text-xs">
                  Matched by {enrichment.match_type}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Location Section */}
        {hasLocationData && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <MapPin className="h-3 w-3" />
              Location
            </div>
            <div className="space-y-1">
              <p className="text-sm">
                {[enrichment?.ip_city, enrichment?.ip_region, enrichment?.ip_country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {enrichment?.ip_timezone && (
                <p className="text-xs text-muted-foreground">
                  Timezone: {enrichment.ip_timezone}
                </p>
              )}
              {enrichment?.ip_isp && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Server className="h-3 w-3" />
                  {enrichment.ip_isp}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tech Stack */}
        {enrichment?.tech_stack && enrichment.tech_stack.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
              <Server className="h-3 w-3" />
              Tech Stack
            </div>
            <div className="flex flex-wrap gap-1">
              {enrichment.tech_stack.map((tech, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* No data state */}
        {!hasCompanyData && !hasContactData && !hasLocationData && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No enrichment data available yet
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3 w-3 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Enrich Now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VisitorEnrichmentCard;
