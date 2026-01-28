# One-Click Setup Guide

## Step 1: Create Supabase Account (1 minute)

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** → Sign up with GitHub
3. Click **"New Project"**
4. Fill in:
   - **Name:** `clankdex`
   - **Password:** Click "Generate a password" (copy it!)
   - **Region:** `N. Virginia`
5. Click **"Create new project"**
6. ⏱️ Wait 2 minutes for it to be ready

## Step 2: Get API Keys (30 seconds)

1. In your Supabase project, click **⚙️ Project Settings** (left sidebar, bottom)
2. Click **"API"** in the menu
3. Copy these values:

```
📋 Copy this:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## Step 3: Paste in .env.local (30 seconds)

Create `.env.local` file in your project root:

```bash
# Paste the two lines you copied above
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-key
```

## Step 4: Run Setup Script (30 seconds)

```bash
npm install
npx tsx scripts/setup-supabase.ts
```

If it says "Table does not exist", do this:

1. In Supabase, click **"SQL Editor"** (left sidebar)
2. Click **"New query"**
3. Paste this SQL:

```sql
CREATE TABLE evolutions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_address TEXT UNIQUE NOT NULL,
    entry_number INTEGER NOT NULL,
    current_tier INTEGER DEFAULT 0,
    highest_market_cap NUMERIC DEFAULT 0,
    tier_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_token_address ON evolutions(token_address);

ALTER TABLE evolutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations" ON evolutions
    FOR ALL TO anon USING (true) WITH CHECK (true);
```

4. Click **"Run"** ✅

## Step 5: Deploy (1 minute)

```bash
# Add env vars to Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your URL

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your key

# Deploy
vercel --prod
```

## Done! 🎉

Total time: ~5 minutes

Your evolution tracking is now persistent across:
- ✅ Browser refreshes
- ✅ Device changes
- ✅ Session clears
- ✅ App updates
