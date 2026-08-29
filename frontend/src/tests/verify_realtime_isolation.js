const { isCitizenMatching, checkDocInVault } = require('../lib/vaultDetection');

console.log('====================================================');
console.log('🧪 JANSETU REAL-TIME & PERSONA ISOLATION TEST SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// 1. Citizen Profiles for Testing
const citizenAyush = { name: 'Ayush Singh Chauhan', aadhaar: '1111 2222 0207', username: 'ayush' };
const citizenHriday = { name: 'Hriday Bardia', aadhaar: '1111 2222 1405', username: 'hriday' };
const citizenVarad = { name: 'Varad Kanade', aadhaar: '1111 2222 1304', username: 'varad' };
const citizenSatwik = { name: 'Satwik Guru', aadhaar: '1111 2222 3333', username: 'satwik' };

// 2. Test Strict Persona Isolation for Hriday's Request (JS-2026-8802)
const hridayRequest = {
  appId: 'JS-2026-8802',
  citizenName: 'Hriday Bardia',
  citizenId: '1111 2222 1405'
};

assert(isCitizenMatching(hridayRequest, citizenHriday) === true, 'Hriday receives request targeted for Hriday');
assert(isCitizenMatching(hridayRequest, citizenAyush) === false, 'Ayush does NOT receive request targeted for Hriday');
assert(isCitizenMatching(hridayRequest, citizenVarad) === false, 'Varad does NOT receive request targeted for Hriday');
assert(isCitizenMatching(hridayRequest, citizenSatwik) === false, 'Satwik does NOT receive request targeted for Hriday');

// 3. Test Strict Persona Isolation for Ayush's Request (JS-2026-8801)
const ayushRequest = {
  appId: 'JS-2026-8801',
  citizenName: 'Ayush Singh Chauhan',
  citizenId: '1111 2222 0207'
};

assert(isCitizenMatching(ayushRequest, citizenAyush) === true, 'Ayush receives request targeted for Ayush');
assert(isCitizenMatching(ayushRequest, citizenHriday) === false, 'Hriday does NOT receive request targeted for Ayush');
assert(isCitizenMatching(ayushRequest, citizenVarad) === false, 'Varad does NOT receive request targeted for Ayush');
assert(isCitizenMatching(ayushRequest, citizenSatwik) === false, 'Satwik does NOT receive request targeted for Ayush');

// 4. Test Strict Persona Isolation for Varad's Request (JS-2026-8803)
const varadRequest = {
  appId: 'JS-2026-8803',
  citizenName: 'Varad Kanade',
  citizenId: '1111 2222 1304'
};

assert(isCitizenMatching(varadRequest, citizenVarad) === true, 'Varad receives request targeted for Varad');
assert(isCitizenMatching(varadRequest, citizenHriday) === false, 'Hriday does NOT receive request targeted for Varad');
assert(isCitizenMatching(varadRequest, citizenAyush) === false, 'Ayush does NOT receive request targeted for Varad');
assert(isCitizenMatching(varadRequest, citizenSatwik) === false, 'Satwik does NOT receive request targeted for Varad');

// 5. Test Strict Persona Isolation for Satwik's Request (JS-2026-8804)
const satwikRequest = {
  appId: 'JS-2026-8804',
  citizenName: 'Satwik Guru',
  citizenId: '1111 2222 3333'
};

assert(isCitizenMatching(satwikRequest, citizenSatwik) === true, 'Satwik receives request targeted for Satwik');
assert(isCitizenMatching(satwikRequest, citizenHriday) === false, 'Hriday does NOT receive request targeted for Satwik');
assert(isCitizenMatching(satwikRequest, citizenAyush) === false, 'Ayush does NOT receive request targeted for Satwik');
assert(isCitizenMatching(satwikRequest, citizenVarad) === false, 'Varad does NOT receive request targeted for Satwik');

// 5b. Test Baseline Default Fallback Persona (Hriday Bardia)
const defaultFallbackCitizen = { name: 'hriday bardia', aadhaar: '111122221405', username: 'hriday' };
assert(isCitizenMatching(hridayRequest, defaultFallbackCitizen) === true, 'Default fallback citizen on portal receives Hriday request');
assert(isCitizenMatching(ayushRequest, defaultFallbackCitizen) === false, 'Default fallback citizen does NOT receive Ayush request');
assert(isCitizenMatching(varadRequest, defaultFallbackCitizen) === false, 'Default fallback citizen does NOT receive Varad request');
assert(isCitizenMatching(satwikRequest, defaultFallbackCitizen) === false, 'Default fallback citizen does NOT receive Satwik request');

// 6. Test Smart Document Vault Detection Intelligence
console.log('\n--- Testing Smart Document Vault Detection ---');

const vaultResultMarksheet = checkDocInVault('Polytechnic Marksheet');
assert(vaultResultMarksheet.isInVault === true, 'Polytechnic Marksheet (Hriday) detected in Document Vault -> Primary: Submit from Vault');

const vaultResultAadhaar = checkDocInVault('Aadhaar Card');
assert(vaultResultAadhaar.isInVault === true, 'Aadhaar Card detected in Document Vault -> Primary: Submit from Vault');

const vaultResultPAN = checkDocInVault('PAN Card');
assert(vaultResultPAN.isInVault === true, 'PAN Card detected in Document Vault -> Primary: Submit from Vault');

const vaultResultDegree = checkDocInVault('Degree Certificate');
assert(vaultResultDegree.isInVault === true, 'Degree Certificate detected in Document Vault -> Primary: Submit from Vault');

const vaultResultKhasra = checkDocInVault('Land Record Khasra');
assert(vaultResultKhasra.isInVault === false, 'Land Record Khasra (Ayush) not in default vault -> Primary: Upload Required Document');

const vaultResultSitePhoto = checkDocInVault('Geo-Tagged Site Inspection Photo');
assert(vaultResultSitePhoto.isInVault === false, 'Geo-Tagged Site Photo (Varad) not in default vault -> Primary: Upload Required Document');

const vaultResultMissing = checkDocInVault('Unregistered Specialized Certificate 2026');
assert(vaultResultMissing.isInVault === false, 'Unknown / unregistered document -> Primary: Upload Required Document');

console.log('\n====================================================');
console.log(`📊 RESULTS: ${passedTests}/${totalTests} tests passed successfully!`);
console.log('====================================================');
