import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// TYPES
// ============================================

// Evolution tracking
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

// Creature record with referral support
export interface CreatureRecord {
  id?: string;
  entry_number: number;
  token_address: string;
  token_symbol: string;
  name: string;
  element: string;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  special: number;
  description: string;
  creator_address?: string;
  farcaster_username?: string;
  image_url?: string;
  verified: boolean;
  created_at?: string;
  // New fields
  referrer_address?: string;  // Who referred the creator
  is_merged?: boolean;        // If this token was created from merging
  parent_tokens?: string[];   // Addresses of parent tokens (if merged)
  daily_votes?: number;       // Votes for token of the day
}

// Creator streak tracking
export interface CreatorStreak {
  id?: string;
  creator_address: string;
  current_streak: number;
  longest_streak: number;
  last_launch_date: string;
  total_launches: number;
  tier: 'novice' | 'pro' | 'legend' | 'whale';
  created_at?: string;
  updated_at?: string;
}

// Token of the Day
export interface TokenOfTheDay {
  id?: string;
  date: string;
  token_address: string;
  entry_number: number;
  votes: number;
  featured: boolean;
  created_at?: string;
}

// Merge history
export interface MergeRecord {
  id?: string;
  new_token_address: string;
  parent_token_1: string;
  parent_token_2: string;
  creator_address: string;
  entry_number: number;
  created_at?: string;
}

// ============================================
// EVOLUTION FUNCTIONS
// ============================================

export async function getEvolutionData(tokenAddress: string): Promise<EvolutionRecord | null> {
  const { data, error } = await supabase
    .from('evolutions')
    .select('*')
    .eq('token_address', tokenAddress.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching evolution:', error);
    return null;
  }

  return data;
}

