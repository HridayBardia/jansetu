// Utility for deterministic persona matching & smart Document Vault detection

export interface CitizenIdentity {
  name?: string;
  aadhaar?: string;
  username?: string;
}

export interface TargetIdentity {
  citizenName?: string;
  citizenId?: string;
  appId?: string;
}

/**
 * Deterministically checks if a target request matches the currently active citizen session.
 * Prevents cross-citizen notification / alert leakage.
 */
export function isCitizenMatching(
  target: TargetIdentity,
  citizen: CitizenIdentity
): boolean {
  const citName = (citizen.name || '').toLowerCase().trim();
  const citAadhaar = (citizen.aadhaar || '').replace(/\D/g, '');
  const citUser = (citizen.username || '').toLowerCase().trim();

  // If no citizen context exists, no match
  if (!citName && !citAadhaar && !citUser) return false;

  const targetName = (target.citizenName || '').toLowerCase().trim();
  const targetId = (target.citizenId || '').replace(/\D/g, '');
  const targetAppId = (target.appId || '').trim();

  // 1. Explicit Application ID Matching
  if (targetAppId === 'JS-2026-8801') {
    return citName.includes('ayush') || citAadhaar.endsWith('0207') || citUser.includes('ayush');
  }
  if (targetAppId === 'JS-2026-8802') {
    return citName.includes('hriday') || citAadhaar.endsWith('1405') || citUser.includes('hriday');
  }
  if (targetAppId === 'JS-2026-8803') {
    return citName.includes('varad') || citAadhaar.endsWith('1304') || citUser.includes('varad');
  }
  if (targetAppId === 'JS-2026-8804') {
    return citName.includes('satwik') || citAadhaar.endsWith('3333') || citUser.includes('satwik');
  }

  // 2. Specific Demo Personas Name Matching
  if (targetName) {
    if (targetName.includes('ayush')) return citName.includes('ayush') || citAadhaar.endsWith('0207') || citUser.includes('ayush');
    if (targetName.includes('hriday')) return citName.includes('hriday') || citAadhaar.endsWith('1405') || citUser.includes('hriday');
    if (targetName.includes('varad')) return citName.includes('varad') || citAadhaar.endsWith('1304') || citUser.includes('varad');
    if (targetName.includes('satwik')) return citName.includes('satwik') || citAadhaar.endsWith('3333') || citUser.includes('satwik');

    // General Substring Matching
    if (citName && (citName.includes(targetName) || targetName.includes(citName))) return true;
    if (citUser && (citUser.includes(targetName) || targetName.includes(citUser))) return true;
  }

  // 3. Aadhaar UID matching
  if (targetId && citAadhaar && (targetId === citAadhaar || citAadhaar.endsWith(targetId) || targetId.endsWith(citAadhaar))) {
    return true;
  }

  return false;
}

export interface VaultCheckResult {
  isInVault: boolean;
  docName: string;
  vaultDocTitle?: string;
  source?: string;
  status?: string;
}

/**
 * Smart Document Vault Detector:
 * Inspects citizen's local vault catalog & storage to determine if the requested document
 * is already available in the Document Vault or needs direct device upload.
 */
export function checkDocInVault(requestedDocName: string): VaultCheckResult {
  if (!requestedDocName) {
    return { isInVault: false, docName: '' };
  }

  const cleanReq = requestedDocName.toLowerCase().trim();

  // Catalog of standard citizen documents present in JanSetu Vault / DigiLocker
  const defaultVaultDocs = [
    { name: 'Aadhaar Card', type: 'Aadhaar Card', fileName: 'Aadhaar.pdf', source: 'DigiLocker', status: 'VERIFIED' },
    { name: 'PAN Card', type: 'PAN Card', fileName: 'PAN.pdf', source: 'Income Tax Dept', status: 'VERIFIED' },
    { name: 'Driving Licence', type: 'Driving Licence', fileName: 'Driving_Licence.pdf', source: 'Parivahan', status: 'VERIFIED' },
    { name: 'Voter ID', type: 'Voter ID', fileName: 'Voter_ID.pdf', source: 'Election Commission', status: 'VERIFIED' },
    { name: '10th Marksheet', type: '10th Marksheet', fileName: '10th_Marksheet.pdf', source: 'CBSE / State Board', status: 'VERIFIED' },
    { name: '12th Marksheet', type: '12th Marksheet', fileName: '12th_Marksheet.pdf', source: 'CBSE / State Board', status: 'VERIFIED' },
    { name: 'Degree Certificate', type: 'Degree Certificate', fileName: 'Degree_Certificate.pdf', source: 'University Registry', status: 'VERIFIED' },
  ];

  let customDocs: any[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('jansetu_documents');
      if (stored) {
        customDocs = JSON.parse(stored);
      }
    } catch (e) {}
  }

  const allDocs = [...customDocs, ...defaultVaultDocs];

  const matched = allDocs.find((doc) => {
    const dName = (doc.name || doc.document_name || doc.type || doc.document_type || doc.fileName || doc.file_name || '').toLowerCase();
    
    // Exact or partial substring match
    if (dName && cleanReq && (dName.includes(cleanReq) || cleanReq.includes(dName))) {
      return true;
    }

    // Specialized keyword mappings
    if (cleanReq.includes('khasra') || cleanReq.includes('land') || cleanReq.includes('patta')) {
      return dName.includes('land') || dName.includes('khasra') || dName.includes('property') || dName.includes('revenue');
    }
    if (cleanReq.includes('marksheet') || cleanReq.includes('polytechnic') || cleanReq.includes('diploma') || cleanReq.includes('transcript')) {
      return dName.includes('marksheet') || dName.includes('degree') || dName.includes('diploma') || dName.includes('certificate');
    }
    if (cleanReq.includes('income') || cleanReq.includes('salary')) {
      return dName.includes('income') || dName.includes('pan') || dName.includes('salary');
    }
    if (cleanReq.includes('site') || cleanReq.includes('inspection') || cleanReq.includes('photo')) {
      return dName.includes('site') || dName.includes('photo') || dName.includes('geo');
    }

    return false;
  });

  if (matched) {
    return {
      isInVault: true,
      docName: requestedDocName,
      vaultDocTitle: matched.name || matched.document_name || matched.type || requestedDocName,
      source: matched.source || 'DigiLocker / State Geo-Registry',
      status: matched.status || 'VERIFIED'
    };
  }

  return {
    isInVault: false,
    docName: requestedDocName
  };
}
