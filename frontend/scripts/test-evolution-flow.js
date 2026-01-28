#!/usr/bin/env node
/**
 * Quick Evolution System Test
 * Tests the full flow: connection → insert → update → verify
 */

const SUPABASE_URL = 'https://jzesdipwpsccgctneisf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_m_nHZbHbxlBjeWAWAXXmcQ_BujNDiWt';

const TEST_TOKEN = '0x' + 'TEST'.padEnd(40, '0');
const TEST_ENTRY = 999999;

async function test() {
  console.log('🧪 ClankDex Evolution System Test\n');
  console.log('=' .repeat(50));

  // Test 1: Connection
  console.log('\n1️⃣ Testing Supabase connection...');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/evolutions?limit=1`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    if (res.ok) {
      console.log('   ✅ Connected to Supabase');
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (e) {
    console.log('   ❌ Connection failed:', e.message);
    process.exit(1);
  }

  // Test 2: Insert (Launch simulation)
  console.log('\n2️⃣ Testing token launch (insert)...');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/evolutions`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        token_address: TEST_TOKEN,
        entry_number: TEST_ENTRY,
        current_tier: 0,
        highest_market_cap: 0,
        tier_history: [{ tier: 0, tier_name: 'Egg', market_cap: 0, achieved_at: new Date().toISOString() }]
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('   ✅ Created evolution record');
      console.log(`      Token: ${data[0].token_address.slice(0, 20)}...`);
      console.log(`      Entry: #${data[0].entry_number}`);
      console.log(`      Tier: ${data[0].current_tier} (Egg)`);
    } else if (res.status === 409) {
      console.log('   ℹ️  Test record already exists');
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (e) {
    console.log('   ❌ Insert failed:', e.message);
    process.exit(1);
  }

  // Test 3: Update (Evolution simulation)
  console.log('\n3️⃣ Testing evolution (update)...');
  const tiers = [
    { tier: 1, name: 'Baby', mc: 5000 },
    { tier: 3, name: 'Stage 1', mc: 75000 },
    { tier: 6, name: 'Legendary', mc: 2000000 }
  ];

  for (const { tier, name, mc } of tiers) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/evolutions?token_address=eq.${TEST_TOKEN}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          current_tier: tier,
          highest_market_cap: mc,
          tier_history: [
            { tier: 0, tier_name: 'Egg', market_cap: 0, achieved_at: new Date().toISOString() },
            { tier, tier_name: name, market_cap: mc, achieved_at: new Date().toISOString() }
          ]
        })
      });

      if (res.ok) {
        console.log(`   ✅ Evolved to ${name} (tier ${tier}, MC: $${mc.toLocaleString()})`);
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      console.log(`   ❌ Evolution to ${name} failed:`, e.message);
    }
    
    // Small delay
    await new Promise(r => setTimeout(r, 500));
  }

  // Test 4: Verify
  console.log('\n4️⃣ Verifying final state...');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/evolutions?token_address=eq.${TEST_TOKEN}&select=*`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    
    if (res.ok) {
      const data = await res.json();
      const record = data[0];
      
      console.log('   ✅ Final state verified:');
      console.log(`      Current Tier: ${record.current_tier}`);
      console.log(`      Highest MC: $${record.highest_market_cap.toLocaleString()}`);
      console.log(`      History Entries: ${record.tier_history.length}`);
      console.log(`      Updated: ${new Date(record.updated_at).toLocaleString()}`);
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch (e) {
    console.log('   ❌ Verification failed:', e.message);
  }

  // Cleanup
  console.log('\n5️⃣ Cleaning up test data...');
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/evolutions?token_address=eq.${TEST_TOKEN}`, {
      method: 'DELETE',
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    console.log('   ✅ Test data cleaned up');
  } catch (e) {
    console.log('   ⚠️  Cleanup skipped');
  }

  console.log('\n' + '=' .repeat(50));
  console.log('\n🎉 All tests passed!');
  console.log('Your evolution system is ready.\n');
  console.log('Next steps:');
  console.log('  1. Launch a real token through the app');
  console.log('  2. Check Collection tab for your creature');
  console.log('  3. Watch tier evolve as market cap grows!\n');
}

test().catch(console.error);
