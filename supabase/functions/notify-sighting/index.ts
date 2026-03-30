// Supabase Edge Function: notify-sighting
// Triggered via Database Webhook on INSERT into sightings.
// Requires header x-bootwatch-webhook-secret matching NOTIFY_SIGHTING_WEBHOOK_SECRET (or Bearer same value).
// Dashboard: Edge Function → disable JWT verification for this function (webhook has no user JWT).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/** ~1–2 short city blocks; tight enough to stay relevant, loose enough to catch neighbors. */
const NEARBY_RADIUS_METERS = 450;

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string;
    user_id: string | null;
    complex_id: string;
    report_type?: string;
  };
}

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i]! ^ bb[i]!;
  return diff === 0;
}

function verifyWebhookSecret(req: Request): Response | null {
  const secret = Deno.env.get("NOTIFY_SIGHTING_WEBHOOK_SECRET")?.trim();
  if (!secret || secret.length < 16) {
    return new Response(
      JSON.stringify({
        error: "Server misconfigured: set NOTIFY_SIGHTING_WEBHOOK_SECRET (min 16 chars) on this function",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  const header =
    req.headers.get("x-bootwatch-webhook-secret")?.trim() ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")?.trim();
  if (!header || !timingSafeEqual(header, secret)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function tokensForUsers(supabase: any, userIds: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (userIds.length === 0) return out;
  const { data, error } = await supabase
    .from("push_tokens")
    .select("user_id, token")
    .in("user_id", userIds);
  if (error) {
    console.error("[notify-sighting] push_tokens query", error.message);
    return out;
  }
  for (const row of (data ?? []) as { user_id: string; token: string }[]) {
    if (row.user_id && row.token) out.set(row.user_id, row.token);
  }
  return out;
}

Deno.serve(async (req) => {
  try {
    const denied = verifyWebhookSecret(req);
    if (denied) return denied;

    const payload: WebhookPayload = await req.json();
    const record = payload.record;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: sighting, error: sightingErr } = await supabase
      .from("sightings")
      .select("id, user_id, complex_id, latitude, longitude, report_type")
      .eq("id", record.id)
      .single();

    if (sightingErr || !sighting) {
      return new Response(
        JSON.stringify({ error: "Sighting not found", detail: sightingErr?.message }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const { data: reportedComplex } = await supabase
      .from("complexes")
      .select("name, latitude, longitude")
      .eq("id", sighting.complex_id)
      .single();

    const complexName = reportedComplex?.name ?? "an apartment complex";

    // Prefer reporter coordinates (where they saw the truck); fall back to complex center.
    let anchorLat = sighting.latitude;
    let anchorLng = sighting.longitude;
    if (
      anchorLat == null ||
      anchorLng == null ||
      Number.isNaN(anchorLat) ||
      Number.isNaN(anchorLng)
    ) {
      anchorLat = reportedComplex?.latitude ?? 0;
      anchorLng = reportedComplex?.longitude ?? 0;
    }

    const { data: allComplexes, error: complexesErr } = await supabase
      .from("complexes")
      .select("id, latitude, longitude");

    if (complexesErr || !allComplexes?.length) {
      return new Response(
        JSON.stringify({ error: "Could not load complexes", detail: complexesErr?.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const nearIds = new Set<string>();
    nearIds.add(sighting.complex_id);
    for (const c of allComplexes) {
      if (c.latitude == null || c.longitude == null) continue;
      if (haversineMeters(anchorLat, anchorLng, c.latitude, c.longitude) <= NEARBY_RADIUS_METERS) {
        nearIds.add(c.id);
      }
    }

    const nearIdList = [...nearIds];

    const { data: followerProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("nearby_sighting_alerts", true)
      .overlaps("saved_complexes", nearIdList);

    const followerIds = (followerProfiles ?? []).map((r) => r.id);
    const followerTokens = await tokensForUsers(supabase, followerIds);

    const { data: parkedTimers } = await supabase
      .from("active_timers")
      .select("user_id")
      .in("complex_id", nearIdList)
      .gt("expires_at", new Date().toISOString());

    const parkedUserIds = [...new Set((parkedTimers ?? []).map((t) => t.user_id))];
    let parkedTokenMap = new Map<string, string>();
    if (parkedUserIds.length > 0) {
      const { data: parkedProfiles } = await supabase
        .from("profiles")
        .select("id")
        .in("id", parkedUserIds)
        .eq("nearby_sighting_alerts", true);
      const eligibleParked = (parkedProfiles ?? []).map((p) => p.id);
      parkedTokenMap = await tokensForUsers(supabase, eligibleParked);
    }

    const allRecipients = new Map<string, string>();
    for (const [id, tok] of followerTokens) allRecipients.set(id, tok);
    for (const [id, tok] of parkedTokenMap) allRecipients.set(id, tok);

    if (sighting.user_id) allRecipients.delete(sighting.user_id);

    const tokens = [...allRecipients.values()];

    if (tokens.length === 0) {
      return new Response(
        JSON.stringify({
          sent: 0,
          nearbyComplexCount: nearIdList.length,
          radiusMeters: NEARBY_RADIUS_METERS,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const reportType = sighting.report_type ?? "spotter";
    const title =
      reportType === "booted"
        ? `Someone got booted near ${complexName}!`
        : `Booter spotted near ${complexName}!`;

    const body =
      reportType === "booted"
        ? "A community member reported getting booted within a few blocks. Be careful if you're parked nearby."
        : "A boot truck was reported nearby (within a few blocks). Check the feed for details.";

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
      JSON.stringify({
        sent: tokens.length,
        nearbyComplexCount: nearIdList.length,
        radiusMeters: NEARBY_RADIUS_METERS,
        result: pushResult,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
