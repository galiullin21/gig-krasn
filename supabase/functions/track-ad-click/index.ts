import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 20; // Max 20 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now - record.timestamp > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

// Validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
               req.headers.get("cf-connecting-ip") || 
               "unknown";
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      console.warn(`Rate limit exceeded for IP: ${ip.substring(0, 10)}...`);
      return new Response(
        JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    const { ad_id, type } = body;

    // Validate ad_id format
    if (!ad_id || typeof ad_id !== "string") {
      return new Response(
        JSON.stringify({ error: "ad_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!isValidUUID(ad_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid ad_id format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate type
    const validTypes = ["impression", "click"];
    const trackingType = validTypes.includes(type) ? type : "click";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First verify the ad exists
    const { data: adExists, error: checkError } = await supabase
      .from("ads")
      .select("id")
      .eq("id", ad_id)
      .eq("is_active", true)
      .single();

    if (checkError || !adExists) {
      return new Response(
        JSON.stringify({ error: "Ad not found or inactive" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (trackingType === "impression") {
      // Increment impressions count
      const { data: ad } = await supabase
        .from("ads")
        .select("impressions_count")
        .eq("id", ad_id)
        .single();
      
      if (ad) {
        await supabase
          .from("ads")
          .update({ impressions_count: (ad.impressions_count || 0) + 1 })
          .eq("id", ad_id);
      }
      
      console.log(`Impression tracked for ad: ${ad_id}`);
    } else {
      // Increment clicks count
      const { data: ad, error: fetchError } = await supabase
        .from("ads")
        .select("clicks_count")
        .eq("id", ad_id)
        .single();

      if (fetchError) {
        console.error("Error fetching ad:", fetchError);
        return new Response(
          JSON.stringify({ error: "Ad not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { error: updateError } = await supabase
        .from("ads")
        .update({ clicks_count: (ad.clicks_count || 0) + 1 })
        .eq("id", ad_id);

      if (updateError) {
        console.error("Error updating clicks:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to track click" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log(`Click tracked for ad: ${ad_id}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in track-ad-click:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
