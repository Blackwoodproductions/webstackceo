import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GmbApiRequest {
  accessToken: string;
  action: string;
  locationName?: string;
  // Update location fields
  updateData?: {
    title?: string;
    websiteUri?: string;
    phoneNumber?: string;
    description?: string;
    regularHours?: Array<{
      day: string;
      openTime: string;
      closeTime: string;
      isClosed: boolean;
    }>;
  };
  updateMask?: string;
  // Reply to review
  reviewName?: string;
  replyComment?: string;
  // Create post
  postData?: {
    summary?: string;
    callToAction?: {
      actionType: string;
      url?: string;
    };
    event?: {
      title: string;
      schedule: {
        startDate: { year: number; month: number; day: number };
        endDate: { year: number; month: number; day: number };
        startTime?: { hours: number; minutes: number };
        endTime?: { hours: number; minutes: number };
      };
    };
    offer?: {
      couponCode?: string;
      redeemOnlineUrl?: string;
      termsConditions?: string;
    };
    topicType?: string;
    mediaItems?: Array<{
      sourceUrl: string;
      mediaFormat: string;
    }>;
  };
  // Media/photos
  mediaData?: {
    sourceUrl: string;
    mediaFormat?: string;
    category?: string;
    description?: string;
  };
  mediaName?: string;
  // Categories search
  categoryQuery?: string;
  regionCode?: string;
}

