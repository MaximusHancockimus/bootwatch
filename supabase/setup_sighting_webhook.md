# Setting Up the Sighting Notification Webhook

This edge function sends push notifications when a new sighting is inserted. Recipients include anyone who **follows** a complex **or** has an **active parking timer** at that complex **or** at any complex within **~450 m** (~1–2 short blocks) of the sighting. Distance uses the sighting’s **latitude/longitude** (reporter location) when present, with fallback to the reported complex’s center.

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
   - **HTTP Headers**: Add `Authorization: Bearer YOUR_SERVICE_ROLE_KEY`
     (Find this in Settings → API → `service_role` key)
4. Save

## How It Works

1. User submits a sighting → row inserted into `sightings` table
2. Database webhook fires → calls the `notify-sighting` edge function
3. Edge function loads the sighting row, builds the set of **nearby complex IDs** (within **450 m** of the sighting point, plus the reported `complex_id` always included), then finds users who:
   - Have `saved_complexes` **overlapping** any of those IDs, **or**
   - Have a row in `active_timers` for any of those IDs with `expires_at` in the future
   - Have `nearby_sighting_alerts = true` on `profiles` (default; users can turn off in the app Profile tab)
   - Have a non-null `push_token`
   - Are NOT the person who reported (no self-notifications)
4. Sends push notifications via Expo's push API
5. User's phone shows e.g. "Booter spotted near The Cove!" with body text mentioning **nearby / within a few blocks**

## Notification Content

- **Spotter report**: "Booter spotted near {complex}!" / body references **within a few blocks**
- **Booted report**: "Someone got booted near {complex}!" / body warns if parked **nearby**
