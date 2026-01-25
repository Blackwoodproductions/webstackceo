import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  place_id: string;
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Places API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, input, placeId, sessionToken } = await req.json();
    console.log(`Places API request: action=${action}, input="${input?.substring(0, 20)}..."`);

    if (action === 'autocomplete') {
      // Autocomplete predictions for address input
      if (!input || input.length < 3) {
        return new Response(
          JSON.stringify({ predictions: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const params = new URLSearchParams({
        input,
        key: apiKey,
        types: 'address',
        components: 'country:us', // Limit to US addresses
      });
      
      if (sessionToken) {
        params.append('sessiontoken', sessionToken);
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`
      );

      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Places autocomplete error:', data.status, data.error_message);
        return new Response(
          JSON.stringify({ error: data.error_message || data.status, predictions: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const predictions: PlacePrediction[] = (data.predictions || []).map((p: any) => ({
        place_id: p.place_id,
        description: p.description,
        structured_formatting: p.structured_formatting,
      }));

      console.log(`Returning ${predictions.length} predictions`);
      return new Response(
        JSON.stringify({ predictions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'details') {
      // Get place details for a selected prediction
      if (!placeId) {
        return new Response(
          JSON.stringify({ error: 'placeId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const params = new URLSearchParams({
        place_id: placeId,
        key: apiKey,
        fields: 'formatted_address,address_components,geometry',
      });
      
      if (sessionToken) {
        params.append('sessiontoken', sessionToken);
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?${params}`
      );

      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('Places details error:', data.status, data.error_message);
        return new Response(
          JSON.stringify({ error: data.error_message || data.status }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = data.result;
      
      // Parse address components
      const getComponent = (types: string[]) => {
        const component = result.address_components?.find((c: any) => 
          types.some(t => c.types.includes(t))
        );
        return component?.short_name || component?.long_name || '';
      };

      const parsed = {
        streetNumber: getComponent(['street_number']),
        streetName: getComponent(['route']),
        city: getComponent(['locality', 'sublocality', 'administrative_area_level_3']),
        state: getComponent(['administrative_area_level_1']),
        postalCode: getComponent(['postal_code']),
        country: getComponent(['country']),
        formattedAddress: result.formatted_address,
      };

      const streetAddress = [parsed.streetNumber, parsed.streetName].filter(Boolean).join(' ');

      console.log(`Parsed address: ${streetAddress}, ${parsed.city}, ${parsed.state} ${parsed.postalCode}`);

      return new Response(
        JSON.stringify({
          placeId,
          streetAddress,
          city: parsed.city,
          state: parsed.state,
          postalCode: parsed.postalCode,
          formattedAddress: parsed.formattedAddress,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "autocomplete" or "details"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Places function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
