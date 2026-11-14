import React, { useState } from 'react';
import cfcdLogo from '../assets/CFCD-logo.jpg';
<<<<<<< HEAD
import courtBackground from '../assets/court-portal-background.webp';
import cfcdBackground from '../assets/CFCD-portal-background.jpg';
=======
>>>>>>> b4b26413299ff0d128111e35c7323bba807e1a87
import './Login.css';

/**
 * CFCD Case Tracking System sign-in screen.
<<<<<<< HEAD
 * Demo accounts are for local prototype demonstrations only. They will be
=======
 * Demo accounts are for local prototype demonstrations only. They must be
>>>>>>> b4b26413299ff0d128111e35c7323bba807e1a87
 * replaced with server-side authentication before deployment.
 */
export const DEMO_ACCOUNTS = [
  {
    name: 'CFCD Analyst',
    description: 'Case examination and analysis',
    portal: 'cfcd',
    username: 'analyst@cfcd.demo',
    password: 'AnalystDemo123!',
  },
  {
    name: 'CFCD Supervisor',
    description: 'Workload and case oversight',
    portal: 'cfcd',
    username: 'supervisor@cfcd.demo',
    password: 'SupervisorDemo123!',
  },
  {
    name: 'Court User',
    description: 'Authorised case-status monitoring',
    portal: 'court',
    username: 'court@cfcd.demo',
    password: 'CourtDemo123!',
  },
  {
    name: 'Administrator',
    description: 'System and account management',
<<<<<<< HEAD
    portal: 'cfcd',
=======
    portal: 'admin',
>>>>>>> b4b26413299ff0d128111e35c7323bba807e1a87
    username: 'admin@cfcd.demo',
    password: 'AdminDemo123!',
  },
];

const PORTALS = [
  { id: 'cfcd', label: 'CFCD' },
  { id: 'court', label: 'Court' },
<<<<<<< HEAD
=======
  { id: 'admin', label: 'Admin' },
>>>>>>> b4b26413299ff0d128111e35c7323bba807e1a87
];

