import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Types for evolution tracking
export interface EvolutionRecord {
  id?: string;
  token_address: string;
  entry_number: number;
  current_tier: number;
  highest_market_cap: number;
  tier_history: TierHistoryEntry[];
  created_at?: string;
  updated_at?: string;
}

export interface TierHistoryEntry {
  tier: number;
  tier_name: string;
  market_cap: number;
  achieved_at: string;
}

// Fetch evolution data for a token
export async function getEvolutionData(tokenAddress: string): Promise<EvolutionRecord | null> {
  const { data, error } = await supabase
    .from('evolutions')
    .select('*')
    .eq('token_address', tokenAddress.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching evolution:', error);
    return null;
  }

  return data;
}

// Create initial evolution record
export async function createEvolution(
  tokenAddress: string,
  entryNumber: number
): Promise<EvolutionRecord | null> {
  const { data, error } = await supabase
    .from('evolutions')
    .insert({
      token_address: tokenAddress.toLowerCase(),
      entry_number: entryNumber,
      current_tier: 0, // Start as Egg
      highest_market_cap: 0,
      tier_history: [{
        tier: 0,
        tier_name: 'Egg',
        market_cap: 0,
        achieved_at: new Date().toISOString()
      }]
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating evolution:', error);
    return null;
  }

  return data;
}

// Update evolution tier
export async function updateEvolution(
  tokenAddress: string,
  newTier: number,
  tierName: string,
  marketCap: number
): Promise<boolean> {
  // First get current data
  const current = await getEvolutionData(tokenAddress);
  
  const historyEntry: TierHistoryEntry = {
    tier: newTier,
    tier_name: tierName,
    market_cap: marketCap,
    achieved_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('evolutions')
    .update({
      current_tier: newTier,
      highest_market_cap: marketCap,
      tier_history: current 
        ? [...current.tier_history, historyEntry]
        : [historyEntry],
      updated_at: new Date().toISOString()
    })
    .eq('token_address', tokenAddress.toLowerCase());

  if (error) {
    console.error('Error updating evolution:', error);
    return false;
  }

  return true;
}

// Get all evolutions for a user (by entry numbers)
export async function getEvolutionsByEntries(entryNumbers: number[]): Promise<EvolutionRecord[]> {
  if (entryNumbers.length === 0) return [];
  
  const { data, error } = await supabase
    .from('evolutions')
    .select('*')
    .in('entry_number', entryNumbers);

  if (error) {
    console.error('Error fetching evolutions:', error);
    return [];
  }

  return data || [];
}

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('evolutions').select('id').limit(1);
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist yet, but connection works
      return true;
    }
    return !error;
  } catch (e) {
    console.error('Supabase connection test failed:', e);
    return false;
  }
}
