import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  subject: string;
  content: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the request is from an authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user is admin or editor
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["admin", "editor", "developer"]);

      if (!roles || roles.length === 0) {
        return new Response(
          JSON.stringify({ error: "Forbidden: Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const { subject, content }: NewsletterRequest = await req.json();

    if (!subject || !content) {
      return new Response(
        JSON.stringify({ error: "Subject and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all active subscribers
    const { data: subscribers, error: subError } = await supabase
      .from("email_subscriptions")
      .select("email")
      .eq("is_active", true);

    if (subError) {
      console.error("Error fetching subscribers:", subError);
      throw subError;
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, message: "No active subscribers" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending newsletter to ${subscribers.length} subscribers`);

    // If RESEND_API_KEY is not set, return a message
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured. Newsletter would be sent to:", subscribers.map(s => s.email));
      return new Response(
        JSON.stringify({ 
          sent: 0, 
          message: "RESEND_API_KEY not configured. Please add the secret to enable email sending.",
          wouldSendTo: subscribers.length
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send emails using Resend
    let sentCount = 0;
    const errors: string[] = [];

    // Send in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const sendPromises = batch.map(async (subscriber) => {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Городская газета <noreply@resend.dev>",
              to: [subscriber.email],
              subject: subject,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <header style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e5e5;">
                    <h1 style="color: #1a1a1a; margin: 0; font-size: 24px;">Городская газета</h1>
                  </header>
                  <main>
                    <h2 style="color: #1a1a1a; font-size: 20px; margin-bottom: 20px;">${subject}</h2>
                    <div style="white-space: pre-wrap;">${content}</div>
                  </main>
                  <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; font-size: 12px; color: #666;">
                    <p>Вы получили это письмо, потому что подписаны на рассылку.</p>
                    <p>Чтобы отписаться, перейдите на наш сайт в раздел настроек.</p>
                  </footer>
                </body>
                </html>
              `,
            }),
          });

          if (response.ok) {
            sentCount++;
          } else {
            const errorData = await response.json();
            errors.push(`${subscriber.email}: ${errorData.message || 'Unknown error'}`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`${subscriber.email}: ${errorMessage}`);
        }
      });

      await Promise.all(sendPromises);
      
      // Small delay between batches
      if (i + batchSize < subscribers.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Newsletter sent: ${sentCount}/${subscribers.length}`);
    if (errors.length > 0) {
      console.log("Errors:", errors);
    }

    return new Response(
      JSON.stringify({ 
        sent: sentCount, 
        total: subscribers.length,
        errors: errors.length > 0 ? errors : undefined 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in send-newsletter:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
