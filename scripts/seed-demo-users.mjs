import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const apiKey = process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!projectId || !apiKey || !credentialsPath) {
  console.error('Missing setup values. Set FIREBASE_PROJECT_ID, FIREBASE_API_KEY, and GOOGLE_APPLICATION_CREDENTIALS.');
  process.exit(1);
}

const demoUsers = [
  { name: 'CFCD Analyst', description: 'Case examination and analysis', portal: 'cfcd', role: 'Analyst', email: 'analyst@cfcd.demo', password: 'AnalystDemo123!', twoFactor: true },
  { name: 'CFCD Supervisor', description: 'Workload and case oversight', portal: 'cfcd', role: 'Supervisor', email: 'supervisor@cfcd.demo', password: 'SupervisorDemo123!', twoFactor: true },
  { name: 'Court User', description: 'Authorised case-status monitoring', portal: 'court', role: 'Court', email: 'court@cfcd.demo', password: 'CourtDemo123!', twoFactor: true },
  { name: 'Administrator', description: 'System and account management', portal: 'admin', role: 'Administrator', email: 'admin@cfcd.demo', password: 'AdminDemo123!', twoFactor: true },
];

const roles = [
  { id: 'administrator', name: 'Administrator', description: 'Manage configuration, account profiles, roles, audit records and system settings.' },
  { id: 'supervisor', name: 'Supervisor', description: 'Oversee CFCD case workflows, assignments, urgent court requests and workload.' },
  { id: 'analyst', name: 'Analyst', description: 'View and work with assigned examination and analysis cases.' },
  { id: 'court', name: 'Court', description: 'View authorised case status snapshots and submit urgent court requests.' },
  { id: 'investigating-officer', name: 'CFCD Investigating Officer', description: 'Submit case information and monitor operational case progress.' },
  { id: 'judge', name: 'Judge', description: 'View authorised court-facing case status information.' },
  { id: 'clerk-of-court', name: 'Clerk of Court', description: 'Search permitted court-facing case status information.' },
  { id: 'prosecutor', name: 'Prosecutor', description: 'View authorised status information and request prioritisation.' },
  { id: 'data-entry-clerk', name: 'Data Entry Clerk', description: 'Limited administrative data-entry access assigned by an administrator.' },
];

const cases = [
  { uid:'c1', cons:'01', registryYear:2026, ref:'CFCD-22D-2026', otherRef:'CFCD-15D-2026', offence:'Fraud', received:'2026-10-19T09:30', item:'Mobile', io:'Det. Cpl. A. Brown', division:'St. Catherine North', suspects:'John Brown', victims:'Mary Smith', analyst:'CFCD Analyst', status:'Technical Issues', technicalNote:'Awaiting repair of forensic workstation.', history:[], createdBy:'CFCD Supervisor', createdAt:'2026-10-19T09:30:00.000Z' },
  { uid:'c2', cons:'02', registryYear:2026, ref:'CFCD-22V-2026', otherRef:'CFCD-18V-2026', offence:'Robbery', received:'2026-10-19T11:15', item:'Video', io:'Det. Sgt. M. Williams', division:'Kingston Central', suspects:'Unknown', victims:'Peter Johnson', analyst:'Analyst B', status:'Assigned', technicalNote:'', history:[], createdBy:'CFCD Supervisor', createdAt:'2026-10-19T11:15:00.000Z' },
  { uid:'c3', cons:'03', registryYear:2026, ref:'CFCD-23D-2026', otherRef:'', offence:'Murder', received:'2026-10-20T08:00', item:'PC', io:'Det. Sgt. C. Green', division:'St. Andrew South', suspects:'Unknown', victims:'David Clarke', analyst:'Analyst C', status:'Not Completed', technicalNote:'', history:[], createdBy:'CFCD Supervisor', createdAt:'2026-10-20T08:00:00.000Z' },
  { uid:'c4', cons:'04', registryYear:2026, ref:'CFCD-24D-2026', otherRef:'', offence:'Cybercrime', received:'2026-09-20T10:20', item:'ICCID', io:'Det. Cpl. J. Reid', division:'St. James', suspects:'Unknown', victims:'Sarah White', analyst:'Unassigned', status:'Unassigned', technicalNote:'', history:[], createdBy:'CFCD Supervisor', createdAt:'2026-09-20T10:20:00.000Z' },
  { uid:'c5', cons:'05', registryYear:2026, ref:'CFCD-25V-2026', otherRef:'', offence:'Assault', received:'2026-10-21T09:00', item:'Video', io:'Det. Sgt. P. Jones', division:'Clarendon', suspects:'Unknown', victims:'Michael Smith', analyst:'CFCD Analyst', status:'Not Completed', technicalNote:'', history:[], createdBy:'CFCD Supervisor', createdAt:'2026-10-21T09:00:00.000Z' },
  { uid:'c6', cons:'06', registryYear:2026, ref:'CFCD-26D-2026', otherRef:'', offence:'Cybercrime', received:'2026-10-01T08:15', item:'PC', io:'Det. Cpl. R. Thomas', division:'Kingston Eastern', suspects:'Unknown', victims:'Company A', analyst:'CFCD Analyst', status:'Completed', technicalNote:'', completedAt:'2026-10-15T14:00:00.000Z', history:[], createdBy:'CFCD Supervisor', createdAt:'2026-10-01T08:15:00.000Z' },
];

