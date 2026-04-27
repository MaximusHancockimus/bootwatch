# Setting Up the Sighting Notification Webhook

This edge function sends push notifications when a new sighting is inserted. Recipients include anyone who **follows** a complex **or** has an **active parking timer** at that complex **or** at any complex within **~600 m** of the reporter and/or the **selected complex’s** center (so neighbors match even if the map pin is off). Distance uses the sighting’s **latitude/longitude** when present, with fallback to the reported complex’s center.

## Step 1: Deploy the Edge Function

From the Supabase Dashboard:
1. Go to **Edge Functions** in the left sidebar
2. Click **New Function**
3. Name it `notify-sighting`
4. Paste the contents of `supabase/functions/notify-sighting/index.ts`
5. Deploy

Or via CLI (if you have Supabase CLI installed):
```bash
supabase functions deploy notify-sighting
```

## Step 2: Create the Database Webhook

1. Go to **Database → Webhooks** in the Supabase Dashboard
2. Click **Create a new webhook**
3. Configure:
   - **Name**: `on-new-sighting`
   - **Table**: `sightings`
   - **Events**: `INSERT` only
   - **Type**: Supabase Edge Function
   - **Edge Function**: Select `notify-sighting`
4. In **Edge Function → Settings** for `notify-sighting`, turn **off** “Verify JWT” (webhooks do not send a user session).
5. **Webhook auth — the function must receive your key in one of these (see `getCallerCredential` in `index.ts`):**
   - **A)** `x-bootwatch-webhook-secret` = `NOTIFY_SIGHTING_WEBHOOK_SECRET` (Edge **Secrets**), or  
   - **B)** `Authorization: Bearer <service_role>` (from **Settings → API**), or  
   - **C)** `apikey: <service_role or anon key>` (same as many Supabase clients) — this is a common source of 401s if the Dashboard only set `apikey` and you weren’t reading it before.  

   The latest `notify-sighting` code accepts all of the above.
6. **Save** the webhook, then add a new test sighting and check **Edge Functions → notify-sighting → Logs** for a line like `notify-sighting sighting=… parkedUserIds=… recipientTokens=…`

### Manual test (after one real sighting exists)

Replace placeholders and run in **PowerShell** (or use curl on macOS/Linux):

```powershell
$project = "YOUR_PROJECT_REF"
$serviceRole = "YOUR_SERVICE_ROLE_KEY"
$sightingId = "UUID_FROM_sightings_TABLE"
$body = "{`"type`":`"INSERT`",`"table`":`"sightings`",`"schema`":`"public`",`"record`":{`"id`":`"$sightingId`"},`"old_record`":null}"
Invoke-RestMethod -Uri "https://$project.supabase.co/functions/v1/notify-sighting" -Method Post -ContentType "application/json" -Headers @{ Authorization = "Bearer $serviceRole" } -Body $body
```

If this returns JSON with `sent` > 0, Expo push and recipients are working; if `sent: 0`, use `check_sighting_push_setup.sql` and the log line to see whether `parkedUserIds` is 0 (timer / `complex_id` / radius) or tokens are missing.

## How It Works

1. User submits a sighting → row inserted into `sightings` table
2. The **app** also calls `supabase.functions.invoke('notify-sighting', …)` with the new row id and the reporter’s session token, so **nearby users get pushes even if the database webhook is misconfigured**. (If you also use a webhook, run `supabase/add_notify_sighting_dispatch.sql` so the second call no-ops and does not double-notify.)
3. Database webhook (if configured) can call the same function; dedup as above
4. Edge function loads the sighting row, builds the set of **nearby complex IDs** (within **~600 m** of the reporter’s location **and** within ~600 m of the **selected complex’s** map coordinates, plus the reported `complex_id` always included), then finds users who:
   - **Follow a complex in that set** (`saved_complexes` overlaps) **and** have `nearby_sighting_alerts` on in Profile, **or**
   - **Have a parking timer** (`active_timers`) for any complex in that set — _including_ after visitor time if they have not tapped “I’ve left” (see `add_active_timers_over_limit.sql`). No profile toggle is required for timer-based alerts.
   - Have a row in `push_tokens` for Expo push
   - Are NOT the person who reported (no self-notifications)
5. Sends push notifications via Expo's push API
6. User's phone shows e.g. "Booter spotted near The Cove!" with body text mentioning **nearby / within a few blocks**

## Notification Content

- **Spotter report**: "Booter spotted near {complex}!" / body references **within a few blocks**
- **Booted report**: "Someone got booted near {complex}!" / body warns if parked **nearby**