export async function createEvolution(
  tokenAddress: string,
  entryNumber: number
): Promise<EvolutionRecord | null> {
  const { data, error } = await supabase
    .from('evolutions')
    .insert({
      token_address: tokenAddress.toLowerCase(),
      entry_number: entryNumber,
      current_tier: 0,
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

export async function updateEvolution(
  tokenAddress: string,
  newTier: number,
  tierName: string,
  marketCap: number
): Promise<boolean> {
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

// ============================================
// CREATURE FUNCTIONS
// ============================================

export async function createCreatureRecord(
  creature: CreatureRecord
): Promise<CreatureRecord | null> {
  const { data, error } = await supabase
    .from('creatures')
    .insert(creature)
    .select()
    .single();

  if (error) {
    console.error('Error creating creature record:', error);
    return null;
  }

  return data;
}

export async function getAllCreatures(): Promise<CreatureRecord[]> {
  const { data, error } = await supabase
    .from('creatures')
    .select('*')
    .eq('verified', true)
    .order('entry_number', { ascending: true });

  if (error) {
    console.error('Error fetching creatures:', error);
    return [];
  }

  return data || [];
}

export async function getCreatureByAddress(address: string): Promise<CreatureRecord | null> {
  const { data, error } = await supabase
    .from('creatures')
    .select('*')
    .eq('token_address', address.toLowerCase())
    .single();

  if (error) {
    console.error('Error fetching creature:', error);
    return null;
  }

  return data;
}

export async function getNextEntryNumber(): Promise<number> {
  const { data, error } = await supabase
    .from('creatures')
    .select('entry_number')
    .order('entry_number', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return 1;
  }

  return data.entry_number + 1;
}

// Get mergeable tokens (user's tokens that aren't already merged)
export async function getMergeableTokens(creatorAddress: string): Promise<CreatureRecord[]> {
  const { data, error } = await supabase
    .from('creatures')
    .select('*')
    .eq('creator_address', creatorAddress.toLowerCase())
    .eq('verified', true)
    .eq('is_merged', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching mergeable tokens:', error);
    return [];
  }

  return data || [];
}

// ============================================
// CREATOR STREAK FUNCTIONS
// ============================================

export async function getCreatorStreak(creatorAddress: string): Promise<CreatorStreak | null> {
  const { data, error } = await supabase
    .from('creator_streaks')
    .select('*')
    .eq('creator_address', creatorAddress.toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching streak:', error);
    return null;
  }

  return data;
}

export async function updateCreatorStreak(creatorAddress: string): Promise<CreatorStreak | null> {
  const today = new Date().toISOString().split('T')[0];
  const existing = await getCreatorStreak(creatorAddress);

  if (!existing) {
    // First launch - create new streak
    const { data, error } = await supabase
      .from('creator_streaks')
      .insert({
        creator_address: creatorAddress.toLowerCase(),
        current_streak: 1,
        longest_streak: 1,
        last_launch_date: today,
        total_launches: 1,
        tier: 'novice'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating streak:', error);
      return null;
    }
    return data;
  }

  // Check if streak continues
  const lastLaunch = new Date(existing.last_launch_date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isConsecutive = lastLaunch.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];
  const isSameDay = lastLaunch.toISOString().split('T')[0] === today;

  let newStreak = existing.current_streak;
  
  if (isConsecutive) {
    newStreak += 1;
  } else if (!isSameDay) {
    newStreak = 1; // Reset streak
  }

  const longestStreak = Math.max(existing.longest_streak, newStreak);
  
  // Determine tier
  let tier: 'novice' | 'pro' | 'legend' | 'whale' = 'novice';
  if (longestStreak >= 30) tier = 'whale';
  else if (longestStreak >= 10) tier = 'legend';
  else if (longestStreak >= 5) tier = 'pro';

  const { data, error } = await supabase
    .from('creator_streaks')
    .update({
      current_streak: newStreak,
      longest_streak: longestStreak,
      last_launch_date: today,
      total_launches: existing.total_launches + 1,
      tier,
      updated_at: new Date().toISOString()
    })
    .eq('creator_address', creatorAddress.toLowerCase())
    .select()
    .single();

  if (error) {
    console.error('Error updating streak:', error);
    return null;
  }

  return data;
}

// ============================================
// TOKEN OF THE DAY FUNCTIONS
// ============================================

export async function getTokenOfTheDay(date?: string): Promise<TokenOfTheDay | null> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('token_of_the_day')
    .select('*')
    .eq('date', targetDate)
    .eq('featured', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching token of the day:', error);
    return null;
  }

  return data;
}

export async function voteForToken(tokenAddress: string, entryNumber: number): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  // Check if vote record exists for today
  const { data: existing } = await supabase
    .from('token_of_the_day')
    .select('*')
    .eq('token_address', tokenAddress.toLowerCase())
    .eq('date', today)
    .single();

  if (existing) {
    // Increment vote
    const { error } = await supabase
      .from('token_of_the_day')
      .update({ votes: existing.votes + 1 })
      .eq('id', existing.id);

    if (error) {
      console.error('Error updating vote:', error);
      return false;
    }
  } else {
    // Create new vote record
    const { error } = await supabase
      .from('token_of_the_day')
      .insert({
        date: today,
        token_address: tokenAddress.toLowerCase(),
        entry_number: entryNumber,
        votes: 1,
        featured: false
      });

    if (error) {
      console.error('Error creating vote:', error);
      return false;
    }
  }

  // Check if this token now has most votes and should be featured
  await updateFeaturedToken(today);
  return true;
}

async function updateFeaturedToken(date: string): Promise<void> {
  // Get token with most votes for today
  const { data: topToken } = await supabase
    .from('token_of_the_day')
    .select('*')
    .eq('date', date)
    .order('votes', { ascending: false })
    .limit(1)
    .single();

  if (topToken && topToken.votes >= 3) {
    // Feature this token (unfeature others first)
    await supabase
      .from('token_of_the_day')
      .update({ featured: false })
      .eq('date', date);

    await supabase
      .from('token_of_the_day')
      .update({ featured: true })
      .eq('id', topToken.id);
  }
}

export async function getTopVotedTokens(limit: number = 5): Promise<TokenOfTheDay[]> {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('token_of_the_day')
    .select('*')
    .eq('date', today)
    .order('votes', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top tokens:', error);
    return [];
  }

  return data || [];
}

// ============================================
// MERGE FUNCTIONS
// ============================================

export async function recordMerge(
  newTokenAddress: string,
  parent1: string,
  parent2: string,
  creatorAddress: string,
  entryNumber: number
): Promise<boolean> {
  const { error } = await supabase
    .from('merge_history')
    .insert({
      new_token_address: newTokenAddress.toLowerCase(),
      parent_token_1: parent1.toLowerCase(),
      parent_token_2: parent2.toLowerCase(),
      creator_address: creatorAddress.toLowerCase(),
      entry_number: entryNumber
    });

  if (error) {
    console.error('Error recording merge:', error);
    return false;
  }

  // Mark parent tokens as merged
  await supabase
    .from('creatures')
    .update({ is_merged: true })
    .eq('token_address', parent1.toLowerCase());

  await supabase
    .from('creatures')
    .update({ is_merged: true })
    .eq('token_address', parent2.toLowerCase());

  return true;
}

export async function getMergeHistory(creatorAddress: string): Promise<MergeRecord[]> {
  const { data, error } = await supabase
    .from('merge_history')
    .select('*')
    .eq('creator_address', creatorAddress.toLowerCase())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching merge history:', error);
    return [];
  }

  return data || [];
}

// ============================================
// TEST CONNECTION
// ============================================

export async function testConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('creatures').select('id').limit(1);
    if (error && error.code === 'PGRST116') {
      return true;
    }
    return !error;
  } catch (e) {
    console.error('Supabase connection test failed:', e);
    return false;
  }
}
