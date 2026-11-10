import { SKILLS, QUEST_CAPE, DIARIES, XP_TABLE } from './data.js';

const API = 'https://api.wiseoldman.net/v2';
const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString();
const title = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const MAX_XP = XP_TABLE[99];

let player = null;
let tab = 'skills';

// ---------- data ----------
async function fetchPlayer(name) {
  const url = `${API}/players/${encodeURIComponent(name)}`;
  let res = await fetch(url);
  if (res.status === 404) res = await fetch(url, { method: 'POST' }); // start tracking
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${res.status})`);
  }
  return res.json();
}
const getJson = async (path) => { const r = await fetch(API + path); if (!r.ok) throw new Error(`Request failed (${r.status})`); return r.json(); };

const skillsOf = (p) => p.latestSnapshot.data.skills;
const progress = (xp, level) => Math.min(1, xp / XP_TABLE[level]);
const bar = (f) => `<span class="bar"><i style="width:${(f * 100).toFixed(1)}%"></i></span>`;

// ---------- recent players ----------
function recent() { try { return JSON.parse(localStorage.getItem('recent') || '[]'); } catch { return []; } }
function remember(name) {
  const list = [name, ...recent().filter((n) => n.toLowerCase() !== name.toLowerCase())].slice(0, 8);
  try { localStorage.setItem('recent', JSON.stringify(list)); } catch {}
  renderRecent();
}
function renderRecent() {
  const list = recent();
  $('recent').innerHTML = list.length ? 'Recent: ' + list.map((n) => `<a data-n="${esc(n)}">${esc(n)}</a>`).join('') : '';
}
$('recent').onclick = (e) => { if (e.target.dataset.n) lookup(e.target.dataset.n); };

// ---------- lookup ----------
async function lookup(name) {
  name = name.trim();
  if (!name) return;
  $('name').value = name;
  $('status').textContent = 'Loading…';
  try {
    player = await fetchPlayer(name);
    if (!player.latestSnapshot) throw new Error('No hiscores data for this player yet.');
    history.replaceState(null, '', `?player=${encodeURIComponent(player.displayName)}`);
    remember(player.displayName);
    $('status').textContent = '';
    $('result').hidden = false;
    render();
  } catch (e) {
    $('status').textContent = e.message;
    $('result').hidden = true;
  }
}
$('search').onsubmit = (e) => { e.preventDefault(); lookup($('name').value); };

// ---------- tabs ----------
const TABS = { skills: 'Skills', quest: 'Quest Cape', diaries: 'Diaries', bosses: 'Bosses & Activities', gains: 'Gains', compare: 'Compare' };
$('tabs').onclick = (e) => { if (e.target.dataset.t) { tab = e.target.dataset.t; render(); } };

function render() {
  const s = skillsOf(player);
  const updated = new Date(player.updatedAt).toLocaleString();
  $('summary').innerHTML = `<b>${esc(player.displayName)}</b>Total ${fmt(s.overall.level)} · Combat ${player.combatLevel} · ${fmt(s.overall.experience)} XP · Updated ${updated}`;
  $('tabs').innerHTML = Object.entries(TABS).map(([k, v]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${v}</button>`).join('');
  VIEWS[tab]($('view'), s);
}