export default function Login({ onLogin }) {
  const [role, setRole] = useState('court');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState(null);
<<<<<<< HEAD
  const [showActivation, setShowActivation] = useState(false);

  const getIdPlaceholder = () => {
=======

  const getIdPlaceholder = () => {
    if (role === 'admin') return 'Admin email or ID';
>>>>>>> b4b26413299ff0d128111e35c7323bba807e1a87
    if (role === 'cfcd') return 'CFCD email or ID';
    return 'Court email or user ID';
  };

  const choosePortal = (portal) => {
    setRole(portal);
    setFeedback(null);
  };

  const useDemoAccount = (account) => {
    setRole(account.portal);
    setId(account.username);
    setPassword(account.password);
    setShowPassword(false);
    setFeedback(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const account = DEMO_ACCOUNTS.find((item) =>
      item.portal === role &&
      item.username.toLowerCase() === id.trim().toLowerCase() &&
      item.password === password
    );

    if (!account) {
      setFeedback({
        type: 'error',
        message: 'The credentials do not match the selected portal. Choose a demo account below or check your sign-in details.',
      });
      return;
    }

    setFeedback({
      type: 'success',
      message: `Demo sign-in successful: ${account.name}.`,
    });
    if (typeof onLogin === 'function') onLogin(account);
  };

  return (
    <>
      <main className="cfcd-login-page">
        <aside className="cfcd-login-side">
          <header className="cfcd-login-brand">
            <img className="cfcd-login-logo" src={cfcdLogo} alt="CFCD emblem" />
            <div>
              <h2>CFCD Case Tracking System</h2>
              <p>Communication Forensics &amp; Cybercrime Division</p>
            </div>
          </header>

          <section className="cfcd-login-message" aria-label="System introduction">
            <p className="cfcd-login-kicker">Secure case visibility</p>
            <h1>Track every CFCD case from referral to completion.</h1>
            <p>
<<<<<<< HEAD
              One shared record for CFCD personnel and the courts
=======
              One shared record for CFCD personnel, the courts, and administrators,
>>>>>>> b4b26413299ff0d128111e35c7323bba807e1a87
              with live completion status and turnaround time on every referred case.
            </p>
          </section>

          <footer className="cfcd-login-side-footer">
            <span className="cfcd-login-lock" aria-hidden="true">✓</span>
            <span>Authorized personnel only. All activities are logged.</span>
          </footer>
        </aside>

<<<<<<< HEAD
        <section className={`cfcd-login-main ${role === "court" ? "court-background" : "cfcd-background"}`} style={{ "--portal-background": `url(${role === "court" ? courtBackground : cfcdBackground})` }}>
=======
        <section className="cfcd-login-main">
>>>>>>> b4b26413299ff0d128111e35c7323bba807e1a87
          <div className="cfcd-login-content">
            <header className="cfcd-login-heading">
              <div className="cfcd-login-secure"><span className="cfcd-login-secure-dot" /> CFCD secure access</div>
              <h1>Sign in</h1>
              <p>Choose your portal and enter your credentials.</p>
            </header>

            <form className="cfcd-login-form" onSubmit={handleSubmit}>
              <label className="cfcd-login-field-label" id="portal-label">Choose your portal</label>
              <div className="cfcd-portal-tabs" role="group" aria-labelledby="portal-label">
                {PORTALS.map((portal) => (
                  <button
                    className={`cfcd-portal-tab${role === portal.id ? ' is-selected' : ''}`}
                    type="button"
                    key={portal.id}
                    aria-pressed={role === portal.id}
                    onClick={() => choosePortal(portal.id)}
                  >
                    {portal.label}
                  </button>
                ))}
              </div>

              <div className="cfcd-login-field">
                <label className="cfcd-login-field-label" htmlFor="cfcd-login-id">Email or user ID</label>
                <input
                  className="cfcd-login-input"
                  id="cfcd-login-id"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder={getIdPlaceholder()}
                  value={id}
                  onChange={(event) => { setId(event.target.value); setFeedback(null); }}
                  required
                />
              </div>

              <div className="cfcd-login-field">
                <label className="cfcd-login-field-label" htmlFor="cfcd-login-password">Password</label>
                <div className="cfcd-login-input-wrap">
                  <input
                    className="cfcd-login-input has-toggle"
                    id="cfcd-login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => { setPassword(event.target.value); setFeedback(null); }}
                    required
                  />
                  <button
                    className="cfcd-show-password"
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button className="cfcd-signin-button" type="submit">
                Sign in <span aria-hidden="true">→</span>
              </button>

<<<<<<< HEAD
              <div className="cfcd-login-access-note">
                <strong>Need access to the CFCD Case Tracking System?</strong>
                <p>Contact the CFCD department to request an account.</p>
                <button type="button" className="cfcd-activate-link" onClick={() => setShowActivation(true)}>Activate Account</button>
              </div>

=======
>>>>>>> b4b26413299ff0d128111e35c7323bba807e1a87
              {feedback && (
                <div className={`cfcd-login-feedback ${feedback.type}`} role="status" aria-live="polite">
                  {feedback.message}
                </div>
              )}
            </form>

<<<<<<< HEAD
=======
            <section className="cfcd-demo-section" aria-labelledby="demo-heading">
              <div className="cfcd-demo-heading">
                <h2 id="demo-heading">Demo accounts</h2>
                <span>For prototype testing only</span>
              </div>
              <div className="cfcd-demo-grid">
                {DEMO_ACCOUNTS.map((account) => (
                  <article className="cfcd-demo-card" key={account.username}>
                    <div className="cfcd-demo-card-top">
                      <strong>{account.name}</strong>
                      <span className="cfcd-demo-badge">{account.portal === 'cfcd' ? 'CFCD' : account.portal === 'court' ? 'Court' : 'Admin'}</span>
                    </div>
                    <p className="cfcd-demo-description">{account.description}</p>
                    <p className="cfcd-demo-credential"><b>User:</b> {account.username}</p>
                    <p className="cfcd-demo-credential"><b>Password:</b> {account.password}</p>
                    <button className="cfcd-demo-use" type="button" onClick={() => useDemoAccount(account)}>
                      Use this account →
                    </button>
                  </article>
                ))}
              </div>
              <p className="cfcd-demo-note">
                These sample credentials are stored in the front-end for demonstration only. Do not use real case data or real passwords with this prototype.
              </p>
            </section>
>>>>>>> b4b26413299ff0d128111e35c7323bba807e1a87

            <p className="cfcd-login-bottom-note">CFCD Case Tracking System · Access is limited to authorised users.</p>
          </div>
        </section>
<<<<<<< HEAD
        {showActivation && <div className="cfcd-activation-overlay" onMouseDown={event => { if (event.target === event.currentTarget) setShowActivation(false); }}>
          <section className="cfcd-activation-dialog" role="dialog" aria-modal="true" aria-label="Activate Account">
            <button className="cfcd-activation-close" type="button" aria-label="Close activation information" onClick={() => setShowActivation(false)}>×</button>
            <h2>Activate your account</h2>
            <p>New users must first be approved and invited by CFCD administrator.</p>
            <p>In the live system, the invitation link will open a secure account setup page where users can establish a password and multi-factor authentication.</p>
            <p className="cfcd-activation-notice">Note: Invitation validation and activation are not connected to a server, so no account can be activated here.</p>
            <button className="cfcd-signin-button" type="button" onClick={() => setShowActivation(false)}>Return to sign in</button>
          </section>
        </div>}
=======
>>>>>>> b4b26413299ff0d128111e35c7323bba807e1a87
      </main>
    </>
  );
}
