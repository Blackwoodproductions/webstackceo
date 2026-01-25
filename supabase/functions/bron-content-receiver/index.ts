import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * BRON Content Receiver Endpoint
 * 
 * This endpoint receives content data from external PHP systems or APIs.
 * It validates the incoming payload and processes it for distribution to connected platforms.
 * 
 * PHP Example:
 * ```php
 * <?php
 * $endpoint = 'https://qwnzenimkwtuaqnrcygb.supabase.co/functions/v1/bron-content-receiver';
 * 
 * $data = [
 *     'api_key' => 'bron_your_api_key_here',
 *     'content' => [
 *         'title' => 'Your Article Title',
 *         'body' => '<p>Your HTML content here...</p>',
 *         'excerpt' => 'Short summary of the article',
 *         'categories' => ['SEO', 'Marketing'],
 *         'tags' => ['tips', 'guide'],
 *         'featured_image' => 'https://example.com/image.jpg',
 *         'meta_title' => 'SEO Title | Brand',
 *         'meta_description' => 'Meta description for search engines',
 *         'slug' => 'your-article-slug',
 *         'status' => 'publish', // draft, publish, scheduled
 *         'scheduled_at' => '2024-01-15T10:00:00Z' // Only if status is scheduled
 *     ],
 *     'target_platforms' => ['wordpress', 'shopify'], // Optional: specific platforms
 *     'options' => [
 *         'notify_on_publish' => true,
 *         'auto_social_share' => true
 *     ]
 * ];
 * 
 * $ch = curl_init($endpoint);
 * curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
 * curl_setopt($ch, CURLOPT_POST, true);
 * curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
 * curl_setopt($ch, CURLOPT_HTTPHEADER, [
 *     'Content-Type: application/json',
 * ]);
 * 
 * $response = curl_exec($ch);
 * $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
 * curl_close($ch);
 * 
 * if ($httpCode === 200) {
 *     $result = json_decode($response, true);
 *     echo "Content ID: " . $result['content_id'];
 * } else {
 *     echo "Error: " . $response;
 * }
 * ?>
 * ```
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ContentPayload {
  api_key: string;
  content: {
    title: string;
    body: string;
    excerpt?: string;
    categories?: string[];
    tags?: string[];
    featured_image?: string;
    meta_title?: string;
    meta_description?: string;
    slug?: string;
    status?: "draft" | "publish" | "scheduled";
    scheduled_at?: string;
  };
  target_platforms?: string[];
  options?: {
    notify_on_publish?: boolean;
    auto_social_share?: boolean;
    skip_validation?: boolean;
  };
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Validate the incoming content payload
function validatePayload(payload: ContentPayload): ValidationResult {
  const errors: string[] = [];

  if (!payload.api_key) {
    errors.push("api_key is required");
  } else if (!payload.api_key.startsWith("bron_")) {
    errors.push("Invalid api_key format");
  }

  if (!payload.content) {
    errors.push("content object is required");
  } else {
    if (!payload.content.title || payload.content.title.trim().length === 0) {
      errors.push("content.title is required");
    }
    if (!payload.content.body || payload.content.body.trim().length === 0) {
      errors.push("content.body is required");
    }
    if (payload.content.status === "scheduled" && !payload.content.scheduled_at) {
      errors.push("content.scheduled_at is required when status is 'scheduled'");
    }
    if (payload.content.scheduled_at) {
      const scheduledDate = new Date(payload.content.scheduled_at);
      if (isNaN(scheduledDate.getTime())) {
        errors.push("content.scheduled_at must be a valid ISO 8601 date string");
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Generate a unique content ID
function generateContentId(): string {
  return `cnt_${crypto.randomUUID().replace(/-/g, "").substring(0, 16)}`;
}

// Process and queue the content for distribution
async function processContent(payload: ContentPayload): Promise<{
  content_id: string;
  queued_platforms: string[];
  estimated_publish_time: string;
}> {
  const contentId = generateContentId();
  const targetPlatforms = payload.target_platforms || ["all"];
  
  // Calculate estimated publish time
  let estimatedPublishTime: Date;
  if (payload.content.status === "scheduled" && payload.content.scheduled_at) {
    estimatedPublishTime = new Date(payload.content.scheduled_at);
  } else if (payload.content.status === "draft") {
    estimatedPublishTime = new Date(0); // No publish time for drafts
  } else {
    // Publish immediately - allow 30 seconds for processing
    estimatedPublishTime = new Date(Date.now() + 30000);
  }

  console.log(`Processing content: ${contentId}`);
  console.log(`Title: ${payload.content.title}`);
  console.log(`Status: ${payload.content.status || "publish"}`);
  console.log(`Target platforms: ${targetPlatforms.join(", ")}`);

  // Here you would:
  // 1. Store the content in your database
  // 2. Queue it for distribution to connected platforms
  // 3. Trigger any webhooks or notifications

  return {
    content_id: contentId,
    queued_platforms: targetPlatforms,
    estimated_publish_time: estimatedPublishTime.toISOString(),
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const payload = await req.json() as ContentPayload;

    // Validate the payload
    const validation = validatePayload(payload);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Validation failed",
          details: validation.errors,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process the content
    const result = await processContent(payload);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Content received and queued for processing",
        ...result,
        received_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("BRON Content Receiver error:", error);
    
    if (error instanceof SyntaxError) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
