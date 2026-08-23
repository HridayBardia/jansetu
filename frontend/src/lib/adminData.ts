/**
 * ADMIN DATA — Single Source of Truth
 * 
 * All admin portal sections (Citizens, Applications, Workflows, Data Quality)
 * read from this module. This ensures consistency across the admin dashboard.
 */

// ==========================================
// CITIZENS
// ==========================================
export interface AdminCitizen {
  id: string;
  name: string;
  username: string;
  domicile: string;
  location: string;
  status: 'Active' | 'Action Required' | 'Pending KYC';
  lastActive: string;
  documentsTotal: number;
  documentsVerified: number;
  documentsPending: number;
  activeApplications: number;
  activeWorkflows: number;
  lastGoal: string;
  profileCompletion: number;
  lastActivity: string;
  assignedTo: 'DISHITA' | 'JYOTI';
  documents: { name: string; status: 'Verified' | 'Pending' | 'Expired' }[];
  applications: { id: string; service: string; status: string }[];
  recentActivity: string[];
}

export const ALL_CITIZENS: AdminCitizen[] = [
  {
    id: 'CIT-001',
    name: 'Hriday Bardia',
    username: 'hriday',
    domicile: 'Gujarat',
    location: 'Vadodara, Gujarat',
    status: 'Active',
    lastActive: 'Today, 10:42 PM',
    documentsTotal: 8,
    documentsVerified: 6,
    documentsPending: 2,
    activeApplications: 2,
    activeWorkflows: 2,
    lastGoal: 'I want to start a business in Assam',
    profileCompletion: 78,
    lastActivity: 'Document uploaded',
    assignedTo: 'DISHITA',
    documents: [
      { name: 'Aadhaar Card', status: 'Verified' },
      { name: 'PAN Card', status: 'Verified' },
      { name: 'Driving Licence', status: 'Verified' },
      { name: 'Passport', status: 'Verified' },
      { name: '10th Marksheet', status: 'Verified' },
      { name: '12th Marksheet', status: 'Verified' },
      { name: 'Income Certificate', status: 'Pending' },
      { name: 'Domicile Certificate', status: 'Pending' },
    ],
    applications: [
      { id: 'APP-2026-001', service: 'Business Registration', status: 'UNDER_VERIFICATION' },
      { id: 'APP-2026-002', service: 'Government Business Support', status: 'DOCUMENTS_REQUIRED' },
    ],
    recentActivity: [
      'Document uploaded — Income Certificate',
      'Goal analyzed — Start a business in Assam',
      'Application submitted — Business Registration',
      'Identity verified via Aadhaar e-KYC',
    ],
  },
  {
    id: 'CIT-002',
    name: 'Varad Kanade',
    username: 'varad',
    domicile: 'Maharashtra',
    location: 'Pune, Maharashtra',
    status: 'Active',
    lastActive: 'Today, 8:15 PM',
    documentsTotal: 6,
    documentsVerified: 5,
    documentsPending: 1,
    activeApplications: 1,
    activeWorkflows: 1,
    lastGoal: 'I want to study masters in Australia',
    profileCompletion: 84,
    lastActivity: 'Application submitted',
    assignedTo: 'DISHITA',
    documents: [
      { name: 'Aadhaar Card', status: 'Verified' },
      { name: 'PAN Card', status: 'Verified' },
      { name: '10th Marksheet', status: 'Verified' },
      { name: '12th Marksheet', status: 'Verified' },
      { name: 'Degree Certificate', status: 'Verified' },
      { name: 'English Proficiency Test', status: 'Pending' },
    ],
    applications: [
      { id: 'APP-2026-003', service: 'Higher Education Assistance', status: 'UNDER_REVIEW' },
    ],
    recentActivity: [
      'Goal analyzed — Study masters in Australia',
      'Application submitted — Higher Education Assistance',
      'Academic records verified',
      'Passport verified via DigiLocker',
    ],
  },
  {
    id: 'CIT-003',
    name: 'Satwik',
    username: 'satwik',
    domicile: 'Karnataka',
    location: 'Bangalore, Karnataka',
    status: 'Active',
    lastActive: 'Yesterday, 6:30 PM',
    documentsTotal: 7,
    documentsVerified: 5,
    documentsPending: 2,
    activeApplications: 2,
    activeWorkflows: 1,
    lastGoal: 'I want to buy land in Bangalore',
    profileCompletion: 72,
    lastActivity: 'Property document pending',
    assignedTo: 'JYOTI',
    documents: [
      { name: 'Aadhaar Card', status: 'Verified' },
      { name: 'PAN Card', status: 'Verified' },
      { name: 'Driving Licence', status: 'Verified' },
      { name: '10th Marksheet', status: 'Verified' },
      { name: 'Bank Passbook', status: 'Verified' },
      { name: 'Sale Agreement', status: 'Pending' },
      { name: 'Encumbrance Certificate', status: 'Pending' },
    ],
    applications: [
      { id: 'APP-2026-004', service: 'Property Registration', status: 'SUBMITTED' },
      { id: 'APP-2026-005', service: 'Property-related Government Service', status: 'ACTION_REQUIRED' },
    ],
    recentActivity: [
      'Goal analyzed — Buy land in Bangalore',
      'Application submitted — Property Registration',
      'Title verification initiated',
      'Document pending — Sale Agreement',
    ],
  },
  {
    id: 'CIT-004',
    name: 'Ayush',
    username: 'ayush',
    domicile: 'Rajasthan',
    location: 'Jaipur, Rajasthan',
    status: 'Action Required',
    lastActive: 'Yesterday, 4:15 PM',
    documentsTotal: 5,
    documentsVerified: 3,
    documentsPending: 2,
    activeApplications: 1,
    activeWorkflows: 1,
    lastGoal: 'I want to start a business',
    profileCompletion: 65,
    lastActivity: 'Document verification required',
    assignedTo: 'JYOTI',
    documents: [
      { name: 'Aadhaar Card', status: 'Verified' },
      { name: 'PAN Card', status: 'Verified' },
      { name: 'Domicile Certificate', status: 'Verified' },
      { name: 'Income Certificate', status: 'Pending' },
      { name: 'Caste Certificate', status: 'Pending' },
    ],
    applications: [
      { id: 'APP-2026-006', service: 'Business Support Scheme', status: 'DOCUMENTS_REQUIRED' },
    ],
    recentActivity: [
      'Goal analyzed — Start a business',
      'Application submitted — Business Support Scheme',
      'Document verification required — Income Certificate',
      'Document verification required — Caste Certificate',
    ],
  },
];

