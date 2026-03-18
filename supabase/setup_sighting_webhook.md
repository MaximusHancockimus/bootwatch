# Setting Up the Sighting Notification Webhook

This edge function sends push notifications to users who follow a complex when a new sighting is reported there.

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
3. Edge function queries `profiles` for users who:
   - Have `saved_complexes` containing the sighting's `complex_id`
   - Have a non-null `push_token`
   - Are NOT the person who reported (no self-notifications)
4. Sends push notifications via Expo's push API
5. User's phone shows: "Booter spotted at The Cove!"

## Notification Content

- **Spotter report**: "Booter spotted at {complex}!" / "A boot truck was just reported nearby."
- **Booted report**: "Someone got booted at {complex}!" / "A community member just reported getting booted."
