import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId } = await req.json();
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create client with user's token to verify admin access
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to check user's roles
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: rolesData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    const userRoles = rolesData?.map(r => r.role) || [];
    const hasAdminAccess = userRoles.some(role => ['admin', 'developer'].includes(role));
    
    if (!hasAdminAccess) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Deleting user:', userId);

    // Delete related data first (using service role to bypass RLS)
    // 1. Get warning IDs
    const { data: warnings } = await supabaseAdmin
      .from('user_warnings')
      .select('id')
      .eq('user_id', userId);
    
    const warningIds = warnings?.map(w => w.id) || [];
    
    // 2. Delete warning messages
    if (warningIds.length > 0) {
      await supabaseAdmin.from('warning_messages').delete().in('warning_id', warningIds);
    }
    
    // 3. Delete warnings where user issued them
    await supabaseAdmin.from('user_warnings').delete().eq('issued_by', userId);
    
    // 4. Delete warnings for user
    await supabaseAdmin.from('user_warnings').delete().eq('user_id', userId);
    
    // 5. Delete reactions
    await supabaseAdmin.from('reactions').delete().eq('user_id', userId);
    
    // 6. Delete comments
    await supabaseAdmin.from('comments').delete().eq('user_id', userId);
    
    // 7. Delete notifications
    await supabaseAdmin.from('notifications').delete().eq('user_id', userId);
    
    // 8. Delete user preferences
    await supabaseAdmin.from('user_preferences').delete().eq('user_id', userId);
    
    // 9. Delete roles
    await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
    
    // 10. Delete profile
    await supabaseAdmin.from('profiles').delete().eq('user_id', userId);

    // 11. Delete from auth.users (this fully removes the account)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      throw deleteError;
    }

    console.log('User deleted successfully:', userId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in delete-user:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
