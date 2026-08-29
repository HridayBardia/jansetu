// Comprehensive Supabase Interlinking Verification Test Suite
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lrkxsxhcknkhqyrvnzrl.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tOXJcq-7LCYS9FjZBhkVIA_2pRW5y3P';

const client = createClient(SUPABASE_URL, SUPABASE_KEY);

let passCount = 0;
let failCount = 0;

function report(status, testName, detail = '') {
  if (status) {
    console.log(`✅ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
    passCount++;
  } else {
    console.error(`❌ FAIL: ${testName} ${detail ? `[Error: ${detail}]` : ''}`);
    failCount++;
  }
}

async function runVerification() {
  console.log('====================================================');
  console.log('🧪 JANSETU SUPABASE INTERLINKING AUDIT SUITE (V2)');
  console.log('====================================================');
  console.log(`Target Cloud Instance: ${SUPABASE_URL}\n`);

  const testSuffix = Date.now().toString().slice(-6);

  // 1. Test Table: applications (with new operational columns)
  try {
    const testApp = {
      id: `TEST-APP-${testSuffix}`,
      citizen_name: 'Hriday Bardia',
      citizen_id: '1111 2222 1405',
      scheme_name: 'National Apprenticeship Training Scheme',
      category: 'Apprenticeship',
      department: 'Ministry of Education',
      status: 'UNDER_VERIFICATION',
      location: 'Vadodara, Gujarat',
      documents: JSON.stringify([{ id: 'doc1', name: 'Aadhaar' }])
    };

    const { error: upsertErr } = await client.from('applications').upsert(testApp, { onConflict: 'id' });
    report(!upsertErr, 'Applications Table: Upsert with new columns', upsertErr ? upsertErr.message : `ID: ${testApp.id}`);

    // Clean up
    await client.from('applications').delete().eq('id', testApp.id);
  } catch (e) {
    report(false, 'Applications Table: Exception', e.message);
  }

  // 2. Test Table: notifications (with new targeting columns)
  try {
    const testNotif = {
      title: 'e-KYC Request',
      message: 'Department requires document validation',
      type: 'doc_request',
      citizen_name: 'Hriday Bardia',
      citizen_id: '1111 2222 1405',
      app_id: `APP-${testSuffix}`,
      recipient_role: 'CITIZEN'
    };

    const { data: insertedNotif, error: notifInsertErr } = await client.from('notifications').insert(testNotif).select();
    report(!notifInsertErr, 'Notifications Table: Insert with targeting columns', notifInsertErr ? notifInsertErr.message : 'OK');

    if (insertedNotif && insertedNotif[0]) {
      await client.from('notifications').delete().eq('id', insertedNotif[0].id);
    }
  } catch (e) {
    report(false, 'Notifications Table: Exception', e.message);
  }

  // 3. Test Table: consents (with new citizen columns)
  try {
    const testConsent = {
      dept_id: `dept_${testSuffix}`,
      dept_name: 'Ministry of Education',
      purpose: 'Verification under DPDP',
      status: 'ACTIVE',
      citizen_name: 'Hriday Bardia',
      citizen_id: '1111 2222 1405'
    };

    const { error: consentUpsertErr } = await client.from('consents').upsert(testConsent, { onConflict: 'dept_id' });
    report(!consentUpsertErr, 'Consents Table: Upsert with citizen data', consentUpsertErr ? consentUpsertErr.message : 'OK');

    await client.from('consents').delete().eq('dept_id', testConsent.dept_id);
  } catch (e) {
    report(false, 'Consents Table: Exception', e.message);
  }

  // 4. Test Table: journeys (with UUID and operational columns)
  try {
    const testJourney = {
      id: crypto.randomUUID(),
      title: 'Apprenticeship Application',
      category: 'Education',
      citizen_name: 'Hriday Bardia',
      status: 'In Progress',
      progress: 25,
      current_stage: 'Initial Documentation',
      documents_ready: 1,
      documents_total: 4
    };

    const { error: journeyErr } = await client.from('journeys').upsert(testJourney);
    report(!journeyErr, 'Journeys Table: Upsert with operational columns', journeyErr ? journeyErr.message : 'OK');
    
    await client.from('journeys').delete().eq('id', testJourney.id);
  } catch (e) {
    report(false, 'Journeys Table: Exception', e.message);
  }

  // 5. Test Table: doc_requests (NEW TABLE)
  try {
    const testDocReq = {
      id: `REQ_${testSuffix}`,
      dept_name: 'Ministry of Education',
      doc_type: 'Polytechnic Marksheet',
      citizen_name: 'Hriday Bardia',
      citizen_id: '1111 2222 1405',
      app_id: `APP-${testSuffix}`,
      status: 'PENDING'
    };

    const { error: docReqErr } = await client.from('doc_requests').upsert(testDocReq);
    report(!docReqErr, 'Doc Requests Table: Creation & Upsert', docReqErr ? docReqErr.message : 'OK');

    await client.from('doc_requests').delete().eq('id', testDocReq.id);
  } catch (e) {
    report(false, 'Doc Requests Table: Exception', e.message);
  }

  console.log('\n====================================================');
  console.log(`📊 RESULTS: ${passCount}/${passCount + failCount} Interlinking Tests Passed!`);
  console.log('====================================================\n');
  
  if (failCount > 0) {
    console.error('⚠️ ATTENTION: Some tests failed. Ensure you have run the schema migration SQL in the Supabase Dashboard.');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification();