// Helper to build API URLs
const GMB_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
const GMB_POSTS_BASE = "https://mybusiness.googleapis.com/v4";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: GmbApiRequest = await req.json();
    const { accessToken, action } = body;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Missing accessToken" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[gmb-api] Action: ${action}`);

    switch (action) {
      // ===== READ OPERATIONS =====
      
      case "getLocation": {
        const { locationName } = body;
        if (!locationName) {
          return errorResponse("Missing locationName");
        }
        
        const res = await fetch(
          `${GMB_BASE}/${locationName}?readMask=name,title,websiteUri,storefrontAddress,phoneNumbers,regularHours,categories,metadata,profile`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        return handleApiResponse(res, "getLocation");
      }

      case "getReviews": {
        const { locationName } = body;
        if (!locationName) {
          return errorResponse("Missing locationName");
        }
        
        // Use v4 API for reviews
        const res = await fetch(
          `${GMB_POSTS_BASE}/${locationName}/reviews?pageSize=50`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        return handleApiResponse(res, "getReviews");
      }

      case "getPosts": {
        const { locationName } = body;
        if (!locationName) {
          return errorResponse("Missing locationName");
        }
        
        const res = await fetch(
          `${GMB_POSTS_BASE}/${locationName}/localPosts?pageSize=20`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        return handleApiResponse(res, "getPosts");
      }

      case "getMedia": {
        const { locationName } = body;
        if (!locationName) {
          return errorResponse("Missing locationName");
        }
        
        const res = await fetch(
          `${GMB_POSTS_BASE}/${locationName}/media?pageSize=50`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        return handleApiResponse(res, "getMedia");
      }

      case "searchCategories": {
        const { categoryQuery, regionCode = "US" } = body;
        if (!categoryQuery) {
          return errorResponse("Missing categoryQuery");
        }
        
        const res = await fetch(
          `${GMB_BASE}/categories:search?query=${encodeURIComponent(categoryQuery)}&regionCode=${regionCode}&languageCode=en`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        return handleApiResponse(res, "searchCategories");
      }

      // ===== WRITE OPERATIONS =====

      case "updateLocation": {
        const { locationName, updateData, updateMask } = body;
        if (!locationName || !updateData) {
          return errorResponse("Missing locationName or updateData");
        }
        
        // Build the update payload
        const locationPatch: Record<string, unknown> = {};
        const updateFields: string[] = [];
        
        if (updateData.title !== undefined) {
          locationPatch.title = updateData.title;
          updateFields.push("title");
        }
        
        if (updateData.websiteUri !== undefined) {
          locationPatch.websiteUri = updateData.websiteUri.startsWith('http') 
            ? updateData.websiteUri 
            : `https://${updateData.websiteUri}`;
          updateFields.push("websiteUri");
        }
        
        if (updateData.phoneNumber !== undefined) {
          locationPatch.phoneNumbers = { primaryPhone: updateData.phoneNumber };
          updateFields.push("phoneNumbers.primaryPhone");
        }
        
        if (updateData.description !== undefined) {
          locationPatch.profile = { description: updateData.description };
          updateFields.push("profile.description");
        }
        
        if (updateData.regularHours && updateData.regularHours.length > 0) {
          const periods = updateData.regularHours
            .filter(h => !h.isClosed)
            .map(h => ({
              openDay: h.day.toUpperCase(),
              openTime: parseTime(h.openTime),
              closeDay: h.day.toUpperCase(),
              closeTime: parseTime(h.closeTime),
            }));
          
          locationPatch.regularHours = { periods };
          updateFields.push("regularHours");
        }
        
        const mask = updateMask || updateFields.join(",");
        
        console.log(`[gmb-api] Updating location with mask: ${mask}`);
        console.log(`[gmb-api] Update payload:`, JSON.stringify(locationPatch));
        
        const res = await fetch(
          `${GMB_BASE}/${locationName}?updateMask=${encodeURIComponent(mask)}`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(locationPatch),
          }
        );
        
        return handleApiResponse(res, "updateLocation");
      }

      case "replyToReview": {
        const { reviewName, replyComment } = body;
        if (!reviewName || !replyComment) {
          return errorResponse("Missing reviewName or replyComment");
        }
        
        const res = await fetch(
          `${GMB_POSTS_BASE}/${reviewName}/reply`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ comment: replyComment }),
          }
        );
        
        return handleApiResponse(res, "replyToReview");
      }

      case "deleteReviewReply": {
        const { reviewName } = body;
        if (!reviewName) {
          return errorResponse("Missing reviewName");
        }
        
        const res = await fetch(
          `${GMB_POSTS_BASE}/${reviewName}/reply`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        
        return handleApiResponse(res, "deleteReviewReply");
      }

      case "createPost": {
        const { locationName, postData } = body;
        if (!locationName || !postData) {
          return errorResponse("Missing locationName or postData");
        }
        
        // Build the local post payload
        const localPost: Record<string, unknown> = {
          languageCode: "en",
          topicType: postData.topicType || "STANDARD",
        };
        
        if (postData.summary) {
          localPost.summary = postData.summary;
        }
        
        if (postData.callToAction) {
          localPost.callToAction = postData.callToAction;
        }
        
        if (postData.event) {
          localPost.event = postData.event;
        }
        
        if (postData.offer) {
          localPost.offer = postData.offer;
        }
        
        if (postData.mediaItems && postData.mediaItems.length > 0) {
          localPost.media = postData.mediaItems;
        }
        
        console.log(`[gmb-api] Creating post:`, JSON.stringify(localPost));
        
        const res = await fetch(
          `${GMB_POSTS_BASE}/${locationName}/localPosts`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(localPost),
          }
        );
        
        return handleApiResponse(res, "createPost");
      }

      case "deletePost": {
        const { locationName } = body;
        if (!locationName) {
          return errorResponse("Missing post name");
        }
        
        const res = await fetch(
          `${GMB_POSTS_BASE}/${locationName}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        
        return handleApiResponse(res, "deletePost");
      }

      case "uploadMedia": {
        const { locationName, mediaData } = body;
        if (!locationName || !mediaData?.sourceUrl) {
          return errorResponse("Missing locationName or mediaData.sourceUrl");
        }
        
        const media: Record<string, unknown> = {
          mediaFormat: mediaData.mediaFormat || "PHOTO",
          sourceUrl: mediaData.sourceUrl,
        };
        
        if (mediaData.category) {
          media.locationAssociation = { category: mediaData.category };
        }
        
        if (mediaData.description) {
          media.description = mediaData.description;
        }
        
        console.log(`[gmb-api] Uploading media:`, JSON.stringify(media));
        
        const res = await fetch(
          `${GMB_POSTS_BASE}/${locationName}/media`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(media),
          }
        );
        
        return handleApiResponse(res, "uploadMedia");
      }

      case "deleteMedia": {
        const { mediaName } = body;
        if (!mediaName) {
          return errorResponse("Missing mediaName");
        }
        
        const res = await fetch(
          `${GMB_POSTS_BASE}/${mediaName}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        
        return handleApiResponse(res, "deleteMedia");
      }

      default:
        return errorResponse(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("[gmb-api] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper functions
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}

function errorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleApiResponse(res: Response, action: string) {
  const responseText = await res.text();
  console.log(`[gmb-api] ${action} status: ${res.status}`);
  
  if (!res.ok) {
    console.error(`[gmb-api] ${action} error:`, responseText.slice(0, 500));
    
    let errorMessage = `API request failed (${res.status})`;
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error?.message || errorData.error?.status || errorMessage;
      
      // Provide user-friendly error messages
      if (res.status === 401) {
        errorMessage = "Authentication expired. Please reconnect your Google account.";
      } else if (res.status === 403) {
        if (responseText.includes("API has not been used")) {
          errorMessage = "Google Business Profile API is not enabled. Please enable it in Google Cloud Console.";
        } else {
          errorMessage = "Permission denied. You may not have access to this business listing.";
        }
      } else if (res.status === 429) {
        errorMessage = "API quota exceeded. Please wait a moment and try again.";
      } else if (res.status === 404) {
        errorMessage = "Resource not found. The listing or item may have been deleted.";
      }
    } catch {
      // Keep default error message
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        status: res.status,
        details: responseText.slice(0, 300),
        isQuotaError: res.status === 429,
        isAuthError: res.status === 401,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  // Try to parse as JSON, otherwise return as text
  try {
    const data = responseText ? JSON.parse(responseText) : { success: true };
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ success: true, data: responseText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
