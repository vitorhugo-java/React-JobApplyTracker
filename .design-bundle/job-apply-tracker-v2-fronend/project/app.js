/* ===========================================================
   Job Application Tracker — Wireframes
   Data + screen renderers + routing
   =========================================================== */

/* ---------- tiny helpers ---------- */
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- icons (minimal geometric) ---------- */
const I = {
  search: '<svg width="14" height="14" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor"/><line x1="10.5" y1="10.5" x2="14" y2="14" stroke="currentColor" stroke-linecap="round"/></svg>',
  plus: '<svg width="14" height="14" viewBox="0 0 15 15" fill="none"><line x1="7.5" y1="2" x2="7.5" y2="13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><line x1="2" y1="7.5" x2="13" y2="7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  edit: '<svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M10 2.5L12.5 5L5 12.5L2.2 13L2.7 10.2L10 2.5Z" stroke="currentColor" stroke-linejoin="round"/></svg>',
  archive: '<svg width="14" height="14" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2" width="12" height="3" rx="0.5" stroke="currentColor"/><path d="M2.5 5.5V12.5H12.5V5.5" stroke="currentColor"/><line x1="6" y1="8" x2="9" y2="8" stroke="currentColor" stroke-linecap="round"/></svg>',
  trash: '<svg width="14" height="14" viewBox="0 0 15 15" fill="none"><path d="M2.5 4H12.5M5 4V2.5H10V4M3.5 4V12.5H11.5V4" stroke="currentColor" stroke-linejoin="round"/></svg>',
  note: '<svg width="13" height="13" viewBox="0 0 15 15" fill="none"><rect x="2" y="1.5" width="11" height="12" rx="1" stroke="currentColor"/><line x1="4.5" y1="5" x2="10.5" y2="5" stroke="currentColor" stroke-linecap="round"/><line x1="4.5" y1="7.5" x2="10.5" y2="7.5" stroke="currentColor" stroke-linecap="round"/><line x1="4.5" y1="10" x2="8" y2="10" stroke="currentColor" stroke-linecap="round"/></svg>',
  noteEmpty: '<svg width="13" height="13" viewBox="0 0 15 15" fill="none"><rect x="2" y="1.5" width="11" height="12" rx="1" stroke="currentColor" stroke-dasharray="2 2"/></svg>',
  cal: '<svg width="13" height="13" viewBox="0 0 15 15" fill="none"><rect x="1.5" y="2.5" width="12" height="11" rx="1" stroke="currentColor"/><line x1="1.5" y1="5.5" x2="13.5" y2="5.5" stroke="currentColor"/><line x1="4.5" y1="1" x2="4.5" y2="3.5" stroke="currentColor" stroke-linecap="round"/><line x1="10.5" y1="1" x2="10.5" y2="3.5" stroke="currentColor" stroke-linecap="round"/></svg>',
  clock: '<svg width="13" height="13" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6" stroke="currentColor"/><path d="M7.5 4V7.5L10 9" stroke="currentColor" stroke-linecap="round"/></svg>',
  link: '<svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M6 9L9 6M5.5 11L4 12.5C3 13.5 1.5 13.5 0.8 12.5C0 11.7 0 10.3 1 9.3L2.5 7.8M9.5 4L11 2.5C12 1.5 13.5 1.5 14.2 2.5C15 3.3 15 4.7 14 5.7L12.5 7.2" stroke="currentColor" stroke-linecap="round" transform="scale(0.95) translate(0.3 0.3)"/></svg>',
  chevSort: '<span class="chev">↕</span>',
  check: '<svg width="12" height="12" viewBox="0 0 15 15" fill="none"><path d="M2.5 7.5L6 11L12.5 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  filter: '<svg width="13" height="13" viewBox="0 0 15 15" fill="none"><path d="M1.5 2.5H13.5L9 8V12.5L6 13.5V8L1.5 2.5Z" stroke="currentColor" stroke-linejoin="round"/></svg>',
  shapes: {
    square: '<svg width="16" height="16" viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="1.5" fill="currentColor"/></svg>',
    circle: '<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5" fill="currentColor"/></svg>',
    diamond: '<svg width="16" height="16" viewBox="0 0 16 16"><rect x="8" y="0.5" width="10.6" height="10.6" rx="1.5" transform="rotate(45 8 0.5)" fill="currentColor"/></svg>',
    triangle: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M8 2.5L14 13H2L8 2.5Z" fill="currentColor"/></svg>',
    ring: '<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>',
    bolt: '<svg width="16" height="16" viewBox="0 0 16 16"><path d="M9 1.5L3.5 9H7.5L6.5 14.5L12.5 6.5H8.5L9 1.5Z" fill="currentColor"/></svg>',
  }
};

