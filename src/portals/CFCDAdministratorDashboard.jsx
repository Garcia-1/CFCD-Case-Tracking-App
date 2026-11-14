import React, { useEffect, useMemo, useState } from "react";
import cfcdLogo from "../assets/CFCD-logo.jpg";
import "./CFCDAdministratorDashboard.css";
import { addAuditRecord, loadAdminDashboard, removeRoleRecord, removeUserProfile, saveRoleRecord, saveSystemConfig as persistSystemConfig, saveUserProfile, sendPasswordReset } from "../services/firestoreService";

/**
 * CFCD Administrator Dashboard
 * Dashboard records are loaded from and persisted to Firebase Firestore.
 * Firebase Authentication remains the sign-in authority.
 */

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

export default function CFCDAdministratorDashboard({ session, onSignOut }) {
  const [activePage, setActivePage] = useState("overview");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
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

  useEffect(() => {
    let active = true;
    const loadData = async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        const data = await loadAdminDashboard(session);
        if (!active) return;
        setUsers(data.users);
        setRoles(data.roles);
        setAuditLogs(data.auditLogs);
        setCases(data.cases);
        if (data.config) {
          setConfig((previous) => ({ ...previous, ...data.config }));
        }
      } catch (error) {
        if (active) notify(`Database error: ${error.message}`);
      } finally {
        if (active && !silent) setLoading(false);
      }
    };
    loadData();
    const onFocus = () => loadData(true);
    window.addEventListener('focus', onFocus);
    const refreshTimer = window.setInterval(() => loadData(true), 60000);
    return () => { active = false; window.removeEventListener('focus', onFocus); window.clearInterval(refreshTimer); };
  }, [session]);

  const addAuditEvent = async (action, target, details) => {
    const now = new Date();
    const record = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: now.toLocaleString("en-JM", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }),
      createdAt: now.toISOString(),
      action,
      by: session?.name || "Administrator",
      target: target || "—",
      ip: "client-session",
      details,
    };
    await addAuditRecord(session, record);
    setAuditLogs((previous) => [record, ...previous]);
  };

  const roleUserCount = (roleName) => users.filter((user) => user.role === roleName).length;
  const turnaroundTarget = Number(config.defaultTat || 20);
  const caseMetrics = useMemo(() => {
    const now = Date.now();
    const completed = cases.filter((item) => item.status === "Completed");
    const open = cases.filter((item) => item.status !== "Completed");
    const ageDays = (value) => value ? Math.max(0, (now - new Date(value).getTime()) / 86400000) : 0;
    const turnaroundDays = (item) => {
      if (!item.received) return 0;
      const start = new Date(item.received).getTime();
      const end = new Date(item.completedAt || item.updatedAt || now).getTime();
      return Math.max(0, (end - start) / 86400000);
    };
    const completedDurations = completed.map(turnaroundDays);
    const onTime = completedDurations.filter((days) => days <= turnaroundTarget).length;
    const overdue = open.filter((item) => ageDays(item.received) > turnaroundTarget).length;
    const average = completedDurations.length ? completedDurations.reduce((sum, days) => sum + days, 0) / completedDurations.length : 0;
    return {
      total: cases.length,
      open: open.length,
      completed: completed.length,
      overdue,
      onTimeRate: completed.length ? Math.round((onTime / completed.length) * 100) : 0,
      averageTat: average.toFixed(1),
    };
  }, [cases, turnaroundTarget]);
  const workload = useMemo(() => {
    const colors = ["blue", "pink", "gold", "mint"];
    const grouped = new Map();
    cases.filter((item) => item.status !== "Completed" && item.analyst && item.analyst !== "Unassigned").forEach((item) => {
      const row = grouped.get(item.analyst) || { name: item.analyst, title: "CFCD Analyst", open: 0, overdue: 0 };
      row.open += 1;
      const age = item.received ? (Date.now() - new Date(item.received).getTime()) / 86400000 : 0;
      if (age > turnaroundTarget) row.overdue += 1;
      grouped.set(item.analyst, row);
    });
    return Array.from(grouped.values()).map((row, index) => ({ ...row, initials: initials(row.name), color: colors[index % colors.length] }));
  }, [cases, turnaroundTarget]);

  const filteredUsers = useMemo(() => users.filter((user) => `${user.name} ${user.email} ${user.role} ${user.status}`.toLowerCase().includes(userSearch.toLowerCase())), [users, userSearch]);
  const filteredAudit = useMemo(() => auditLogs.filter((entry) => `${entry.date} ${entry.action} ${entry.by} ${entry.target} ${entry.ip} ${entry.details}`.toLowerCase().includes(auditSearch.toLowerCase())), [auditLogs, auditSearch]);

  const openUserModal = (user = null) => setModal({ type: "user", user });
  const openRoleModal = (role = null) => setModal({ type: "role", role });

  const inferPortal = (roleName) => {
    const value = String(roleName || '').toLowerCase();
    if (value.includes('admin')) return 'admin';
    if (value.includes('court') || value.includes('judge') || value.includes('prosecutor')) return 'court';
    return 'cfcd';
  };

  const saveUser = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const role = String(form.get("role") || "Analyst");
    const twoFactor = form.get("twoFactor") === "on";
    if (!name || !email) return;
    try {
      const id = modal.user?.id || `pending-${Date.now()}`;
      const updated = {
        ...(modal.user || {}), id, name, email, role, twoFactor,
        portal: inferPortal(role),
        status: modal.user?.status || "Pending",
        description: modal.user?.description || "Administrator-managed account profile",
      };
      await saveUserProfile(session, id, updated);
      setUsers((previous) => modal.user ? previous.map((item) => item.id === id ? updated : item) : [updated, ...previous]);
      await addAuditEvent(modal.user ? "User updated" : "User profile created", name, modal.user ? "Account profile updated in Firestore" : `Pending Firestore profile created; assigned role: ${role}`);
      notify(modal.user ? "User details saved to Firestore." : "Pending user profile saved to Firestore. Authentication provisioning is still a separate admin step.");
      setModal(null);
    } catch (error) { notify(`Could not save user: ${error.message}`); }
  };

  const userAction = async (action, user) => {
    if (user.id === session?.uid && (action === "Suspend" || action === "Delete")) {
      notify("You cannot suspend or remove the profile for the administrator account currently signed in.");
      return;
    }
    try {
      if (action === "Suspend" || action === "Activate") {
        const status = action === "Activate" || user.status === "Suspended" ? "Active" : "Suspended";
        const updated = { ...user, status };
        await saveUserProfile(session, user.id, updated);
        setUsers((previous) => previous.map((item) => item.id === user.id ? updated : item));
        await addAuditEvent(status === "Active" ? "User activated" : "User suspended", user.name, status === "Active" ? "Account profile access enabled" : "Account profile access disabled");
        notify(`${user.name}'s account profile is now ${status.toLowerCase()}.`);
      } else if (action === "Reset Password") {
        await sendPasswordReset(user.email);
        await addAuditEvent("Password reset requested", user.name, "Firebase password reset email requested");
        notify(`Password reset email requested for ${user.name}.`);
      } else if (action === "Reset Authenticator") {
        const updated = { ...user, twoFactor: false };
        await saveUserProfile(session, user.id, updated);
        setUsers((previous) => previous.map((item) => item.id === user.id ? updated : item));
        await addAuditEvent("Authenticator flag reset", user.name, "Two-factor profile flag cleared in Firestore");
        notify(`Two-factor profile flag cleared for ${user.name}.`);
      } else if (action === "Delete") {
        if (window.confirm(`Remove the Firestore profile for ${user.name}? This does not delete a Firebase Authentication account.`)) {
          await removeUserProfile(session, user.id);
          setUsers((previous) => previous.filter((item) => item.id !== user.id));
          await addAuditEvent("User profile removed", user.name, "Firestore user profile deleted; Firebase Auth user, if any, was not deleted");
          notify("Firestore user profile removed.");
        }
      }
    } catch (error) { notify(`Account action failed: ${error.message}`); }
  };

  const saveRole = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const description = String(form.get("description") || "").trim();
    if (!name) return;
    try {
      const id = modal.role?.id || `role-${Date.now()}`;
      const updated = { ...(modal.role || {}), id, name, description };
      delete updated.users;
      await saveRoleRecord(session, id, updated);
      setRoles((previous) => modal.role ? previous.map((role) => role.id === id ? updated : role) : [...previous, updated]);
      await addAuditEvent(modal.role ? "Role updated" : "Role created", name, "Role record saved in Firestore");
      notify(modal.role ? "Role updated in Firestore." : "Role created in Firestore.");
      setModal(null);
    } catch (error) { notify(`Could not save role: ${error.message}`); }
  };

  const deleteRole = async (role) => {
    const assigned = roleUserCount(role.name);
    if (assigned > 0) {
      notify("This role has assigned users. Reassign them before deleting the role.");
      return;
    }
    if (window.confirm(`Delete the ${role.name} role?`)) {
      try {
        await removeRoleRecord(session, role.id);
        setRoles((previous) => previous.filter((item) => item.id !== role.id));
        await addAuditEvent("Role deleted", role.name, "Role removed from Firestore");
        notify("Role deleted from Firestore.");
      } catch (error) { notify(`Could not delete role: ${error.message}`); }
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

  const saveSystemConfig = async (event) => {
    event.preventDefault();
    try {
      await persistSystemConfig(session, config);
      setConfigSaved(true);
      await addAuditEvent("Configuration changed", "System settings", "System configuration saved in Firestore");
      notify("System configuration saved to Firestore.");
    } catch (error) { notify(`Could not save configuration: ${error.message}`); }
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
          <p>Your Firebase session has ended. Return to the application sign-in screen to authenticate again.</p>
          <button className="cfcd-btn primary" onClick={() => { if (typeof onSignOut === "function") onSignOut(); }}>Return to sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cfcd-admin-app">
      <aside className={`cfcd-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="cfcd-sidebar-brand">
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
            <img className="cfcd-topbar-logo" src={cfcdLogo} alt="CFCD logo" />
            <div className="cfcd-topbar-brand"><strong>CFCD Case Management</strong><small>Administrator Portal</small></div>
            <div className="cfcd-breadcrumb"><span>Admin Portal</span><Icon name="chevron" size={14} /><strong>{NAV_ITEMS.find((item) => item.id === activePage)?.label || "Overview"}</strong></div>
          </div>
          <div className="cfcd-topbar-right">
            <div className="cfcd-topbar-date"><span className="cfcd-live-dot" /> Operational Overview</div>
            <div className="cfcd-topbar-divider" />
            <div className="cfcd-profile-menu-wrap"><button className="cfcd-admin-identity cfcd-profile-trigger" aria-label="Open profile menu" aria-expanded={profileMenuOpen} onClick={() => setProfileMenuOpen(value => !value)}><div className="cfcd-avatar">{initials(session?.name || "Administrator")}</div><div className="cfcd-admin-name"><strong>{session?.name || "Administrator"}</strong><span>{session?.role || "System Administrator"}</span></div></button>{profileMenuOpen && <div className="cfcd-profile-popover"><strong>{session?.name || "Administrator"}</strong><span>{session?.role || "System Administrator"} Portal</span><button className="cfcd-btn signout" onClick={() => { setToast(""); if (typeof onSignOut === "function") onSignOut(); else setIsSignedIn(false); }}><Icon name="logout" size={16} /><span>Sign out</span></button></div>}</div>
          </div>
        </header>

        <div className="cfcd-system-ticker" role="note" aria-label="System notice"><div className="cfcd-system-ticker-track"><span>DEMONSTRATION ONLY — Fictional case records. CFCD account, case, workflow, and system activity is managed through this Firebase-backed prototype.</span><span aria-hidden="true">DEMONSTRATION ONLY — Fictional case records. CFCD account, case, workflow, and system activity is managed through this Firebase-backed prototype.</span></div></div>

        <div className="cfcd-page-content">
          <div className="cfcd-page-heading">
            <div><div className="cfcd-eyebrow">ADMINISTRATION / {activePage.toUpperCase()}</div><h1>{pageTitle(activePage)}</h1><p>{pageDescription(activePage)}</p></div>
            <div className="cfcd-heading-actions">{activePage === "users" && <button className="cfcd-btn primary" onClick={() => openUserModal()}><Icon name="plus" size={17} /> Add user</button>}{activePage === "roles" && <button className="cfcd-btn primary" onClick={() => openRoleModal()}><Icon name="plus" size={17} /> Add role</button>}{activePage === "security" && <button className="cfcd-btn secondary" onClick={exportAuditCsv}><Icon name="download" size={16} /> Export audit log</button>}</div>
          </div>

          {activePage === "overview" && (
            <>
              <div className="cfcd-overview-banner"><div className="cfcd-banner-symbol"><Icon name="building" size={23} /></div><div className="cfcd-banner-copy"><strong>CFCD Operational Overview</strong><span>Monitor case turnaround, officer workload, and service performance from one place.</span></div><div className="cfcd-banner-date"><span>REPORTING PERIOD</span><strong>Current snapshot</strong></div></div>
              <div className="cfcd-section-heading"><div><h2>Case performance</h2><p>Key indicators across the division</p></div><span className="cfcd-snapshot-label"><span className="cfcd-live-dot" /> {loading ? "Loading Firestore" : "Live Firestore snapshot"}</span></div>
              <div className="cfcd-metrics-grid">
                <MetricCard icon="check" label="Completed within target" value={`${caseMetrics.onTimeRate}%`} note="of completed cases" tone="green" />
                <MetricCard icon="building" label="Total cases" value={caseMetrics.total} note="all registered cases" tone="blue" />
                <MetricCard icon="clock" label="Open cases" value={caseMetrics.open} note="currently in progress" tone="purple" />
                <MetricCard icon="alert" label="Overdue cases" value={caseMetrics.overdue} note="require attention" tone="orange" />
                <MetricCard icon="clock" label="Average turnaround" value={`${caseMetrics.averageTat} days`} note="completed cases" tone="teal" />
              </div>

              <div className="cfcd-content-grid cfcd-overview-tables">
                <section className="cfcd-panel cfcd-division-panel">
                  <div className="cfcd-panel-heading"><div><h2>Turnaround by CFCD</h2><p>Division-wide case performance</p></div><span className="cfcd-panel-icon"><Icon name="building" /></span></div>
                  <div className="cfcd-table-wrap"><table className="cfcd-table cfcd-division-table"><thead><tr><th>Division</th><th>Open</th><th>Overdue</th><th>Completed</th><th>Avg TAT</th><th>On-time rate</th></tr></thead><tbody><tr><td><div className="cfcd-division-cell"><div className="cfcd-table-avatar">CF</div><div><strong>CFCD</strong><span>Communication Forensics and Cybercrime Division</span></div></div></td><td><strong>{caseMetrics.open}</strong></td><td><span className="cfcd-number-alert">{caseMetrics.overdue}</span></td><td><strong>{caseMetrics.completed}</strong></td><td>{caseMetrics.averageTat} days</td><td><div className="cfcd-rate-cell"><strong>{caseMetrics.onTimeRate}%</strong><span className="cfcd-progress"><span style={{ width: `${caseMetrics.onTimeRate}%` }} /></span></div></td></tr></tbody></table></div>
                  <div className="cfcd-table-footnote"><span><Icon name="alert" size={14} /> Overdue cases are included in open cases.</span><span>Turnaround target: {turnaroundTarget} days</span></div>
                </section>

                <section className="cfcd-panel cfcd-workload-panel">
                  <div className="cfcd-panel-heading"><div><h2>CFCD officer workload</h2><p>Open and overdue cases by officer</p></div><button className="cfcd-icon-button" onClick={() => notify("Officer workload is calculated from Firestore case assignments.")} aria-label="Workload information"><Icon name="more" /></button></div>
                  <div className="cfcd-workload-list">
                    {workload.map((officer) => <div className="cfcd-officer-row" key={officer.name}><div className={`cfcd-officer-avatar ${officer.color}`}>{officer.initials}</div><div className="cfcd-officer-details"><strong>{officer.name}</strong><span>{officer.title}</span><div className="cfcd-officer-counts"><span>{officer.open} open</span><span className="cfcd-overdue-mini">{officer.overdue} overdue</span></div></div><div className="cfcd-officer-bar" title={`${officer.open} open cases`}><span style={{ height: `${Math.max(22, officer.open * 5)}px` }} /></div></div>)}
                    {!workload.length && <div className="cfcd-empty-state"><strong>No assigned open cases</strong><span>Workload will appear when Firestore cases are assigned.</span></div>}
                  </div>
                  <div className="cfcd-panel-footer">Workload is calculated from open Firestore case assignments.</div>
                </section>
              </div>

              <section className="cfcd-panel cfcd-quick-actions-panel"><div className="cfcd-panel-heading"><div><h2>Administration Shortcuts</h2><p>Common system management tasks</p></div></div><div className="cfcd-shortcut-grid"><button className="cfcd-shortcut" onClick={() => navTo("users")}><span className="cfcd-shortcut-icon blue"><Icon name="users" /></span><span><strong>Manage users</strong><small>Create and maintain user accounts</small></span><Icon name="chevron" size={17} /></button><button className="cfcd-shortcut" onClick={() => navTo("roles")}><span className="cfcd-shortcut-icon purple"><Icon name="shield" /></span><span><strong>Review roles</strong><small>Manage roles and access profiles</small></span><Icon name="chevron" size={17} /></button><button className="cfcd-shortcut" onClick={() => navTo("security")}><span className="cfcd-shortcut-icon orange"><Icon name="lock" /></span><span><strong>Security audit</strong><small>Review recorded activity</small></span><Icon name="chevron" size={17} /></button><button className="cfcd-shortcut" onClick={() => navTo("setup")}><span className="cfcd-shortcut-icon green"><Icon name="settings" /></span><span><strong>System setup</strong><small>Review system configuration</small></span><Icon name="chevron" size={17} /></button></div></section>
            </>
          )}

          {activePage === "users" && (
            <section className="cfcd-panel cfcd-full-panel">
              <div className="cfcd-panel-heading cfcd-table-heading"><div><h2>System Users</h2><p>Manage user accounts and account security settings</p></div><div className="cfcd-heading-tools"><span className="cfcd-count-badge">{users.length} accounts</span></div></div>
              <div className="cfcd-table-toolbar"><label className="cfcd-searchbox"><Icon name="search" size={17} /><input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users, email, or role..." /></label><span className="cfcd-muted-text">{filteredUsers.length} of {users.length} users</span></div>
              <div className="cfcd-table-wrap"><table className="cfcd-table"><thead><tr><th>User</th><th>Email</th><th>Account Status</th><th>Two-Factor</th><th>Actions</th></tr></thead><tbody>{filteredUsers.map((user) => <tr key={user.id}><td><div className="cfcd-user-cell"><div className="cfcd-small-avatar">{initials(user.name)}</div><div><strong>{user.name}</strong><span>{user.role}</span></div></div></td><td className="cfcd-email-cell">{user.email}</td><td><StatusPill status={user.status} /></td><td><span className={`cfcd-twofactor ${user.twoFactor ? "enabled" : "disabled"}`}><span />{user.twoFactor ? "Enabled" : "Not enabled"}</span></td><td><div className="cfcd-actions-cell">{user.status === "Pending" ? <button className="cfcd-action-button" onClick={() => userAction("Activate", user)}>Activate</button> : <button className="cfcd-action-button" onClick={() => userAction("Suspend", user)}>{user.status === "Suspended" ? "Restore" : "Suspend"}</button>}<button className="cfcd-action-button" onClick={() => userAction("Reset Password", user)}>Reset Password</button><button className="cfcd-action-button" onClick={() => userAction("Reset Authenticator", user)}>Reset Authenticator</button><button className="cfcd-action-button danger" onClick={() => userAction("Delete", user)}>Delete</button><button className="cfcd-icon-button small" aria-label={`Edit ${user.name}`} title="Edit user" onClick={() => openUserModal(user)}><Icon name="edit" size={15} /></button></div></td></tr>)}</tbody></table>{filteredUsers.length === 0 && <div className="cfcd-empty-state"><Icon name="search" size={25} /><strong>No matching users</strong><span>Try another search term.</span></div>}</div>
              <div className="cfcd-panel-footnote">Account profile status, role metadata and audit events now persist in Firestore. Firebase Authentication account creation/deletion still requires an Admin SDK or trusted server function.</div>
            </section>
          )}

          {activePage === "roles" && (
            <section className="cfcd-panel cfcd-full-panel">
              <div className="cfcd-panel-heading cfcd-table-heading"><div><h2>Roles and permissions</h2><p>Define the access profiles used throughout the CFCD Case Tracking System</p></div></div>
              <div className="cfcd-role-note"><Icon name="shield" size={18} /><div><strong>Role-based access control (RBAC)</strong><span>Assign each user the minimum permissions required for their duties. Changes must be enforced by the backend, not only the interface.</span></div></div>
              <div className="cfcd-role-list">{roles.map((role) => <article className="cfcd-role-row" key={role.id}><div className="cfcd-role-icon"><Icon name="shield" size={19} /></div><div className="cfcd-role-info"><strong>{role.name}</strong><span>{role.description || "No description provided."}</span></div><div className="cfcd-role-usercount"><strong>{roleUserCount(role.name)}</strong><span>assigned users</span></div><div className="cfcd-role-actions"><button className="cfcd-btn secondary small-btn" onClick={() => openRoleModal(role)}><Icon name="edit" size={14} /> Edit</button><button className="cfcd-btn danger-outline small-btn" onClick={() => deleteRole(role)}><Icon name="trash" size={14} /> Delete</button></div></article>)}</div>
              <div className="cfcd-panel-footnote"></div>
            </section>
          )}

          {activePage === "security" && (
            <>
              <div className="cfcd-security-summary"><div className="cfcd-security-summary-icon"><Icon name="lock" size={22} /></div><div><strong>Security management</strong><span>Monitor account events and configuration activity. Administrative actions below are persisted as Firestore audit records for this prototype.</span></div><StatusPill status="Demo mode" /></div>
              <div className="cfcd-metrics-grid cfcd-security-metrics"><MetricCard icon="shield" label="Two-factor enabled" value={`${users.filter((user) => user.twoFactor).length}`} note={`of ${users.length} profiles`} tone="green" /><MetricCard icon="alert" label="Suspended accounts" value={users.filter((user) => user.status === "Suspended").length} note="profile access disabled" tone="orange" /><MetricCard icon="clock" label="Audit entries" value={auditLogs.length} note="stored in Firestore" tone="blue" /><MetricCard icon="check" label="Policy controls" value="3 / 3" note="example settings available" tone="purple" /></div>
              <section className="cfcd-panel cfcd-full-panel"><div className="cfcd-panel-heading cfcd-table-heading"><div><h2>Audit log</h2><p>Track administrative and account activity</p></div><button className="cfcd-btn secondary" onClick={exportAuditCsv}><Icon name="download" size={16} /> Export CSV</button></div><div className="cfcd-table-toolbar"><label className="cfcd-searchbox"><Icon name="search" size={17} /><input value={auditSearch} onChange={(event) => setAuditSearch(event.target.value)} placeholder="Search action, user, IP address, or details..." /></label><span className="cfcd-muted-text">{filteredAudit.length} entries</span></div><div className="cfcd-table-wrap"><table className="cfcd-table"><thead><tr><th>Date</th><th>Action</th><th>Performed By</th><th>Target User</th><th>IP Address</th><th>Details</th></tr></thead><tbody>{filteredAudit.map((entry) => <tr key={entry.id}><td className="cfcd-nowrap">{entry.date}</td><td><span className="cfcd-audit-action"><span className={`cfcd-audit-dot ${auditDotClass(entry.action)}`} />{entry.action}</span></td><td>{entry.by}</td><td>{entry.target}</td><td><code className="cfcd-ip-code">{entry.ip}</code></td><td className="cfcd-audit-details">{entry.details}</td></tr>)}</tbody></table>{filteredAudit.length === 0 && <div className="cfcd-empty-state"><Icon name="search" size={25} /><strong>No matching audit entries</strong><span>Try another search term.</span></div>}</div><div className="cfcd-panel-footnote">Production audit records should be append-only, access-controlled, time-synchronised, and stored server-side with retention policies.</div></section>
              <section className="cfcd-security-principles"><div><Icon name="shield" size={19} /><strong>Least privilege</strong><span>Grant only the access needed for each role.</span></div><div><Icon name="lock" size={19} /><strong>Strong authentication</strong><span>Require MFA for privileged accounts.</span></div><div><Icon name="eye" size={19} /><strong>Traceability</strong><span>Record who did what, when, and to which account.</span></div></section>
            </>
          )}

          {activePage === "setup" && (
            <form onSubmit={saveSystemConfig} className="cfcd-system-setup">
              <section className="cfcd-panel cfcd-full-panel"><div className="cfcd-panel-heading"><div><h2>System configuration</h2><p>Manage default workflow, security, and notification settings</p></div><span className="cfcd-settings-chip"><Icon name="settings" size={15} /> Administrator settings</span></div><div className="cfcd-setup-section"><div className="cfcd-setup-section-title"><span className="cfcd-setup-section-icon blue"><Icon name="clock" /></span><div><h3>Case turnaround and reminders</h3><p>Default values to help identify cases requiring attention.</p></div></div><div className="cfcd-form-grid"><label className="cfcd-field"><span>Default turnaround target (calendar days)</span><input type="number" min="1" max="365" value={config.defaultTat} onChange={(event) => { setConfig({ ...config, defaultTat: event.target.value }); setConfigSaved(false); }} required /><small>Used as the initial target for new cases; define exclusions with stakeholders.</small></label><label className="cfcd-field"><span>Overdue reminder interval (days)</span><input type="number" min="1" max="30" value={config.overdueReminder} onChange={(event) => { setConfig({ ...config, overdueReminder: event.target.value }); setConfigSaved(false); }} required /><small>Example interval for a future notification service.</small></label></div></div><div className="cfcd-setup-section"><div className="cfcd-setup-section-title"><span className="cfcd-setup-section-icon purple"><Icon name="lock" /></span><div><h3>Security and session policy</h3><p>Recommended controls for protecting restricted case status information.</p></div></div><div className="cfcd-form-grid"><label className="cfcd-field"><span>Session idle timeout (minutes)</span><input type="number" min="5" max="120" value={config.sessionTimeout} onChange={(event) => { setConfig({ ...config, sessionTimeout: event.target.value }); setConfigSaved(false); }} required /><small>Enforced by the app session manager after the next sign-in or session refresh.</small></label><label className="cfcd-field"><span>Audit log retention (days)</span><input type="number" min="30" max="3650" value={config.auditRetention} onChange={(event) => { setConfig({ ...config, auditRetention: event.target.value }); setConfigSaved(false); }} required /><small>Final retention period must follow approved policy.</small></label></div><div className="cfcd-toggle-list"><label className="cfcd-toggle-row"><span><strong>Require two-factor authentication</strong><small>Require MFA for users at sign-in, especially privileged roles.</small></span><input type="checkbox" checked={config.requireTwoFactor} onChange={(event) => { setConfig({ ...config, requireTwoFactor: event.target.checked }); setConfigSaved(false); }} /><i /></label><label className="cfcd-toggle-row"><span><strong>Email notifications</strong><small>Enable event notifications when an email service is configured.</small></span><input type="checkbox" checked={config.emailNotifications} onChange={(event) => { setConfig({ ...config, emailNotifications: event.target.checked }); setConfigSaved(false); }} /><i /></label></div></div><div className="cfcd-setup-section"><div className="cfcd-setup-section-title"><span className="cfcd-setup-section-icon orange"><Icon name="alert" /></span><div><h3>System availability</h3><p>Use maintenance mode only through an approved operational process.</p></div></div><label className="cfcd-maintenance-row"><span><strong>Maintenance mode</strong><small>Blocks non-admin Firestore access immediately; non-admin sign-in is also refused while enabled.</small></span><span className={`cfcd-maintenance-state ${config.maintenanceMode ? "enabled" : ""}`}>{config.maintenanceMode ? "Enabled" : "Disabled"}</span><input type="checkbox" checked={config.maintenanceMode} onChange={(event) => { setConfig({ ...config, maintenanceMode: event.target.checked }); setConfigSaved(false); }} /><i /></label></div><div className="cfcd-setup-footer"><div>{configSaved && <span className="cfcd-saved-message"><Icon name="check" size={16} /> Saved to Firestore</span>}</div><button className="cfcd-btn primary" type="submit">Save configuration <Icon name="chevron" size={15} /></button></div><div className="cfcd-panel-footnote">These settings are stored in Firestore. Session timeout and maintenance mode are enforced by the app/rules; MFA and email notifications still require their dedicated Firebase/email integrations.</div></section>
            </form>
          )}

          <footer className="cfcd-page-footer"><span>© 2026 CFCD Case Tracking System</span><span><span className="cfcd-live-dot" /> Administrator interface <span className="cfcd-footer-separator">•</span> Firestore-backed prototype</span></footer>
        </div>
      </main>

      {toast && <div className="cfcd-toast" role="status"><span className="cfcd-toast-check"><Icon name="check" size={16} /></span><span>{toast}</span><button onClick={() => setToast("")} aria-label="Dismiss notification"><Icon name="close" size={15} /></button></div>}

      {modal?.type === "user" && <Modal title={modal.user ? "Edit user" : "Add user"} subtitle="Manage a Firestore account profile." onClose={() => setModal(null)} onSubmit={saveUser} submitLabel={modal.user ? "Save user" : "Create user"}><label className="cfcd-field"><span>Full name</span><input name="name" defaultValue={modal.user?.name || ""} placeholder="Enter user's full name" required autoFocus /></label><label className="cfcd-field"><span>Email address</span><input name="email" type="email" defaultValue={modal.user?.email || ""} placeholder="name@" required /></label><label className="cfcd-field"><span>Role</span><select name="role" defaultValue={modal.user?.role || "Analyst"}>{roles.map((role) => <option value={role.name} key={role.id}>{role.name}</option>)}</select></label><label className="cfcd-checkbox-field"><input type="checkbox" name="twoFactor" defaultChecked={modal.user?.twoFactor ?? true} /><span>Two-factor authentication profile flag</span></label><p className="cfcd-form-note">New entries are created as Pending Firestore profiles. Creating the corresponding Firebase Authentication identity still requires trusted backend/Admin SDK provisioning.</p></Modal>}
      {modal?.type === "role" && <Modal title={modal.role ? "Edit role" : "Add role"} subtitle="Define a role name and purpose.Permissions will be enforced in the backend." onClose={() => setModal(null)} onSubmit={saveRole} submitLabel={modal.role ? "Save role" : "Create role"}><label className="cfcd-field"><span>Role name</span><input name="name" defaultValue={modal.role?.name || ""} placeholder="e.g. Court Status Viewer" required autoFocus /></label><label className="cfcd-field"><span>Description</span><textarea name="description" rows="3" defaultValue={modal.role?.description || ""} placeholder="Describe the responsibilities and access scope for this role." /></label>{modal.role && roleUserCount(modal.role.name) > 0 && <p className="cfcd-form-note">This role currently has {roleUserCount(modal.role.name)} assigned users. Reassign them before deleting the role.</p>}</Modal>}
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

