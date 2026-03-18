// Supabase Edge Function: notify-sighting
// Triggered via Database Webhook when a new sighting is inserted.
// Looks up all users who follow the sighting's complex and sends
// push notifications via Expo's push API.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    user_id: string | null;
    complex_id: string;
    report_type: string;
    is_anonymous: boolean;
    created_at: string;
  };
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();
    const sighting = payload.record;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get complex name
    const { data: complex } = await supabase
      .from("complexes")
      .select("name")
      .eq("id", sighting.complex_id)
      .single();

    const complexName = complex?.name ?? "an apartment complex";

    // Find all profiles that follow this complex and have a push token
    const { data: followers } = await supabase
      .from("profiles")
      .select("id, push_token")
      .contains("saved_complexes", [sighting.complex_id])
      .not("push_token", "is", null);

    // Find users with an active parking timer at this complex
    const { data: parkedUsers } = await supabase
      .from("active_timers")
      .select("user_id")
      .eq("complex_id", sighting.complex_id)
      .gt("expires_at", new Date().toISOString());

    // Fetch push tokens for parked users
    const parkedUserIds = (parkedUsers ?? []).map((t) => t.user_id);
    let parkedProfiles: { id: string; push_token: string }[] = [];
    if (parkedUserIds.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("id, push_token")
        .in("id", parkedUserIds)
        .not("push_token", "is", null);
      parkedProfiles = data ?? [];
    }

    // Merge followers + parked users, deduplicate by user id
    const allRecipients = new Map<string, string>();
    for (const f of (followers ?? [])) {
      if (f.push_token) allRecipients.set(f.id, f.push_token);
    }
    for (const p of parkedProfiles) {
      if (p.push_token) allRecipients.set(p.id, p.push_token);
    }

    // Don't notify the person who reported
    if (sighting.user_id) allRecipients.delete(sighting.user_id);

    const tokens = [...allRecipients.values()];

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({ sent: 0, followers: followers?.length ?? 0, parked: parkedUserIds.length }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const title =
      sighting.report_type === "booted"
        ? `Someone got booted at ${complexName}!`
        : `Booter spotted at ${complexName}!`;

    const body =
      sighting.report_type === "booted"
        ? "A community member just reported getting booted. Be extra careful parking here."
        : "A boot truck was just reported nearby. Check the feed for details.";

    // Send via Expo push API (batched)
    const messages = tokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data: { screen: "Feed", sightingId: sighting.id },
    }));

    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    const pushResult = await pushResponse.json();

    return new Response(
      JSON.stringify({ sent: tokens.length, result: pushResult }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
