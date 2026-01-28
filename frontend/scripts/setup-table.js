#!/usr/bin/env node
/**
 * Create evolutions table via Supabase REST API
 * Run: node scripts/setup-table.js
 */

const SUPABASE_URL = 'https://jzesdipwpsccgctneisf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_m_nHZbHbxlBjeWAWAXXmcQ_BujNDiWt';

const SQL = `
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

CREATE INDEX IF NOT EXISTS idx_token_address ON evolutions(token_address);
CREATE INDEX IF NOT EXISTS idx_entry_number ON evolutions(entry_number);

ALTER TABLE evolutions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations" ON evolutions;
CREATE POLICY "Allow all operations" ON evolutions
    FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_evolutions_updated_at ON evolutions;
CREATE TRIGGER update_evolutions_updated_at
    BEFORE UPDATE ON evolutions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

async function setup() {
  console.log('🔌 Connecting to Supabase...\n');
  
  try {
    // Try to query the table first
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/evolutions?select=id&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (checkRes.status === 200) {
      console.log('✅ Evolutions table already exists!');
      console.log('   Table is ready to use.\n');
      return;
    }

    if (checkRes.status === 404) {
      console.log('⚠️  Table not found. Please create it manually:\n');
      console.log('1. Go to https://supabase.com/dashboard/project/jzesdipwpsccgctneisf');
      console.log('2. Click "SQL Editor" in the left sidebar');
      console.log('3. Click "New query"');
      console.log('4. Paste the SQL below and click "Run":\n');
      console.log('='.repeat(60));
      console.log(SQL);
      console.log('='.repeat(60));
      return;
    }

    console.log(`⚠️  Unexpected response: ${checkRes.status}`);
    console.log('Please check your Supabase project.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setup();
