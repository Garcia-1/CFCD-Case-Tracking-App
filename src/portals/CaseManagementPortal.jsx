import React, { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, LayoutDashboard, FolderOpen, Scale, Plus, Search, Users, AlertTriangle, X, Save, Menu, ClipboardList, Activity, Bell, PanelLeftClose } from 'lucide-react';
import cfcdLogo from '../assets/CFCD-logo.jpg';
import ProfileMenu from '../components/ProfileMenu';
import './CaseManagementPortal.css';
import { createCaseRecord, createUrgentRequest, loadCaseDashboard, reviewUrgentRequest, updateAssignedCaseDocument, updateCaseRecord } from '../services/firestoreService';

const STATUS = ['Completed', 'Not Completed', 'Assigned', 'Unassigned'];
const ITEMS = ['Mobile', 'PC', 'Video', 'ICCID', 'Others'];
const DIVISIONS = ['Hanover','St. James','Trelawny','Westmoreland','Portland','St. Ann','St. Mary','Clarendon','Manchester','St. Elizabeth','Kingston Central','Kingston Eastern','Kingston Western','St. Andrew Central','St. Andrew South','St. Andrew North','St. Catherine North','St. Catherine South','St. Thomas','Other'];
const COURTS = ['Supreme Court','Kingston & St. Andrew Corporate Area Parish Court','St. Catherine Parish Court','Clarendon Parish Court','Manchester Parish Court','St. Elizabeth Parish Court','Westmoreland Parish Court','Hanover Parish Court','St. James Parish Court','Trelawny Parish Court','St. Ann Parish Court','St. Mary Parish Court','Portland Parish Court','St. Thomas Parish Court','Other'];
const emptyCase = { ref:'', otherRef:'', offence:'', received:'', item:'Mobile', itemOther:'', io:'', division:'', divisionOther:'', suspects:'', victims:'', analyst:'Unassigned', urgent:false };
const nowStamp = () => new Date().toLocaleString();
const displayDate = value => value ? value.replace('T',' ') : '—';
const nav = [{id:'Dashboard',Icon:LayoutDashboard},{id:'Case Registry',Icon:FolderOpen},{id:'Reports',Icon:ClipboardList},{id:'Activity',Icon:Activity},{id:'Court Urgent Requests',Icon:Scale},{id:'Team Workload',Icon:Users}];