/* ---------- data ---------- */
const STATUSES = {
  draft:     { label: 'Draft',     cls: 'b-draft' },
  sent:      { label: 'Sent',      cls: 'b-sent' },
  replied:   { label: 'Replied',   cls: 'b-replied' },
  interview: { label: 'Interview', cls: 'b-interview' },
  offer:     { label: 'Offer',     cls: 'b-offer' },
  rejected:  { label: 'Rejected',  cls: 'b-rejected' },
};
const badge = (s) => `<span class="badge ${STATUSES[s].cls}"><span class="dot"></span>${STATUSES[s].label}</span>`;

const APPS = [
  { vac: 'Senior Frontend Engineer', org: 'Linear', rec: 'Priya Nayar',     status: 'interview', applied: 'May 28', next: 'Jun 06 · Onsite', note: true,  src: 'Referral' },
  { vac: 'Product Designer, Growth',  org: 'Vercel', rec: 'Marcus Webb',     status: 'sent',      applied: 'May 30', next: 'Jun 05 · Follow-up', note: false, src: 'LinkedIn' },
  { vac: 'Full-stack Developer',      org: 'Supabase', rec: 'Dana Klein',    status: 'replied',   applied: 'May 26', next: 'Jun 04 · Reply due', note: true,  src: 'Job Board' },
  { vac: 'Design Engineer',           org: 'Raycast', rec: 'Tom Asante',     status: 'offer',     applied: 'May 14', next: 'Jun 09 · Decision', note: true,  src: 'Referral' },
  { vac: 'Frontend Engineer II',      org: 'Retool', rec: 'Lena Ortiz',      status: 'rejected',  applied: 'May 09', next: '—', note: false, src: 'Company Site' },
  { vac: 'UX Engineer',               org: 'Notion', rec: 'Sam Cho',         status: 'sent',      applied: 'Jun 01', next: 'Jun 07 · Follow-up', note: false, src: 'LinkedIn' },
  { vac: 'Staff Product Designer',    org: 'Stripe', rec: 'Grace Liu',       status: 'interview', applied: 'May 22', next: 'Jun 05 · Panel', note: true,  src: 'Recruiter' },
  { vac: 'Web Platform Engineer',     org: 'Framer', rec: 'Ivan Petrov',     status: 'draft',     applied: '—',      next: 'Send later', note: true,  src: 'Job Board' },
  { vac: 'Senior UI Engineer',        org: 'Figma', rec: 'Noor Hassan',      status: 'replied',   applied: 'May 31', next: 'Jun 06 · Schedule', note: false, src: 'Referral' },
  { vac: 'Frontend Developer',        org: 'Cron', rec: 'Beth Owens',        status: 'draft',     applied: '—',      next: 'Send later', note: false, src: 'Company Site' },
  { vac: 'Motion Designer',           org: 'Rive', rec: 'Carlos Mendez',     status: 'sent',      applied: 'May 27', next: 'Jun 04 · Follow-up', note: true,  src: 'LinkedIn' },
  { vac: 'Design Systems Lead',       org: 'GitHub', rec: 'Amy Tran',        status: 'rejected',  applied: 'Apr 30', next: '—', note: false, src: 'Recruiter' },
];

const ACHIEVEMENTS = [
  { name: 'First Contact',  desc: 'Send your first application', shape: 'square',   unlocked: true,  meta: 'Apr 12' },
  { name: 'Double Digits',  desc: 'Reach 10 applications sent',  shape: 'circle',   unlocked: true,  meta: 'Apr 28' },
  { name: 'In the Room',    desc: 'Land your first interview',   shape: 'triangle', unlocked: true,  meta: 'May 03' },
  { name: 'Hot Streak',     desc: '7-day application streak',    shape: 'bolt',     unlocked: true,  meta: 'May 19' },
  { name: 'Closer',         desc: 'Receive your first offer',    shape: 'diamond',  unlocked: false, meta: '4/5 stages' },
  { name: 'Half Century',   desc: 'Send 50 applications',        shape: 'ring',     unlocked: false, meta: '36 / 50' },
  { name: 'Early Bird',     desc: 'Apply before 9am, 5 times',   shape: 'circle',   unlocked: true,  meta: 'May 21' },
  { name: 'Comeback',       desc: 'Re-apply after a rejection',  shape: 'square',   unlocked: false, meta: 'Locked' },
];

/* ---------- shared bits ---------- */
function pageHead({ title, sub, actions = '' }) {
  return `<div class="page-head">
    <div class="titles"><div class="page-title">${title}</div>${sub ? `<div class="page-sub">${sub}</div>` : ''}</div>
    ${actions ? `<div class="actions">${actions}</div>` : ''}
  </div>`;
}
function segControl(id, opts, active) {
  return `<div class="seg" data-seg="${id}">${opts.map(o => `<button data-val="${o.val}" class="${o.val === active ? 'active' : ''}">${o.label}</button>`).join('')}</div>`;
}

/* ===========================================================
   DASHBOARD
   =========================================================== */
