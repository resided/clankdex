-- ClankDex Evolution Table Setup
-- Run this in Supabase SQL Editor

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

-- Allow public access (for miniapp)
DROP POLICY IF EXISTS "Allow all operations" ON evolutions;
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

-- Verify table was created
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'evolutions';
