
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

    // Check if the users_meta table exists
    const { data: tablesData, error: tablesError } = await supabaseClient.rpc(
      'check_if_table_exists',
      { table_name: 'users_meta' }
    );

    if (tablesError) {
      console.error("Error checking if table exists:", tablesError);
      throw tablesError;
    }

    // If table doesn't exist, create it
    if (!tablesData || !tablesData.exists) {
      // Create the users_meta table
      const { error: createError } = await supabaseClient.rpc(
        'create_users_meta_table'
      );

      if (createError) {
        console.error("Error creating users_meta table:", createError);
        throw createError;
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
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
