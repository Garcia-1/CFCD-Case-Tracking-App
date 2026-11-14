import { firebaseConfig, firebaseConfigured, firebaseConfigMessage } from '../firebase';

const SESSION_KEY = 'cfcd.firebase.session.v1';
const ACTIVE_STATUS = 'active';
const DEFAULT_RUNTIME_CONFIG = { sessionTimeout: 15, maintenanceMode: false };

function authUrl(endpoint) {
  return `https://identitytoolkit.googleapis.com/v1/accounts:${endpoint}?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
}

function firestoreDocumentUrl(collection, id) {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseConfig.projectId)}/databases/(default)/documents/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`;
}

function tokenUrl() {
  return `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(firebaseConfig.apiKey)}`;
}

function readFirestoreValue(value) {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(readFirestoreValue);
  if ('mapValue' in value) return readFirestoreFields(value.mapValue.fields || {});
  return null;
}

function readFirestoreFields(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, readFirestoreValue(value)]),
  );
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function firebaseErrorMessage(errorCode) {
  const messages = {
    EMAIL_NOT_FOUND: 'No account was found for that email address.',
    INVALID_PASSWORD: 'The password is incorrect.',
    INVALID_LOGIN_CREDENTIALS: 'The email address or password is incorrect.',
    USER_DISABLED: 'This account has been disabled. Contact the system administrator.',
    TOO_MANY_ATTEMPTS_TRY_LATER: 'Too many unsuccessful sign-in attempts. Try again later.',
    OPERATION_NOT_ALLOWED: 'Email/password sign-in is not enabled for this Firebase project.',
    API_KEY_INVALID: 'The Firebase API key is invalid or is not configured for this application.',
    PROJECT_NOT_FOUND: 'The configured Firebase project could not be found.',
  };
  return messages[errorCode] || 'Unable to sign in. Check your credentials and try again.';
}

async function firebasePasswordSignIn(email, password) {
  const response = await fetch(authUrl('signInWithPassword'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      password,
      returnSecureToken: true,
    }),
  });
  const data = await readJson(response);
  if (!response.ok) {
    const code = data?.error?.message || 'AUTHENTICATION_FAILED';
    throw new Error(firebaseErrorMessage(code));
  }
  return data;
}