const DASH_METRICS = [
  { label: 'Total Applications', value: '142', foot: '<span class="delta-up">12</span> this week', spark: 72 },
  { label: 'Sent',               value: '128', foot: '90% of total', spark: 90 },
  { label: 'Interviews',         value: '19',  foot: '<span class="delta-up">3</span> scheduled', spark: 48 },
  { label: 'Offers',             value: '4',   foot: '2 pending reply', spark: 28 },
  { label: 'Rejection Rate',     value: '38%', foot: '<span class="delta-down">4%</span> vs last mo', spark: 38 },
  { label: 'Avg. Response',      value: '4.2d', foot: 'time to first reply', spark: 55 },
  { label: 'Streak',             value: '11', foot: 'days active', spark: 80 },
];

function metricCard(m, mono = true) {
  return `<div class="metric">
    <div class="m-label">${m.label}</div>
    <div class="m-value">${m.value}</div>
    <div class="m-spark"><i style="width:${m.spark}%"></i></div>
    <div class="m-foot">${m.foot}</div>
  </div>`;
}

function achCard(a) {
  return `<div class="ach ${a.unlocked ? '' : 'locked'}">
    <div class="ach-ico">${I.shapes[a.shape]}</div>
    <div>
      <div class="ach-name">${a.name}</div>
      <div class="ach-desc">${a.desc}</div>
    </div>
    <div class="ach-state ${a.unlocked ? 'unlocked' : ''}">${a.unlocked ? '✓ ' + a.meta : a.meta}</div>
  </div>`;
}

const TO_SEND = APPS.filter(a => a.status === 'draft').concat([
  { vac: 'Interaction Designer', org: 'Arc', rec: 'Will Frost', status: 'draft', next: 'Send later' },
  { vac: 'Frontend Architect', org: 'Replit', rec: 'Hana Suzuki', status: 'draft', next: 'Send later' },
]);
const OVERDUE = [
  { vac: 'Product Designer, Growth', org: 'Vercel', rec: 'Marcus Webb', meta: '6d overdue', status: 'sent' },
  { vac: 'Motion Designer', org: 'Rive', rec: 'Carlos Mendez', meta: '3d overdue', status: 'sent' },
  { vac: 'UX Engineer', org: 'Notion', rec: 'Sam Cho', meta: '2d overdue', status: 'sent' },
  { vac: 'Full-stack Developer', org: 'Supabase', rec: 'Dana Klein', meta: '1d overdue', status: 'replied' },
];

function listPanel(title, count, rows, kind) {
  const body = rows.slice(0, 4).map(r => `<div class="list-row">
    <div class="lr-main">
      <div class="lr-title">${r.vac}</div>
      <div class="lr-sub">${r.org} · ${r.rec}</div>
    </div>
    ${kind === 'overdue' ? `<div class="lr-meta">${r.meta}</div>` : ''}
    ${badge(r.status)}
  </div>`).join('');
  return `<div class="panel">
    <div class="panel-head"><h3>${title}</h3><span class="count">${count}</span>
      <div class="right"><button class="btn btn-sm btn-ghost">View all</button></div></div>
    <div>${body}</div>
    <div class="pager"><span>Showing 1–4 of ${count}</span>
      <div class="pages"><span class="pg active">1</span><span class="pg">2</span>${kind === 'tosend' ? '' : '<span class="pg">3</span>'}</div></div>
  </div>`;
}

function renderDashboard(variant = 'standard') {
  const head = pageHead({
    title: 'Dashboard',
    sub: 'Tuesday, June 4 · your job hunt at a glance',
    actions: `<button class="btn btn-sm">Last 30 days ▾</button>${segControl('dash', [{val:'standard',label:'Standard'},{val:'gamified',label:'Gamified'}], variant)}`
  });

  const metrics = `<div class="metric-grid cols7">${DASH_METRICS.map(m => metricCard(m)).join('')}</div>`;
  const achievements = `<div class="section-label"><h2>Achievements</h2><div class="ln"></div><span class="more">5 of 8 unlocked →</span></div>
    <div class="ach-scroll">${ACHIEVEMENTS.map(achCard).join('')}</div>`;
  const panels = `<div class="split-2" style="margin-top:24px">
    ${listPanel('To Send Later', TO_SEND.length, TO_SEND, 'tosend')}
    ${listPanel('Overdue Follow-ups', OVERDUE.length, OVERDUE, 'overdue')}
  </div>`;

  if (variant === 'standard') {
    return `<div class="page">${head}${metrics}${achievements}${panels}</div>`;
  }

  /* gamified: hero level card + achievements pulled up, metrics condensed to the side */
  const hero = `<div class="card" style="padding:20px 22px;display:flex;gap:24px;align-items:center;margin-bottom:22px;">
    <div style="display:flex;flex-direction:column;gap:4px;flex:0 0 auto;">
      <div class="eyebrow">Current rank</div>
      <div style="font-size:30px;font-weight:700;letter-spacing:-0.02em;">Level 7</div>
      <div style="font-family:var(--mono);font-size:12px;color:var(--c-5);">Persistent Hunter</div>
    </div>
    <div style="flex:1;min-width:0;">
      <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:11px;color:var(--c-9);margin-bottom:8px;"><span>1,360 XP</span><span>2,000 XP → Level 8</span></div>
      <div class="xp-track" style="height:8px;"><div class="xp-fill" style="width:68%"></div></div>
      <div style="display:flex;gap:20px;margin-top:14px;">
        <div><div style="font-size:18px;font-weight:660;font-family:var(--mono);">11</div><div class="eyebrow">Day streak</div></div>
        <div><div style="font-size:18px;font-weight:660;font-family:var(--mono);">+240</div><div class="eyebrow">XP this week</div></div>
        <div><div style="font-size:18px;font-weight:660;font-family:var(--mono);">5/8</div><div class="eyebrow">Achievements</div></div>
        <div><div style="font-size:18px;font-weight:660;font-family:var(--mono);">#42</div><div class="eyebrow">Leaderboard</div></div>
      </div>
    </div>
  </div>`;
  const metrics4 = `<div class="metric-grid" style="grid-template-columns:repeat(4,1fr);">${DASH_METRICS.slice(0,4).map(m => metricCard(m)).join('')}</div>`;
  return `<div class="page">${head}${hero}${achievements}<div style="margin-top:24px">${metrics4}</div>${panels}</div>`;
}