const urgentRequests = [
  { id:'UR-001', caseRef:'CFCD-22D-2026', court:'Kingston Parish Court', courtDate:'2026-11-05', reason:'Report required for upcoming trial.', submitted:'2026-10-21', submittedBy:'Court User', requestStatus:'Pending Review', replyStatus:'', publicNote:'', reviewedBy:'', reviewedAt:'' },
  { id:'UR-002', caseRef:'CFCD-22V-2026', court:'Spanish Town Parish Court', courtDate:'2026-11-12', reason:'Court requires an update on examination progress.', submitted:'2026-10-20', submittedBy:'Court User', requestStatus:'Under Review', replyStatus:'', publicNote:'', reviewedBy:'CFCD Supervisor', reviewedAt:'2026-10-22 10:15' },
];

const audit = [
  { id:'audit-seed-1', date:'19 Oct 2026, 09:42', createdAt:'2026-10-19T09:42:00.000Z', action:'User suspended', by:'Administrator', target:'Kevin Reid', ip:'seed-data', details:'Access disabled pending review' },
  { id:'audit-seed-2', date:'19 Oct 2026, 09:18', createdAt:'2026-10-19T09:18:00.000Z', action:'Role updated', by:'Administrator', target:'Analyst', ip:'seed-data', details:'Permissions reviewed' },
  { id:'audit-seed-3', date:'18 Oct 2026, 16:07', createdAt:'2026-10-18T16:07:00.000Z', action:'Sign-in successful', by:'CFCD Analyst', target:'—', ip:'seed-data', details:'Synthetic seed audit event' },
];

const config = {
  defaultTat: '20',
  overdueReminder: '3',
  sessionTimeout: '15',
  auditRetention: '365',
  requireTwoFactor: true,
  emailNotifications: true,
  maintenanceMode: false,
};

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

async function getGoogleAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), serviceAccount.private_key).toString('base64url');
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Could not obtain Google access token: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function firebaseAuthRequest(endpoint, body) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { response, data };
}

async function ensureAuthUser(user) {
  let result = await firebaseAuthRequest('signUp', {
    email: user.email,
    password: user.password,
    displayName: user.name,
    returnSecureToken: true,
  });

  if (result.response.ok) return result.data.localId;

  if (result.data?.error?.message === 'EMAIL_EXISTS') {
    result = await firebaseAuthRequest('signInWithPassword', {
      email: user.email,
      password: user.password,
      returnSecureToken: true,
    });
    if (result.response.ok) return result.data.localId;
    throw new Error(`Account ${user.email} already exists, but the demo password does not match. Reset/delete that test account in Firebase Authentication and run the seed again.`);
  }

  throw new Error(`Could not create ${user.email}: ${JSON.stringify(result.data)}`);
}

