#!/bin/bash

# Quick deployment script for RitualFin Edge Functions and Database

set -e

echo "🚀 Starting deployment to Supabase..."

# Login to Supabase (this will open a browser)
echo "📝 Step 1: Login to Supabase"
echo "This will open a browser window. Please authenticate."
read -p "Press Enter to continue..."
supabase login

# Link the project
echo ""
echo "🔗 Step 2: Link to Supabase project"
cd "$(dirname "$0")"
supabase link --project-ref dfvlnzyqaapztsmdounj

# Apply database migrations
echo ""
echo "📊 Step 3: Apply database migrations"
supabase db push

# Deploy Edge Function
echo ""
echo "⚡ Step 4: Deploy mm-import Edge Function"
supabase functions deploy mm-import

# Set secrets
echo ""
echo "🔐 Step 5: Set Edge Function secrets"
echo "⚠️  IMPORTANT: You need to set the SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "Get your service_role key from:"
echo "https://supabase.com/dashboard/project/dfvlnzyqaapztsmdounj/settings/api"
echo ""
read -p "Paste your service_role key here: " SERVICE_ROLE_KEY

supabase secrets set SUPABASE_URL=https://dfvlnzyqaapztsmdounj.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your app should now work at: http://localhost:3002/uploads"
echo "Test by uploading a Miles & More CSV file."