/* ===========================================================
   APPLICATIONS
   =========================================================== */
let appState = { tab: 'active', variant: 'table', view: 'list', sortKey: 'applied', sortDir: 'desc' };

function renderApplications() {
  if (appState.view === 'form') return renderForm();

  const head = pageHead({
    title: 'Applications',
    sub: '36 active · 14 archived',
    actions: `<button class="btn btn-primary" id="newAppBtn">${I.plus} New Application</button>`
  });

  const tabs = `<div class="tabs">
    <div class="tab ${appState.tab==='active'?'active':''}" data-tab="active">Active <span class="cnt">36</span></div>
    <div class="tab ${appState.tab==='archived'?'active':''}" data-tab="archived">Archived <span class="cnt">14</span></div>
  </div>`;

  const filters = `<div class="filterbar">
    <div class="search">${I.search}<input placeholder="Search vacancy, recruiter, org…" /></div>
    <select class="field-select"><option>All statuses</option><option>Draft</option><option>Sent</option><option>Replied</option><option>Interview</option><option>Offer</option><option>Rejected</option></select>
    <button class="btn btn-sm">${I.cal} Date range</button>
    <select class="field-select"><option>Sort: Applied date</option><option>Sort: Next step</option><option>Sort: Status</option><option>Sort: Vacancy A–Z</option></select>
    <div class="spacer"></div>
    ${segControl('appview', [{val:'table',label:'Table'},{val:'board',label:'Board'},{val:'mobile',label:'Mobile'}], appState.variant)}
  </div>`;

  let body;
  if (appState.tab === 'archived') body = emptyState();
  else if (appState.variant === 'table') body = appsTable();
  else if (appState.variant === 'board') body = appsBoard();
  else body = appsMobile();

  return `<div class="page">${head}${tabs}${filters}${body}</div>`;
}

function appsTable() {
  const cols = [
    { key: 'vac', label: 'Vacancy', sortable: true },
    { key: 'rec', label: 'Recruiter', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'applied', label: 'Applied', sortable: true },
    { key: 'next', label: 'Next Step', sortable: true },
    { key: 'note', label: 'Note', sortable: false },
    { key: 'actions', label: '', sortable: false },
  ];
  const head = cols.map(c => `<th class="${c.sortable?'sortable':''} ${c.key===appState.sortKey?'sorted':''}">${c.label}${c.sortable?I.chevSort:''}</th>`).join('');
  const rows = APPS.map(a => `<tr>
    <td><div class="cell-primary">${a.vac}</div><div class="cell-sub">${a.org}</div></td>
    <td>${a.rec}</td>
    <td>${badge(a.status)}</td>
    <td class="cell-mono">${a.applied}</td>
    <td class="cell-muted">${a.next}</td>
    <td>${a.note ? `<span class="note-ico">${I.note}</span>` : `<span class="cell-muted" style="display:inline-block;width:22px;text-align:center;">–</span>`}</td>
    <td><div class="row-actions">
      <span class="act" data-act="edit" title="Edit">${I.edit}</span>
      <span class="act" title="Archive">${I.archive}</span>
      <span class="act" title="Delete">${I.trash}</span>
    </div></td>
  </tr>`).join('');
  return `<div class="tbl-wrap">
    <table class="tbl"><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>
    <div class="pager"><span>Showing 1–12 of 36</span>
      <div class="pages"><span class="pg">‹</span><span class="pg active">1</span><span class="pg">2</span><span class="pg">3</span><span class="pg">›</span></div></div>
  </div>`;
}

