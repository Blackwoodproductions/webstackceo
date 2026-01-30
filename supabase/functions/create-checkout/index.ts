import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[CREATE-CHECKOUT] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not configured");
      return new Response(JSON.stringify({
        error: "Payment system not configured",
        instructions: "Please contact support to enable payments.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (stripeKey.startsWith("pk_")) {
      logStep("ERROR: Invalid key type - publishable key used instead of secret");
      return new Response(JSON.stringify({
        error: "Invalid payment configuration",
        message: "Server configuration error. Please contact support.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    logStep("Stripe key verified");

    // Parse request body
    const { priceId, successUrl, cancelUrl, metadata, mode = 'subscription' } = await req.json();
    
    if (!priceId) {
      throw new Error("No price ID provided");
    }
    logStep("Request parsed", { priceId, mode, hasMetadata: !!metadata });

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Try to get authenticated user (optional for guest checkout)
    let userEmail: string | undefined;
    let customerId: string | undefined;

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      if (userData.user?.email) {
        userEmail = userData.user.email;
        logStep("User authenticated", { email: userEmail });
      }
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing Stripe customer if user is authenticated
    if (userEmail) {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing customer", { customerId });
      }
    }

    // Get origin for redirect URLs
    const origin = req.headers.get("origin") || "https://webstack.ceo";

    // Create checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode as 'subscription' | 'payment',
      success_url: successUrl || `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${origin}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: metadata || {},
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout session created", { 
      sessionId: session.id, 
      url: session.url,
      mode,
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
