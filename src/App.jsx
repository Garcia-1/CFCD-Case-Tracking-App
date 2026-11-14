import React, { useState } from 'react';
import Login from './components/Login';
import CaseManagementPortal from './portals/CaseManagementPortal';
import CFCDAdministratorDashboard from './portals/CFCDAdministratorDashboard';

export default function App() {
  const [session, setSession] = useState(null);

<<<<<<< HEAD
  const handleLogin = ({ name, username, portal }) => {
    // The prototype does not establish a secure server session.
    setSession({ name, portal, username, displayName: name, profileEmail: username, notifications: true });
  };
  const handleSignOut = () => setSession(null);
  const handleProfileSave = (changes) => setSession(previous => previous ? { ...previous, ...changes } : previous);

  if (!session) return <Login onLogin={handleLogin} />;

  const sharedProps = {
    accountName: session.displayName,
    accountEmail: session.profileEmail,
    notifications: session.notifications,
    onProfileSave: handleProfileSave,
    onSignOut: handleSignOut,
  };

  // Administrators authenticate via the CFCD tab, but retain their admin dashboard.
  if (session.portal === 'cfcd' && session.name === 'Administrator') {
    return <CFCDAdministratorDashboard {...sharedProps} />;
  }
  if (session.portal === 'court') {
    return <CaseManagementPortal {...sharedProps} initialRole="Court" />;
  }
  return <CaseManagementPortal {...sharedProps} initialRole={session.name === 'CFCD Supervisor' ? 'Supervisor' : 'Analyst'} />;
=======
  const handleLogin = (account) => {
    setSession(account);
  };

  const handleSignOut = () => {
    setSession(null);
  };

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  if (session.portal === 'admin') {
    return <CFCDAdministratorDashboard onSignOut={handleSignOut} />;
  }

  if (session.portal === 'court') {
    return (
      <CaseManagementPortal
        initialRole="Court"
        accountName={session.name}
        onSignOut={handleSignOut}
      />
    );
  }

  const cfcdRole = session.name === 'CFCD Supervisor' ? 'Supervisor' : 'Analyst';
  return (
    <CaseManagementPortal
      initialRole={cfcdRole}
      accountName={session.name}
      onSignOut={handleSignOut}
    />
  );
>>>>>>> b4b26413299ff0d128111e35c7323bba807e1a87
}
