
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: req.headers.get("Authorization")! } },
      }
    );

    // First, check if the users_meta table exists and create it if not
    const { error: tableCheckError } = await supabaseClient.rpc('create_users_meta_if_not_exists');
    
    if (tableCheckError) {
      console.error("Error checking or creating users_meta table:", tableCheckError);
    }

    // Get the leaderboard data
    const { data, error } = await supabaseClient
      .from('users_meta')
      .select('user_id, learn_points, updated_at')
      .order('learn_points', { ascending: true })
      .limit(10);

    if (error) throw error;

    // Format the data for the frontend
    const formattedData = await Promise.all(data.map(async (item) => {
      // Try to get user profile info
      try {
        const { data: userData, error: userError } = await supabaseClient
          .from('profiles')
          .select('username, full_name, avatar_url')
          .eq('id', item.user_id)
          .single();
          
        const displayName = userData?.username || userData?.full_name || 'Anonymous';
          
        return {
          user_id: item.user_id,
          username: displayName,
          learn_points: item.learn_points || 0,
          updated_at: item.updated_at
        };
      } catch (e) {
        // If we can't get user info, return with what we have
        return {
          user_id: item.user_id,
          username: 'Anonymous',
          learn_points: item.learn_points || 0,
          updated_at: item.updated_at
        };
      }
    }));

    return new Response(
      JSON.stringify(formattedData),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