function appsBoard() {
  const order = ['draft','sent','replied','interview','offer','rejected'];
  const cols = order.map(st => {
    const items = APPS.filter(a => a.status === st);
    const cards = items.map(a => `<div class="bcard">
      <div class="bc-title">${a.vac}</div>
      <div class="bc-sub">${a.org} · ${a.rec}</div>
      <div class="bc-foot">${a.note?`<span class="note-ico">${I.note}</span>`:''}<span class="bc-date">${a.applied !== '—' ? a.applied : a.next}</span></div>
    </div>`).join('') || `<div style="font-family:var(--mono);font-size:11px;color:var(--c-c);padding:8px;text-align:center;">empty</div>`;
    return `<div class="bcolumn">
      <div class="bcolumn-head"><span class="badge ${STATUSES[st].cls}" style="padding:2px 7px;"><span class="dot"></span>${STATUSES[st].label}</span><span class="bc">${items.length}</span></div>
      <div class="bcolumn-body">${cards}</div>
    </div>`;
  }).join('');
  return `<div class="board">${cols}</div>`;
}

function appsMobile() {
  const cards = APPS.slice(0, 7).map(a => `<div class="mcard">
    <div class="mc-top">
      <div>
        <div class="mc-title">${a.vac}</div>
        <div class="mc-sub">${a.org} · ${a.rec}</div>
      </div>
      ${badge(a.status)}
    </div>
    <div class="mc-meta">
      <span class="mm">${I.cal} ${a.applied}</span>
      <span class="mm">${I.clock} ${a.next}</span>
      ${a.note?`<span class="mm">${I.note}</span>`:''}
    </div>
  </div>`).join('');
  return `<div class="phone-stage"><div class="phone">
    <div class="phone-bar"><div class="notch"></div></div>
    <div class="phone-head">
      <div class="ph-title">Applications</div>
      <div class="phone-search">${I.search}<span>Search…</span></div>
    </div>
    <div class="phone-body">${cards}</div>
  </div></div>
  <p style="text-align:center;font-family:var(--mono);font-size:11px;color:var(--c-9);margin-top:4px;">Mobile · 390px · card-per-application layout</p>`;
}

function emptyState() {
  return `<div class="empty">
    <div class="ph empty-art">illustration</div>
    <h3>No archived applications</h3>
    <p>Applications you archive will live here. Archiving keeps your active list focused without deleting history.</p>
    <button class="btn btn-primary" id="newAppBtn">${I.plus} New Application</button>
  </div>`;
}

/* ===========================================================
   FORM
   =========================================================== */
function renderForm() {
  const head = pageHead({ title: 'New Application', sub: 'Track a vacancy you’re applying to' });
  const banner = `<div class="dirty-banner">
    <span class="mono" style="font-size:11px;">●</span>
    You have unsaved changes.
    <div class="actions"><button class="btn btn-sm btn-ghost">Discard</button><button class="btn btn-sm">Save draft</button></div>
  </div>`;
  const form = `<div class="form-wrap">
    ${banner}
    <div class="form-grid">
      <div class="field req fg-full">
        <label>Vacancy Name</label>
        <input class="field-input" value="Senior Frontend Engineer" />
      </div>
      <div class="field"><label>Recruiter Name</label><input class="field-input" placeholder="e.g. Priya Nayar" /></div>
      <div class="field"><label>Organization</label><input class="field-input" placeholder="e.g. Linear" /></div>
      <div class="field fg-full"><label>Vacancy Link</label>
        <input class="field-input mono" placeholder="https://…" /><span class="hint">paste the job posting URL</span></div>
      <div class="field"><label>Status</label>
        <select class="field-select"><option>Draft</option><option>Sent</option><option>Replied</option><option>Interview</option><option>Offer</option><option>Rejected</option></select></div>
      <div class="field"><label>Application Date</label><input class="field-input" placeholder="Jun 4, 2026" /></div>
      <div class="field"><label>Next Step — Date</label><input class="field-input" placeholder="Jun 9, 2026" /></div>
      <div class="field"><label>Next Step — Time</label><input class="field-input mono" placeholder="14:30" /></div>
      <div class="field fg-full"><label>Note</label>
        <textarea class="field-input" rows="3" placeholder="Context, contacts, things to remember…"></textarea></div>
      <div class="field fg-full"><label>Base Resume</label>
        <select class="field-select"><option>Frontend — 2026 (default)</option><option>Design Engineer variant</option><option>Product Designer variant</option><option>+ Upload new…</option></select></div>
    </div>

    <div style="margin-top:20px;border-top:var(--border);">
      <div class="toggle-row">
        <div class="tr-text"><div class="tr-title">To Send Later</div><div class="tr-sub">Keep as a draft and remind me to send it</div></div>
        <div class="switch on" data-toggle><i></i></div>
      </div>
      <div class="toggle-row">
        <div class="tr-text"><div class="tr-title">Mark DM Sent</div><div class="tr-sub">I’ve already messaged the recruiter directly</div></div>
        <div class="checkbox" data-check>${I.check}</div>
      </div>
    </div>

    <div class="form-foot">
      <button class="btn btn-ghost" data-cancel>Cancel</button>
      <button class="btn">Create Resume</button>
      <button class="btn btn-primary">Save</button>
    </div>
  </div>`;
  return `<div class="page">${head}${form}</div>`;
}

