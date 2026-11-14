import { firebaseConfig, firebaseConfigured, firebaseConfigMessage } from '../firebase';
import { restoreSession } from './authService';

const DATABASE = () => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseConfig.projectId)}/databases/(default)`;
const DOCUMENTS = () => `${DATABASE()}/documents`;

function assertConfigured() {
  if (!firebaseConfigured) throw new Error(firebaseConfigMessage);
}

function encodeValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === 'object') return { mapValue: { fields: encodeFields(value) } };
  return { stringValue: String(value) };
}

function encodeFields(data = {}) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, encodeValue(value)]));
}

function decodeValue(value) {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return decodeFields(value.mapValue.fields || {});
  return null;
}

function decodeFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function documentId(name = '') {
  return name.split('/').pop() || '';
}

function documentName(collection, id) {
  return `projects/${firebaseConfig.projectId}/databases/(default)/documents/${collection}/${id}`;
}

function cleanData(data = {}) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

async function json(response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function validSession(session) {
  if (session?.idToken && (!session.expiresAt || session.expiresAt > Date.now() + 30_000)) return session;
  const refreshed = await restoreSession();
  if (!refreshed?.idToken) throw new Error('Your session has expired. Please sign in again.');
  return refreshed;
}

async function request(session, url, options = {}) {
  assertConfigured();
  const active = await validSession(session);
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${active.idToken}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await json(response);
  if (!response.ok) {
    const message = data?.error?.message || `Firestore request failed (${response.status}).`;
    throw new Error(message);
  }
  return data;
}

export async function listDocuments(session, collection) {
  const data = await request(session, `${DOCUMENTS()}/${encodeURIComponent(collection)}?pageSize=500`);
  return (data.documents || []).map((doc) => ({ id: documentId(doc.name), ...decodeFields(doc.fields || {}) }));
}

export async function queryDocuments(session, collection, filters = []) {
  if (!filters.length) return listDocuments(session, collection);
  const fieldFilters = filters.map(({ field, op = 'EQUAL', value }) => ({
    fieldFilter: {
      field: { fieldPath: field },
      op,
      value: encodeValue(value),
    },
  }));
  const where = fieldFilters.length === 1
    ? fieldFilters[0]
    : { compositeFilter: { op: 'AND', filters: fieldFilters } };
  const rows = await request(session, `${DOCUMENTS()}:runQuery`, {
    method: 'POST',
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where,
        limit: 500,
      },
    }),
  });
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => row.document)
    .map((row) => ({ id: documentId(row.document.name), ...decodeFields(row.document.fields || {}) }));
}

export async function getDocument(session, collection, id) {
  const data = await request(session, `${DOCUMENTS()}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`);
  return { id, ...decodeFields(data.fields || {}) };
}

export async function setDocument(session, collection, id, data) {
  const clean = cleanData(data);
  const result = await request(session, `${DOCUMENTS()}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: encodeFields(clean) }),
  });
  return { id, ...decodeFields(result.fields || {}) };
}

