# How to Get the Correct Service Role Key

## The Problem

Your Edge Function is returning "Token invalido" (Invalid token) because the `SUPABASE_SERVICE_ROLE_KEY` environment variable is set to a **publishable key** (`sb_secret_...`) instead of the **JWT service_role key**.

## The Solution

You need to get the **JWT service_role key** from your Supabase dashboard:

### Step 1: Go to API Settings

Visit: https://supabase.com/dashboard/project/dfvlnzyqaapztsmdounj/settings/api

### Step 2: Find the Correct Key

Look for the section labeled **"Project API keys"** or **"Legacy anon, service_role API keys"**

You need the **`service_role` secret** key that:
- Starts with `eyJ...` (it's a JWT token)
- Is labeled as `service_role` (NOT `anon`)
- Is much longer than the `sb_secret_...` keys

### Step 3: The Keys You'll See

There are different types of keys:

1. **Publishable keys** (NEW system):
   - Start with `sb_publishable_...`
   - Start with `sb_secret_...`
   - These are NOT JWT tokens

2. **JWT keys** (what you need):
   - **anon key**: starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: ALSO starts with `eyJ...` but has `"role":"service_role"` in the payload

### Step 4: How to Find It

In the Supabase dashboard API settings page:

1. Look for a tab or section called **"Legacy anon, service_role API keys"** or just **"Project API keys"**
2. You'll see two JWT tokens:
   - `anon` / `public` - This is what your frontend uses (you already have this)
   - `service_role` / `secret` - **This is what you need!**
3. Click the "Reveal" or eye icon next to `service_role`
4. Copy the ENTIRE token (it's very long, starts with `eyJ`)

### Step 5: Update Your Environment

Once you have the correct JWT service_role key:

```bash
# Update .env file
cd /Users/viniciussteigleder/Documents/Web\ apps\ -\ vide\ coding/RitualFin_MVP_v1

# Add to .env
echo 'SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...YOUR_ACTUAL_SERVICE_ROLE_JWT' >> .env
echo 'SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...YOUR_ACTUAL_SERVICE_ROLE_JWT' >> apps/web/.env.local
```

**IMPORTANT**: The service_role key should be a JWT that starts with `eyJ` and is very long (several hundred characters).

### Current Status

❌ **Wrong**: `SUPABASE_SERVICE_ROLE_KEY=sb_secret_Bjo6coJ-qZjYqy53U-24Hg_CD45I324`
✅ **Right**: `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRm...` (very long JWT)

## Why This Matters

The Edge Function uses the service_role key to:
1. Validate the user's JWT token from the frontend
2. Access the database with elevated permissions
3. Bypass RLS policies when needed

Without the correct JWT service_role key, the Edge Function cannot validate user tokens and will always return "Token invalido".

## After You Get the Key

1. Update both `.env` files with the correct JWT
2. The Edge Function will automatically use it (no redeployment needed for Supabase-managed env vars)
3. Test the upload again

## How to Identify the Right Key

The service_role JWT contains `"role":"service_role"` in its payload. You can decode it at https://jwt.io to verify:

- Paste the key into jwt.io
- Check the payload section
- Look for `"role": "service_role"`

If you see `"role": "anon"`, that's the anon key (wrong one).
