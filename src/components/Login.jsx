import React, { useState } from 'react';
import cfcdLogo from '../assets/CFCD-logo.jpg';
import courtBackground from '../assets/court-portal-background.webp';
import cfcdBackground from '../assets/CFCD-portal-background.jpg';
import { firebaseConfigured, firebaseConfigMessage } from '../firebase';
import { signInWithPortal } from '../services/authService';
import './Login.css';

/**
 * Prototype/demo credentials. Authentication is performed by Firebase;
 * these values only populate the form for controlled demonstrations.
 * Set VITE_ENABLE_DEMO_ACCOUNTS=false before a production deployment.
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
    portal: 'admin',
    username: 'admin@cfcd.demo',
    password: 'AdminDemo123!',
  },
];

const PORTALS = [
  { id: 'cfcd', label: 'CFCD' },
  { id: 'court', label: 'Court' },
  { id: 'admin', label: 'Admin' },
];

const SHOW_DEMO_ACCOUNTS = import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS !== 'false';

export default function Login({ onLogin }) {
  const [role, setRole] = useState('court');
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const getIdPlaceholder = () => {
    if (role === 'admin') return 'Admin email address';
    if (role === 'cfcd') return 'CFCD email address';
    return 'Court email address';
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setSubmitting(true);

    try {
      const account = await signInWithPortal({
        email: id.trim(),
        password,
        portal: role,
      });
      setFeedback({
        type: 'success',
        message: `Sign-in successful: ${account.name}.`,
      });
      if (typeof onLogin === 'function') onLogin(account);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to sign in. Try again.',
      });
    } finally {
      setSubmitting(false);
    }
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
              One shared record for CFCD personnel, the courts, and administrators,
              with live completion status and turnaround time on every referred case.
            </p>
          </section>

          <footer className="cfcd-login-side-footer">
            <span className="cfcd-login-lock" aria-hidden="true">✓</span>
            <span>Authorized personnel only. All activities are logged.</span>
          </footer>
        </aside>

        <section className="cfcd-login-main" style={{ '--portal-background': `url(${role === 'court' ? courtBackground : cfcdBackground})` }}>
          <div className="cfcd-login-content">
            <header className="cfcd-login-heading">
              <div className="cfcd-login-secure"><span className="cfcd-login-secure-dot" /> CFCD secure access</div>
              <h1>Sign in</h1>
              <p>Choose your portal and enter your Firebase account credentials.</p>
            </header>

            {!firebaseConfigured && (
              <div className="cfcd-login-feedback error" role="status">
                {firebaseConfigMessage}
              </div>
            )}

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
                    disabled={submitting}
                  >
                    {portal.label}
                  </button>
                ))}
              </div>

              <div className="cfcd-login-field">
                <label className="cfcd-login-field-label" htmlFor="cfcd-login-id">Email address</label>
                <input
                  className="cfcd-login-input"
                  id="cfcd-login-id"
                  name="username"
                  type="email"
                  autoComplete="username"
                  placeholder={getIdPlaceholder()}
                  value={id}
                  onChange={(event) => { setId(event.target.value); setFeedback(null); }}
                  disabled={submitting}
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
                    disabled={submitting}
                    required
                  />
                  <button
                    className="cfcd-show-password"
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={submitting}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button className="cfcd-signin-button" type="submit" disabled={submitting || !firebaseConfigured}>
                {submitting ? 'Signing in…' : 'Sign in'} {!submitting && <span aria-hidden="true">→</span>}
              </button>

              {feedback && (
                <div className={`cfcd-login-feedback ${feedback.type}`} role="status" aria-live="polite">
                  {feedback.message}
                </div>
              )}
            </form>

            {SHOW_DEMO_ACCOUNTS && (
              <section className="cfcd-demo-section" aria-labelledby="demo-heading">
                <div className="cfcd-demo-heading">
                  <h2 id="demo-heading">Demo accounts</h2>
                  <span>Firebase-backed prototype testing</span>
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
                      <button className="cfcd-demo-use" type="button" onClick={() => useDemoAccount(account)} disabled={submitting}>
                        Use this account →
                      </button>
                    </article>
                  ))}
                </div>
                <p className="cfcd-demo-note">
                  These are test-only Firebase accounts created by the included seed script. Disable demo accounts before production deployment and never place real passwords in source code.
                </p>
              </section>
            )}

            <p className="cfcd-login-bottom-note">CFCD Case Tracking System · Access is limited to authorised users.</p>
          </div>
        </section>
      </main>
    </>
  );
}