export async function deleteDocument(session, collection, id, { ignoreNotFound = false } = {}) {
  try {
    await request(session, `${DOCUMENTS()}/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (error) {
    if (ignoreNotFound && /404|not found/i.test(String(error?.message || ''))) return;
    throw error;
  }
}

async function commitDocuments(session, writes) {
  const payload = writes.map((write) => {
    if (write.delete) return { delete: documentName(write.collection, write.id) };
    return {
      update: {
        name: documentName(write.collection, write.id),
        fields: encodeFields(cleanData(write.data)),
      },
    };
  });
  return request(session, `${DOCUMENTS()}:commit`, {
    method: 'POST',
    body: JSON.stringify({ writes: payload }),
  });
}

function sortDashboardData(cases, requests) {
  cases.sort((a, b) => String(b.received || '').localeCompare(String(a.received || '')));
  requests.sort((a, b) => String(b.submittedAt || b.submitted || '').localeCompare(String(a.submittedAt || a.submitted || '')));
}

export async function loadCaseDashboard(session) {
  const role = String(session?.role || '').toLowerCase();
  let cases = [];
  let requests = [];
  let analysts = [];
  let analystProfiles = [];

  if (session?.portal === 'court') {
    [cases, requests] = await Promise.all([
      listDocuments(session, 'courtCaseStatus'),
      listDocuments(session, 'urgentRequests'),
    ]);
  } else if (role === 'analyst') {
    const [byUid, byLegacyName] = await Promise.all([
      session?.uid ? queryDocuments(session, 'cases', [{ field: 'analystUid', value: session.uid }]).catch(() => []) : Promise.resolve([]),
      session?.name ? queryDocuments(session, 'cases', [{ field: 'analyst', value: session.name }]).catch(() => []) : Promise.resolve([]),
    ]);
    cases = [...new Map([...byUid, ...byLegacyName].map((item) => [item.id || item.uid, item])).values()];
  } else {
    const [allCases, allRequests, cfcdUsers] = await Promise.all([
      listDocuments(session, 'cases'),
      listDocuments(session, 'urgentRequests'),
      queryDocuments(session, 'users', [{ field: 'portal', value: 'cfcd' }]),
    ]);
    cases = allCases;
    requests = allRequests;
    analystProfiles = cfcdUsers
      .filter((user) => String(user.status || '').toLowerCase() === 'active' && String(user.role || '').toLowerCase().includes('analyst'))
      .filter((user) => user.name)
      .map((user) => ({ id: user.id, name: user.name, email: user.email || '' }));
    analysts = analystProfiles.map((user) => user.name);
  }

  const assignedNames = cases.map((item) => item.analyst).filter((name) => name && name !== 'Unassigned');
  analysts = [...new Set([...analysts, ...assignedNames])].sort((a, b) => a.localeCompare(b));
  sortDashboardData(cases, requests);
  return { cases, requests, analysts, analystProfiles };
}

function courtSafeCase(record, id) {
  return {
    uid: id,
    cons: record.cons || '',
    registryYear: record.registryYear || new Date().getFullYear(),
    ref: record.ref || '',
    otherRef: record.otherRef || '',
    received: record.received || '',
    status: record.status || 'Unassigned',
    updatedAt: record.updatedAt || new Date().toISOString(),
  };
}

export async function createCaseRecord(session, record) {
  const id = record.uid || `case-${Date.now()}`;
  const full = { ...record, uid: id, updatedAt: new Date().toISOString() };
  await commitDocuments(session, [
    { collection: 'cases', id, data: full },
    { collection: 'courtCaseStatus', id, data: courtSafeCase(full, id) },
  ]);
  return full;
}

export async function updateCaseRecord(session, id, record) {
  const full = { ...record, uid: id, updatedAt: new Date().toISOString() };
  await commitDocuments(session, [
    { collection: 'cases', id, data: full },
    { collection: 'courtCaseStatus', id, data: courtSafeCase(full, id) },
  ]);
  return full;
}

export async function updateAssignedCaseDocument(session, id, record) {
  const full = { ...record, uid: id, updatedAt: new Date().toISOString() };
  await commitDocuments(session, [{ collection: 'cases', id, data: full }]);
  return full;
}

export async function createUrgentRequest(session, record) {
  const now = new Date().toISOString();
  return setDocument(session, 'urgentRequests', record.id, {
    ...record,
    submittedByUid: record.submittedByUid || session?.uid || '',
    submittedByEmail: record.submittedByEmail || session?.email || '',
    submittedAt: record.submittedAt || now,
    updatedAt: now,
  });
}

export async function updateUrgentRequest(session, id, record) {
  return setDocument(session, 'urgentRequests', id, { ...record, id, updatedAt: new Date().toISOString() });
}

export async function reviewUrgentRequest(session, { requestId, requestRecord, caseId, caseRecord }) {
  const now = new Date().toISOString();
  const writes = [
    { collection: 'urgentRequests', id: requestId, data: { ...requestRecord, id: requestId, updatedAt: now } },
  ];
  if (caseId && caseRecord) {
    const full = { ...caseRecord, uid: caseId, updatedAt: now };
    writes.unshift(
      { collection: 'cases', id: caseId, data: full },
      { collection: 'courtCaseStatus', id: caseId, data: courtSafeCase(full, caseId) },
    );
  }
  await commitDocuments(session, writes);
  return { request: { ...requestRecord, id: requestId, updatedAt: now }, caseRecord: caseRecord ? { ...caseRecord, uid: caseId, updatedAt: now } : null };
}

export async function loadAdminDashboard(session) {
  const [users, roles, auditLogs, configRows, cases] = await Promise.all([
    listDocuments(session, 'users'),
    listDocuments(session, 'roles'),
    listDocuments(session, 'auditLogs'),
    listDocuments(session, 'systemConfig'),
    listDocuments(session, 'cases'),
  ]);
  auditLogs.sort((a, b) => String(b.createdAt || b.date || '').localeCompare(String(a.createdAt || a.date || '')));
  return {
    users,
    roles,
    auditLogs,
    config: configRows.find((row) => row.id === 'main') || null,
    cases,
  };
}

export async function saveUserProfile(session, id, profile) {
  return setDocument(session, 'users', id, { ...profile, updatedAt: new Date().toISOString() });
}

export async function removeUserProfile(session, id) {
  return deleteDocument(session, 'users', id);
}

export async function saveRoleRecord(session, id, role) {
  return setDocument(session, 'roles', id, { ...role, updatedAt: new Date().toISOString() });
}

export async function removeRoleRecord(session, id) {
  return deleteDocument(session, 'roles', id);
}

export async function addAuditRecord(session, record) {
  const id = record.id || `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return setDocument(session, 'auditLogs', id, { ...record, id, createdAt: record.createdAt || new Date().toISOString() });
}

export async function saveSystemConfig(session, config) {
  const { id: _id, ...values } = config || {};
  return setDocument(session, 'systemConfig', 'main', { ...values, updatedAt: new Date().toISOString() });
}

export async function sendPasswordReset(email) {
  assertConfigured();
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(firebaseConfig.apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }),
  });
  const data = await json(response);
  if (!response.ok) throw new Error(data?.error?.message || 'Password reset email could not be sent.');
  return data;
}
