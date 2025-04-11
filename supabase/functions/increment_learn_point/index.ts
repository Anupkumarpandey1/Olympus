
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
    const { user_id } = await req.json();
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    // Now check if user already has a record
    const { data: existingData, error: fetchError } = await supabaseClient
      .from('users_meta')
      .select('learn_points')
      .eq('user_id', user_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // Real error, not just "not found"
      throw fetchError;
    }

    let result;
    
    if (!existingData) {
      // Insert new record with 1 learn_point
      const { data: insertData, error: insertError } = await supabaseClient
        .from('users_meta')
        .insert({
          user_id: user_id,
          learn_points: 1,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      result = insertData;
    } else {
      // Update existing record
      const newPoints = (existingData.learn_points || 0) + 1;
      
      const { data: updateData, error: updateError } = await supabaseClient
        .from('users_meta')
        .update({
          learn_points: newPoints,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user_id)
        .select()
        .single();
        
      if (updateError) throw updateError;
      result = updateData;
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
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