export function getCitizensForAdmin(adminUsername: string): AdminCitizen[] {
  const normalized = (adminUsername || '').toLowerCase();
  if (normalized === 'dishita') {
    return ALL_CITIZENS.filter(c => c.assignedTo === 'DISHITA');
  }
  if (normalized === 'jyoti') {
    return ALL_CITIZENS.filter(c => c.assignedTo === 'JYOTI');
  }
  // Default: show all
  return ALL_CITIZENS;
}

// ==========================================
// APPLICATIONS
// ==========================================
export interface AdminApplication {
  id: string;
  citizenName: string;
  citizenId: string;
  service: string;
  department: string;
  location: string;
  status: 'SUBMITTED' | 'UNDER_VERIFICATION' | 'UNDER_REVIEW' | 'DOCUMENTS_REQUIRED' | 'ACTION_REQUIRED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  sla: string;
  submittedDate: string;
  lastUpdated: string;
  nextAction: string;
  documents: { name: string; status: 'verified' | 'pending' | 'required' }[];
  workflow: { step: string; status: 'completed' | 'current' | 'pending' }[];
  assignedTo: 'DISHITA' | 'JYOTI';
  timeline: { title: string; description: string; timestamp: string; status: string }[];
}

const today = new Date();
const daysAgo = (d: number) => new Date(today.getTime() - d * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const hoursAgo = (h: number) => new Date(today.getTime() - h * 3600000).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const ALL_APPLICATIONS: AdminApplication[] = [
  {
    id: 'APP-2026-001',
    citizenName: 'Hriday Bardia',
    citizenId: 'CIT-001',
    service: 'Business Registration',
    department: 'Industries Commissionerate, Gujarat',
    location: 'Assam',
    status: 'UNDER_VERIFICATION',
    sla: 'On Track',
    submittedDate: daysAgo(2),
    lastUpdated: hoursAgo(3),
    nextAction: 'Verify business documents',
    documents: [
      { name: 'PAN Card', status: 'verified' },
      { name: 'Aadhaar Card', status: 'verified' },
      { name: 'Address Proof', status: 'verified' },
      { name: 'Business Proof', status: 'pending' },
    ],
    workflow: [
      { step: 'Application Submitted', status: 'completed' },
      { step: 'Documents Received', status: 'completed' },
      { step: 'Verification', status: 'current' },
      { step: 'Department Review', status: 'pending' },
    ],
    assignedTo: 'DISHITA',
    timeline: [
      { title: 'Application Created', description: 'Business registration form submitted.', timestamp: daysAgo(2), status: 'SUBMITTED' },
      { title: 'Documents Received', description: 'PAN, Aadhaar, and address proof received.', timestamp: daysAgo(1), status: 'DOCUMENTS_RECEIVED' },
      { title: 'Verification Initiated', description: 'Identity and address checks via Interop Gateway.', timestamp: hoursAgo(3), status: 'UNDER_VERIFICATION' },
    ],
  },
  {
    id: 'APP-2026-002',
    citizenName: 'Hriday Bardia',
    citizenId: 'CIT-001',
    service: 'Government Business Support',
    department: 'Ministry of MSME',
    location: 'Gujarat',
    status: 'DOCUMENTS_REQUIRED',
    sla: 'Action Required',
    submittedDate: daysAgo(3),
    lastUpdated: hoursAgo(8),
    nextAction: 'Upload income / business documents',
    documents: [
      { name: 'PAN Card', status: 'verified' },
      { name: 'Aadhaar Card', status: 'verified' },
      { name: 'Income Certificate', status: 'required' },
      { name: 'Business Plan', status: 'required' },
    ],
    workflow: [
      { step: 'Application Submitted', status: 'completed' },
      { step: 'Document Collection', status: 'current' },
      { step: 'Eligibility Review', status: 'pending' },
      { step: 'Approval', status: 'pending' },
    ],
    assignedTo: 'DISHITA',
    timeline: [
      { title: 'Application Created', description: 'Government business support scheme application submitted.', timestamp: daysAgo(3), status: 'SUBMITTED' },
      { title: 'Documents Required', description: 'Income certificate and business plan needed.', timestamp: hoursAgo(8), status: 'DOCUMENTS_REQUIRED' },
    ],
  },
  {
    id: 'APP-2026-003',
    citizenName: 'Varad Kanade',
    citizenId: 'CIT-002',
    service: 'Higher Education Assistance',
    department: 'Ministry of Education',
    location: 'Australia',
    status: 'UNDER_REVIEW',
    sla: 'On Track',
    submittedDate: daysAgo(5),
    lastUpdated: hoursAgo(6),
    nextAction: 'Verify education documents',
    documents: [
      { name: 'Aadhaar Card', status: 'verified' },
      { name: '10th Marksheet', status: 'verified' },
      { name: '12th Marksheet', status: 'verified' },
      { name: 'Degree Certificate', status: 'verified' },
      { name: 'English Proficiency Test', status: 'pending' },
    ],
    workflow: [
      { step: 'Application Submitted', status: 'completed' },
      { step: 'Documents Verified', status: 'completed' },
      { step: 'Eligibility Review', status: 'current' },
      { step: 'Scholarship Approval', status: 'pending' },
    ],
    assignedTo: 'DISHITA',
    timeline: [
      { title: 'Application Created', description: 'Higher education assistance application submitted.', timestamp: daysAgo(5), status: 'SUBMITTED' },
      { title: 'Documents Verified', description: 'Academic records verified via DigiLocker.', timestamp: daysAgo(3), status: 'DOCUMENTS_VERIFIED' },
      { title: 'Under Review', description: 'Eligibility review in progress.', timestamp: hoursAgo(6), status: 'UNDER_REVIEW' },
    ],
  },
  {
    id: 'APP-2026-004',
    citizenName: 'Satwik',
    citizenId: 'CIT-003',
    service: 'Property Registration',
    department: 'Kaveri Online Services, Karnataka',
    location: 'Bangalore',
    status: 'SUBMITTED',
    sla: 'On Track',
    submittedDate: daysAgo(1),
    lastUpdated: daysAgo(1),
    nextAction: 'Document verification',
    documents: [
      { name: 'Aadhaar Card', status: 'verified' },
      { name: 'PAN Card', status: 'verified' },
      { name: 'Sale Agreement', status: 'pending' },
      { name: 'Title Deed', status: 'pending' },
    ],
    workflow: [
      { step: 'Application Submitted', status: 'completed' },
      { step: 'Document Verification', status: 'current' },
      { step: 'Stamp Duty Payment', status: 'pending' },
      { step: 'Final Registration', status: 'pending' },
    ],
    assignedTo: 'JYOTI',
    timeline: [
      { title: 'Application Created', description: 'Property registration application submitted.', timestamp: daysAgo(1), status: 'SUBMITTED' },
    ],
  },
  {
    id: 'APP-2026-005',
    citizenName: 'Satwik',
    citizenId: 'CIT-003',
    service: 'Property-related Government Service',
    department: 'Revenue Department, Karnataka',
    location: 'Bangalore',
    status: 'ACTION_REQUIRED',
    sla: 'Needs Attention',
    submittedDate: daysAgo(4),
    lastUpdated: hoursAgo(12),
    nextAction: 'Upload property document',
    documents: [
      { name: 'Aadhaar Card', status: 'verified' },
      { name: 'Property Tax Receipt', status: 'required' },
    ],
    workflow: [
      { step: 'Application Submitted', status: 'completed' },
      { step: 'Document Collection', status: 'current' },
      { step: 'Revenue Verification', status: 'pending' },
    ],
    assignedTo: 'JYOTI',
    timeline: [
      { title: 'Application Created', description: 'Property-related government service application.', timestamp: daysAgo(4), status: 'SUBMITTED' },
      { title: 'Action Required', description: 'Property tax receipt needed.', timestamp: hoursAgo(12), status: 'ACTION_REQUIRED' },
    ],
  },
  {
    id: 'APP-2026-006',
    citizenName: 'Ayush',
    citizenId: 'CIT-004',
    service: 'Business Support Scheme',
    department: 'Industries Department, Rajasthan',
    location: 'Rajasthan',
    status: 'DOCUMENTS_REQUIRED',
    sla: 'Action Required',
    submittedDate: daysAgo(7),
    lastUpdated: hoursAgo(18),
    nextAction: 'Upload required documents',
    documents: [
      { name: 'Aadhaar Card', status: 'verified' },
      { name: 'PAN Card', status: 'verified' },
      { name: 'Income Certificate', status: 'required' },
      { name: 'Caste Certificate', status: 'required' },
    ],
    workflow: [
      { step: 'Application Submitted', status: 'completed' },
      { step: 'Document Collection', status: 'current' },
      { step: 'Eligibility Review', status: 'pending' },
      { step: 'Approval', status: 'pending' },
    ],
    assignedTo: 'JYOTI',
    timeline: [
      { title: 'Application Created', description: 'Business support scheme application submitted.', timestamp: daysAgo(7), status: 'SUBMITTED' },
      { title: 'Documents Required', description: 'Income certificate and caste certificate needed.', timestamp: hoursAgo(18), status: 'DOCUMENTS_REQUIRED' },
    ],
  },
];

export function getApplicationsForAdmin(adminUsername: string): AdminApplication[] {
  const normalized = (adminUsername || '').toLowerCase();
  if (normalized === 'dishita') {
    return ALL_APPLICATIONS.filter(a => a.assignedTo === 'DISHITA');
  }
  if (normalized === 'jyoti') {
    return ALL_APPLICATIONS.filter(a => a.assignedTo === 'JYOTI');
  }
  return ALL_APPLICATIONS;
}

// ==========================================
// WORKFLOWS
// ==========================================
export interface AdminWorkflow {
  id: string;
  name: string;
  citizen: string;
  citizenId: string;
  department: string;
  currentStep: string;
  progress: number;
  status: 'Active' | 'Pending' | 'Action Required';
  startedDate: string;
  lastUpdated: string;
  nextAction: string;
  assignedTo: 'DISHITA' | 'JYOTI';
  steps: { name: string; status: 'completed' | 'current' | 'pending'; type: string; target: string }[];
}

export const ALL_WORKFLOWS: AdminWorkflow[] = [
  {
    id: 'WF-001',
    name: 'Business Registration',
    citizen: 'Hriday Bardia',
    citizenId: 'CIT-001',
    department: 'Industries Commissionerate, Gujarat',
    currentStep: 'Document Verification',
    progress: 65,
    status: 'Active',
    startedDate: daysAgo(5),
    lastUpdated: hoursAgo(2),
    nextAction: 'Verify business documents',
    assignedTo: 'DISHITA',
    steps: [
      { name: 'Goal Submitted', status: 'completed', type: 'Action', target: 'JanSetu Portal' },
      { name: 'Documents Collected', status: 'completed', type: 'Validation', target: 'Citizen Vault' },
      { name: 'Document Verification', status: 'current', type: 'Validation', target: 'UIDAI / State Registry' },
      { name: 'Department Review', status: 'pending', type: 'Processing', target: 'Industries Dept' },
      { name: 'Registration Complete', status: 'pending', type: 'Action', target: 'Udyam Portal' },
    ],
  },
  {
    id: 'WF-002',
    name: 'Higher Education Assistance',
    citizen: 'Varad Kanade',
    citizenId: 'CIT-002',
    department: 'Ministry of Education',
    currentStep: 'Eligibility Review',
    progress: 45,
    status: 'Active',
    startedDate: daysAgo(7),
    lastUpdated: hoursAgo(5),
    nextAction: 'Review education documents',
    assignedTo: 'DISHITA',
    steps: [
      { name: 'Goal Submitted', status: 'completed', type: 'Action', target: 'JanSetu Portal' },
      { name: 'Passport Verification', status: 'completed', type: 'Validation', target: 'Passport Seva Portal' },
      { name: 'Academic Records Verification', status: 'completed', type: 'Validation', target: 'DigiLocker' },
      { name: 'Eligibility Review', status: 'current', type: 'Processing', target: 'Ministry of Education' },
      { name: 'Scholarship Approval', status: 'pending', type: 'Action', target: 'NSP Portal' },
    ],
  },
  {
    id: 'WF-003',
    name: 'Property Registration',
    citizen: 'Satwik',
    citizenId: 'CIT-003',
    department: 'Kaveri Online Services, Karnataka',
    currentStep: 'Document Verification',
    progress: 70,
    status: 'Active',
    startedDate: daysAgo(3),
    lastUpdated: daysAgo(1),
    nextAction: 'Verify property documents',
    assignedTo: 'JYOTI',
    steps: [
      { name: 'Goal Submitted', status: 'completed', type: 'Action', target: 'JanSetu Portal' },
      { name: 'Title Verification', status: 'completed', type: 'Validation', target: 'Kaveri Online' },
      { name: 'Document Verification', status: 'current', type: 'Validation', target: 'Sub-Registrar Office' },
      { name: 'Stamp Duty Payment', status: 'pending', type: 'Processing', target: 'Karnataka GRAS Portal' },
      { name: 'Final Registration', status: 'pending', type: 'Action', target: 'Sub-Registrar Office' },
    ],
  },
  {
    id: 'WF-004',
    name: 'Government Scholarship Application',
    citizen: 'Ayush',
    citizenId: 'CIT-004',
    department: 'National Scholarship Portal',
    currentStep: 'Document Collection',
    progress: 35,
    status: 'Action Required',
    startedDate: daysAgo(10),
    lastUpdated: hoursAgo(18),
    nextAction: 'Citizen must upload missing documents',
    assignedTo: 'JYOTI',
    steps: [
      { name: 'Goal Submitted', status: 'completed', type: 'Action', target: 'JanSetu Portal' },
      { name: 'Document Collection', status: 'current', type: 'Action', target: 'Citizen Vault' },
      { name: 'NSP Application', status: 'pending', type: 'Processing', target: 'scholarships.gov.in' },
      { name: 'Institutional Verification', status: 'pending', type: 'Validation', target: 'College / University' },
    ],
  },
  {
    id: 'WF-005',
    name: 'Citizen Profile Verification',
    citizen: 'Hriday Bardia',
    citizenId: 'CIT-001',
    department: 'UIDAI / Ministry of Electronics & IT',
    currentStep: 'Identity Verification',
    progress: 90,
    status: 'Pending',
    startedDate: daysAgo(15),
    lastUpdated: daysAgo(2),
    nextAction: 'Await final confirmation',
    assignedTo: 'DISHITA',
    steps: [
      { name: 'Aadhaar e-KYC', status: 'completed', type: 'Validation', target: 'UIDAI API' },
      { name: 'Address Verification', status: 'completed', type: 'Validation', target: 'State Land Registry' },
      { name: 'Income Verification', status: 'completed', type: 'Validation', target: 'Revenue Department' },
      { name: 'Identity Verification', status: 'current', type: 'Validation', target: 'UIDAI / PAN Database' },
      { name: 'Profile Completion', status: 'pending', type: 'Action', target: 'JanSetu Portal' },
    ],
  },
];

export function getWorkflowsForAdmin(adminUsername: string): AdminWorkflow[] {
  const normalized = (adminUsername || '').toLowerCase();
  if (normalized === 'dishita') {
    return ALL_WORKFLOWS.filter(w => w.assignedTo === 'DISHITA');
  }
  if (normalized === 'jyoti') {
    return ALL_WORKFLOWS.filter(w => w.assignedTo === 'JYOTI');
  }
  return ALL_WORKFLOWS;
}

// ==========================================
// DATA QUALITY
// ==========================================
export interface DataQualityMetrics {
  totalRecords: number;
  validRecords: number;
  missingFields: number;
  duplicates: number;
  staleRecords: number;
  invalidRecords: number;
  qualityScore: number;
}

export function calculateDataQuality(adminUsername: string): DataQualityMetrics {
  const citizens = getCitizensForAdmin(adminUsername);
  const apps = getApplicationsForAdmin(adminUsername);
  const workflows = getWorkflowsForAdmin(adminUsername);

  // Calculate from actual data
  let totalRecords = citizens.length * 10 + apps.length * 5 + workflows.length * 3;
  let missingFields = 0;
  let duplicates = 0;
  let staleRecords = 0;

  citizens.forEach(c => {
    missingFields += c.documentsPending;
    if (c.status === 'Action Required') staleRecords += 2;
    if (c.profileCompletion < 70) staleRecords += 1;
  });

  apps.forEach(a => {
    if (a.status === 'DOCUMENTS_REQUIRED' || a.status === 'ACTION_REQUIRED') missingFields += 2;
  });

  workflows.forEach(w => {
    if (w.status === 'Action Required') missingFields += 1;
  });

  // Simulate duplicates (cross-referencing)
  duplicates = Math.floor(citizens.length * 0.5) + Math.floor(apps.length * 0.3);

  const validRecords = totalRecords - missingFields - staleRecords;
  const invalidRecords = missingFields + staleRecords;
  const qualityScore = parseFloat(((validRecords / totalRecords) * 100).toFixed(1));

  return {
    totalRecords,
    validRecords: Math.max(0, validRecords),
    missingFields,
    duplicates,
    staleRecords,
    invalidRecords: Math.max(0, invalidRecords),
    qualityScore: Math.min(100, Math.max(0, qualityScore)),
  };
}
