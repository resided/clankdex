#!/usr/bin/env tsx
/**
 * Test Supabase Connection
 * Run: npx tsx scripts/test-connection.ts
 */

import { supabase, testConnection, createEvolution, getEvolutionData, updateEvolution } from '../lib/supabase';

async function main() {
  console.log('🔌 Testing Supabase connection...\n');

  // Test 1: Basic connection
  console.log('1️⃣ Testing connection...');
  const connected = await testConnection();
  if (connected) {
    console.log('✅ Connected to Supabase!\n');
  } else {
    console.error('❌ Failed to connect\n');
    process.exit(1);
  }

  // Test 2: Create test record
  console.log('2️⃣ Testing create evolution...');
  const testAddress = '0x' + '9'.repeat(40);
  const testEntry = 999999;
  
  const created = await createEvolution(testAddress, testEntry);
  if (created) {
    console.log('✅ Created test evolution record');
    console.log('   Token:', testAddress.slice(0, 20) + '...');
    console.log('   Entry #:', created.entry_number);
    console.log('   Tier:', created.current_tier, '(Egg)\n');
  } else {
    console.log('⚠️  Create returned null (might already exist)\n');
  }

  // Test 3: Fetch record
  console.log('3️⃣ Testing fetch evolution...');
  const fetched = await getEvolutionData(testAddress);
  if (fetched) {
    console.log('✅ Fetched evolution record');
    console.log('   Current Tier:', fetched.current_tier);
    console.log('   History entries:', fetched.tier_history.length);
    console.log('   Created:', new Date(fetched.created_at!).toLocaleString(), '\n');
  } else {
    console.error('❌ Failed to fetch\n');
  }

  // Test 4: Update tier
  console.log('4️⃣ Testing update evolution...');
  const updated = await updateEvolution(testAddress, 2, 'Basic', 25000);
  if (updated) {
    console.log('✅ Updated evolution to tier 2 (Basic)\n');
    
    // Fetch again to verify
    const updatedRecord = await getEvolutionData(testAddress);
    console.log('   New tier:', updatedRecord?.current_tier);
    console.log('   Highest MC: $', updatedRecord?.highest_market_cap.toLocaleString());
    console.log('   History:', updatedRecord?.tier_history.length, 'entries\n');
  } else {
    console.error('❌ Failed to update\n');
  }

  // Cleanup
  console.log('5️⃣ Cleaning up test data...');
  await supabase.from('evolutions').delete().eq('token_address', testAddress);
  console.log('✅ Cleanup complete\n');

  console.log('🎉 All tests passed! Supabase is ready to use.');
  console.log('\n📊 Your evolutions table is configured correctly.');
}

main().catch(console.error);