function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === 'object') return { mapValue: { fields: encodeFields(value) } };
  return { stringValue: String(value) };
}

function encodeFields(data) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeValue(value)]));
}

async function writeDocument(accessToken, collection, id, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encodeFields({ ...data, updatedAt: new Date().toISOString() }) }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Could not write ${collection}/${id}: ${JSON.stringify(body)}`);
}

function courtSafeCase(item) {
  return {
    uid: item.uid,
    cons: item.cons,
    registryYear: item.registryYear,
    ref: item.ref,
    otherRef: item.otherRef || '',
    received: item.received || '',
    status: item.status || 'Unassigned',
  };
}

const serviceAccount = JSON.parse(await fs.readFile(credentialsPath, 'utf8'));
const accessToken = await getGoogleAccessToken(serviceAccount);

console.log('Creating/updating Firebase Authentication demo users and Firestore profiles...');
const demoUidByEmail = new Map();
for (const user of demoUsers) {
  const uid = await ensureAuthUser(user);
  demoUidByEmail.set(user.email, uid);
  await writeDocument(accessToken, 'users', uid, {
    name: user.name,
    email: user.email,
    description: user.description,
    portal: user.portal,
    role: user.role,
    status: 'Active',
    twoFactor: user.twoFactor,
    demo: true,
    createdAt: new Date().toISOString(),
  });
  console.log(`  users/${uid} -> ${user.name}`);
}

const directoryProfiles = [
  { id:'directory-shanara-richmond', name:'Shanara Richmond', email:'shanara.richmond@moj.gov.jm', role:'Clerk of Court', portal:'court', status:'Active', twoFactor:true },
  { id:'directory-kadian-morris', name:'Kadian Morris', email:'kadian.morris@moj.gov.jm', role:'Prosecutor', portal:'court', status:'Pending', twoFactor:false },
  { id:'directory-kevin-reid', name:'Kevin Reid', email:'kevin.reid@jcf.gov.jm', role:'CFCD Investigating Officer', portal:'cfcd', status:'Suspended', twoFactor:false },
];
for (const profile of directoryProfiles) {
  await writeDocument(accessToken, 'users', profile.id, { ...profile, description:'Directory-only prototype profile; no Firebase Auth identity is created by this seed entry.' });
}

console.log('Seeding dashboard collections...');
for (const role of roles) await writeDocument(accessToken, 'roles', role.id, role);
for (const item of cases) {
  const enriched = item.analyst === 'CFCD Analyst'
    ? { ...item, analystUid: demoUidByEmail.get('analyst@cfcd.demo') || '' }
    : item;
  await writeDocument(accessToken, 'cases', item.uid, enriched);
  await writeDocument(accessToken, 'courtCaseStatus', item.uid, courtSafeCase(enriched));
}
const courtUid = demoUidByEmail.get('court@cfcd.demo') || '';
for (const item of urgentRequests) {
  await writeDocument(accessToken, 'urgentRequests', item.id, {
    ...item,
    submittedByUid: courtUid,
    submittedByEmail: 'court@cfcd.demo',
    submittedAt: item.submitted ? `${item.submitted}T12:00:00.000Z` : new Date().toISOString(),
  });
}
for (const item of audit) await writeDocument(accessToken, 'auditLogs', item.id, item);
await writeDocument(accessToken, 'systemConfig', 'main', config);

console.log('\nDone. Firebase Authentication and Firestore dashboard data are seeded.');
console.log('Collections: users, roles, cases, courtCaseStatus, urgentRequests, auditLogs, systemConfig');
