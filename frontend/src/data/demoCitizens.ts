// Mock database holding team member citizen and officer profiles for SIH Demo

export interface DemoCitizen {
  name: string;
  aadhaar: string; // Formatted 12-digit: "XXXX XXXX XXXX"
  rawAadhaar: string; // 12-digit clean string
  phone: string; // Masked phone string: "+91 XXXXX XXXX"
  rawPhone: string;
  dob: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  username: string;
  role: 'CITIZEN';
  annualIncome: number;
  incomeCategory: string;
  category: string;
  avatarColor: string;
}

export const DEMO_CITIZENS: DemoCitizen[] = [
  {
    name: 'Ayush Singh Chauhan',
    aadhaar: '1111 2222 0207',
    rawAadhaar: '111122220207',
    phone: '+91 XXXXX 0207',
    rawPhone: '+918969707785',
    dob: '20/12/2004',
    gender: 'Male',
    address: '88, Boring Road, Jaipur, Rajasthan - 302001',
    city: 'Jaipur',
    state: 'Rajasthan',
    pincode: '302001',
    username: 'ayush',
    role: 'CITIZEN',
    annualIncome: 280000,
    incomeCategory: 'EWS',
    category: 'General',
    avatarColor: 'from-amber-500 to-orange-500'
  },
  {
    name: 'Hriday Bardia',
    aadhaar: '1111 2222 1405',
    rawAadhaar: '111122221405',
    phone: '+91 XXXXX 1405',
    rawPhone: '+919876543210',
    dob: '15/08/2001',
    gender: 'Male',
    address: '42, Sunrise Greens, Alkapuri, Vadodara, Gujarat - 390007',
    city: 'Vadodara',
    state: 'Gujarat',
    pincode: '390007',
    username: 'hriday',
    role: 'CITIZEN',
    annualIncome: 350000,
    incomeCategory: 'Middle Class',
    category: 'General',
    avatarColor: 'from-blue-500 to-indigo-500'
  },
  {
    name: 'Varad Kanade',
    aadhaar: '1111 2222 1304',
    rawAadhaar: '111122221304',
    phone: '+91 XXXXX 1304',
    rawPhone: '+919822334455',
    dob: '10/05/2000',
    gender: 'Male',
    address: '12, Kothrud Main Road, Pune, Maharashtra - 411038',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411038',
    username: 'varad',
    role: 'CITIZEN',
    annualIncome: 450000,
    incomeCategory: 'Middle Class',
    category: 'OBC',
    avatarColor: 'from-emerald-500 to-teal-500'
  },
  {
    name: 'Satwik Guru',
    aadhaar: '1111 2222 3333',
    rawAadhaar: '111122223333',
    phone: '+91 XXXXX 3333',
    rawPhone: '+919988776655',
    dob: '12/04/2005',
    gender: 'Male',
    address: '15, MG Road, Bengaluru, Karnataka - 560001',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    username: 'satwik',
    role: 'CITIZEN',
    annualIncome: 300000,
    incomeCategory: 'EWS',
    category: 'General',
    avatarColor: 'from-purple-500 to-pink-500'
  }
];

export interface DemoAdmin {
  officerId: string;
  name: string;
  designation: string;
  department: string;
  role: 'ADMIN' | 'SYSTEM_ADMIN';
  username: string;
}

export const DEMO_ADMINS: DemoAdmin[] = [
  {
    officerId: 'dis123456',
    name: 'Dishita',
    designation: 'Chief System Administrator',
    department: 'Ministry of Electronics and Information Technology (MeitY)',
    role: 'SYSTEM_ADMIN',
    username: 'dishita'
  },
  {
    officerId: 'jyo123456',
    name: 'Jyoti',
    designation: 'Departmental Scheme Administrator',
    department: 'Department of Higher Education & Social Welfare',
    role: 'ADMIN',
    username: 'jyoti'
  }
];

export const GLOBAL_DEMO_OTP = '123456';

export function formatAadhaarNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  const parts = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(' ');
}

export function findCitizen(query: string): DemoCitizen | undefined {
  if (!query) return undefined;
  const clean = query.trim().toLowerCase();
  const cleanDigits = query.replace(/\D/g, '');
  
  return DEMO_CITIZENS.find((c) => 
    (cleanDigits && cleanDigits.length >= 4 && (c.rawAadhaar === cleanDigits || c.rawAadhaar.endsWith(cleanDigits))) ||
    c.username.toLowerCase() === clean ||
    c.name.toLowerCase() === clean ||
    c.name.toLowerCase().includes(clean) ||
    c.aadhaar.toLowerCase().includes(clean) ||
    (cleanDigits && cleanDigits.length >= 4 && c.rawPhone.includes(cleanDigits))
  );
}

export function findCitizenByAadhaar(rawDigits: string): DemoCitizen | undefined {
  const clean = rawDigits.replace(/\D/g, '');
  return findCitizen(clean || rawDigits);
}

export function findAdminByOfficerId(officerId: string): DemoAdmin | undefined {
  const clean = officerId.trim().toLowerCase();
  return DEMO_ADMINS.find((a) => a.officerId.toLowerCase() === clean || a.username.toLowerCase() === clean || a.name.toLowerCase() === clean);
}
