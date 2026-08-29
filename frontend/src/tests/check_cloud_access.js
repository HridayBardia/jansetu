// Quick Cloud Network Access & Supabase Diagnostic Script
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lrkxsxhcknkhqyrvnzrl.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tOXJcq-7LCYS9FjZBhkVIA_2pRW5y3P';

async function checkCloudStatus() {
  console.log('====================================================');
  console.log('🌐 JANSETU CLOUD NETWORK CONNECTIVITY CHECK');
  console.log('====================================================');
  console.log(`Endpoint: ${SUPABASE_URL}`);
  console.log(`Checking connection...\n`);

  const startTime = Date.now();
  const client = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { data, error } = await client.from('applications').select('*').limit(1);
    const latency = Date.now() - startTime;

    if (error) {
      console.log(`⚠️  Cloud Reached with Notice (${latency}ms):`);
      console.log(`   ${error.message}`);
    } else {
      console.log(`✅ Cloud Access: ONLINE & HEALTHY`);
      console.log(`   - Latency: ${latency}ms`);
      console.log(`   - Table 'applications' accessible`);
      console.log(`   - Record sample retrieved: ${data ? data.length : 0} items`);
    }
  } catch (err) {
    console.error(`❌ Cloud Access: OFFLINE / UNREACHABLE`);
    console.error(`   - Error: ${err.message}`);
    console.error(`   - Note: JanSetu will automatically fallback to local FastAPI + SQLite mode.`);
  }

  console.log('====================================================\n');
}

checkCloudStatus();
