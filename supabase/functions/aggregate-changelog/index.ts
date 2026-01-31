import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChangelogInput {
  title: string;
  description: string;
  changes: string[];
  type?: "feature" | "improvement" | "fix" | "announcement";
  icon?: string;
  highlight?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const contentType = req.headers.get("content-type") || "";
    let body: ChangelogInput | null = null;
    
    if (contentType.includes("application/json")) {
      try {
        body = await req.json();
      } catch {
        body = null;
      }
    }

    // Manual changelog entry creation
    if (body && body.title && body.changes) {
      const now = new Date();
      
      const { data: latestEntry } = await supabase
        .from("changelog_entries")
        .select("version")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let newVersion = "2.6.0";
      if (latestEntry?.version) {
        const parts = latestEntry.version.split(".").map(Number);
        parts[2] = (parts[2] || 0) + 1;
        newVersion = parts.join(".");
      }

      const { data, error } = await supabase
        .from("changelog_entries")
        .insert({
          version: newVersion,
          title: body.title,
          description: body.description,
          type: body.type || "improvement",
          changes: body.changes,
          icon: body.icon || "Zap",
          highlight: body.highlight || false,
          is_published: true,
          published_at: now.toISOString(),
          aggregation_start: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          aggregation_end: now.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, entry: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Automated 24-hour aggregation check
    const { data: lastEntry } = await supabase
      .from("changelog_entries")
      .select("aggregation_end, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastAggregation = lastEntry?.aggregation_end 
      ? new Date(lastEntry.aggregation_end) 
      : twentyFourHoursAgo;

    const timeSinceLast = Date.now() - lastAggregation.getTime();
    const hoursRemaining = Math.max(0, 24 - (timeSinceLast / (60 * 60 * 1000)));

    // Check if 24 hours have passed
    if (timeSinceLast < 24 * 60 * 60 * 1000) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Aggregation runs every 24 hours. Next run in ~${hoursRemaining.toFixed(1)} hours.`,
          lastAggregation: lastAggregation.toISOString(),
          nextRun: new Date(lastAggregation.getTime() + 24 * 60 * 60 * 1000).toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for recent beta feedback to aggregate
    const { data: recentFeedback } = await supabase
      .from("beta_feedback")
      .select("feedback_type, title, message, status")
      .gte("created_at", lastAggregation.toISOString())
      .order("created_at", { ascending: false });

    const resolvedBugs = recentFeedback?.filter(f => 
      (f.feedback_type === "bug_report" || f.feedback_type === "error_report") && 
      f.status === "resolved"
    ) || [];

    const implementedFeatures = recentFeedback?.filter(f => 
      f.feedback_type === "feature_request" && f.status === "resolved"
    ) || [];

    // If we have resolved items, auto-create a changelog entry
    if (resolvedBugs.length > 0 || implementedFeatures.length > 0) {
      const changes: string[] = [];
      
      implementedFeatures.forEach(f => {
        changes.push(`New: ${f.title || f.message.substring(0, 50)}`);
      });
      
      resolvedBugs.forEach(f => {
        changes.push(`Fixed: ${f.title || f.message.substring(0, 50)}`);
      });

      const { data: latestVersion } = await supabase
        .from("changelog_entries")
        .select("version")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let newVersion = "2.6.0";
      if (latestVersion?.version) {
        const parts = latestVersion.version.split(".").map(Number);
        parts[2] = (parts[2] || 0) + 1;
        newVersion = parts.join(".");
      }

      const now = new Date();
      const title = implementedFeatures.length > 0 
        ? "New Features & Bug Fixes" 
        : "Bug Fixes & Improvements";

      const { data: newEntry, error: insertError } = await supabase
        .from("changelog_entries")
        .insert({
          version: newVersion,
          title,
          description: `Auto-aggregated changelog covering ${changes.length} updates from the last 24 hours.`,
          type: implementedFeatures.length > 0 ? "feature" : "fix",
          changes,
          icon: implementedFeatures.length > 0 ? "Sparkles" : "CheckCircle2",
          highlight: implementedFeatures.length > 2,
          is_published: true,
          published_at: now.toISOString(),
          aggregation_start: lastAggregation.toISOString(),
          aggregation_end: now.toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Auto-aggregated ${changes.length} changes into changelog v${newVersion}`,
          entry: newEntry
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "No resolved feedback to aggregate. Manual entry available via POST.",
        lastAggregation: lastAggregation.toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Changelog aggregation error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});