# Deploy Edge Functions to Supabase

Your Edge Function `mm-import` needs to be deployed to your Supabase project for the CSV upload to work.

## Quick Deploy Steps

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

This will open a browser window to authenticate.

### 3. Link Your Project

```bash
cd /Users/viniciussteigleder/Documents/Web\ apps\ -\ vide\ coding/RitualFin_MVP_v1
supabase link --project-ref dfvlnzyqaapztsmdounj
```

### 4. Deploy the Edge Function

```bash
supabase functions deploy mm-import
```

### 5. Set Environment Variables for Edge Function

The Edge Function needs the following environment variables:

```bash
supabase secrets set SUPABASE_URL=https://dfvlnzyqaapztsmdounj.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_ACTUAL_SERVICE_ROLE_KEY
```

**IMPORTANT**: Get your actual service role key from:
- Supabase Dashboard → Project Settings → API → `service_role` key

### 6. Apply Database Migrations

```bash
supabase db push
```

This will apply the migrations including:
- Create all tables with proper schema
- Add RLS policies
- Create storage bucket for uploads

---

## Alternative: Manual Deployment via Supabase Dashboard

If you prefer not to use the CLI:

1. Go to https://supabase.com/dashboard/project/dfvlnzyqaapztsmdounj/functions
2. Click "Create a new function"
3. Name it `mm-import`
4. Copy the contents of `supabase/functions/mm-import/index.ts`
5. Paste into the editor
6. Deploy

Then set secrets:
1. Go to Project Settings → Edge Functions
2. Add secrets:
   - `SUPABASE_URL`: https://dfvlnzyqaapztsmdounj.supabase.co
   - `SUPABASE_SERVICE_ROLE_KEY`: (your actual service role key)

---

## Testing After Deployment

Once deployed, test the upload at: http://localhost:3002/uploads

The function will be available at:
`https://dfvlnzyqaapztsmdounj.supabase.co/functions/v1/mm-import`
