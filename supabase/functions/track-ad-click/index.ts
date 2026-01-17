import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ad_id, type } = await req.json();

    if (!ad_id) {
      return new Response(
        JSON.stringify({ error: "ad_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (type === "impression") {
      // Increment impressions count
      const { error } = await supabase.rpc("increment_ad_impressions", { ad_id });
      
      if (error) {
        // Fallback: manual increment if RPC doesn't exist
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
      }
      
      console.log(`Impression tracked for ad: ${ad_id}`);
    } else {
      // Increment clicks count (default)
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
