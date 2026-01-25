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

    // This function can be called in two ways:
    // 1. Scheduled cron job - aggregates recent changes automatically
    // 2. Manual trigger with body - creates a specific changelog entry

    const contentType = req.headers.get("content-type") || "";
    let body: ChangelogInput | null = null;
    
    if (contentType.includes("application/json")) {
      try {
        body = await req.json();
      } catch {
        body = null;
      }
    }

    if (body && body.title && body.changes) {
      // Manual changelog entry
      const now = new Date();
      
      // Get the latest version number
      const { data: latestEntry } = await supabase
        .from("changelog_entries")
        .select("version")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Parse and increment version
      let newVersion = "2.6.0";
      if (latestEntry?.version) {
        const parts = latestEntry.version.split(".").map(Number);
        parts[2] = (parts[2] || 0) + 1; // Increment patch version
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
          aggregation_start: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
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

    // Scheduled aggregation mode
    // Check last aggregation time
    const { data: lastEntry } = await supabase
      .from("changelog_entries")
      .select("aggregation_end")
      .order("aggregation_end", { ascending: false })
      .limit(1)
      .single();

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const lastAggregation = lastEntry?.aggregation_end 
      ? new Date(lastEntry.aggregation_end) 
      : sixHoursAgo;

    // If less than 6 hours since last aggregation, skip
    if (Date.now() - lastAggregation.getTime() < 6 * 60 * 60 * 1000) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Less than 6 hours since last aggregation", 
          nextRun: new Date(lastAggregation.getTime() + 6 * 60 * 60 * 1000).toISOString() 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For now, return a message that manual aggregation is needed
    // In production, this would integrate with GitHub API to fetch commits
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Ready for aggregation. Use POST with changelog data to create entry.",
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