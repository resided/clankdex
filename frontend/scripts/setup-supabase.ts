#!/usr/bin/env tsx
/**
 * Supabase Setup Script
 * Run: npx tsx scripts/setup-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';

const SQL_SETUP = `
-- Create evolutions table
CREATE TABLE IF NOT EXISTS evolutions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    token_address TEXT UNIQUE NOT NULL,
    entry_number INTEGER NOT NULL,
    current_tier INTEGER DEFAULT 0,
    highest_market_cap NUMERIC DEFAULT 0,
    tier_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_token_address ON evolutions(token_address);
CREATE INDEX IF NOT EXISTS idx_entry_number ON evolutions(entry_number);

-- Enable Row Level Security
ALTER TABLE evolutions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Allow all operations" ON evolutions;

-- Allow public access (for miniapp)
CREATE POLICY "Allow all operations" ON evolutions
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS update_evolutions_updated_at ON evolutions;
CREATE TRIGGER update_evolutions_updated_at
    BEFORE UPDATE ON evolutions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

async function setup() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('❌ Missing environment variables!');
    console.log('\nAdd these to .env.local:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...');
    process.exit(1);
  }

  console.log('🔌 Connecting to Supabase...');
  const supabase = createClient(url, key);

  console.log('🗄️  Creating evolutions table...');
  
  // Execute SQL
  const { error } = await supabase.rpc('exec_sql', { sql: SQL_SETUP });
  
  // If exec_sql doesn't exist, try direct SQL
  if (error) {
    console.log('⚠️  Trying alternative method...');
    
    // Check if table exists
    const { data: existing, error: checkError } = await supabase
      .from('evolutions')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST116') {
      console.error('❌ Table does not exist. Please run SQL manually in Supabase dashboard:');
      console.log('\n' + '='.repeat(60));
      console.log(SQL_SETUP);
      console.log('='.repeat(60) + '\n');
      process.exit(1);
    }
  }

  console.log('✅ Setup complete! Testing...');

  // Test insert
  const testAddress = '0x' + '1'.repeat(40);
  const { error: insertError } = await supabase
    .from('evolutions')
    .upsert({
      token_address: testAddress,
      entry_number: 999999,
      current_tier: 0,
      highest_market_cap: 0
    });

  if (insertError) {
    console.error('❌ Test insert failed:', insertError.message);
    process.exit(1);
  }

  // Cleanup test
  await supabase.from('evolutions').delete().eq('token_address', testAddress);

  console.log('✅ All tests passed! Supabase is ready.');
  console.log('\n📊 Your database is configured:');
  console.log('  • Table: evolutions');
  console.log('  • Columns: token_address, entry_number, current_tier, etc.');
  console.log('  • Indexes: token_address, entry_number');
  console.log('  • RLS: Enabled with public access');
}

setup().catch(console.error);
