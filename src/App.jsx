import React, { useState } from 'react';
import Login from './components/Login';
import CaseManagementPortal from './portals/CaseManagementPortal';
import CFCDAdministratorDashboard from './portals/CFCDAdministratorDashboard';

export default function App() {
  const [session, setSession] = useState(null);

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
}