async function loadFirestoreDocument(collection, id, idToken, { optional = false } = {}) {
  const response = await fetch(firestoreDocumentUrl(collection, id), {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const data = await readJson(response);
  if (response.status === 404 && optional) return null;
  if (response.status === 404) {
    throw new Error('Your sign-in account exists, but no CFCD user profile has been assigned. Contact the system administrator.');
  }
  if (!response.ok) {
    throw new Error('Your account was authenticated, but required CFCD account information could not be loaded.');
  }
  return readFirestoreFields(data.fields || {});
}

async function loadUserProfile(uid, idToken) {
  return loadFirestoreDocument('users', uid, idToken);
}

async function loadRuntimeConfig(idToken) {
  const config = await loadFirestoreDocument('systemConfig', 'main', idToken, { optional: true });
  if (!config) return DEFAULT_RUNTIME_CONFIG;
  return {
    sessionTimeout: Math.max(5, Number(config.sessionTimeout || DEFAULT_RUNTIME_CONFIG.sessionTimeout)),
    maintenanceMode: Boolean(config.maintenanceMode),
  };
}

function normalizeSession(authData, profile, runtimeConfig, selectedPortal = profile.portal, lastActivityAt = Date.now()) {
  const expiresInSeconds = Number(authData.expiresIn || authData.expires_in || 3600);
  return {
    uid: authData.localId || authData.user_id,
    email: authData.email || profile.email || '',
    name: profile.name || authData.displayName || authData.email || 'CFCD User',
    portal: profile.portal,
    role: profile.role || '',
    description: profile.description || '',
    status: profile.status || 'Active',
    selectedPortal,
    idToken: authData.idToken || authData.access_token,
    refreshToken: authData.refreshToken || authData.refresh_token,
    expiresAt: Date.now() + Math.max(expiresInSeconds - 60, 60) * 1000,
    runtimeConfig: runtimeConfig || DEFAULT_RUNTIME_CONFIG,
    lastActivityAt,
  };
}

function validateProfile(profile, selectedPortal) {
  if (!profile?.portal) {
    throw new Error('This account does not have a portal assigned. Contact the system administrator.');
  }
  if (String(profile.status || '').toLowerCase() !== ACTIVE_STATUS) {
    throw new Error(`This account is ${String(profile.status || 'not active').toLowerCase()}. Contact the system administrator.`);
  }
  if (profile.portal !== selectedPortal) {
    const portalLabel = profile.portal === 'cfcd' ? 'CFCD' : profile.portal === 'court' ? 'Court' : 'Admin';
    throw new Error(`This account belongs to the ${portalLabel} portal. Select that portal and sign in again.`);
  }
}

function validateRuntime(profile, runtimeConfig) {
  if (runtimeConfig?.maintenanceMode && profile?.portal !== 'admin') {
    throw new Error('The CFCD Case Tracking System is currently in maintenance mode. Please try again later.');
  }
}

function persistSession(session) {
  if (typeof window !== 'undefined') window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function sessionIdleExpired(session) {
  const timeoutMinutes = Number(session?.runtimeConfig?.sessionTimeout || 0);
  if (!timeoutMinutes || !session?.lastActivityAt) return false;
  return Date.now() - Number(session.lastActivityAt) >= timeoutMinutes * 60_000;
}

export function clearSession() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(SESSION_KEY);
}

export function touchSessionActivity() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    const updated = { ...session, lastActivityAt: Date.now() };
    persistSession(updated);
    return updated.lastActivityAt;
  } catch {
    return null;
  }
}

export async function signInWithPortal({ email, password, portal }) {
  if (!firebaseConfigured) throw new Error(firebaseConfigMessage);
  const authData = await firebasePasswordSignIn(email, password);
  try {
    const profile = await loadUserProfile(authData.localId, authData.idToken);
    validateProfile(profile, portal);
    const runtimeConfig = await loadRuntimeConfig(authData.idToken);
    validateRuntime(profile, runtimeConfig);
    const session = normalizeSession(authData, profile, runtimeConfig, portal);
    persistSession(session);
    return session;
  } catch (error) {
    clearSession();
    throw error;
  }
}

async function refreshSession(saved) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: saved.refreshToken,
  });
  const response = await fetch(tokenUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const authData = await readJson(response);
  if (!response.ok) throw new Error('Your session has expired. Please sign in again.');
  const profile = await loadUserProfile(authData.user_id, authData.access_token);
  validateProfile(profile, profile.portal);
  const runtimeConfig = await loadRuntimeConfig(authData.access_token);
  validateRuntime(profile, runtimeConfig);
  const refreshed = normalizeSession(authData, profile, runtimeConfig, profile.portal, saved.lastActivityAt || Date.now());
  persistSession(refreshed);
  return refreshed;
}

export async function restoreSession() {
  if (!firebaseConfigured || typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const saved = JSON.parse(raw);
    if (!saved?.refreshToken || sessionIdleExpired(saved)) {
      clearSession();
      return null;
    }

    if (saved.idToken && saved.expiresAt > Date.now() + 30_000) {
      const profile = await loadUserProfile(saved.uid, saved.idToken);
      validateProfile(profile, profile.portal);
      const runtimeConfig = await loadRuntimeConfig(saved.idToken);
      validateRuntime(profile, runtimeConfig);
      const current = {
        ...saved,
        ...profile,
        name: profile.name || saved.name,
        portal: profile.portal,
        runtimeConfig,
        lastActivityAt: saved.lastActivityAt || Date.now(),
      };
      persistSession(current);
      return current;
    }

    return await refreshSession(saved);
  } catch {
    clearSession();
    return null;
  }
}

export async function signOutUser() {
  clearSession();
}