/* ===========================================================
   METRICS
   =========================================================== */
function renderMetrics() {
  const head = pageHead({ title: 'Metrics', sub: 'Conversion and activity across your applications' });
  const filters = `<div class="filterbar">
    <button class="btn btn-sm">${I.cal} Last 90 days ▾</button>
    <select class="field-select"><option>All statuses</option><option>Sent+</option><option>Interview+</option></select>
    <select class="field-select"><option>All sources</option><option>Referral</option><option>LinkedIn</option><option>Job Board</option><option>Company Site</option><option>Recruiter</option></select>
    <div class="search">${I.search}<input placeholder="Search…" /></div>
  </div>`;

  /* funnel */
  const funnelData = [
    { l: 'Applied', v: 142, w: 100, bg: 'var(--c-0)', rate: '100%' },
    { l: 'Sent', v: 128, w: 90, bg: 'var(--c-2)', rate: '90%' },
    { l: 'Replied', v: 61, w: 60, bg: 'var(--c-5)', rate: '48%' },
    { l: 'Interview', v: 19, w: 32, bg: 'var(--c-9)', rate: '15%' },
    { l: 'Offer', v: 4, w: 14, bg: 'var(--c-c)', rate: '3%' },
  ];
  const funnel = `<div class="panel span2">
    <div class="panel-head"><h3>Conversion Funnel</h3><span class="count">applied → offer</span></div>
    <div class="chart-body"><div class="funnel">${funnelData.map(f => `<div class="funnel-row">
      <span class="fl">${f.l}</span>
      <div class="fbar-wrap"><div class="fbar" style="width:${f.w}%;background:${f.bg};${f.w<24?'color:var(--c-2);':''}">${f.v}</div></div>
      <span class="frate">${f.rate}</span>
    </div>`).join('')}</div></div>
  </div>`;

  /* response time distribution */
  const dist = [
    { x: '0–1d', v: 18, h: 42 }, { x: '1–2d', v: 31, h: 74 }, { x: '2–4d', v: 40, h: 100 },
    { x: '4–7d', v: 22, h: 52 }, { x: '7–14d', v: 11, h: 26 }, { x: '14d+', v: 6, h: 14 },
  ];
  const distChart = `<div class="panel">
    <div class="panel-head"><h3>Response Time</h3><span class="count">median 4.2d</span></div>
    <div class="chart-body"><div class="bars">${dist.map(d => `<div class="bcol">
      <div class="bv">${d.v}</div><div class="bar" style="height:${d.h}%"></div><div class="bx">${d.x}</div></div>`).join('')}</div></div>
  </div>`;

  /* by status (bars, varied gray) */
  const byStatus = [
    { x: 'Draft', v: 8, h: 20, c: 'var(--c-9)' }, { x: 'Sent', v: 47, h: 100, c: 'var(--c-2)' },
    { x: 'Replied', v: 33, h: 70, c: 'var(--c-5)' }, { x: 'Interview', v: 19, h: 40, c: 'var(--c-1)' },
    { x: 'Offer', v: 4, h: 9, c: 'var(--c-0)' }, { x: 'Rejected', v: 31, h: 66, c: 'var(--c-c)' },
  ];
  const statusChart = `<div class="panel">
    <div class="panel-head"><h3>Applications by Status</h3></div>
    <div class="chart-body"><div class="bars">${byStatus.map(d => `<div class="bcol">
      <div class="bv">${d.v}</div><div class="bar" style="height:${d.h}%;background:${d.c}"></div><div class="bx">${d.x}</div></div>`).join('')}</div></div>
  </div>`;

  /* by source (hbars) */
  const bySource = [
    { l: 'Referral', v: 38, w: 100 }, { l: 'LinkedIn', v: 34, w: 89 },
    { l: 'Job Board', v: 29, w: 76 }, { l: 'Company Site', v: 24, w: 63 }, { l: 'Recruiter', v: 17, w: 45 },
  ];
  const sourceChart = `<div class="panel">
    <div class="panel-head"><h3>Applications by Source</h3></div>
    <div class="chart-body"><div class="hbars">${bySource.map((s,i) => `<div class="hbar-row">
      <span class="hl">${s.l}</span><div class="htrack"><div class="hfill" style="width:${s.w}%;background:${['var(--c-0)','var(--c-2)','var(--c-5)','var(--c-9)','var(--c-c)'][i]}"></div></div><span class="hv">${s.v}</span></div>`).join('')}</div></div>
  </div>`;

  /* weekly volume (line via svg polyline) */
  const weekly = [6, 9, 7, 12, 10, 14, 11, 16, 13, 18, 15, 12];
  const max = 20, w = 100, stepX = w / (weekly.length - 1);
  const pts = weekly.map((v, i) => `${(i * stepX).toFixed(1)},${(100 - (v / max) * 90 - 5).toFixed(1)}`).join(' ');
  const area = `0,100 ${pts} ${w},100`;
  const weeklyChart = `<div class="panel span2">
    <div class="panel-head"><h3>Weekly Application Volume</h3><span class="count">last 12 weeks</span></div>
    <div class="chart-body">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:150px;display:block;">
        <line x1="0" y1="50" x2="100" y2="50" stroke="var(--c-f5)" stroke-width="0.4"/>
        <line x1="0" y1="95" x2="100" y2="95" stroke="var(--c-e5)" stroke-width="0.4"/>
        <polygon points="${area}" fill="var(--c-f5)"/>
        <polyline points="${pts}" fill="none" stroke="var(--c-1)" stroke-width="0.9" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
        ${weekly.map((v,i) => `<circle cx="${(i*stepX).toFixed(1)}" cy="${(100-(v/max)*90-5).toFixed(1)}" r="0.9" fill="var(--c-0)" vector-effect="non-scaling-stroke"/>`).join('')}
      </svg>
      <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--c-9);margin-top:8px;"><span>W1</span><span>W4</span><span>W8</span><span>W12</span></div>
    </div>
  </div>`;

  return `<div class="page">${head}${filters}
    <div class="chart-grid">${funnel}${distChart}${statusChart}${sourceChart}${weeklyChart}</div>
  </div>`;
}