// ---------- views ----------
const VIEWS = {
  skills(el, s) {
    const left = SKILLS.reduce((sum, k) => sum + Math.max(0, MAX_XP - s[k].experience), 0);
    const maxed = SKILLS.filter((k) => s[k].level >= 99).length;
    el.innerHTML = `<p class="muted">Max cape: ${maxed}/${SKILLS.length} skills at 99, ${fmt(left)} XP to go.</p>
      <table><tr><th>Skill</th><th>Level</th><th>XP</th><th>Rank</th><th>To 99</th></tr>
      ${SKILLS.map((k) => { const x = s[k]; const f = progress(x.experience, 99);
        return `<tr class="${f >= 1 ? 'done' : ''}"><td>${title(k)}</td><td>${x.level}</td><td>${fmt(Math.max(0, x.experience))}</td>
        <td>${x.rank > 0 ? fmt(x.rank) : '–'}</td><td>${f >= 1 ? 'Done' : fmt(MAX_XP - Math.max(0, x.experience))}${bar(f)}</td></tr>`; }).join('')}</table>`;
  },

  quest(el, s) {
    const rows = Object.entries(QUEST_CAPE).map(([k, lvl]) => {
      const xp = Math.max(0, s[k].experience), need = XP_TABLE[lvl];
      return { k, lvl, level: s[k].level, left: Math.max(0, need - xp), need, xp };
    }).sort((a, b) => a.left - b.left);
    const need = rows.reduce((t, r) => t + r.need, 0), have = rows.reduce((t, r) => t + Math.min(r.xp, r.need), 0);
    el.innerHTML = `<p class="muted">Overall: ${Math.round((have / need) * 100)}% of the XP needed for every quest's skill requirements (${fmt(need - have)} XP left). Quest points aren't on the hiscores, so this only covers skills.</p>
      <table><tr><th>Skill</th><th>Level</th><th>Needed</th><th>XP left</th></tr>
      ${rows.map((r) => `<tr class="${r.left ? '' : 'done'}"><td>${title(r.k)}</td><td>${r.level}</td><td>${r.lvl}</td>
        <td>${r.left ? fmt(r.left) : 'Done'}${bar(Math.min(1, r.xp / r.need))}</td></tr>`).join('')}</table>`;
  },

  diaries(el, s) {
    el.innerHTML = `<p class="muted">Elite-tier skill requirements per region (boostable levels aren't accounted for).</p><div class="grid">
      ${Object.entries(DIARIES).map(([region, reqs]) => {
        const items = Object.entries(reqs);
        const met = items.filter(([k, l]) => s[k].level >= l).length;
        return `<div class="card"><h3>${region}<span class="${met === items.length ? 'done' : 'muted'}">${met}/${items.length}</span></h3><ul>
          ${items.map(([k, l]) => `<li class="${s[k].level >= l ? 'done' : ''}">${title(k)}: ${s[k].level}/${l}</li>`).join('')}</ul></div>`;
      }).join('')}</div>`;
  },

  bosses(el) {
    const d = player.latestSnapshot.data;
    const list = (obj, field) => Object.values(obj).filter((x) => x[field] > 0).sort((a, b) => b[field] - a[field]);
    const table = (rows, field, label) => rows.length
      ? `<table><tr><th>Name</th><th>${label}</th><th>Rank</th></tr>${rows.map((x) => `<tr><td>${title(x.metric)}</td><td>${fmt(x[field])}</td><td>${fmt(x.rank)}</td></tr>`).join('')}</table>`
      : '<p class="muted">Nothing ranked on the hiscores yet.</p>';
    el.innerHTML = `<h3>Bosses</h3>${table(list(d.bosses, 'kills'), 'kills', 'Kills')}<h3>Activities</h3>${table(list(d.activities, 'score'), 'score', 'Score')}`;
  },

  async gains(el) {
    const period = el.dataset.period || 'week';
    el.innerHTML = `<div class="row">Period <select id="period">${['day', 'week', 'month', 'year'].map((p) => `<option ${p === period ? 'selected' : ''}>${p}</option>`).join('')}</select></div><div id="gainsBody" class="muted">Loading…</div>`;
    $('period').onchange = (e) => { el.dataset.period = e.target.value; VIEWS.gains(el); };
    const name = encodeURIComponent(player.username);
    try {
      const [g, timeline] = await Promise.all([
        getJson(`/players/${name}/gained?period=${period}`),
        getJson(`/players/${name}/snapshots/timeline?metric=overall&period=${period}`),
      ]);
      if (!$('gainsBody')) return; // user switched tabs while loading
      const rows = SKILLS.map((k) => ({ k, ...g.data.skills[k] })).filter((r) => r.experience.gained > 0).sort((a, b) => b.experience.gained - a.experience.gained);
      const total = g.data.skills.overall.experience.gained;
      $('gainsBody').outerHTML = `${chart(timeline)}<p class="muted">${fmt(total)} XP gained this ${period}. Wise Old Man only records gains when the profile is updated, so they start from the first lookup.</p>
        ${rows.length ? `<table><tr><th>Skill</th><th>XP gained</th><th>Levels</th></tr>${rows.map((r) => `<tr><td>${title(r.k)}</td><td>${fmt(r.experience.gained)}</td><td>${r.level.gained ? '+' + r.level.gained : ''}</td></tr>`).join('')}</table>` : ''}`;
    } catch (e) { if ($('gainsBody')) $('gainsBody').textContent = e.message; }
  },

  compare(el, s) {
    el.innerHTML = `<form class="row" id="cmpForm"><input id="cmpName" placeholder="Compare with…" value="${esc(el.dataset.other || '')}"><button>Compare</button></form><div id="cmpBody"></div>`;
    const show = async (name) => {
      $('cmpBody').innerHTML = '<p class="muted">Loading…</p>';
      try {
        const o = await fetchPlayer(name); const t = skillsOf(o);
        el.dataset.other = o.displayName;
        $('cmpBody').innerHTML = `<table><tr><th>Skill</th><th>${esc(player.displayName)}</th><th>${esc(o.displayName)}</th><th>XP difference</th></tr>
          ${['overall', ...SKILLS].map((k) => { const d = Math.max(0, s[k].experience) - Math.max(0, t[k].experience);
            return `<tr><td>${title(k)}</td><td class="${d > 0 ? 'done' : ''}">${s[k].level}</td><td class="${d < 0 ? 'done' : ''}">${t[k].level}</td><td>${d > 0 ? '+' : ''}${fmt(d)}</td></tr>`; }).join('')}</table>`;
      } catch (e) { $('cmpBody').innerHTML = `<p class="muted">${esc(e.message)}</p>`; }
    };
    $('cmpForm').onsubmit = (e) => { e.preventDefault(); show($('cmpName').value.trim()); };
    if (el.dataset.other) show(el.dataset.other);
  },
};

function chart(points) {
  if (points.length < 2) return '<p class="muted">Not enough snapshots yet to draw a chart.</p>';
  const pts = points.map((p) => ({ t: +new Date(p.date), v: p.value })).sort((a, b) => a.t - b.t);
  const W = 800, H = 180, P = 8;
  const t0 = pts[0].t, t1 = pts.at(-1).t, v0 = pts[0].v, v1 = Math.max(pts.at(-1).v, v0 + 1);
  const x = (t) => P + ((t - t0) / (t1 - t0 || 1)) * (W - 2 * P), y = (v) => H - P - ((v - v0) / (v1 - v0)) * (H - 2 * P - 16);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Overall XP over time">
    <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2"/>
    <text x="${P}" y="12">${fmt(v1)} XP</text><text x="${W - P}" y="${H - 1}" text-anchor="end">${new Date(t1).toLocaleDateString()}</text>
    <text x="${P}" y="${H - 1}">${new Date(t0).toLocaleDateString()}</text></svg>`;
}

// ---------- start ----------
renderRecent();
const initial = new URLSearchParams(location.search).get('player');
if (initial) lookup(initial);
