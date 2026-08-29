// Automated Verification Test for Incognito & Cross-Browser Event Relay
const BACKEND_URL = 'http://127.0.0.1:8000';

async function runIncognitoRelayTest() {
  console.log('====================================================');
  console.log('🧪 JANSETU INCOGNITO & CROSS-WINDOW RELAY TEST SUITE');
  console.log('====================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failCount++;
    }
  }

  // 1. Check backend readiness
  try {
    const healthRes = await fetch(`${BACKEND_URL}/health`);
    assert(healthRes.ok, 'FastAPI Backend is running and reachable on http://127.0.0.1:8000');
  } catch (e) {
    console.error('❌ FAIL: Backend is not reachable:', e.message);
    process.exit(1);
  }

  const incognitoTabId = 'TAB_INCOGNITO_' + Date.now();
  const normalCitizenTabId = 'TAB_NORMAL_' + Date.now();
  const testEventId = 'EVT_TEST_' + Date.now();

  const mockAdminPayload = {
    id: testEventId,
    type: 'DOC_KYC_REQUEST',
    sender: 'ADMIN',
    senderTabId: incognitoTabId,
    timestamp: new Date().toISOString(),
    payload: {
      id: testEventId,
      appId: 'JS-2026-8802',
      schemeName: 'National Apprenticeship Training Scheme (NATS)',
      deptName: 'Ministry of Education',
      targetCitizenName: 'Hriday Bardia',
      targetCitizenUid: '1111 2222 1405',
      targetUidLast4: '1405',
      citizenId: '1111 2222 1405',
      requestedDoc: 'Polytechnic Marksheet',
      docType: 'polytechnic_marksheet',
      status: 'ACTION_REQUIRED'
    }
  };

  // 2. Admin in Incognito dispatches e-KYC request to backend relay
  console.log('1. Admin in Incognito Window clicks "Request Citizen e-KYC"...');
  try {
    const postRes = await fetch(`${BACKEND_URL}/api/v1/events/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockAdminPayload)
    });
    assert(postRes.ok, 'Incognito Admin successfully posts event to /api/v1/events/broadcast');
    const postData = await postRes.json();
    assert(postData.data && postData.data.id === testEventId, 'Backend acknowledges and enqueues event relay');
  } catch (e) {
    assert(false, `Post error: ${e.message}`);
  }

  // 3. Citizen in Normal Window polls backend relay
  console.log('2. Citizen in Normal Window polls /api/v1/events/poll...');
  try {
    const pollRes = await fetch(`${BACKEND_URL}/api/v1/events/poll?since=0`);
    assert(pollRes.ok, 'Normal Citizen successfully polls /api/v1/events/poll');
    const pollData = await pollRes.json();
    const events = pollData.data?.events || [];
    
    const matchingEvent = events.find(e => e.id === testEventId);
    assert(!!matchingEvent, 'Normal Citizen receives the cross-window Incognito event');
    assert(matchingEvent.senderTabId === incognitoTabId, 'Event provenance preserves Incognito source ID');
    assert(matchingEvent.payload.requestedDoc === 'Polytechnic Marksheet', 'Event payload preserves requested document');
    assert(matchingEvent.payload.targetCitizenName === 'Hriday Bardia', 'Event payload preserves target beneficiary name');
  } catch (e) {
    assert(false, `Poll error: ${e.message}`);
  }

  console.log('\n====================================================');
  console.log(`📊 RESULTS: ${passCount}/${passCount + failCount} Tests Passed!`);
  console.log('====================================================\n');

  if (failCount > 0) process.exit(1);
}

runIncognitoRelayTest();
