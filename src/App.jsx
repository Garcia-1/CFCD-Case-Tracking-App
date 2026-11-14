import React, { useEffect, useRef, useState } from 'react';
import Login from './components/Login';
import CaseManagementPortal from './portals/CaseManagementPortal';
import CFCDAdministratorDashboard from './portals/CFCDAdministratorDashboard';
import { restoreSession, signOutUser, touchSessionActivity } from './services/authService';

export default function App() {
  const [session, setSession] = useState(undefined);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    let active = true;
    restoreSession().then((restored) => {
      if (!active) return;
      if (restored?.lastActivityAt) lastActivityRef.current = Number(restored.lastActivityAt);
      setSession(restored);
    });
    return () => { active = false; };
  }, []);

  const handleLogin = (account) => {
    lastActivityRef.current = Number(account?.lastActivityAt || Date.now());
    setSession(account);
  };

  const handleSignOut = async () => {
    await signOutUser();
    setSession(null);
  };

  useEffect(() => {
    if (!session) return undefined;
    const timeoutMinutes = Number(session.runtimeConfig?.sessionTimeout || 0);
    if (!timeoutMinutes) return undefined;

    let lastPersisted = 0;
    const markActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      if (now - lastPersisted >= 30_000) {
        lastPersisted = now;
        touchSessionActivity();
      }
    };

    const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));

    const timer = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= timeoutMinutes * 60_000) {
        handleSignOut();
      }
    }, 10_000);

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      window.clearInterval(timer);
    };
  }, [session?.uid, session?.runtimeConfig?.sessionTimeout]);

  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f4f7fb', fontFamily: 'Inter, Segoe UI, Arial, sans-serif', color: '#1b2a3e' }}>
        <p>Checking secure session…</p>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  if (session.portal === 'admin') {
    return <CFCDAdministratorDashboard session={session} onSignOut={handleSignOut} />;
  }

  if (session.portal === 'court') {
    return (
      <CaseManagementPortal
        initialRole="Court"
        accountName={session.name}
        session={session}
        onSignOut={handleSignOut}
      />
    );
  }

  const cfcdRole = String(session.role).toLowerCase() === 'supervisor' ? 'Supervisor' : 'Analyst';
  return (
    <CaseManagementPortal
      initialRole={cfcdRole}
      accountName={session.name}
      session={session}
      onSignOut={handleSignOut}
    />
  );
}