/* ===========================================================
   DEVELOPER TOOLS (light)
   =========================================================== */
function renderDevtools() {
  const head = pageHead({ title: 'Developer Tools', sub: 'API access, data, and local environment' });
  return `<div class="page">${head}<div class="settings-wrap">
    <div class="set-card">
      <div class="sc-head"><div class="sc-title">API Access</div><div class="sc-sub">Personal token for the tracker REST + CLI</div></div><hr/>
      <div class="sc-body">
        <div class="field"><label>Personal access token</label>
          <div style="display:flex;gap:8px;"><input class="field-input mono" value="apw_live_••••••••••••••••••3f9a" readonly /><button class="btn">Copy</button><button class="btn">Regenerate</button></div>
          <span class="hint">last used 2h ago · scoped read+write</span></div>
      </div>
    </div>
    <div class="set-card">
      <div class="sc-head"><div class="sc-title">Data</div><div class="sc-sub">Export or import your application history</div></div><hr/>
      <div class="sc-body" style="display:flex;gap:10px;flex-wrap:wrap;">
        <button class="btn">Export JSON</button><button class="btn">Export CSV</button><button class="btn">Import…</button>
        <button class="btn">Seed demo data</button>
      </div>
    </div>
    <div class="set-card">
      <div class="sc-head"><div class="sc-title">Environment</div></div><hr/>
      <div class="sc-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-family:var(--mono);font-size:12px;color:var(--c-5);">
          <div>Build <span style="color:var(--c-1)">v2.4.1</span></div><div>Region <span style="color:var(--c-1)">iad1</span></div>
          <div>API <span style="color:var(--c-1)">healthy</span></div><div>Webhook <span style="color:var(--c-1)">2 active</span></div>
        </div>
      </div>
    </div>
  </div></div>`;
}

/* ===========================================================
   ACCOUNT SETTINGS
   =========================================================== */
