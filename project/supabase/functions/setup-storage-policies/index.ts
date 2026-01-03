import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;

    const db = await Deno.postgres.connect(dbUrl);

    const policies = [
      `DROP POLICY IF EXISTS "Public read access" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;`,
      `DROP POLICY IF EXISTS "User delete own files" ON storage.objects;`,
      
      `CREATE POLICY "Public read access"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'images');`,
      
      `CREATE POLICY "Authenticated upload"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'images' AND auth.role() = 'authenticated');`,
      
      `CREATE POLICY "User delete own files"
        ON storage.objects FOR DELETE
        USING (bucket_id = 'images' AND auth.uid()::text = owner);`,
    ];

    for (const policy of policies) {
      try {
        await db.queryArray(policy);
      } catch (e) {
        console.log(`Policy execution note: ${e.message}`);
      }
    }

    await db.close();

    return new Response(
      JSON.stringify({ success: true, message: "Storage policies configured" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
