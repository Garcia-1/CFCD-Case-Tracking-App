import React, { useMemo, useState } from "react";
import cfcdLogo from "../assets/CFCD-logo.jpg";
import "./CFCDAdministratorDashboard.css";

/**
 * CFCD Administrator Dashboard
 * Styling is maintained separately in CFCDAdministratorDashboard.css.
 * Contains mockdata which is held in local component state.
 * Will be connected to a secure API.
 */

const INITIAL_USERS = [
  { id: 1, name: "Administrator", email: "admin@jcf.gov.jm", role: "System Administrator", status: "Active", twoFactor: true },
  { id: 2, name: "Sekou Jacas", email: "sekou.jacas@jcf.gov.jm", role: "CFCD Analyst", status: "Active", twoFactor: true },
  { id: 3, name: "Shanara Richmond", email: "shanara.richmond@moj.gov.jm", role: "Clerk of Court", status: "Active", twoFactor: true },
  { id: 4, name: "Kadian Morris", email: "kadian.morris@moj.gov.jm", role: "Prosecutor", status: "Pending", twoFactor: false },
  { id: 5, name: "Kevin Reid", email: "kevin.reid@jcf.gov.jm", role: "CFCD Investigating Officer", status: "Suspended", twoFactor: false },
];

const INITIAL_ROLES = [
  { id: 1, name: "System Administrator", users: 2, description: "Manage configuration, accounts, roles, and security settings." },
  { id: 2, name: "CFCD Supervisor", users: 4, description: "Oversee case workflows, workload, turnaround, and reports." },
  { id: 3, name: "CFCD Analyst", users: 18, description: "Update assigned examination and analysis stages." },
  { id: 4, name: "CFCD Investigating Officer", users: 23, description: "Submit requests and monitor assigned case progress." },
  { id: 5, name: "Judge", users: 12, description: "View authorised case status information." },
  { id: 6, name: "Clerk of Court", users: 15, description: "Search permitted cases and monitor status." },
  { id: 7, name: "Prosecutor", users: 16, description: "View authorised status information and request prioritisation." },
  { id: 8, name: "Data Entry Clerk", users: 3, description: "Limited access assigned by an administrator." },
];

const INITIAL_AUDIT = [
  { id: 1, date: "19 Oct 2026, 09:42", action: "User suspended", by: "Administrator", target: "Kevin Reid", ip: "192.0.2.24", details: "Access disabled pending review" },
  { id: 2, date: "19 Oct 2026, 09:18", action: "Role updated", by: "System Administrator", target: "CFCD Analyst", ip: "192.0.2.18", details: "Permissions reviewed" },
  { id: 3, date: "18 Oct 2026, 16:07", action: "Sign-in successful", by: "Sekou Jacas", target: "—", ip: "192.0.2.31", details: "Two-factor verification completed" },
  { id: 4, date: "18 Oct 2026, 14:26", action: "Configuration changed", by: "Administrator", target: "System settings", ip: "192.0.2.24", details: "Default turnaround target updated" },
  { id: 5, date: "18 Oct 2026, 11:02", action: "Password reset requested", by: "Administrator", target: "Kadian Morris", ip: "192.0.2.24", details: "Demo event only; no email sent" },
];

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "users", label: "User Management", icon: "users" },
  { id: "roles", label: "Roles List", icon: "shield" },
  { id: "security", label: "Security Management", icon: "lock" },
  { id: "setup", label: "System Setup", icon: "settings" },
];

function Icon({ name, size = 18, strokeWidth = 1.8 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    lock: <><rect x="3" y="10" width="18" height="11" rx="2" /><path d="M7 10V7a5 5 0 0 1 10 0v3" /><path d="M12 14v3" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2L6 11.9l1.4-2.4 1.7.7a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1-.2 2Z" transform="translate(-1 -1) scale(1.08)" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    arrow: <><path d="M7 17 17 7" /><path d="M7 7h10v10" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    alert: <><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 4h.01" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
    logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    building: <><rect x="3" y="4" width="18" height="17" rx="1" /><path d="M8 8h2m4 0h2M8 12h2m4 0h2M8 16h2m4 0h2M9 21v-3h6v3" /></>,
    menu: <><path d="M3 6h18M3 12h18M3 18h18" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    refresh: <><path d="M20 7v5h-5" /><path d="M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.8-2L20 12M4 12l2.6 5a7 7 0 0 0 11.8-2" /></>,
  };
  return <svg {...common}>{paths[name] || paths.grid}</svg>;
}

