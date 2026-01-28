import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScreenshotRequest {
  action: "capture" | "get";
  domain: string;
  force?: boolean; // Force recapture even if exists
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const body: ScreenshotRequest = await req.json();
    const { action, domain, force } = body;

    if (!domain) {
      return new Response(
        JSON.stringify({ error: "Domain is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const screenshotPath = `bron-screenshots/${cleanDomain.replace(/\./g, "_")}.png`;

    if (action === "get") {
      // Check if screenshot exists in storage
      const { data: existingFile } = await supabase.storage
        .from("website-screenshots")
        .getPublicUrl(screenshotPath);

      // Verify the file actually exists by checking if it returns a valid response
      const { data: fileList } = await supabase.storage
        .from("website-screenshots")
        .list("bron-screenshots", {
          search: cleanDomain.replace(/\./g, "_"),
        });

      const fileExists = fileList?.some(f => f.name === `${cleanDomain.replace(/\./g, "_")}.png`);

      if (fileExists && existingFile?.publicUrl) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            url: existingFile.publicUrl,
            cached: true 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, message: "Screenshot not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "capture") {
      // Check if we already have a recent screenshot (within 24 hours)
      if (!force) {
        const { data: fileList } = await supabase.storage
          .from("website-screenshots")
          .list("bron-screenshots", {
            search: cleanDomain.replace(/\./g, "_"),
          });

        const existingFile = fileList?.find(f => f.name === `${cleanDomain.replace(/\./g, "_")}.png`);
        
        if (existingFile) {
          const fileDate = new Date(existingFile.updated_at || existingFile.created_at);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          
          if (fileDate > dayAgo) {
            const { data: urlData } = await supabase.storage
              .from("website-screenshots")
              .getPublicUrl(screenshotPath);

            return new Response(
              JSON.stringify({ 
                success: true, 
                url: urlData.publicUrl,
                cached: true,
                message: "Using cached screenshot (less than 24h old)" 
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }

      // Use multiple screenshot services with fallback
      const screenshotServices = [
        `https://api.microlink.io/?url=https://${cleanDomain}&screenshot=true&meta=false&embed=screenshot.url`,
        `https://image.thum.io/get/width/800/crop/600/https://${cleanDomain}`,
        `https://s.wordpress.com/mshots/v1/https%3A%2F%2F${cleanDomain}?w=800&h=600`,
      ];

      let imageData: ArrayBuffer | null = null;
      let usedService = "";

      for (const serviceUrl of screenshotServices) {
        try {
          console.log(`Trying screenshot service: ${serviceUrl}`);
          const response = await fetch(serviceUrl, {
            headers: { "User-Agent": "WebstackCEO Screenshot Bot/1.0" }
          });

          if (response.ok) {
            const contentType = response.headers.get("content-type") || "";
            
            // Microlink returns JSON with the screenshot URL
            if (contentType.includes("application/json")) {
              const json = await response.json();
              const screenshotUrl = json?.data?.screenshot?.url || json?.screenshot?.url;
              if (screenshotUrl) {
                const imgResponse = await fetch(screenshotUrl);
                if (imgResponse.ok) {
                  imageData = await imgResponse.arrayBuffer();
                  usedService = "microlink";
                  break;
                }
              }
            } else if (contentType.includes("image")) {
              imageData = await response.arrayBuffer();
              usedService = serviceUrl.includes("thum.io") ? "thum.io" : "wordpress";
              break;
            }
          }
        } catch (e) {
          console.log(`Service failed: ${serviceUrl}`, e);
          continue;
        }
      }

      if (!imageData) {
        // Last resort: use AI to describe what we'd capture (placeholder)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "All screenshot services failed",
            fallbackUrl: `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=256`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("website-screenshots")
        .upload(screenshotPath, imageData, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return new Response(
          JSON.stringify({ error: "Failed to upload screenshot", details: uploadError }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: urlData } = await supabase.storage
        .from("website-screenshots")
        .getPublicUrl(screenshotPath);

      console.log(`Screenshot captured for ${cleanDomain} using ${usedService}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          url: urlData.publicUrl,
          service: usedService,
          cached: false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Screenshot capture error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
