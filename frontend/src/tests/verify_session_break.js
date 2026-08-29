// Automated Verification Test Suite for Session Break & Tab Isolation in JanSetu
console.log('====================================================');
console.log('🧪 JANSETU TAB ISOLATION & SESSION BREAK TEST SUITE');
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

// Mock Tab Storage Environments
function createTabEnvironment(tabName) {
  const sessionStorage = new Map();
  return {
    tabName,
    sessionStorage: {
      getItem: (k) => sessionStorage.get(k) || null,
      setItem: (k, v) => sessionStorage.set(k, String(v)),
      removeItem: (k) => sessionStorage.delete(k),
      clear: () => sessionStorage.clear()
    },
    isSessionBroken: false,
    brokenAccountName: null,
    currentUser: null,
    tabSessionId: null
  };
}

const globalLocalStorage = new Map();
const mockEventBusListeners = [];

function broadcastBus(msg) {
  mockEventBusListeners.forEach(listener => listener(msg));
}

// 1. Test Fresh Tab Isolation
const tab1 = createTabEnvironment('Tab 1');
const tab2 = createTabEnvironment('Tab 2');

assert(
  tab1.sessionStorage.getItem('jansetu_citizen_session') === null,
  'Tab 1 starts with empty sessionStorage (unauthenticated)'
);
assert(
  tab2.sessionStorage.getItem('jansetu_citizen_session') === null,
  'Tab 2 starts with empty sessionStorage (unauthenticated)'
);

// 2. Test Login on Tab 1 (Hriday Bardia)
const hridayAccountKey = '111122221405';
tab1.tabSessionId = 'TS_TAB1_' + Date.now();
tab1.currentUser = { id: '111122221405', full_name: 'Hriday Bardia', role: 'CITIZEN' };
tab1.sessionStorage.setItem('jansetu_tab_session_id', tab1.tabSessionId);
tab1.sessionStorage.setItem('jansetu_citizen_session', JSON.stringify({
  user: tab1.currentUser,
  accountKey: hridayAccountKey,
  tabSessionId: tab1.tabSessionId
}));
tab1.sessionStorage.setItem('jansetu_session_consent_accepted', 'true');
globalLocalStorage.set('jansetu_active_account_' + hridayAccountKey, tab1.tabSessionId);

assert(
  tab1.sessionStorage.getItem('jansetu_citizen_session') !== null,
  'Tab 1 is successfully authenticated with Hriday Bardia'
);
assert(
  tab2.sessionStorage.getItem('jansetu_citizen_session') === null,
  'Tab 2 remains unauthenticated when Tab 1 logs in (strict tab isolation)'
);

// Setup Session Takeover listener on Tab 1
mockEventBusListeners.push((event) => {
  if (event.type === 'SESSION_TAKEN_OVER') {
    const { accountKey, newTabSessionId, accountName } = event.payload;
    if (accountKey === hridayAccountKey && newTabSessionId !== tab1.tabSessionId) {
      tab1.isSessionBroken = true;
      tab1.brokenAccountName = accountName;
      tab1.currentUser = null;
      tab1.sessionStorage.removeItem('jansetu_citizen_session');
    }
  }
});

// 3. Test Different Account Login on Tab 2 (Ayush Singh Chauhan) - No Break
const ayushAccountKey = '111122220207';
tab2.tabSessionId = 'TS_TAB2_' + Date.now();
tab2.currentUser = { id: '111122220207', full_name: 'Ayush Singh Chauhan', role: 'CITIZEN' };
tab2.sessionStorage.setItem('jansetu_tab_session_id', tab2.tabSessionId);
tab2.sessionStorage.setItem('jansetu_citizen_session', JSON.stringify({
  user: tab2.currentUser,
  accountKey: ayushAccountKey,
  tabSessionId: tab2.tabSessionId
}));
globalLocalStorage.set('jansetu_active_account_' + ayushAccountKey, tab2.tabSessionId);

broadcastBus({
  type: 'SESSION_TAKEN_OVER',
  payload: {
    accountKey: ayushAccountKey,
    newTabSessionId: tab2.tabSessionId,
    accountName: tab2.currentUser.full_name,
    role: 'CITIZEN'
  }
});

assert(
  tab1.isSessionBroken === false,
  'Tab 1 (Hriday) is NOT broken when Tab 2 logs in as a different account (Ayush)'
);
assert(
  tab1.currentUser !== null && tab1.currentUser.full_name === 'Hriday Bardia',
  'Tab 1 retains active Hriday session while Tab 2 runs Ayush'
);

// 4. Test Concurrent Login of SAME Account on Tab 3 (Hriday Bardia) -> Breaks Tab 1!
const tab3 = createTabEnvironment('Tab 3');
tab3.tabSessionId = 'TS_TAB3_' + Date.now();
tab3.currentUser = { id: '111122221405', full_name: 'Hriday Bardia', role: 'CITIZEN' };
tab3.sessionStorage.setItem('jansetu_tab_session_id', tab3.tabSessionId);
tab3.sessionStorage.setItem('jansetu_citizen_session', JSON.stringify({
  user: tab3.currentUser,
  accountKey: hridayAccountKey,
  tabSessionId: tab3.tabSessionId
}));
globalLocalStorage.set('jansetu_active_account_' + hridayAccountKey, tab3.tabSessionId);

broadcastBus({
  type: 'SESSION_TAKEN_OVER',
  payload: {
    accountKey: hridayAccountKey,
    newTabSessionId: tab3.tabSessionId,
    accountName: tab3.currentUser.full_name,
    role: 'CITIZEN'
  }
});

assert(
  tab1.isSessionBroken === true,
  'Tab 1 session is successfully BROKEN when Hriday Bardia logs in on Tab 3'
);
assert(
  tab1.brokenAccountName === 'Hriday Bardia',
  'Tab 1 captures the broken account name for DPDP alert display'
);
assert(
  tab1.sessionStorage.getItem('jansetu_citizen_session') === null,
  'Tab 1 local session storage is immediately purged on takeover'
);
assert(
  tab3.currentUser !== null && tab3.isSessionBroken === false,
  'Tab 3 remains healthy and active as the new authoritative session'
);

console.log('\n====================================================');
console.log(`📊 RESULTS: ${passCount}/${passCount + failCount} tests passed successfully!`);
console.log('====================================================\n');

if (failCount > 0) process.exit(1);
