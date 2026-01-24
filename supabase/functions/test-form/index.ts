import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FormTestRequest {
  formName: string;
  formEndpoint: string;
  testData: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { formName, formEndpoint, testData } = await req.json() as FormTestRequest;

    console.log(`[test-form] Testing form: ${formName} at ${formEndpoint}`);
    console.log(`[test-form] Test data:`, JSON.stringify(testData));

    const startTime = Date.now();
    let status: "success" | "failed" = "pending" as "success" | "failed";
    let errorMessage: string | null = null;

    try {
      // Actually submit to the form endpoint
      const response = await fetch(formEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      const responseTime = Date.now() - startTime;
      console.log(`[test-form] Response status: ${response.status}, time: ${responseTime}ms`);

      if (response.ok) {
        status = "success";
        console.log(`[test-form] Form test PASSED`);
      } else {
        status = "failed";
        const errorText = await response.text();
        errorMessage = `HTTP ${response.status}: ${errorText.slice(0, 500)}`;
        console.log(`[test-form] Form test FAILED: ${errorMessage}`);
      }

      // Record the test result
      const { data: testRecord, error: insertError } = await supabase
        .from("form_tests")
        .insert({
          form_name: formName,
          form_endpoint: formEndpoint,
          test_data: testData,
          status,
          error_message: errorMessage,
          response_time_ms: responseTime,
          tested_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`[test-form] Failed to record test:`, insertError);
      }

      return new Response(
        JSON.stringify({
          success: status === "success",
          status,
          responseTime,
          errorMessage,
          testId: testRecord?.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (fetchError) {
      const responseTime = Date.now() - startTime;
      status = "failed";
      errorMessage = fetchError instanceof Error ? fetchError.message : "Network error";
      console.error(`[test-form] Network error:`, errorMessage);

      // Record the failed test
      await supabase.from("form_tests").insert({
        form_name: formName,
        form_endpoint: formEndpoint,
        test_data: testData,
        status,
        error_message: errorMessage,
        response_time_ms: responseTime,
        tested_by: user.id,
      });

      return new Response(
        JSON.stringify({
          success: false,
          status,
          responseTime,
          errorMessage,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("[test-form] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
