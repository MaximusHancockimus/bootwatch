// Supabase Edge Function: delete-account
//
// Called by the client when a signed-in user taps "Delete Account" in Profile.
// App Store Guideline 5.1.1(v) requires in-app deletion for apps with accounts.
//
// Flow:
//  1. Verify the caller's JWT (regular anon client with Authorization header).
//  2. Clean up storage objects that aren't auto-cascaded (avatar files).
//  3. Call auth.admin.deleteUser() with the service role key. FK cascades take
//     care of profiles, push_tokens, active_timers. Sightings are set to
//     user_id = NULL (preserved for community value, stripped of identity).
//
// Dashboard: Edge Function → leave JWT verification ENABLED (we rely on it).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    // User-scoped client: resolves auth.uid() from the caller's JWT so we
    // can only ever delete *that* user's account, even if the body lied.
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return json({ error: "Invalid session" }, 401);
    }
    const userId = userData.user.id;

    // Service-role client for admin deletion + storage cleanup.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Best-effort: remove any avatar objects under `avatars/<userId>/`.
    // Failures here don't block account deletion — the row pointing at them
    // will be gone momentarily anyway, and storage GC can sweep later.
    try {
      const { data: files } = await admin.storage
        .from("avatars")
        .list(userId, { limit: 100 });
      if (files && files.length > 0) {
        const paths = files.map((f) => `${userId}/${f.name}`);
        await admin.storage.from("avatars").remove(paths);
      }
    } catch (storageErr) {
      console.error("[delete-account] avatar cleanup failed:", storageErr);
    }

    // Same best-effort pass for sighting photos if that bucket is used.
    try {
      const { data: sightingFiles } = await admin.storage
        .from("sighting-photos")
        .list(userId, { limit: 100 });
      if (sightingFiles && sightingFiles.length > 0) {
        const paths = sightingFiles.map((f) => `${userId}/${f.name}`);
        await admin.storage.from("sighting-photos").remove(paths);
      }
    } catch {
      // Bucket may not exist in every project; ignore.
    }

    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
    if (deleteErr) {
      console.error("[delete-account] admin.deleteUser failed:", deleteErr);
      return json({ error: deleteErr.message }, 500);
    }

    return json({ ok: true, userId }, 200);
  } catch (error) {
    console.error("[delete-account] unexpected:", error);
    return json({ error: String(error) }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