export default function CaseManagementPortal({ initialRole = 'Supervisor', accountName = 'Demo User', session, onSignOut }) {
 const [role] = useState(initialRole);
 const [page,setPage] = useState('Dashboard');
 const [navOpen,setNavOpen] = useState(false);
 const [profileOpen,setProfileOpen] = useState(false);
 const [profileDetails,setProfileDetails] = useState({displayName:accountName,profileEmail:session?.email||'',notifications:true});
 const [notificationsOpen,setNotificationsOpen] = useState(false);
 const [readNotifications,setReadNotifications] = useState(() => {
   try { return JSON.parse(localStorage.getItem('cfcdReadCaseNotifications') || '[]'); }
   catch { return []; }
 });
 const [cases,setCases] = useState([]);
 const [requests,setRequests] = useState([]);
 const [analysts,setAnalysts] = useState([]);
 const [analystProfiles,setAnalystProfiles] = useState([]);
 const [loading,setLoading] = useState(true);
 const [query,setQuery] = useState('');
 const [newOpen,setNewOpen] = useState(false);
 const [form,setForm] = useState(emptyCase);
 const [selected,setSelected] = useState(null);
 const [editingRequest,setEditingRequest] = useState(null);
 const [courtOpen,setCourtOpen] = useState(false);
 const [courtForm,setCourtForm] = useState({caseRef:'',court:'',courtOther:'',courtDate:'',reason:''});
 const [message,setMessage] = useState('');
 const [formError,setFormError] = useState('');
 const [analystDraft,setAnalystDraft] = useState('');
 const [analystSaving,setAnalystSaving] = useState(false);
 const [analystSaveError,setAnalystSaveError] = useState('');
 const saveAnalystUpdate = async uid => {
   const current=cases.find(c=>c.uid===uid); if(!current||analystSaving)return;
   // `id` is added locally when Firestore documents are read. It is not a
   // stored case field, and sending it back would make this a forbidden edit.
   const { id: _documentId, ...caseRecord } = current;
   const updated={...caseRecord,analystReport:analystDraft,updatedAt:new Date().toISOString(),history:[...(caseRecord.history||[]),{at:nowStamp(),by:accountName,description:'Case document updated by assigned analyst'}]};
   setAnalystSaving(true);setAnalystSaveError('');
   try { await updateAssignedCaseDocument(session,uid,updated);setCases(old=>old.map(c=>c.uid===uid?updated:c));setSelected(null);setMessage('Case document update saved.'); }
   catch(error) { setAnalystSaveError(`Could not save case document: ${error.message}`); }
   finally { setAnalystSaving(false); }
 };
 const [requestDraft,setRequestDraft] = useState({caseStatus:'Not Completed',analyst:'Unassigned',publicNote:'',requestStatus:'Under Review'});
 const visible = useMemo(() => role==='Supervisor'?cases:role==='Analyst'?cases.filter(c=>c.analyst===accountName):cases, [cases,role,accountName]);
 const assignedNotifications = role==='Analyst' ? cases.filter(c=>(c.analystUid&&c.analystUid===session?.uid)||c.analyst===accountName).map(c=>({...c,notificationKey:`${c.uid}:${c.analystUid||c.analyst}`})) : [];
 const unreadNotificationCount = assignedNotifications.filter(c=>!readNotifications.includes(c.notificationKey)).length;
 const openCaseNotification = c => {
   const next=[...new Set([...readNotifications,c.notificationKey])];
   setReadNotifications(next);
   try { localStorage.setItem('cfcdReadCaseNotifications',JSON.stringify(next)); } catch {}
   setSelected(c.uid);setAnalystDraft(c.analystReport||'');setNotificationsOpen(false);
 };
 const analystOptions = useMemo(() => ['Unassigned', ...new Set([...analysts, ...cases.map(c=>c.analyst).filter(a=>a&&a!=='Unassigned')])], [analysts,cases]);
 const analystUidFor = name => analystProfiles.find(profile=>profile.name===name)?.id || '';
 const filtered = visible.filter(c=>Object.values(c).filter(x=>typeof x==='string').join(' ').toLowerCase().includes(query.toLowerCase())).sort((a,b)=>Number(Boolean(b.urgent))-Number(Boolean(a.urgent)));
 const year = new Date().getFullYear();
 const nextCons = String(Math.max(0,...cases.filter(c=>c.registryYear===year).map(c=>Number(c.cons)||0))+1).padStart(2,'0');
 useEffect(() => {
   let active = true;
   const loadData = async (silent = false) => {
     try {
       if (!silent) setLoading(true);
       const data = await loadCaseDashboard(session);
       if (!active) return;
       // Older records keep their history, but no longer appear in a separate
       // technical-issues workflow.
       setCases(data.cases.map(c=>c.status==='Technical Issues'?{...c,status:'Not Completed'}:c));
       setRequests(data.requests);
       setAnalysts(data.analysts || []);
       setAnalystProfiles(data.analystProfiles || []);
       if (data.cases.length) setCourtForm(old => ({...old, caseRef:old.caseRef || data.cases[0].ref}));
     } catch (error) {
       if (active) setMessage(`Database error: ${error.message}`);
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
 const changeCase = async (uid,patch,description) => {
   const current=cases.find(c=>c.uid===uid); if(!current)return false;
   const completionPatch = patch.status === 'Completed' && current.status !== 'Completed'
     ? { completedAt:new Date().toISOString() }
     : patch.status && patch.status !== 'Completed' && current.status === 'Completed'
       ? { completedAt:'' }
       : {};
   const updated={...current,...patch,...completionPatch,updatedAt:new Date().toISOString(),history:[...(current.history||[]),{at:nowStamp(),by:accountName,description}]};
   try {
     await updateCaseRecord(session,uid,updated);
     setCases(old=>old.map(c=>c.uid===uid?updated:c));
     setMessage(description);
     return true;
   } catch(error) { setMessage(`Could not save case: ${error.message}`); return false; }
 };
 const createCase = async e => {
   e.preventDefault(); const ref=form.ref.trim().toUpperCase();
   if(!/^CFCD-\d+[DV]-\d{4}$/.test(ref)){setFormError('Use the format CFCD-22D-2026 or CFCD-22V-2026.');return;}
   if(cases.some(c=>c.ref.toUpperCase()===ref)){setFormError('That case reference already exists.');return;}
   if(!form.offence.trim()||!form.received||!form.io.trim()||!form.division.trim()||(form.division==='Other'&&!form.divisionOther.trim())||(form.item==='Others'&&!form.itemOther.trim())){setFormError('Complete the required fields, including each Other description.');return;}
   setFormError('');
   const analyst=role==='Supervisor'?form.analyst:'Unassigned';
   const analystUid=analyst==='Unassigned'?'':analystUidFor(analyst);
   const uid=`case-${Date.now()}-${cases.length}`;
   const createdAt=new Date().toISOString();
   const entry={...form,division:form.division==='Other'?form.divisionOther.trim():form.division,uid,cons:nextCons,registryYear:year,ref,otherRef:form.otherRef.trim(),item:form.item==='Others'?`Others: ${form.itemOther.trim()}`:form.item,urgent:Boolean(form.urgent),analyst,analystUid,status:analyst==='Unassigned'?'Unassigned':'Assigned',createdBy:accountName,createdAt,updatedAt:createdAt,history:[{at:nowStamp(),by:accountName,description:form.urgent?'Urgent case registered':'Case registered'}]};
   try {
     await createCaseRecord(session,entry);
     setCases(old=>[entry,...old]);setForm(emptyCase);setNewOpen(false);setPage('Case Registry');setMessage(`${ref} registered with Cons No. ${nextCons}.`);
   } catch(error) { setFormError(`Could not register case: ${error.message}`); }
 };
 const openRequest = r => {
   const c=cases.find(x=>x.ref===r.caseRef);
   setEditingRequest(r.id);
   setRequestDraft({caseStatus:c?.status==='Technical Issues'?'Not Completed':c?.status||'Not Completed',analyst:c?.analyst||'Unassigned',publicNote:r.publicNote||'',requestStatus:r.requestStatus==='Pending Review'?'Under Review':r.requestStatus});
 };
 const saveResponse = async e => {
   e.preventDefault(); const r=requests.find(x=>x.id===editingRequest);if(!r)return;
   if(requestDraft.caseStatus==='Assigned'&&requestDraft.analyst==='Unassigned'){setMessage('Select an analyst before setting the status to Assigned.');return;}
   if(requestDraft.caseStatus==='Unassigned'&&requestDraft.analyst!=='Unassigned'){setMessage('Set the assigned analyst to Unassigned for this status.');return;}
   const c=cases.find(x=>x.ref===r.caseRef);
   const reviewedAt=new Date().toISOString();
   const updatedRequest={...r,requestStatus:requestDraft.requestStatus,replyStatus:requestDraft.caseStatus,publicNote:requestDraft.publicNote,reviewedBy:accountName,reviewedAt};
   const completionPatch = c && requestDraft.caseStatus === 'Completed' && c.status !== 'Completed'
     ? { completedAt:reviewedAt }
     : c && requestDraft.caseStatus !== 'Completed' && c.status === 'Completed'
       ? { completedAt:'' }
       : {};
   const updatedCase = c ? {
     ...c,
     ...completionPatch,
     status:requestDraft.caseStatus,
     analyst:requestDraft.analyst,
     analystUid:requestDraft.analyst==='Unassigned'?'':analystUidFor(requestDraft.analyst),
     updatedAt:reviewedAt,
     history:[...(c.history||[]),{at:nowStamp(),by:accountName,description:`Court request ${r.id} reviewed; case status updated`}],
   } : null;
   try {
     await reviewUrgentRequest(session,{requestId:r.id,requestRecord:updatedRequest,caseId:c?.uid,caseRecord:updatedCase});
     if(updatedCase)setCases(old=>old.map(x=>x.uid===updatedCase.uid?updatedCase:x));
     setRequests(old=>old.map(x=>x.id===r.id?updatedRequest:x));
     setEditingRequest(null);setMessage(`Supervisor response saved for ${r.id}. Case and court status were committed together.`);
   } catch(error) { setMessage(`Could not save supervisor response: ${error.message}`); }
 };
 const createCourtRequest = async e => {
   e.preventDefault();if(!courtForm.court.trim()||(courtForm.court==='Other'&&!courtForm.courtOther.trim())||!courtForm.reason.trim()){setMessage('Court and reason for urgency are required.');return;}
   const nextNumber=Math.max(0,...requests.map(r=>Number(String(r.id||'').replace(/\D/g,''))||0))+1;
   const id=`UR-${String(nextNumber).padStart(3,'0')}`;
   const submittedAt=new Date().toISOString();
   const record={...courtForm,court:courtForm.court==='Other'?courtForm.courtOther.trim():courtForm.court,id,submitted:submittedAt.slice(0,10),submittedAt,submittedBy:accountName,submittedByUid:session?.uid||'',submittedByEmail:session?.email||'',requestStatus:'Pending Review',replyStatus:'',publicNote:'',reviewedBy:'',reviewedAt:''};delete record.courtOther;
   try {
     await createUrgentRequest(session,record);
     setRequests(old=>[record,...old]);
     setCourtOpen(false);setMessage(`Court request ${id} submitted to Firestore.`);
   } catch(error) { setMessage(`Could not submit court request: ${error.message}`); }
 };
 const selectedCase=cases.find(c=>c.uid===selected);
 const pendingRequests=requests.filter(r=>r.requestStatus==='Pending Review').length;
 const canEdit=role==='Supervisor';
 const canUpdateAssignedCase=role==='Analyst';
 return <div className={`app-shell ${navOpen?'nav-open':''}`}>
  {navOpen&&<button className="nav-scrim" aria-label="Close navigation" onClick={()=>setNavOpen(false)}/>}<aside className="sidebar"><button className="sidebar-close" type="button" aria-label="Close navigation" title="Close navigation" onClick={()=>setNavOpen(false)}><PanelLeftClose size={21}/></button><div className="sidebar-heading"><p className="nav-heading">WORKSPACE</p></div><nav>{nav.filter(n=>(n.id!=='Team Workload'||role==='Supervisor')&&(n.id!=='Court Urgent Requests'||role!=='Analyst')).map(({id,Icon})=><button key={id} className={`nav-btn ${page===id?'active':''}`} onClick={()=>{setPage(id);setMessage('');setNavOpen(false)}}><Icon size={19}/>{id}{id==='Court Urgent Requests'&&pendingRequests>0&&<span className="nav-count">{pendingRequests}</span>}</button>)}</nav><div className="sidebar-footer"><ShieldCheck size={17}/> Firebase-backed prototype</div></aside>
  <div className="main"><header className="topbar"><button className="menu-toggle" aria-label="Open navigation" title="Open navigation" aria-expanded={navOpen} onClick={()=>setNavOpen(v=>!v)}><Menu size={21}/></button><div className="top-brand"><img className="brand-logo" src={cfcdLogo} alt="CFCD logo"/><div><strong>CFCD Case Management</strong><small>Jamaica Constabulary Force · University Capstone Prototype</small></div></div><div className="topbar-tools"><div className="popover-wrap"><button className="header-icon" type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={()=>{setNotificationsOpen(v=>!v);setProfileOpen(false)}}><Bell size={19}/>{unreadNotificationCount>0&&<span className="notification-count">{unreadNotificationCount}</span>}</button>{notificationsOpen&&<div className="header-popover notifications-popover"><strong>Assigned cases</strong>{role!=='Analyst'?<p className="muted">No case assignment notifications for this role.</p>:assignedNotifications.length===0?<p className="muted">No cases are currently assigned to you.</p>:assignedNotifications.map(c=><button className={`notification-item ${readNotifications.includes(c.notificationKey)?'is-read':'is-unread'}`} key={c.uid} onClick={()=>openCaseNotification(c)}><b>{c.ref}</b><span>{c.offence}</span><small>{c.status} · {readNotifications.includes(c.notificationKey)?'Read':'Unread · Click to review'}</small></button>)}</div>}</div><ProfileMenu name={profileDetails.displayName} email={profileDetails.profileEmail} role={`${role} Portal`} notifications={profileDetails.notifications} onSave={setProfileDetails} onSignOut={onSignOut}/></div></header>
   <main className="content"><div className="demo-banner" role="note" aria-label="System notice"><div className="ticker-track"><span>DEMONSTRATION ONLY — Fictional case records. Authentication, case records, court urgent requests and workflow updates are stored in Firebase / Firestore.</span><span aria-hidden="true">DEMONSTRATION ONLY — Fictional case records. Authentication, case records, court urgent requests and workflow updates are stored in Firebase / Firestore.</span></div></div>
    <div className="heading"><div><p className="eyebrow">{role.toUpperCase()} PORTAL</p><h1>{page==='Dashboard'?`${role} Dashboard`:page}</h1><p>Track CFCD case references, assignments, urgent cases and court requests.</p></div>{role==='Supervisor'&&<button className="primary" onClick={()=>{setNewOpen(true);setMessage('')}}><Plus size={17}/> Add New Case</button>}{role==='Court'&&<button className="primary" onClick={()=>setCourtOpen(true)}><Plus size={17}/> Submit Urgent Request</button>}</div>
    {message&&<div className="message" role="status">{message}<button onClick={()=>setMessage('')} aria-label="Dismiss"><X size={16}/></button></div>}
    {page==='Dashboard'&&role==='Analyst'&&<section className="analyst-dashboard">

      <div className="analyst-metrics"><div className="analyst-metric"><span className="metric-mark blue"><FolderOpen size={18}/></span><small>Assigned to you</small><strong>{visible.length}</strong></div><div className="analyst-metric urgent"><span className="metric-mark red"><AlertTriangle size={18}/></span><small>Urgent cases</small><strong>{visible.filter(c=>c.urgent).length}</strong></div><div className="analyst-metric"><span className="metric-mark green"><Save size={18}/></span><small>Completed</small><strong>{visible.filter(c=>c.status==='Completed').length}</strong></div></div>
      <div className="analyst-work-grid"><section className="panel analyst-queue"><div className="panel-title"><div><h2>My work queue</h2><p className="muted">Pick up a case and continue your work.</p></div><span>{visible.length} cases</span></div>{filtered.slice(0,5).map(c=><article className={`analyst-case-card ${c.urgent?'is-urgent':''}`} key={c.uid}><div className="case-card-main"><span className="case-card-icon"><FolderOpen size={18}/></span><div><strong>{c.ref}</strong><p>{c.offence} · Received {displayDate(c.received)}</p></div></div><span className="case-statuses">{c.urgent&&<span className="urgent-case-badge"><AlertTriangle size={12}/> Urgent</span>}<span className="pill">{c.status}</span></span><button className="outline small" onClick={()=>{setSelected(c.uid);setAnalystDraft(c.analystReport||'')}}>Open case</button></article>)}{visible.length===0&&<div className="analyst-empty">No cases are assigned to you yet. New assignments will appear here.</div>}{visible.length>5&&<button className="link-button" onClick={()=>setPage('Case Registry')}>See all assigned cases →</button>}</section>
      <section className="panel analyst-recent"><h2>Recent updates</h2><p className="muted">Latest activity across your cases.</p>{visible.flatMap(c=>(c.history||[]).map((h,i)=>({...h,key:`${c.uid}-${i}`,ref:c.ref}))).sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,5).map(h=><div className="analyst-update" key={h.key}><span className="update-marker"/><div><strong>{h.ref}</strong><p>{h.description}</p><small>{h.at}</small></div></div>)}{visible.every(c=>!(c.history||[]).length)&&<div className="analyst-empty compact">No recent updates yet.</div>}</section></div>
    </section>}
    {page==='Dashboard'&&role!=='Analyst'&&<><div className="stats"><Stat label={role==='Supervisor'?'Unit Cases':'Tracked Cases'} value={visible.length} Icon={FolderOpen}/><Stat label="Completed" value={visible.filter(c=>c.status==='Completed').length} Icon={Users}/><Stat label="Urgent Cases" value={visible.filter(c=>c.urgent).length} Icon={AlertTriangle}/><Stat label="Court Urgent Requests" value={requests.length} Icon={Scale}/></div><div className="two-panels"><section className="panel"><h2>Case Status Summary</h2>{STATUS.map(s=><div className="status-line" key={s}><span>{s}</span><strong>{visible.filter(c=>c.status===s).length}</strong></div>)}</section><section className="panel"><h2>Court Urgent Requests</h2><p className="muted">Requests submitted by courts appear here for supervisor review and response.</p>{requests.slice(0,3).map(r=><div className="request-short" key={r.id}><div><b>{r.caseRef}</b><small>{r.court}</small></div><span className="pill">{r.requestStatus}</span></div>)}<button className="link-button" onClick={()=>setPage('Court Urgent Requests')}>Open Court Urgent Requests →</button></section></div></>}
    {page==='Case Registry'&&<section className="panel registry">
      <div className="panel-title"><h2>{role==='Analyst'?'My Assigned Cases':role==='Court'?'Court-Authorised Case Status':'Horizontal CFCD Case Registry'}</h2><span>{filtered.length} cases</span></div>
      <div className="searchbox"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={role==='Court'?'Search case reference or status...':'Search reference, offence, officer, division...'}/></div>
      <div className="table-scroll">
       {role==='Court'?
        <table><thead><tr>{['Cons No.','Case Reference No.','Other Case Ref. No.','Date & Time Received','Case Status'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{filtered.map(c=><tr key={c.uid}><td><b>{c.cons}</b></td><td className="ref">{c.ref}</td><td>{c.otherRef||'—'}</td><td>{displayDate(c.received)}</td><td><span className="case-statuses">{c.urgent&&<span className="urgent-case-badge"><AlertTriangle size={12}/> Urgent</span>}<span className="pill">{c.status}</span></span></td></tr>)}</tbody></table>
       :<table><thead><tr>{['Cons No.','Case Reference No.','Other Case Ref. No.','Offence','Date & Time Received','Item Received','I/O Name','Division','Suspect/s','Victim/s','Assigned Analyst','Case Status','Action'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{filtered.map(c=><tr key={c.uid} className={c.urgent?'urgent-row':''}><td><b>{c.cons}</b></td><td className="ref">{c.ref}</td><td>{c.otherRef||'—'}</td><td>{c.offence}</td><td>{displayDate(c.received)}</td><td>{c.item}</td><td>{c.io}</td><td>{c.division}</td><td>{c.suspects||'—'}</td><td>{c.victims||'—'}</td><td>{canEdit?<select aria-label={`Assign ${c.ref}`} value={c.analyst} onChange={e=>changeCase(c.uid,{analyst:e.target.value,analystUid:e.target.value==='Unassigned'?'':analystUidFor(e.target.value),status:e.target.value==='Unassigned'?'Unassigned':c.status==='Unassigned'?'Assigned':c.status},`${c.ref} assigned to ${e.target.value}`)}>{analystOptions.map(a=><option key={a}>{a}</option>)}</select>:c.analyst}</td><td><span className="case-statuses">{c.urgent&&<span className="urgent-case-badge"><AlertTriangle size={12}/> Urgent</span>}<span className="pill">{c.status}</span></span></td><td><button className="outline small" onClick={()=>{setSelected(c.uid);setAnalystDraft(c.analystReport||'')}}>{role==='Analyst'?'Update':'View'}</button></td></tr>)}</tbody></table>}
       {!filtered.length&&<p className="muted empty">No matching cases.</p>}
      </div>
      <p className="hint">{role==='Court'?'Court accounts receive a reduced Firestore status view; investigative fields are not exposed.':'Scroll horizontally to view all columns. Only supervisors can assign or reassign analysts.'}</p>
     </section>}
    {page==='Reports'&&<section className="report-grid"><section className="panel"><h2>Case Status Report</h2>{STATUS.map(s=><div className="status-line" key={s}><span>{s}</span><strong>{visible.filter(c=>c.status===s).length}</strong></div>)}</section><section className="panel"><h2>Work Summary</h2><div className="status-line"><span>Total cases</span><strong>{visible.length}</strong></div><div className="status-line"><span>Assigned cases</span><strong>{visible.filter(c=>c.analyst&&c.analyst!=='Unassigned').length}</strong></div><div className="status-line"><span>Urgent court requests</span><strong>{requests.length}</strong></div></section></section>}
    {page==='Activity'&&<section className="panel"><h2>Recent Case Activity</h2>{visible.flatMap(c=>(c.history||[]).map((h,i)=>({...h,key:`${c.uid}-${i}`,ref:c.ref}))).sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,30).map(h=><div className="activity-row" key={h.key}><span className="activity-dot"/><div><strong>{h.ref}</strong><p>{h.description}</p><small>{h.at} · {h.by}</small></div></div>)}{visible.every(c=>!(c.history||[]).length)&&<p className="muted">No recorded activity yet.</p>}</section>}
    {page==='Court Urgent Requests'&&<section className="panel"><div className="panel-title"><h2>Court Urgent Request Register</h2><span>{requests.length} requests</span></div><p className="muted">Courts submit requests here. Supervisors review them, update case status and provide an appropriate court-facing response.</p><div className="table-scroll"><table><thead><tr>{['Request ID','CFCD Case Ref.','Requesting Court','Next Court Date','Reason for Urgency','Request Status','Case Status','Supervisor Action'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{requests.map(r=><tr key={r.id}><td>{r.id}</td><td className="ref">{r.caseRef}</td><td>{r.court}</td><td>{r.courtDate||'—'}</td><td>{r.reason}</td><td><span className="pill">{r.requestStatus}</span></td><td>{r.replyStatus||cases.find(c=>c.ref===r.caseRef)?.status||'—'}</td><td>{role==='Supervisor'?<button className="outline small" onClick={()=>openRequest(r)}>Review / Update</button>:<span className="muted">{r.publicNote||'Awaiting supervisor response'}</span>}</td></tr>)}</tbody></table></div></section>}
    {page==='Team Workload'&&role==='Supervisor'&&<section className="panel"><h2>Supervisor — Analyst Workload</h2>{analystOptions.filter(a=>a!=='Unassigned').map(a=><div className="status-line" key={a}><span>{a}</span><strong>{cases.filter(c=>c.analyst===a).length} cases</strong></div>)}</section>}
    <footer>CFCD Capstone Prototype · No real investigative information · Dashboard records persist in Firestore</footer>
   </main></div>
  {newOpen&&<Modal title="Register New CFCD Case" onClose={()=>setNewOpen(false)}><form onSubmit={createCase}><p className="auto-number">Automatic Cons No.: <strong>{nextCons}</strong> <small>(restarts at 01 each January; year is not displayed)</small></p>{formError&&<p role="alert" style={{color:"#b42318",background:"#fef3f2",padding:"12px",borderRadius:"8px"}}>{formError}</p>}<div className="form-grid"><Field label="Case Reference No. *"><input required value={form.ref} onChange={e=>{setForm({...form,ref:e.target.value});setFormError('')}} placeholder="CFCD-26D-2026"/></Field><Field label="Other Case Ref. No."><input value={form.otherRef} onChange={e=>setForm({...form,otherRef:e.target.value})} placeholder="Related CFCD case reference"/></Field><Field label="Offence *"><input required value={form.offence} onChange={e=>setForm({...form,offence:e.target.value})}/></Field><Field label="Date and Time Received *"><input type="datetime-local" required value={form.received} onChange={e=>setForm({...form,received:e.target.value})}/></Field><Field label="Item Received *"><select value={form.item} onChange={e=>setForm({...form,item:e.target.value})}>{ITEMS.map(i=><option key={i}>{i}</option>)}</select></Field>{form.item==='Others'&&<Field label="Specify Other Item *"><input required value={form.itemOther} onChange={e=>setForm({...form,itemOther:e.target.value})} placeholder="Describe the item"/></Field>}<Field label="I/O Name *"><input required value={form.io} onChange={e=>setForm({...form,io:e.target.value})}/></Field><Field label="Division *"><select required value={form.division} onChange={e=>setForm({...form,division:e.target.value,divisionOther:e.target.value==='Other'?form.divisionOther:''})}><option value="">Select a division</option>{DIVISIONS.map(d=><option key={d}>{d}</option>)}</select></Field>{form.division==='Other'&&<Field label="Specify Other Division *"><input required value={form.divisionOther} onChange={e=>setForm({...form,divisionOther:e.target.value})} placeholder="Enter division name"/></Field>}<Field label="Suspect/s"><textarea value={form.suspects} onChange={e=>setForm({...form,suspects:e.target.value})}/></Field><Field label="Victim/s"><textarea value={form.victims} onChange={e=>setForm({...form,victims:e.target.value})}/></Field>{role==='Supervisor'&&<><Field label="Assign Analyst"><select value={form.analyst} onChange={e=>setForm({...form,analyst:e.target.value})}>{analystOptions.map(a=><option key={a}>{a}</option>)}</select></Field><label className="urgent-toggle"><input type="checkbox" checked={form.urgent} onChange={e=>setForm({...form,urgent:e.target.checked})}/><AlertTriangle size={18}/><span><strong>Mark as urgent</strong><small>Pin this case to the analyst’s work queue.</small></span></label></>}</div><button
  className="primary submit"
  type="submit"
>
  <Save size={16}/> Save Case
</button></form></Modal>}
  {selectedCase&&<Modal title={`${role==='Analyst'?'Update Assigned Case':'Case Details'} — ${selectedCase.ref}`} onClose={()=>setSelected(null)}><div className="details"><p><b>Cons No.:</b> {selectedCase.cons}</p><p><b>Other Case Ref. No.:</b> {selectedCase.otherRef||'—'}</p><p><b>Offence:</b> {selectedCase.offence}</p><p><b>I/O:</b> {selectedCase.io}</p><p><b>Division:</b> {selectedCase.division}</p><p><b>Suspect/s:</b> {selectedCase.suspects||'—'}</p><p><b>Victim/s:</b> {selectedCase.victims||'—'}</p><p><b>Assigned Analyst:</b> {selectedCase.analyst}</p><p><b>Status:</b> {selectedCase.status}</p>{selectedCase.urgent&&<p><b>Priority:</b> <span className="urgent-case-badge"><AlertTriangle size={12}/> Urgent</span></p>}</div>{canUpdateAssignedCase&&<><Field label="Case Document Update"><textarea rows="5" value={analystDraft} onChange={e=>{setAnalystDraft(e.target.value);setAnalystSaveError('')}} placeholder="Record examination progress or document update"/></Field>{analystSaveError&&<p role="alert" className="message">{analystSaveError}</p>}<button type="button" className="primary submit" disabled={!analystDraft.trim()||analystSaving} onClick={()=>saveAnalystUpdate(selectedCase.uid)}><Save size={16}/> {analystSaving?'Saving…':'Save Case Update'}</button><button type="button" className="link-button" onClick={()=>{setSelected(null);setPage('Case Registry')}}>Go to My Assigned Cases →</button></>}{canEdit&&<Field label="Case Status"><select value={selectedCase.status} onChange={e=>{const v=e.target.value;if(v==='Assigned'&&selectedCase.analyst==='Unassigned'){setMessage('Assign an analyst first.');return;}if(v==='Unassigned'&&selectedCase.analyst!=='Unassigned'){setMessage('Unassign the analyst in the registry first.');return;}changeCase(selectedCase.uid,{status:v},`Status changed to ${v}`)}}>{STATUS.map(s=><option key={s}>{s}</option>)}</select></Field>}{(selectedCase.history||[]).length>0&&<><h3>Update History</h3>{(selectedCase.history||[]).map((h,i)=><p className="history" key={i}>{h.at} — {h.by}: {h.description}</p>)}</>}</Modal>}
  {editingRequest&&<Modal title={`Supervisor Review — ${editingRequest}`} onClose={()=>setEditingRequest(null)}>{(()=>{const r=requests.find(x=>x.id===editingRequest);return r&&<form onSubmit={saveResponse}><div className="details"><p><b>CFCD Case:</b> {r.caseRef}</p><p><b>Court:</b> {r.court}</p><p><b>Next Court Date:</b> {r.courtDate||'—'}</p><p><b>Reason for Urgency:</b> {r.reason}</p></div><div className="form-grid"><Field label="Assigned Analyst"><select value={requestDraft.analyst} onChange={e=>setRequestDraft({...requestDraft,analyst:e.target.value})}>{analystOptions.map(a=><option key={a}>{a}</option>)}</select></Field><Field label="Case Status"><select value={requestDraft.caseStatus} onChange={e=>setRequestDraft({...requestDraft,caseStatus:e.target.value})}>{STATUS.map(s=><option key={s}>{s}</option>)}</select></Field><Field label="Court Urgent Request Status"><select value={requestDraft.requestStatus} onChange={e=>setRequestDraft({...requestDraft,requestStatus:e.target.value})}>{['Pending Review','Under Review','Priority Approved','Awaiting Further Information','Response Completed'].map(s=><option key={s}>{s}</option>)}</select></Field><Field label="Court-Facing Response / Approved Summary"><textarea rows="3" value={requestDraft.publicNote} onChange={e=>setRequestDraft({...requestDraft,publicNote:e.target.value})} placeholder="Write a status update suitable for the court; do not include investigative evidence or sensitive technical details."/></Field></div><button className="primary submit" type="submit"><Save size={16}/> Save Supervisor Response</button></form>})()}</Modal>}
  {courtOpen&&<Modal title="Court — Submit Urgent Request" onClose={()=>setCourtOpen(false)}><form onSubmit={createCourtRequest}><Field label="CFCD Case Reference No."><select value={courtForm.caseRef} onChange={e=>setCourtForm({...courtForm,caseRef:e.target.value})}>{cases.map(c=><option key={c.uid}>{c.ref}</option>)}</select></Field><Field label="Requesting Court *"><select required value={courtForm.court} onChange={e=>setCourtForm({...courtForm,court:e.target.value,courtOther:e.target.value==='Other'?courtForm.courtOther:''})}><option value="">Select a court</option>{COURTS.map(c=><option key={c}>{c}</option>)}</select></Field>{courtForm.court==='Other'&&<Field label="Specify Other Court *"><input required value={courtForm.courtOther} onChange={e=>setCourtForm({...courtForm,courtOther:e.target.value})} placeholder="Enter court name"/></Field>}<Field label="Next Court Date"><input type="date" value={courtForm.courtDate} onChange={e=>setCourtForm({...courtForm,courtDate:e.target.value})}/></Field><Field label="Reason for Urgency *"><textarea required rows="3" value={courtForm.reason} onChange={e=>setCourtForm({...courtForm,reason:e.target.value})}/></Field><button className="primary submit" type="submit">Submit Urgent Request</button></form></Modal>}
 </div>;
}
function Stat({label,value,Icon}){return <div className="stat"><div className="stat-icon"><Icon size={22}/></div><span>{label}</span><strong>{value}</strong></div>}
function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}
function Modal({title,onClose,children}){return <div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal" role="dialog" aria-modal="true" aria-label={title}><div className="modal-head"><h2>{title}</h2><button onClick={onClose} aria-label="Close"><X size={22}/></button></div>{children}</div></div>}