function MetricCard({ icon, label, value, note, tone = "blue", trend }) {
  return (
    <article className="cfcd-metric-card">
      <div className={`cfcd-metric-icon ${tone}`}><Icon name={icon} size={20} /></div>
      <div className="cfcd-metric-label">{label}</div>
      <div className="cfcd-metric-value">{value}</div>
      <div className="cfcd-metric-note">{trend && <span className="cfcd-trend">{trend}</span>}{note}</div>
    </article>
  );
}

function StatusPill({ status }) {
  const cls = String(status).toLowerCase().replace(/[^a-z]+/g, "-");
  return <span className={`cfcd-status-pill ${cls}`}>{status}</span>;
}

function Modal({ title, subtitle, onClose, children, onSubmit, submitLabel = "Save changes" }) {
  return (
    <div className="cfcd-modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="cfcd-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="cfcd-modal-head">
          <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          <button className="cfcd-icon-button" type="button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button>
        </div>
        <form onSubmit={onSubmit}>
          <div className="cfcd-modal-body">{children}</div>
          <div className="cfcd-modal-actions">
            <button className="cfcd-btn secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="cfcd-btn primary" type="submit">{submitLabel}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function CFCDAdministratorDashboard({ onSignOut }) {
  const [activePage, setActivePage] = useState("overview");
  const [users, setUsers] = useState(INITIAL_USERS);
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [config, setConfig] = useState({
    defaultTat: "20",
    overdueReminder: "3",
    sessionTimeout: "15",
    auditRetention: "365",
    requireTwoFactor: true,
    emailNotifications: true,
    maintenanceMode: false,
  });
  const [configSaved, setConfigSaved] = useState(false);

  const notify = (message) => {
    setToast(message);
    if (typeof window !== "undefined") {
      window.clearTimeout(notify.timeoutId);
      notify.timeoutId = window.setTimeout(() => setToast(""), 3400);
    }
  };

  const addAuditEvent = (action, target, details) => {
    const now = new Date();
    const record = {
      id: Date.now(),
      date: now.toLocaleString("en-JM", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }),
      action,
      by: "Administrator",
      target: target || "—",
      ip: "192.0.2.24",
      details,
    };
    setAuditLogs((previous) => [record, ...previous]);
  };

  const filteredUsers = useMemo(() => users.filter((user) => `${user.name} ${user.email} ${user.role} ${user.status}`.toLowerCase().includes(userSearch.toLowerCase())), [users, userSearch]);
  const filteredAudit = useMemo(() => auditLogs.filter((entry) => `${entry.date} ${entry.action} ${entry.by} ${entry.target} ${entry.ip} ${entry.details}`.toLowerCase().includes(auditSearch.toLowerCase())), [auditLogs, auditSearch]);

  const openUserModal = (user = null) => setModal({ type: "user", user });
  const openRoleModal = (role = null) => setModal({ type: "role", role });

  const saveUser = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const role = String(form.get("role") || "Data Entry Clerk");
    const twoFactor = form.get("twoFactor") === "on";
    if (!name || !email) return;
    if (modal.user) {
      const updated = { ...modal.user, name, email, role, twoFactor };
      setUsers((previous) => previous.map((item) => item.id === modal.user.id ? updated : item));
      addAuditEvent("User updated", name, "Account details updated in prototype");
      notify("User details updated in this prototype.");
    } else {
      const added = { id: Date.now(), name, email, role, status: "Pending", twoFactor };
      setUsers((previous) => [added, ...previous]);
      addAuditEvent("User created", name, `Assigned role: ${role}`);
      notify("Demo user created with Pending status.");
    }
    setModal(null);
  };

  const userAction = (action, user) => {
    if (action === "Suspend") {
      if (user.status === "Suspended") {
        setUsers((previous) => previous.map((item) => item.id === user.id ? { ...item, status: "Active" } : item));
        addAuditEvent("User reactivated", user.name, "Account access re-enabled in prototype");
        notify(`${user.name}'s demo account has been reactivated.`);
      } else {
        setUsers((previous) => previous.map((item) => item.id === user.id ? { ...item, status: "Suspended" } : item));
        addAuditEvent("User suspended", user.name, "Account access disabled in prototype");
        notify(`${user.name}'s demo account has been suspended.`);
      }
    } else if (action === "Reset Password") {
      addAuditEvent("Password reset requested", user.name, "Prototype only; no password email sent");
      notify(`Password reset would be initiated for ${user.name} by a secure backend.`);
    } else if (action === "Reset Authenticator") {
      setUsers((previous) => previous.map((item) => item.id === user.id ? { ...item, twoFactor: false } : item));
      addAuditEvent("Authenticator reset", user.name, "Two-factor enrollment cleared in prototype");
      notify(`Two-factor enrollment cleared for ${user.name} in this prototype.`);
    } else if (action === "Delete") {
      if (window.confirm(`Delete demo account for ${user.name}? This only changes local prototype state.`)) {
        setUsers((previous) => previous.filter((item) => item.id !== user.id));
        addAuditEvent("User deleted", user.name, "Demo account removed from local state");
        notify("Demo user removed.");
      }
    }
  };

  const saveRole = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const description = String(form.get("description") || "").trim();
    if (!name) return;
    if (modal.role) {
      setRoles((previous) => previous.map((role) => role.id === modal.role.id ? { ...role, name, description } : role));
      addAuditEvent("Role updated", name, "Role details updated in prototype");
      notify("Role updated in this prototype.");
    } else {
      setRoles((previous) => [...previous, { id: Date.now(), name, description, users: 0 }]);
      addAuditEvent("Role created", name, "New role added in prototype");
      notify("Role created in this prototype.");
    }
    setModal(null);
  };

  const deleteRole = (role) => {
    if (role.users > 0) {
      notify("This role has assigned users. Reassign them before deleting the role.");
      return;
    }
    if (window.confirm(`Delete the ${role.name} role?`)) {
      setRoles((previous) => previous.filter((item) => item.id !== role.id));
      addAuditEvent("Role deleted", role.name, "Role removed from prototype");
      notify("Role deleted.");
    }
  };

  const exportAuditCsv = () => {
    const headers = ["Date", "Action", "Performed By", "Target User", "IP Address", "Details"];
    const rows = filteredAudit.map((entry) => [entry.date, entry.action, entry.by, entry.target, entry.ip, entry.details]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cfcd-audit-log-demo.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    notify("Audit log CSV exported.");
  };

  const saveSystemConfig = (event) => {
    event.preventDefault();
    setConfigSaved(true);
    addAuditEvent("Configuration changed", "System settings", "System configuration saved in local prototype state");
    notify("System configuration saved in this prototype only.");
  };

  const navTo = (id) => {
    setActivePage(id);
    setMobileNavOpen(false);
  };

  if (!isSignedIn) {
    return (
      <div className="cfcd-signedout-screen">
        <div className="cfcd-signedout-card">
          <img className="cfcd-brand-logo large" src={cfcdLogo} alt="CFCD logo" />
          <h1>You're signed out</h1>
          <p>This is a front-end demonstration. Sign-in will be connected to the application's secure authentication service.</p>
          <button className="cfcd-btn primary" onClick={() => { setIsSignedIn(true); notify("Demo session restored."); }}>Return to demo dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cfcd-admin-app">
      <aside className={`cfcd-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="cfcd-sidebar-brand">
          <img className="cfcd-brand-logo" src={cfcdLogo} alt="CFCD logo" />
          <div className="cfcd-brand-text"><strong>CFCD Case Tracking System</strong><span>Admin Portal</span></div>
          <button className="cfcd-icon-button cfcd-mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><Icon name="close" /></button>
        </div>
        <div className="cfcd-nav-label">WORKSPACE</div>
        <nav className="cfcd-main-nav" aria-label="Administrator navigation">
          {NAV_ITEMS.map((item) => (
            <button key={item.id} className={`cfcd-nav-item ${activePage === item.id ? "active" : ""}`} onClick={() => navTo(item.id)}>
              <Icon name={item.icon} size={18} /><span>{item.label}</span>{activePage === item.id && <span className="cfcd-nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="cfcd-sidebar-spacer" />
        <div className="cfcd-help-card">
          <div className="cfcd-help-icon"><Icon name="bell" size={17} /></div>
          <strong>Keep your system secure</strong>
          <p>Review access and audit activity regularly.</p>
          <button onClick={() => navTo("security")}>Review security <Icon name="chevron" size={14} /></button>
        </div>
        <div className="cfcd-sidebar-bottom"><span className="cfcd-live-dot" /> Prototype environment <span className="cfcd-version">v0.1</span></div>
      </aside>
      {mobileNavOpen && <button aria-label="Close navigation overlay" className="cfcd-nav-scrim" onClick={() => setMobileNavOpen(false)} />}

      <main className="cfcd-main-area">
        <header className="cfcd-topbar">
          <div className="cfcd-topbar-left">
            <button className="cfcd-icon-button cfcd-mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button>
            <div className="cfcd-breadcrumb"><span>Admin Portal</span><Icon name="chevron" size={14} /><strong>{NAV_ITEMS.find((item) => item.id === activePage)?.label || "Overview"}</strong></div>
          </div>
          <div className="cfcd-topbar-right">
            <div className="cfcd-topbar-date"><span className="cfcd-live-dot" /> Operational Overview</div>
            <div className="cfcd-topbar-divider" />
            <div className="cfcd-admin-identity"><div className="cfcd-avatar">A</div><div className="cfcd-admin-name"><strong>Administrator</strong><span>System Administrator</span></div></div>
            <button className="cfcd-btn signout" onClick={() => { setToast(""); if (typeof onSignOut === "function") onSignOut(); else setIsSignedIn(false); }}><Icon name="logout" size={16} /><span>Sign out</span></button>
          </div>
        </header>

        <div className="cfcd-page-content">
          <div className="cfcd-page-heading">
            <div><div className="cfcd-eyebrow">ADMINISTRATION / {activePage.toUpperCase()}</div><h1>{pageTitle(activePage)}</h1><p>{pageDescription(activePage)}</p></div>
            <div className="cfcd-heading-actions">{activePage === "users" && <button className="cfcd-btn primary" onClick={() => openUserModal()}><Icon name="plus" size={17} /> Add user</button>}{activePage === "roles" && <button className="cfcd-btn primary" onClick={() => openRoleModal()}><Icon name="plus" size={17} /> Add role</button>}{activePage === "security" && <button className="cfcd-btn secondary" onClick={exportAuditCsv}><Icon name="download" size={16} /> Export audit log</button>}</div>
          </div>

          {activePage === "overview" && (
            <>
              <div className="cfcd-overview-banner"><div className="cfcd-banner-symbol"><Icon name="building" size={23} /></div><div className="cfcd-banner-copy"><strong>CFCD Operational Overview</strong><span>Monitor case turnaround, officer workload, and service performance from one place.</span></div><div className="cfcd-banner-date"><span>REPORTING PERIOD</span><strong>Current snapshot</strong></div></div>
              <div className="cfcd-section-heading"><div><h2>Case performance</h2><p>Key indicators across the division</p></div><span className="cfcd-snapshot-label"><span className="cfcd-live-dot" /> Sample data</span></div>
              <div className="cfcd-metrics-grid">
                <MetricCard icon="check" label="Completed within target" value="78%" note="of completed cases" tone="green" trend="↑ 4.2%" />
                <MetricCard icon="building" label="Total cases" value="128" note="all registered cases" tone="blue" />
                <MetricCard icon="clock" label="Open cases" value="42" note="currently in progress" tone="purple" />
                <MetricCard icon="alert" label="Overdue cases" value="9" note="require attention" tone="orange" />
                <MetricCard icon="clock" label="Average turnaround" value="18.4 days" note="completed cases" tone="teal" />
              </div>

              <div className="cfcd-content-grid cfcd-overview-tables">
                <section className="cfcd-panel cfcd-division-panel">
                  <div className="cfcd-panel-heading"><div><h2>Turnaround by CFCD</h2><p>Division-wide case performance</p></div><span className="cfcd-panel-icon"><Icon name="building" /></span></div>
                  <div className="cfcd-table-wrap"><table className="cfcd-table cfcd-division-table"><thead><tr><th>Division</th><th>Open</th><th>Overdue</th><th>Completed</th><th>Avg TAT</th><th>On-time rate</th></tr></thead><tbody><tr><td><div className="cfcd-division-cell"><div className="cfcd-table-avatar">CF</div><div><strong>CFCD</strong><span>Communication Forensics and Cybercrime Division</span></div></div></td><td><strong>42</strong></td><td><span className="cfcd-number-alert">9</span></td><td><strong>86</strong></td><td>18.4 days</td><td><div className="cfcd-rate-cell"><strong>78%</strong><span className="cfcd-progress"><span style={{ width: "78%" }} /></span></div></td></tr></tbody></table></div>
                  <div className="cfcd-table-footnote"><span><Icon name="alert" size={14} /> Overdue cases are included in open cases.</span><span>Turnaround target: 20 days</span></div>
                </section>

                <section className="cfcd-panel cfcd-workload-panel">
                  <div className="cfcd-panel-heading"><div><h2>CFCD officer workload</h2><p>Open and overdue cases by officer</p></div><button className="cfcd-icon-button" onClick={() => notify("Officer workload is illustrative demo data.")} aria-label="Workload information"><Icon name="more" /></button></div>
                  <div className="cfcd-workload-list">
                    {[
                      { name: "Sekou Jacas", title: "Senior Forensic Analyst", initials: "MT", open: 12, overdue: 3, color: "blue" },
                      { name: "Simone Campbell", title: "Digital Forensic Analyst", initials: "SC", open: 9, overdue: 2, color: "pink" },
                      { name: "Andre Foster", title: "CFCD Investigating Officer", initials: "AF", open: 11, overdue: 2, color: "gold" },
                      { name: "Janelle Brown", title: "Forensic Analyst", initials: "JB", open: 10, overdue: 2, color: "mint" },
                    ].map((officer) => <div className="cfcd-officer-row" key={officer.name}><div className={`cfcd-officer-avatar ${officer.color}`}>{officer.initials}</div><div className="cfcd-officer-details"><strong>{officer.name}</strong><span>{officer.title}</span><div className="cfcd-officer-counts"><span>{officer.open} open</span><span className="cfcd-overdue-mini">{officer.overdue} overdue</span></div></div><div className="cfcd-officer-bar" title={`${officer.open} open cases`}><span style={{ height: `${Math.max(22, officer.open * 5)}px` }} /></div></div>)}
                  </div>
                  <div className="cfcd-panel-footer">Workload values are sample records for demonstration.</div>
                </section>
              </div>

              <section className="cfcd-panel cfcd-quick-actions-panel"><div className="cfcd-panel-heading"><div><h2>Administration Shortcuts</h2><p>Common system management tasks</p></div></div><div className="cfcd-shortcut-grid"><button className="cfcd-shortcut" onClick={() => navTo("users")}><span className="cfcd-shortcut-icon blue"><Icon name="users" /></span><span><strong>Manage users</strong><small>Create and maintain user accounts</small></span><Icon name="chevron" size={17} /></button><button className="cfcd-shortcut" onClick={() => navTo("roles")}><span className="cfcd-shortcut-icon purple"><Icon name="shield" /></span><span><strong>Review roles</strong><small>Manage roles and access profiles</small></span><Icon name="chevron" size={17} /></button><button className="cfcd-shortcut" onClick={() => navTo("security")}><span className="cfcd-shortcut-icon orange"><Icon name="lock" /></span><span><strong>Security audit</strong><small>Review recorded activity</small></span><Icon name="chevron" size={17} /></button><button className="cfcd-shortcut" onClick={() => navTo("setup")}><span className="cfcd-shortcut-icon green"><Icon name="settings" /></span><span><strong>System setup</strong><small>Review system configuration</small></span><Icon name="chevron" size={17} /></button></div></section>
            </>
          )}

          {activePage === "users" && (
            <section className="cfcd-panel cfcd-full-panel">
              <div className="cfcd-panel-heading cfcd-table-heading"><div><h2>System Users</h2><p>Manage user accounts and account security settings</p></div><div className="cfcd-heading-tools"><span className="cfcd-count-badge">{users.length} accounts</span></div></div>
              <div className="cfcd-table-toolbar"><label className="cfcd-searchbox"><Icon name="search" size={17} /><input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users, email, or role..." /></label><span className="cfcd-muted-text">{filteredUsers.length} of {users.length} users</span></div>
              <div className="cfcd-table-wrap"><table className="cfcd-table"><thead><tr><th>User</th><th>Email</th><th>Account Status</th><th>Two-Factor</th><th>Actions</th></tr></thead><tbody>{filteredUsers.map((user) => <tr key={user.id}><td><div className="cfcd-user-cell"><div className="cfcd-small-avatar">{initials(user.name)}</div><div><strong>{user.name}</strong><span>{user.role}</span></div></div></td><td className="cfcd-email-cell">{user.email}</td><td><StatusPill status={user.status} /></td><td><span className={`cfcd-twofactor ${user.twoFactor ? "enabled" : "disabled"}`}><span />{user.twoFactor ? "Enabled" : "Not enabled"}</span></td><td><div className="cfcd-actions-cell"><button className="cfcd-action-button" onClick={() => userAction("Suspend", user)}>{user.status === "Suspended" ? "Restore" : "Suspend"}</button><button className="cfcd-action-button" onClick={() => userAction("Reset Password", user)}>Reset Password</button><button className="cfcd-action-button" onClick={() => userAction("Reset Authenticator", user)}>Reset Authenticator</button><button className="cfcd-action-button danger" onClick={() => userAction("Delete", user)}>Delete</button><button className="cfcd-icon-button small" aria-label={`Edit ${user.name}`} title="Edit user" onClick={() => openUserModal(user)}><Icon name="edit" size={15} /></button></div></td></tr>)}</tbody></table>{filteredUsers.length === 0 && <div className="cfcd-empty-state"><Icon name="search" size={25} /><strong>No matching users</strong><span>Try another search term.</span></div>}</div>
              <div className="cfcd-panel-footnote">Account actions in this prototype update local demo state only. Production changes will be handled and audited by a secured backend.</div>
            </section>
          )}

          {activePage === "roles" && (
            <section className="cfcd-panel cfcd-full-panel">
              <div className="cfcd-panel-heading cfcd-table-heading"><div><h2>Roles and permissions</h2><p>Define the access profiles used throughout the CFCD Case Tracking System</p></div></div>
              <div className="cfcd-role-note"><Icon name="shield" size={18} /><div><strong>Role-based access control (RBAC)</strong><span>Assign each user the minimum permissions required for their duties. Changes must be enforced by the backend, not only the interface.</span></div></div>
              <div className="cfcd-role-list">{roles.map((role) => <article className="cfcd-role-row" key={role.id}><div className="cfcd-role-icon"><Icon name="shield" size={19} /></div><div className="cfcd-role-info"><strong>{role.name}</strong><span>{role.description || "No description provided."}</span></div><div className="cfcd-role-usercount"><strong>{role.users}</strong><span>assigned users</span></div><div className="cfcd-role-actions"><button className="cfcd-btn secondary small-btn" onClick={() => openRoleModal(role)}><Icon name="edit" size={14} /> Edit</button><button className="cfcd-btn danger-outline small-btn" onClick={() => deleteRole(role)}><Icon name="trash" size={14} /> Delete</button></div></article>)}</div>
              <div className="cfcd-panel-footnote"></div>
            </section>
          )}

          {activePage === "security" && (
            <>
              <div className="cfcd-security-summary"><div className="cfcd-security-summary-icon"><Icon name="lock" size={22} /></div><div><strong>Security management</strong><span>Monitor account events and configuration activity. Example audit records below are synthetic and are not a real security log.</span></div><StatusPill status="Demo mode" /></div>
              <div className="cfcd-metrics-grid cfcd-security-metrics"><MetricCard icon="shield" label="Two-factor enabled" value={`${users.filter((user) => user.twoFactor).length}`} note={`of ${users.length} demo users`} tone="green" /><MetricCard icon="alert" label="Suspended accounts" value={users.filter((user) => user.status === "Suspended").length} note="access disabled in demo" tone="orange" /><MetricCard icon="clock" label="Audit entries" value={auditLogs.length} note="illustrative local entries" tone="blue" /><MetricCard icon="check" label="Policy controls" value="3 / 3" note="example settings available" tone="purple" /></div>
              <section className="cfcd-panel cfcd-full-panel"><div className="cfcd-panel-heading cfcd-table-heading"><div><h2>Audit log</h2><p>Track administrative and account activity</p></div><button className="cfcd-btn secondary" onClick={exportAuditCsv}><Icon name="download" size={16} /> Export CSV</button></div><div className="cfcd-table-toolbar"><label className="cfcd-searchbox"><Icon name="search" size={17} /><input value={auditSearch} onChange={(event) => setAuditSearch(event.target.value)} placeholder="Search action, user, IP address, or details..." /></label><span className="cfcd-muted-text">{filteredAudit.length} entries</span></div><div className="cfcd-table-wrap"><table className="cfcd-table"><thead><tr><th>Date</th><th>Action</th><th>Performed By</th><th>Target User</th><th>IP Address</th><th>Details</th></tr></thead><tbody>{filteredAudit.map((entry) => <tr key={entry.id}><td className="cfcd-nowrap">{entry.date}</td><td><span className="cfcd-audit-action"><span className={`cfcd-audit-dot ${auditDotClass(entry.action)}`} />{entry.action}</span></td><td>{entry.by}</td><td>{entry.target}</td><td><code className="cfcd-ip-code">{entry.ip}</code></td><td className="cfcd-audit-details">{entry.details}</td></tr>)}</tbody></table>{filteredAudit.length === 0 && <div className="cfcd-empty-state"><Icon name="search" size={25} /><strong>No matching audit entries</strong><span>Try another search term.</span></div>}</div><div className="cfcd-panel-footnote">Production audit records should be append-only, access-controlled, time-synchronised, and stored server-side with retention policies.</div></section>
              <section className="cfcd-security-principles"><div><Icon name="shield" size={19} /><strong>Least privilege</strong><span>Grant only the access needed for each role.</span></div><div><Icon name="lock" size={19} /><strong>Strong authentication</strong><span>Require MFA for privileged accounts.</span></div><div><Icon name="eye" size={19} /><strong>Traceability</strong><span>Record who did what, when, and to which account.</span></div></section>
            </>
          )}

          {activePage === "setup" && (
            <form onSubmit={saveSystemConfig} className="cfcd-system-setup">
              <section className="cfcd-panel cfcd-full-panel"><div className="cfcd-panel-heading"><div><h2>System configuration</h2><p>Manage default workflow, security, and notification settings</p></div><span className="cfcd-settings-chip"><Icon name="settings" size={15} /> Administrator settings</span></div><div className="cfcd-setup-section"><div className="cfcd-setup-section-title"><span className="cfcd-setup-section-icon blue"><Icon name="clock" /></span><div><h3>Case turnaround and reminders</h3><p>Default values to help identify cases requiring attention.</p></div></div><div className="cfcd-form-grid"><label className="cfcd-field"><span>Default turnaround target (calendar days)</span><input type="number" min="1" max="365" value={config.defaultTat} onChange={(event) => { setConfig({ ...config, defaultTat: event.target.value }); setConfigSaved(false); }} required /><small>Used as the initial target for new cases; define exclusions with stakeholders.</small></label><label className="cfcd-field"><span>Overdue reminder interval (days)</span><input type="number" min="1" max="30" value={config.overdueReminder} onChange={(event) => { setConfig({ ...config, overdueReminder: event.target.value }); setConfigSaved(false); }} required /><small>Example interval for a future notification service.</small></label></div></div><div className="cfcd-setup-section"><div className="cfcd-setup-section-title"><span className="cfcd-setup-section-icon purple"><Icon name="lock" /></span><div><h3>Security and session policy</h3><p>Recommended controls for protecting restricted case status information.</p></div></div><div className="cfcd-form-grid"><label className="cfcd-field"><span>Session idle timeout (minutes)</span><input type="number" min="5" max="120" value={config.sessionTimeout} onChange={(event) => { setConfig({ ...config, sessionTimeout: event.target.value }); setConfigSaved(false); }} required /><small>Must be enforced by the authentication service.</small></label><label className="cfcd-field"><span>Audit log retention (days)</span><input type="number" min="30" max="3650" value={config.auditRetention} onChange={(event) => { setConfig({ ...config, auditRetention: event.target.value }); setConfigSaved(false); }} required /><small>Final retention period must follow approved policy.</small></label></div><div className="cfcd-toggle-list"><label className="cfcd-toggle-row"><span><strong>Require two-factor authentication</strong><small>Require MFA for users at sign-in, especially privileged roles.</small></span><input type="checkbox" checked={config.requireTwoFactor} onChange={(event) => { setConfig({ ...config, requireTwoFactor: event.target.checked }); setConfigSaved(false); }} /><i /></label><label className="cfcd-toggle-row"><span><strong>Email notifications</strong><small>Enable event notifications when an email service is configured.</small></span><input type="checkbox" checked={config.emailNotifications} onChange={(event) => { setConfig({ ...config, emailNotifications: event.target.checked }); setConfigSaved(false); }} /><i /></label></div></div><div className="cfcd-setup-section"><div className="cfcd-setup-section-title"><span className="cfcd-setup-section-icon orange"><Icon name="alert" /></span><div><h3>System availability</h3><p>Use maintenance mode only through an approved operational process.</p></div></div><label className="cfcd-maintenance-row"><span><strong>Maintenance mode</strong><small>Illustrative switch only. It does not change actual system availability.</small></span><span className={`cfcd-maintenance-state ${config.maintenanceMode ? "enabled" : ""}`}>{config.maintenanceMode ? "Enabled" : "Disabled"}</span><input type="checkbox" checked={config.maintenanceMode} onChange={(event) => { setConfig({ ...config, maintenanceMode: event.target.checked }); setConfigSaved(false); }} /><i /></label></div><div className="cfcd-setup-footer"><div>{configSaved && <span className="cfcd-saved-message"><Icon name="check" size={16} /> Saved to local prototype state</span>}</div><button className="cfcd-btn primary" type="submit">Save configuration <Icon name="chevron" size={15} /></button></div><div className="cfcd-panel-footnote">These settings remain in the component's browser state only. Persisting and enforcing them requires a secured server-side configuration service and change audit.</div></section>
            </form>
          )}

          <footer className="cfcd-page-footer"><span>© 2026 CFCD Case Tracking System</span><span><span className="cfcd-live-dot" /> Administrator interface <span className="cfcd-footer-separator">•</span> Prototype data only</span></footer>
        </div>
      </main>

      {toast && <div className="cfcd-toast" role="status"><span className="cfcd-toast-check"><Icon name="check" size={16} /></span><span>{toast}</span><button onClick={() => setToast("")} aria-label="Dismiss notification"><Icon name="close" size={15} /></button></div>}

      {modal?.type === "user" && <Modal title={modal.user ? "Edit user" : "Add user"} subtitle="Manage a demonstration account profile." onClose={() => setModal(null)} onSubmit={saveUser} submitLabel={modal.user ? "Save user" : "Create user"}><label className="cfcd-field"><span>Full name</span><input name="name" defaultValue={modal.user?.name || ""} placeholder="Enter user's full name" required autoFocus /></label><label className="cfcd-field"><span>Email address</span><input name="email" type="email" defaultValue={modal.user?.email || ""} placeholder="name@" required /></label><label className="cfcd-field"><span>Role</span><select name="role" defaultValue={modal.user?.role || "CFCD Analyst"}>{roles.map((role) => <option value={role.name} key={role.id}>{role.name}</option>)}</select></label><label className="cfcd-checkbox-field"><input type="checkbox" name="twoFactor" defaultChecked={modal.user?.twoFactor ?? true} /><span>Two-factor authentication enabled (demo flag)</span></label><p className="cfcd-form-note">New accounts are created with Pending status in this front-end prototype. No invitation email is sent.</p></Modal>}
      {modal?.type === "role" && <Modal title={modal.role ? "Edit role" : "Add role"} subtitle="Define a role name and purpose.Permissions will be enforced in the backend." onClose={() => setModal(null)} onSubmit={saveRole} submitLabel={modal.role ? "Save role" : "Create role"}><label className="cfcd-field"><span>Role name</span><input name="name" defaultValue={modal.role?.name || ""} placeholder="e.g. Court Status Viewer" required autoFocus /></label><label className="cfcd-field"><span>Description</span><textarea name="description" rows="3" defaultValue={modal.role?.description || ""} placeholder="Describe the responsibilities and access scope for this role." /></label>{modal.role?.users > 0 && <p className="cfcd-form-note">This role currently has {modal.role.users} assigned users. Reassign them before deleting the role.</p>}</Modal>}
    </div>
  );
}

function pageTitle(page) {
  return ({ overview: "Administrator Dashboard", users: "User Management", roles: "Roles List", security: "Security Management", setup: "System Setup" })[page] || "Administrator Dashboard";
}

function pageDescription(page) {
  return ({
    overview: "A clear view of case turnaround, workload, and system health.",
    users: "Create accounts, manage access status, and review authentication settings.",
    roles: "Organise user access by operational responsibility and permission profile.",
    security: "Review audit activity and monitor key account security indicators.",
    setup: "Configure system defaults and review security and operational policies.",
  })[page] || "Manage the CFCD Case Tracking System.";
}

function initials(name) {
  return String(name || "U").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("");
}

function auditDotClass(action) {
  const value = action.toLowerCase();
  if (value.includes("suspend") || value.includes("delete")) return "warning";
  if (value.includes("sign-in")) return "success";
  if (value.includes("configuration") || value.includes("role")) return "purple";
  return "default";
}

