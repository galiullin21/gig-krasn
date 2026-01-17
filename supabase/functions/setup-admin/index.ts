import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// One-time setup script - creates admin user
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { secret } = await req.json();
    
    // Simple secret check for one-time setup
    if (secret !== "setup-admin-2026") {
      return new Response(
        JSON.stringify({ error: "Invalid secret" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = "admin@gig26.ru";
    const password = "admin1";

    // Delete existing user if exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    if (existingUser) {
      // Delete role first
      await supabase.from("user_roles").delete().eq("user_id", existingUser.id);
      await supabase.from("profiles").delete().eq("user_id", existingUser.id);
      await supabase.auth.admin.deleteUser(existingUser.id);
      console.log(`Deleted existing user: ${email}`);
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add admin role
    if (newUser.user) {
      await supabase.from("user_roles").insert({ user_id: newUser.user.id, role: "admin" });
      console.log(`Admin role added for user: ${email}`);
    }

    console.log(`Admin user created: ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Admin account created: ${email} / ${password}`,
        user: { id: newUser.user?.id, email } 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
