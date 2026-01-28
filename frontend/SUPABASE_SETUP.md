# Supabase Setup for ClankDex Evolution

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/login
3. Click "New Project"
4. Name it: `clankdex`
5. Choose region closest to your users (e.g., `us-east-1`)
6. Wait for project to be created

## 2. Get API Keys

Once project is ready:

1. Go to Project Settings → API
2. Copy these values:
   - `URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Add to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://yourproject.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## 3. Create Database Table

Go to SQL Editor and run:

```sql
-- Create evolutions table
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

-- Add index for faster lookups
CREATE INDEX idx_token_address ON evolutions(token_address);
CREATE INDEX idx_entry_number ON evolutions(entry_number);

-- Enable Row Level Security (RLS)
ALTER TABLE evolutions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for demo)
-- In production, restrict to authenticated users only
CREATE POLICY "Allow all operations" ON evolutions
    FOR ALL
    TO anon
    USING (true)
    WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_evolutions_updated_at
    BEFORE UPDATE ON evolutions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## 4. Test the Setup

Run this test query in SQL Editor:

```sql
-- Insert test record
INSERT INTO evolutions (token_address, entry_number, current_tier, highest_market_cap)
VALUES ('0x1234567890abcdef', 1, 0, 0);

-- Query it back
SELECT * FROM evolutions WHERE token_address = '0x1234567890abcdef';

-- Clean up test
DELETE FROM evolutions WHERE token_address = '0x1234567890abcdef';
```

## 5. How It Works

### Evolution Flow:

1. **Token Launch**
   ```typescript
   // Creates initial record
   await createEvolution(tokenAddress, entryNumber);
   // Sets: current_tier = 0 (Egg), highest_market_cap = 0
   ```

2. **Rolodex View**
   ```typescript
   // Fetches from Supabase every 30s
   const evolution = await getEvolutionData(tokenAddress);
   
   // Checks if market cap crossed threshold
   if (newTier.index > evolution.current_tier) {
     await updateEvolution(tokenAddress, newTier, marketCap);
   }
   ```

3. **Evolution History**
   ```json
   {
     "tier_history": [
       {"tier": 0, "tier_name": "Egg", "market_cap": 0, "achieved_at": "2024-01-15T10:00:00Z"},
       {"tier": 1, "tier_name": "Baby", "market_cap": 5000, "achieved_at": "2024-01-15T14:30:00Z"},
       {"tier": 2, "tier_name": "Basic", "market_cap": 25000, "achieved_at": "2024-01-16T09:15:00Z"}
     ]
   }
   ```

## 6. Evolution Tiers

| Tier | Name | Min Market Cap | Max Market Cap |
|------|------|---------------|----------------|
| 0 | Egg | $0 | $1,000 |
| 1 | Baby | $1,000 | $10,000 |
| 2 | Basic | $10,000 | $50,000 |
| 3 | Stage 1 | $50,000 | $100,000 |
| 4 | Stage 2 | $100,000 | $500,000 |
| 5 | Mega | $500,000 | $1,000,000 |
| 6 | Legendary | $1,000,000+ | ∞ |

## 7. Database Schema

```sql
Table: evolutions
├── id: uuid (primary key)
├── token_address: text (unique, indexed)
├── entry_number: integer (indexed)
├── current_tier: integer (0-6)
├── highest_market_cap: numeric (in USD)
├── tier_history: jsonb (array of evolution events)
├── created_at: timestamptz
└── updated_at: timestamptz
```

## 8. Row Level Security (RLS)

Current policy allows all operations. For production:

```sql
-- Remove public policy
DROP POLICY "Allow all operations" ON evolutions;

-- Add authenticated-only policy
CREATE POLICY "Allow authenticated access" ON evolutions
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
```

## 9. Backup & Export

To export evolution data:

```sql
-- Export all evolutions
COPY (SELECT * FROM evolutions) TO '/tmp/evolutions.csv' CSV HEADER;

-- Or specific format
SELECT 
    token_address,
    entry_number,
    current_tier,
    highest_market_cap,
    jsonb_array_length(tier_history) as total_evolutions,
    created_at,
    updated_at
FROM evolutions
ORDER BY highest_market_cap DESC;
```

## 10. Monitoring

Check evolution stats:

```sql
-- Count by tier
SELECT 
    current_tier,
    COUNT(*) as count,
    AVG(highest_market_cap) as avg_market_cap
FROM evolutions
GROUP BY current_tier
ORDER BY current_tier;

-- Recent evolutions
SELECT 
    token_address,
    current_tier,
    highest_market_cap,
    updated_at
FROM evolutions
WHERE updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;
```

## Done! 🎉

Evolution data will now persist across:
- Browser refreshes
- Device changes  
- Session clears
- App updates
