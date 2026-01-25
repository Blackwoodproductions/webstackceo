import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BusinessHours {
  day: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface CreateLocationRequest {
  accessToken: string;
  accountId: string;
  businessName: string;
  primaryCategory: string;
  phoneNumber?: string;
  websiteUri?: string;
  address: {
    streetAddress: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  description?: string;
  businessHours?: BusinessHours[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CreateLocationRequest = await req.json();
    
    const { 
      accessToken, 
      accountId, 
      businessName, 
      primaryCategory, 
      phoneNumber, 
      websiteUri, 
      address,
      description,
      businessHours 
    } = body;

    if (!accessToken || !accountId || !businessName || !primaryCategory || !address) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: accessToken, accountId, businessName, primaryCategory, address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Creating GMB location for: ${businessName}`);

    // Build the location object for Google Business Profile API
    const locationData: Record<string, unknown> = {
      title: businessName,
      storefrontAddress: {
        addressLines: [address.streetAddress],
        locality: address.city,
        administrativeArea: address.state,
        postalCode: address.postalCode,
        regionCode: address.country || "US",
      },
      primaryCategory: {
        displayName: primaryCategory,
      },
    };

    // Add optional fields
    if (phoneNumber) {
      locationData.primaryPhone = phoneNumber;
    }

    if (websiteUri) {
      locationData.websiteUri = websiteUri.startsWith('http') ? websiteUri : `https://${websiteUri}`;
    }

    if (description) {
      locationData.profile = {
        description: description,
      };
    }

    // Add business hours if provided
    if (businessHours && businessHours.length > 0) {
      const periods = businessHours
        .filter(h => !h.isClosed)
        .map(h => ({
          openDay: h.day.toUpperCase(),
          openTime: { hours: parseInt(h.openTime.split(':')[0]), minutes: parseInt(h.openTime.split(':')[1] || '0') },
          closeDay: h.day.toUpperCase(),
          closeTime: { hours: parseInt(h.closeTime.split(':')[0]), minutes: parseInt(h.closeTime.split(':')[1] || '0') },
        }));
      
      if (periods.length > 0) {
        locationData.regularHours = { periods };
      }
    }

    // Create the location via Google Business Profile API
    // Note: The API endpoint for creating locations
    const createUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations?validateOnly=false`;
    
    console.log('Creating location at:', createUrl);
    console.log('Location data:', JSON.stringify(locationData, null, 2));

    const createResponse = await fetch(createUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(locationData),
    });

    const responseText = await createResponse.text();
    console.log('GMB API Response Status:', createResponse.status);
    console.log('GMB API Response:', responseText);

    if (!createResponse.ok) {
      let errorMessage = "Failed to create business location";
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error?.message || errorData.error?.status || errorMessage;
        
        // Provide more helpful error messages
        if (errorMessage.includes("PERMISSION_DENIED")) {
          errorMessage = "Permission denied. Please ensure your Google account has access to create business locations.";
        } else if (errorMessage.includes("INVALID_ARGUMENT")) {
          errorMessage = "Invalid business information. Please check all fields and try again.";
        } else if (errorMessage.includes("ALREADY_EXISTS")) {
          errorMessage = "A business with this name and address already exists. You may need to claim it instead.";
        }
      } catch {
        // Keep default error message
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage, details: responseText }),
        { status: createResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const locationResult = JSON.parse(responseText);
    
    console.log('Location created successfully:', locationResult.name);

    return new Response(
      JSON.stringify({
        success: true,
        location: locationResult,
        message: "Business location created successfully. Google will require verification before your listing goes live.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("GMB create location error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