function renderSettings() {
  const head = pageHead({ title: 'Account Settings', sub: 'Profile, security, and integrations' });
  return `<div class="page">${head}<div class="settings-wrap">

    <div class="set-card">
      <div class="sc-head"><div class="sc-title">Profile</div><div class="sc-sub">How you appear across the app</div></div><hr/>
      <div class="sc-body"><div class="form-grid">
        <div class="field"><label>Full name</label><input class="field-input" value="Jordan Diaz" /></div>
        <div class="field"><label>Email</label><input class="field-input mono" value="jordan@diaz.dev" /></div>
        <div class="field"><label>Preferred reminder time</label><input class="field-input mono" value="09:00" /></div>
        <div class="field"><label>Timezone</label><select class="field-select"><option>America/New_York</option><option>UTC</option></select></div>
      </div>
      <div class="form-foot" style="margin-top:18px;"><button class="btn btn-primary">Save profile</button></div></div>
    </div>

    <div class="set-card">
      <div class="sc-head"><div class="sc-title">Change Password</div></div><hr/>
      <div class="sc-body"><div class="form-grid">
        <div class="field fg-full"><label>Current password</label><input class="field-input" type="password" value="········" /></div>
        <div class="field"><label>New password</label><input class="field-input" type="password" placeholder="••••••••" /></div>
        <div class="field"><label>Confirm new password</label><input class="field-input" type="password" placeholder="••••••••" /></div>
      </div>
      <div class="form-foot" style="margin-top:18px;"><button class="btn">Update password</button></div></div>
    </div>

    <div class="set-card">
      <div class="sc-head"><div class="sc-title">Passkeys</div><div class="sc-sub">Sign in without a password</div></div><hr/>
      <div class="sc-body">
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:var(--border);">
          <div class="int-logo">⌘</div>
          <div style="flex:1"><div style="font-weight:550;font-size:13px;">MacBook Pro · Touch ID</div><div class="cell-sub mono">added Mar 2 · last used today</div></div>
          <button class="btn btn-sm btn-ghost">Remove</button>
        </div>
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;">
          <div class="int-logo">▦</div>
          <div style="flex:1"><div style="font-weight:550;font-size:13px;">iPhone 16 · Face ID</div><div class="cell-sub mono">added Apr 18 · last used 1d ago</div></div>
          <button class="btn btn-sm btn-ghost">Remove</button>
        </div>
        <div style="margin-top:14px;"><button class="btn">+ Add a passkey</button></div>
      </div>
    </div>

    <div class="set-card">
      <div class="sc-head"><div class="sc-title">Google Drive</div><div class="sc-sub">Store generated resumes in your Drive</div></div><hr/>
      <div class="sc-body"><div class="integration">
        <div class="int-logo">▲</div>
        <div style="flex:1"><div style="font-weight:550;font-size:13.5px;">Connected as jordan@diaz.dev</div><div class="cell-sub mono">/Applywell/Resumes · 12 files · synced 4m ago</div></div>
        <span class="status-pill"><span class="dot"></span>Connected</span>
        <button class="btn btn-sm">Disconnect</button>
      </div></div>
    </div>

    <div class="set-card danger">
      <div class="sc-head"><div class="sc-title">Danger Zone</div><div class="sc-sub">Irreversible and destructive actions</div></div><hr/>
      <div class="sc-body"><div style="display:flex;align-items:center;gap:14px;">
        <div style="flex:1"><div style="font-weight:550;font-size:13.5px;">Delete account</div><div class="cell-sub">Permanently remove your account, applications, and history.</div></div>
        <button class="btn" style="border-color:#d8c4c4;color:#7a2e2e;">Delete account</button>
      </div></div>
    </div>

  </div></div>`;
}

/* ===========================================================
   ROUTER + WIRING
   =========================================================== */
const SCREENS = {
  dashboard:    { root: 'Workspace', leaf: 'Dashboard', render: () => renderDashboard(dashVariant) },
  applications: { root: 'Workspace', leaf: 'Applications', render: renderApplications },
  metrics:      { root: 'Workspace', leaf: 'Metrics', render: renderMetrics },
  devtools:     { root: 'System', leaf: 'Developer Tools', render: renderDevtools },
  settings:     { root: 'System', leaf: 'Account Settings', render: renderSettings },
};
let current = 'dashboard';
let dashVariant = 'standard';

function go(screen) {
  current = screen;
  if (screen === 'applications') appState.view = 'list';
  $$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.screen === screen));
  $('#crumbRoot').textContent = SCREENS[screen].root;
  $('#crumbLeaf').textContent = SCREENS[screen].leaf;
  paint();
}
function paint() {
  $('#content').innerHTML = SCREENS[current].render();
  $('#content').scrollTop = 0;
  bindScreen();
}

function bindScreen() {
  // dashboard variant
  const dashSeg = $('[data-seg="dash"]');
  if (dashSeg) dashSeg.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    dashVariant = b.dataset.val; paint();
  });
  // applications tabs
  $$('.tab[data-tab]').forEach(t => t.addEventListener('click', () => { appState.tab = t.dataset.tab; paint(); }));
  // applications view variant
  const av = $('[data-seg="appview"]');
  if (av) av.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; appState.variant = b.dataset.val; paint(); });
  // new application / edit -> form
  $$('#newAppBtn, [data-act="edit"]').forEach(b => b.addEventListener('click', () => { appState.view = 'form'; paint(); }));
  // form cancel
  const cancel = $('[data-cancel]'); if (cancel) cancel.addEventListener('click', () => { appState.view = 'list'; paint(); });
  // toggles
  $$('[data-toggle]').forEach(s => s.addEventListener('click', () => s.classList.toggle('on')));
  $$('[data-check]').forEach(c => c.addEventListener('click', () => c.classList.toggle('on')));
  // sortable headers (visual only)
  $$('table.tbl th.sortable').forEach(th => th.addEventListener('click', () => {
    $$('table.tbl th').forEach(x => x.classList.remove('sorted'));
    th.classList.add('sorted');
  }));
}

// nav
$$('.nav-item').forEach(n => n.addEventListener('click', () => go(n.dataset.screen)));
// collapse
$('#collapseBtn').addEventListener('click', () => $('#app').classList.toggle('collapsed'));

// initial
paint();
