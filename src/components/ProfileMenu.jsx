import React, { useEffect, useRef, useState } from 'react';
import './ProfileMenu.css';

/** Demo-only account panel. It does not change real identity or server permissions. */
export default function ProfileMenu({ name = 'Demo User', email = '', role = 'User', notifications = true, onSave = () => {}, onSignOut = () => {} }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ displayName: name, profileEmail: email, notifications });
  const [saved, setSaved] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    function closeOnOutsideClick(event) { if (root.current && !root.current.contains(event.target)) setOpen(false); }
    function closeOnEscape(event) { if (event.key === 'Escape') { setOpen(false); setEditing(false); } }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', closeOnOutsideClick); document.removeEventListener('keydown', closeOnEscape); };
  }, []);

  function openEditor() {
    setDraft({ displayName: name, profileEmail: email, notifications });
    setOpen(false);
    setSaved(false);
    setEditing(true);
  }
  function saveProfile(event) {
    event.preventDefault();
    onSave({ displayName: draft.displayName.trim(), profileEmail: draft.profileEmail.trim(), notifications: draft.notifications });
    setSaved(true);
  }
  const initials = String(name || 'U').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');
  return <div className="cfcd-profile-menu" ref={root}>
    <button type="button" className="cfcd-profile-trigger" aria-expanded={open} aria-haspopup="menu" aria-label="Open profile menu" onClick={() => setOpen(value => !value)}>
      <span className="cfcd-profile-avatar">{initials}</span><span className="cfcd-profile-chevron" aria-hidden="true">▾</span>
    </button>
    {open && <div className="cfcd-profile-dropdown" role="menu">
      <div className="cfcd-profile-identity"><strong>{name}</strong><small>{role}</small></div>
      <button role="menuitem" type="button" onClick={openEditor}>Profile</button>
      <button role="menuitem" type="button" onClick={onSignOut}>Sign Out</button>
    </div>}
    {editing && <div className="cfcd-profile-overlay" onMouseDown={event => { if (event.target === event.currentTarget) setEditing(false); }}>
      <section className="cfcd-profile-dialog" role="dialog" aria-modal="true" aria-label="Profile settings">
        <div className="cfcd-profile-dialog-header"><h2>Profile settings</h2><button type="button" aria-label="Close profile settings" onClick={() => setEditing(false)}>×</button></div>
        <p>Edit your prototype profile information. These changes are not stored on a server.</p>
        <form onSubmit={saveProfile}>
          <label>Display name<input required maxLength={80} value={draft.displayName} onChange={event => { setSaved(false); setDraft({ ...draft, displayName: event.target.value }); }} /></label>
          <label>Contact email<input type="email" required value={draft.profileEmail} onChange={event => { setSaved(false); setDraft({ ...draft, profileEmail: event.target.value }); }} /></label>
          <label>Access role<input disabled value={role} aria-label="Your assigned role" /></label>
          <label className="cfcd-profile-check"><input type="checkbox" checked={draft.notifications} onChange={event => { setSaved(false); setDraft({ ...draft, notifications: event.target.checked }); }} /> Email notifications (demo preference)</label>
          {saved && <p className="cfcd-profile-notice" role="status">Profile updated for this demo session.</p>}
          <div className="cfcd-profile-actions"><button type="button" onClick={() => setEditing(false)}>Close</button><button type="submit">Save changes</button></div>
        </form>
      </section>
    </div>}
  </div>;
}
