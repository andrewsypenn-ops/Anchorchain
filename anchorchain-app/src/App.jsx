import { useState, useEffect, useRef } from "react";

// ===== SUPABASE CONFIG =====
const SUPABASE_URL = "https://qtiuszigqlyiofpuksxz.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aXVzemlncWx5aW9mcHVrc3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDE2NDksImV4cCI6MjA5NTk3NzY0OX0.qGlvpF8LB8tbrv3q065PdgKHJI_pqTJ7-8QwH8ntHrU";
const TEAM_PASSWORD = "anchor2026";
const BOARD_ID = "shared_board";

// Cloud sync: mirrors all localStorage keys to one Supabase row
const SYNC_KEYS = [
  "anchorchain_v2", "anchorchain_dashboard_v1", "anchorchain_staff_v2",
  "anchorchain_day_defaults_v1", "anchorchain_tenstar_v1",
  "anchorchain_culture_v1", "anchorchain_win_v1", "anchorchain_template_v1"
];

async function cloudLoad() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/anchorchain_data?id=eq.${BOARD_ID}&select=data`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
    });
    const rows = await res.json();
    if (rows && rows[0] && rows[0].data) {
      const cloud = rows[0].data;
      SYNC_KEYS.forEach(k => { if (cloud[k] !== undefined) localStorage.setItem(k, JSON.stringify(cloud[k])); });
      return true;
    }
  } catch (e) { console.error("Cloud load failed:", e); }
  return false;
}

let saveTimer = null;
function cloudSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      const payload = {};
      SYNC_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v) try { payload[k] = JSON.parse(v); } catch {} });
      await fetch(`${SUPABASE_URL}/rest/v1/anchorchain_data`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`,
          "Content-Type": "application/json", Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify({ id: BOARD_ID, data: payload, updated_at: new Date().toISOString() })
      });
    } catch (e) { console.error("Cloud save failed:", e); }
  }, 800);
}

const STAFF = ["Saavedra", "Sun", "Tubio", "Yoon"];

// Auto-sync any write to a synced key up to the cloud
if (typeof window !== "undefined" && !window.__acSyncPatched) {
  window.__acSyncPatched = true;
  const origSet = localStorage.setItem.bind(localStorage);
  localStorage.setItem = (key, val) => {
    origSet(key, val);
    if (SYNC_KEYS.includes(key)) cloudSave();
  };
}
const DAY_SCHEDULE = {
  "Saavedra": [2,3,4,5],
  "Sun": [2,3,4,5],
  "Tubio": [1,2,4,5],
  "Yoon": [1,2,3],
};

const TASK_IDS_WITH_STAFF = {
  2: [201,202,203,204,205,206,207,208,209],
  7: [703,704,706,707,708,709,710,712,713,714,715],
};

const TEMPLATE_TEAMS = [
  {
    id: 1, name: "Vibe Desk", subtitle: "front desk", color: "#FF6B35", nameColor: "#FF6B35",
    tasks: [
      { id: 101, label: "🌅 MORNING", done: false, header: true },
      { id: 102, label: "Overnight/Weekend email inquiries", done: false },
      { id: 103, label: "Call back all missed/abandoned calls ASAP", done: false },
      { id: 104, label: "Call any unconfirmed appts - 2 days ahead", done: false },
    ],
  },
  {
    id: 2, name: "Tooth Ninjas", subtitle: "dental assistants", color: "#F7C59F", nameColor: "#FF69B4",
    tasks: [
      { id: 201, label: "Optimize schedule 1 day, 3 days & 1 week ahead", done: false },
      { id: 202, label: "Assign assistants day before & cover if team member out", done: false },
      { id: 203, label: "Add Limited Events day prior for open spots", done: false },
      { id: 204, label: "Send game plan in BTO Chat (assistant out, schedule & protocol updates)", done: false },
      { id: 205, label: "Serve as point of contact between assistants and doctor/managers", done: false },
      { id: 206, label: "Ensure lab cases are prepped and sent", done: false },
      { id: 207, label: "Follow up on cases — confirm arrival 3 days ahead & check in cases", done: false },
      { id: 208, label: "Check operatory cleanliness & stock up", done: false },
      { id: 209, label: "Resolve equipment maintenance needs", done: false },
    ],
  },
  {
    id: 3, name: "✨ Sparkle Team", subtitle: "hygiene heroes", color: "#E8E8FF", nameColor: "#E0E0FF",
    tasks: [
      { id: 301, label: "Dev build", done: false },
      { id: 302, label: "QA testing", done: false },
      { id: 303, label: "Bug fixes", done: false },
    ],
  },
  {
    id: 4, name: "Growth Gang", subtitle: "marketing", color: "#4ECDC4", nameColor: "#FFD700",
    tasks: [
      { id: 401, label: "GMB Pics (10)", done: false },
      { id: 402, label: "Social Media Post (1)", done: false },
      { id: 403, label: "10-Star Experience (2)", done: false },
    ],
  },
  {
    id: 6, name: "Vibe Desk", subtitle: "new patients", color: "#FF6B35", nameColor: "#FF6B35",
    isStatCard: true,
    stats: [
      { id: 600, label: "NP PER DAY (Total)", value: "" },
      { id: 6001, label: "NP SCH'D FOR FUTURE", value: "" },
      { id: 601, label: "NP Seen Today", value: "" },
      { id: 602, label: "NP Total Seen This Month", value: "" },
      { id: 603, label: "Days Left In Month", value: "" },
      { id: 610, label: "Google", value: "" },
      { id: 611, label: "Insurance", value: "" },
      { id: 612, label: "Internal (Friend/Family) WOM", value: "" },
      { id: 613, label: "Social Media", value: "" },
      { id: 614, label: "Returning Patient", value: "" },
      { id: 615, label: "Walk In / Drive By", value: "" },
      { id: 616, label: "Dr Referral", value: "" },
      { id: 617, label: "Website", value: "" },
      { id: 618, label: "NA", value: "" },
      { id: 620, label: "Hannah", value: "" },
      { id: 621, label: "MC", value: "" },
      { id: 622, label: "Julia", value: "" },
      { id: 623, label: "Liza", value: "" },
      { id: 624, label: "Litzy", value: "" },
      { id: 625, label: "Brianna", value: "" },
      { id: 626, label: "Ashanty", value: "" },
      { id: 627, label: "Leeza", value: "" },
      { id: 628, label: "Sheila", value: "" },
      { id: 629, label: "Michii", value: "" },
      { id: 630, label: "Charmaine", value: "" },
      { id: 631, label: "Isa", value: "" },
      { id: 632, label: "NA", value: "" },
      { id: 633, label: "Kara", value: "" },
      { id: 634, label: "Megan", value: "" },
    ],
    tasks: [],
  },
  {
    id: 8, name: "Vibe Desk", subtitle: "throughout", color: "#FF6B35", nameColor: "#FF6B35",
    tasks: [
      { id: 801, label: "THROUGHOUT", done: false, header: true },
      { id: 802, label: "Check missed & abandoned calls routinely via Weave + Modento", done: false },
      { id: 803, label: "Outcome - Note in Missed/Abandoned Calls Spreadsheet (scheduled? Helped? Still needs follow-up?)", done: false },
      { id: 804, label: "Confirm all IV consent sent/received", done: false },
      { id: 805, label: "Voicemails - 8am, 10am & 2pm", done: false },
      { id: 806, label: "Call NPs to see if they have any questions (including Limited NPs)", done: false },
      { id: 807, label: "All Texts - Check and respond routinely", done: false },
      { id: 808, label: "Unreplied - Confirm all stations have Weave messaging set to Unreplied", done: false },
      { id: 809, label: "10 star surveys", done: false },
      { id: 810, label: "Schedule - Restorative/Surgical patients after hygiene", done: false },
      { id: 811, label: "OP 15 - Add follow-up appt", done: false },
      { id: 812, label: "Pano text templates and Gchat to notify the team", done: false },
      { id: 813, label: "Consults - Schedule pano/wisdom teeth consults or use Room 15 for follow-up", done: false },
      { id: 814, label: "Tracking Sheet - Notate on Tracking sheet", done: false },
      { id: 815, label: "Sent reminders for medical histories = When?", done: false, hasFillIn: true },
      { id: 816, label: "Sent consents for SRPs = When?", done: false, hasFillIn: true },
    ],
  },
  {
    id: 5, name: "Chaos Coordinators", subtitle: "boss ladies", color: "#A78BFA", nameColor: "#FF00FF",
    tasks: [
      { id: 501, label: "Final review", done: false },
      { id: 502, label: "Sign-off", done: false },
      { id: 503, label: "All clear", done: false },
    ],
  },
  {
    id: 9, name: "Vibe Desk", subtitle: "end of day", color: "#FF6B35", nameColor: "#FF6B35",
    tasks: [
      { id: 901, label: "END OF DAY", done: false, header: true },
      { id: 902, label: "Treatment Planned - Count # of Panos =", done: false, hasFillIn: true },
      { id: 903, label: "Accepted - Count # of Panos =", done: false, hasFillIn: true },
      { id: 904, label: "TOTAL # of Patients Seen today:", done: false, hasFillIn: true },
      { id: 905, label: "Number of Patients we asked for a review from today:", done: false, hasFillIn: true },
      { id: 906, label: "TOTAL # of Patients Seen TO DATE (within the month):", done: false, hasFillIn: true },
      { id: 907, label: "Check DI analytics call 10 unscheduled hyg patients", done: false },
      { id: 908, label: "Number of Reviews asked for TO DATE (within the month):", done: false, hasFillIn: true },
      { id: 909, label: "Number of Reviews Written TO DATE (within the month):", done: false, hasFillIn: true },
      { id: 910, label: "# of preferred names that were updated today:", done: false, hasFillIn: true },
      { id: 911, label: "# of billing policies updated today:", done: false, hasFillIn: true },
      { id: 912, label: "Unresolved = Ensure no voicemails, texts, or calls are left unresolved", done: false },
      { id: 913, label: "Documentation - Confirm all patient interactions are documented clearly in Weave", done: false },
      { id: 914, label: "Leads Follow up - Double-check that all leads (new patients) are either scheduled, answered, reassured", done: false },
      { id: 9141, label: "Make sure patient needs are fully addressed: scheduled, answered, reassured", done: false },
      { id: 915, label: "Fill out NP SEEN google sheet", done: false },
      { id: 916, label: "Print NP/ NP limited routers for next day", done: false },
      { id: 917, label: "Close out schedule - remaining appts left on there", done: false },
    ],
  },
  {
    id: 7, name: "Rain Makers", subtitle: "TXC", color: "#0047AB", nameColor: "#4169E1",
    isRainMakers: true,
    stats: [
      { id: 700, label: "Where did the upper right number start today? $", value: "" },
      { id: 701, label: "Set a Goal $", value: "" },
    ],
    tasks: [
      { id: 702, label: "MORNING TOUCHPOINT", done: false, header: true },
      { id: 703, label: "Print pending routers (insurance breakdown or added overnight)", done: false },
      { id: 704, label: "Check Gchats for cancellations etc.", done: false },
      { id: 705, label: "FOLLOW UP TASKS - TO FILL SCHEDULE", done: false, header: true },
      { id: 706, label: "Next day - Check Hyg for pending Restorative & patients to add tx to (DIAL #3)", done: false },
      { id: 707, label: "Follow-ups from Referrals to specialists (ie RCT pts)", done: false },
      { id: 708, label: "Send Pre D & Pre D Follow Up", done: false },
      { id: 709, label: "Treatment Follow Ups - Start w/ your VIPs", done: false },
      { id: 710, label: "Make Di Calls", done: false },
      { id: 711, label: "END OF DAY", done: false, header: true },
      { id: 712, label: "Add Green events to schedule (Pending Tx/Hyg) Call to add treatment DIAL #3 *Tonia Hyg", done: false },
      { id: 713, label: "Add Limited Here events for your doc", done: false },
      { id: 714, label: "Add Overjet findings to appts", done: false },
      { id: 715, label: "Print Routers", done: false },
      { id: 716, label: "TRACK / MEASURE", done: false, header: true },
      { id: 717, label: "Dial #1 - Same day Treatment Added (Amount): $", done: false, hasFillIn: true },
      { id: 718, label: "Dial #2 - Outstanding Tx scheduled from Hyg (Amount): $", done: false, hasFillIn: true },
      { id: 719, label: "Dial #2 - Create follow ups from Red Events (in op 15)", done: false },
      { id: 720, label: "NOTES", done: false, header: true },
      { id: 721, label: "", done: false, isNote: true },
      { id: 722, label: "", done: false, isNote: true },
      { id: 723, label: "", done: false, isNote: true },
    ],
  },
  {
    id: 10, name: "Rain Makers", subtitle: "scorecard", color: "#0047AB", nameColor: "#4169E1",
    isScoreCard: true,
    sections: [
      {
        id: "sched", title: "Scheduling - Follow Up Tasks", color: "#1a2f5a",
        cols: ["Team Member", "Total $", "$ Per Attempt", "Attempts", "Contacted", "%", "Successes", "%"],
        rows: [
          { id: "s1", cells: ["Kara", "$260", "$87", "3", "3", "100%", "2", "67%"] },
        ],
      },
      {
        id: "other", title: "Other", color: "#1a2f5a",
        cols: ["Team Member", "Attempts", "Contacted", "%", "Completed", "%"],
        rows: [
          { id: "o1", cells: ["Julia", "1", "1", "100%", "1", "100%"] },
        ],
      },
      {
        id: "broken", title: "Unscheduled Broken Appointment", color: "#1a9c4a",
        cols: ["Team Member", "Schedule $", "$ Per Attempt", "Attempts", "Contacted", "%", "Completed", "%", "Patients"],
        rows: [
          { id: "b1", cells: ["Leeza", "$3,131", "$1,044", "3", "3", "100%", "2", "67%", "2"] },
        ],
      },
      {
        id: "unsched", title: "Unscheduled Treatment", color: "#4a7c1f",
        cols: ["Team Member", "Total $", "$ Per Attempt", "Attempts", "Contacted", "%", "Successes", "%"],
        rows: [
          { id: "u1", cells: ["Kara", "$6,485", "$540", "12", "7", "58%", "7", "100%"] },
          { id: "u2", cells: ["SheilaTX", "$9,809", "$1,226", "8", "8", "100%", "8", "100%"] },
          { id: "u3", cells: ["Leeza", "$1,405", "$1,405", "1", "1", "100%", "1", "100%"] },
        ],
      },
    ],
  },
];

const STORAGE_KEY = "anchorchain_v2";
const DASHBOARD_KEY = "anchorchain_dashboard_v1";
function loadDashboard() { try { const r = localStorage.getItem(DASHBOARD_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveDashboard(d) { try { localStorage.setItem(DASHBOARD_KEY, JSON.stringify(d)); } catch {} }
const STAFF_KEY = "anchorchain_staff_v2";
const DAY_DEFAULTS_KEY = "anchorchain_day_defaults_v1";
const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function loadDayDefaults() { try { const r = localStorage.getItem(DAY_DEFAULTS_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; } }
function saveDayDefaults(d) { try { localStorage.setItem(DAY_DEFAULTS_KEY, JSON.stringify(d)); } catch {} }

function todayStr() { return new Date().toISOString().slice(0, 10); }
function loadAllData() { try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; } }
function saveAllData(d) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {} }
function loadStaffData() { try { const r = localStorage.getItem(STAFF_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; } }
function saveStaffData(d) { try { localStorage.setItem(STAFF_KEY, JSON.stringify(d)); } catch {} }
function deepClone() {
  try {
    const saved = localStorage.getItem("anchorchain_template_v1");
    if (saved) return JSON.parse(saved);
  } catch {}
  return JSON.parse(JSON.stringify(TEMPLATE_TEAMS));
}
async function fetchNPData(date) {
  try {
    const range = "A:E";
    const url = `https://sheets.googleapis.com/v4/spreadsheets/1MvMoBEpwWFykWWjWv5T0yhcNgltCW8kX9HvkPSZvcyA/values/${range}?key=AIzaSyB2kwRqpvTFIUKOZQEU4xlF4N2YlDrFL9E`;
    const res = await fetch(url);
    const json = await res.json();
    const rows = json.values || [];
    
    // Parse date to match sheet format MM/DD/YYYY
    const [yr, mo, dy] = date.split("-");
    const dateStr = `${parseInt(mo)}/${parseInt(dy)}/${yr}`;
    
    // Count Yes for today
    const todayYes = rows.filter(r => r[3] && r[3].trim() === dateStr && r[4] && r[4].trim().toLowerCase() === "yes").length;
    
    // Count all Yes this month
    const monthYes = rows.filter(r => r[3] && r[3].trim().endsWith(`/${yr}`) && r[3].includes(`${parseInt(mo)}/`) && r[4] && r[4].trim().toLowerCase() === "yes").length;
    
    // Count total rows with Yes (all time for the month)
    const monthStr = `${parseInt(mo)}/`;
    const monthTotal = rows.filter(r => r[3] && r[3].startsWith(monthStr) && r[4] && r[4].trim().toLowerCase() === "yes").length;
    
    return { todayYes, monthYes };
  } catch(e) {
    console.error("Sheets fetch error:", e);
    return null;
  }
}

function getProgress(tasks, teamId) {
  const staffIds = teamId ? (TASK_IDS_WITH_STAFF[teamId] || []) : [];
  const real = tasks.filter(t => !t.header && !t.isNote && !staffIds.includes(t.id));
  if (!real.length) return 0;
  return Math.round((real.filter(t => t.done).length / real.length) * 100);
}
function getDayPct(teams) {
  const all = teams.flatMap(t => (t.tasks || []).filter(tk => !tk.header && !tk.isNote));
  if (!all.length) return 0;
  return Math.round((all.filter(t => t.done).length / all.length) * 100);
}

function Checkmark() {
  return <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function ProgressRing({ pct, color, size = 72 }) {
  const r = (size - 8) / 2, circ = 2 * Math.PI * r, dash = (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#0f1f38" strokeWidth={6} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: size < 60 ? 19 : 24, fontFamily: "monospace", fontWeight: 700 }}>{pct}%</div>
    </div>
  );
}

function Arrow() {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 4px", flexShrink: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <div style={{ width: 40, height: 2, background: "linear-gradient(90deg,#4ECDC4,#FF6B35)", borderRadius: 2 }} />
        <div style={{ fontSize: 9, color: "#4ECDC4", fontFamily: "monospace", letterSpacing: 1 }}>OPEN</div>
      </div>
    </div>
  );
}

function SectionHeader({ label, color }) {
  return <div style={{ fontFamily: "monospace", fontSize: 14, letterSpacing: 2, color, paddingTop: 8, paddingBottom: 3, borderBottom: `1px solid ${color}33`, marginBottom: 2 }}>{label}</div>;
}

// Staff row component
function StaffRow({ teamId, taskId, date, color }) {
  const key = `${date}_${teamId}_${taskId}`;
  const day = new Date(date + "T12:00:00").getDay();
  const scheduled = STAFF.filter(name => DAY_SCHEDULE[name] && DAY_SCHEDULE[name].includes(day));
  
  const defaultKey = `default_${day}_${teamId}_${taskId}`;
  const [extras, setExtras] = useState(() => {
    try {
      const d = JSON.parse(localStorage.getItem(STAFF_KEY) || "{}");
      if (d[key] && d[key].extras !== undefined) return d[key].extras;
      const defaults = JSON.parse(localStorage.getItem(DAY_DEFAULTS_KEY) || "{}");
      return (defaults[defaultKey] && defaults[defaultKey].extras) || [];
    } catch { return []; }
  });
  const [hidden, setHidden] = useState(() => {
    try {
      const d = JSON.parse(localStorage.getItem(STAFF_KEY) || "{}");
      if (d[key] && d[key].hidden !== undefined) return d[key].hidden;
      const defaults = JSON.parse(localStorage.getItem(DAY_DEFAULTS_KEY) || "{}");
      return (defaults[defaultKey] && defaults[defaultKey].hidden) || [];
    } catch { return []; }
  });
  const [done, setDone] = useState(() => {
    try { const d = JSON.parse(localStorage.getItem(STAFF_KEY) || "{}"); return (d[key] && d[key].done) || {}; } catch { return {}; }
  });
  const [saved, setSaved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");

  const persist = (newExtras, newDone, newHidden) => {
    try {
      const all = JSON.parse(localStorage.getItem(STAFF_KEY) || "{}");
      all[key] = { extras: newExtras, done: newDone, hidden: newHidden };
      localStorage.setItem(STAFF_KEY, JSON.stringify(all));
    } catch {}
  };

  const toggle = (name) => {
    const nd = { ...done, [name]: !done[name] };
    setDone(nd);
    persist(extras, nd, hidden);
  };

  const add = () => {
    if (!newName.trim()) return;
    const ne = [...extras, newName.trim()];
    setExtras(ne);
    persist(ne, done, hidden);
    setNewName("");
    setAdding(false);
  };

  const remove = (name, isExtra) => {
    const ne = isExtra ? extras.filter(e => e !== name) : extras;
    const nh = isExtra ? hidden : [...hidden, name];
    const nd = { ...done };
    delete nd[name];
    setExtras(ne);
    setHidden(nh);
    setDone(nd);
    persist(ne, nd, nh);
  };

  const all = [...scheduled.filter(n => !hidden.includes(n)).map(n => ({ name: n, isExtra: false })), ...extras.map(n => ({ name: n, isExtra: true }))];

  const saveAsDefault = () => {
    const defaults = loadDayDefaults();
    defaults[defaultKey] = { extras, hidden };
    saveDayDefaults(defaults);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ paddingLeft: 20, marginTop: 4, marginBottom: 4, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {all.map(({ name, isExtra }) => (
        <div key={name + isExtra} style={{ display: "flex", alignItems: "center", gap: 2, background: "#0f1f38", borderRadius: 6, padding: "3px 6px", border: `1px solid ${done[name] ? color + "66" : "#1a3050"}` }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${done[name] ? color : "#3a3a5a"}`, background: done[name] ? color : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => toggle(name)}>
            {done[name] && <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span style={{ fontFamily: "monospace", fontSize: 12, color: done[name] ? color : "#aaa", textDecoration: done[name] ? "line-through" : "none", cursor: "pointer", userSelect: "none" }} onClick={() => toggle(name)}>{name}</span>
          <button onClick={() => remove(name, isExtra)} style={{ background: "#ff4444", border: "none", color: "#fff", fontSize: 14, cursor: "pointer", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>X</button>
        </div>
      ))}
      {adding ? (
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") add(); if (e.key === "Escape") { setAdding(false); setNewName(""); } }} placeholder="Name..." style={{ background: "#0f1f38", border: `1px solid ${color}66`, borderRadius: 6, padding: "3px 8px", color: "#fff", fontFamily: "monospace", fontSize: 12, outline: "none", width: 80 }} />
          <button onClick={add} style={{ background: color, border: "none", borderRadius: 5, color: "#000", fontWeight: 700, fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>SAVE</button>
          <button onClick={() => { setAdding(false); setNewName(""); }} style={{ background: "transparent", border: "1px solid #1a3050", borderRadius: 5, color: "#555", fontSize: 11, padding: "4px 6px", cursor: "pointer" }}>✕</button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ background: "transparent", border: "1px dashed #1a3050", borderRadius: 6, color: "#555", fontFamily: "monospace", fontSize: 11, padding: "3px 8px", cursor: "pointer", letterSpacing: 1 }}>+ ADD</button>
      )}
      <button onClick={saveAsDefault} style={{ background: saved ? "#4ECDC422" : "transparent", border: `1px solid ${saved ? "#4ECDC4" : "#1a3050"}`, borderRadius: 6, color: saved ? "#4ECDC4" : "#444", fontFamily: "monospace", fontSize: 10, padding: "3px 8px", cursor: "pointer", letterSpacing: 1, whiteSpace: "nowrap" }}>{saved ? "✓ SAVED" : `SAVE AS ${DAY_NAMES[day].toUpperCase()} DEFAULT`}</button>
    </div>
  );
}

function TeamCard({ team, date, onToggle, onAddTask, onRename, onEditLabel, onDeleteTask, isMobile }) {
  const pct = getProgress(team.tasks, team.id);
  const complete = pct === 100;
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(team.name);
  const [collapsed, setCollapsed] = useState(true);
  const [editingLabel, setEditingLabel] = useState(null);
  const [labelVal, setLabelVal] = useState("");
  useEffect(() => setNameVal(team.name), [team.name]);
  const hasStaff = TASK_IDS_WITH_STAFF[team.id] !== undefined;
  const shimmerClass = team.name.includes("Vibe") ? "shimmer-orange" : team.name.includes("Tooth") ? "shimmer-pink" : team.name.includes("Sparkle") ? "shimmer-silver" : team.name.includes("Growth") ? "shimmer-gold" : team.name.includes("Chaos") ? "shimmer-magenta" : "";

  return (
    <div className={shimmerClass} style={{ width: isMobile ? "92vw" : 358, maxWidth: isMobile ? "92vw" : "none", flexShrink: 0, background: "#0a1628", border: `1.5px solid ${complete ? team.color : "#1a3050"}`, borderRadius: 16, padding: isMobile ? "18px 14px" : "20px 18px", boxShadow: complete ? `0 0 24px ${team.color}33` : "none", transition: "all 0.4s", minHeight: 202, overflow: "visible", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing
            ? <input autoFocus value={nameVal} onChange={e => setNameVal(e.target.value)} onBlur={() => { onRename(nameVal); setEditing(false); }} onKeyDown={e => e.key === "Enter" && (onRename(nameVal), setEditing(false))} style={{ background: "transparent", border: "none", borderBottom: `1px solid ${team.color}`, color: "#fff", fontFamily: "sans-serif", fontWeight: 700, fontSize: 22, width: "100%", outline: "none" }} />
            : <div onClick={() => setEditing(true)} style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: isMobile ? 24 : 31, color: team.nameColor || "#fff", cursor: "text", display: "flex", alignItems: "center", gap: 6 }}>
                {team.name === "Vibe Desk" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.85 }}><circle cx="12" cy="12" r="4" stroke="#FF6B35" strokeWidth="1.5"/><line x1="12" y1="2" x2="12" y2="5" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="22" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="12" x2="5" y2="12" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="19" y1="12" x2="22" y2="12" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="4.93" y1="4.93" x2="7.05" y2="7.05" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="16.95" y1="16.95" x2="19.07" y2="19.07" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="19.07" y1="4.93" x2="16.95" y2="7.05" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="7.05" y1="16.95" x2="4.93" y2="19.07" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                {team.name === "Tooth Ninjas" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.85 }}><path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" stroke="#FF69B4" strokeWidth="1.5" strokeLinejoin="round" fill="#FF69B422"/><path d="M12 6 L13.5 10.5 L18 12 L13.5 13.5 L12 18 L10.5 13.5 L6 12 L10.5 10.5 Z" fill="#FF69B4" opacity="0.4"/></svg>}
                {team.name === "Growth Gang" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.85 }}><path d="M12 2C12 2 7 7 7 13c0 2.76 2.24 5 5 5s5-2.24 5-5c0-6-5-11-5-11z" stroke="#FFD700" strokeWidth="1.5" strokeLinejoin="round" fill="#FFD70022"/><circle cx="12" cy="13" r="2" stroke="#FFD700" strokeWidth="1.5" fill="none"/><path d="M9 19l-2 3M15 19l2 3" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                {team.name === "Chaos Coordinators" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.85 }}><path d="M4 7 L20 7" stroke="#FF00FF" strokeWidth="1.5" strokeLinecap="round"/><path d="M16 3 L20 7 L16 11" stroke="#FF00FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M20 17 L4 17" stroke="#FF00FF" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 13 L4 17 L8 21" stroke="#FF00FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {["Tooth Ninjas", "✨ Sparkle Team", "Growth Gang", "Chaos Coordinators"].includes(team.name)
                  ? <div style={{ lineHeight: 0.88 }}>{team.name === "✨ Sparkle Team" ? <><div><span style={{ marginRight: 4, fontSize: 14 }}>✨</span>Sparkle</div><div style={{ paddingLeft: 20 }}>Team</div></> : team.name.split(" ").map((w, i) => <div key={i}>{w}</div>)}</div>
                  : team.name}
              </div>}
          {team.subtitle && <div style={{ fontSize: 14, color: "#bbb", fontFamily: "monospace", letterSpacing: 1, marginTop: 1 }}>{team.subtitle}</div>}
          <div style={{ fontSize: 14, color: team.color, fontFamily: "monospace", marginTop: 2, letterSpacing: 1 }}>{complete ? "✓ COMPLETE" : "IN PROGRESS"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <ProgressRing pct={pct} color={team.color} size={isMobile ? 50 : 72} />
          <div onClick={() => setCollapsed(c => !c)} style={{ cursor: "pointer", color: "#555", fontSize: 16, userSelect: "none", transition: "transform 0.3s", transform: collapsed ? "rotate(0deg)" : "rotate(180deg)" }}>▾</div>
        </div>
      </div>

      {!collapsed && (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
            {team.tasks.map(task => {
              if (task.header) return <SectionHeader key={task.id} label={task.label} color={team.color} />;
              if (task.sub) return null;
              if (task.hasFillIn) return (
                <div key={task.id}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "9px 10px", borderRadius: 8, background: task.done ? team.color + "18" : "#0f1f38", border: `1px solid ${task.done ? team.color + "44" : "#1a3050"}` }}>
                    <div onClick={() => onToggle(task.id)} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${task.done ? team.color : "#3a3a5a"}`, background: task.done ? team.color : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{task.done && <Checkmark />}</div>
                    {editingLabel === task.id ? (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                        <textarea autoFocus value={labelVal} onChange={e => setLabelVal(e.target.value)} onKeyDown={e => e.key === "Escape" && setEditingLabel(null)} rows={3} style={{ background: "#0f1f38", border: `1px solid ${team.color}66`, borderRadius: 6, color: "#fff", fontFamily: "monospace", fontSize: 14, outline: "none", padding: "8px", resize: "none", lineHeight: 1.5, width: "100%" }} />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { onEditLabel(task.id, labelVal); setEditingLabel(null); }} style={{ flex: 1, background: team.color, border: "none", borderRadius: 6, color: "#000", fontFamily: "monospace", fontWeight: 700, fontSize: 11, padding: "6px", cursor: "pointer" }}>SAVE</button>
                          <button onClick={() => setEditingLabel(null)} style={{ background: "transparent", border: "1px solid #1a3050", borderRadius: 6, color: "#555", fontFamily: "monospace", fontSize: 11, padding: "6px 10px", cursor: "pointer" }}>CANCEL</button>
                        </div>
                      </div>
                    ) : (
                      <span onDoubleClick={() => { setEditingLabel(task.id); setLabelVal(task.label); }} style={{ flex: 1, fontFamily: "monospace", fontSize: 14, color: "#fff", lineHeight: 1.5, whiteSpace: "normal", wordBreak: "break-word", cursor: "text" }} title="Double-click to edit">{task.label}</span>
                    )}
                    <button onClick={e => { e.stopPropagation(); onDeleteTask(task.id); }} style={{ background: "none", border: "none", color: "#3a3a5a", fontSize: 18, cursor: "pointer", padding: "0 2px", lineHeight: 1, fontWeight: 700, flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = "#ff4444"} onMouseLeave={e => e.currentTarget.style.color = "#3a3a5a"}>×</button>
                  </div>
                  <input placeholder="Enter value..." style={{ background: "transparent", border: "none", borderBottom: `1px solid ${team.color}66`, color: "#FFE600", fontFamily: "monospace", fontWeight: 600, fontSize: 12, width: "100%", outline: "none", padding: "4px 10px" }} />
                </div>
              );
              const taskHasStaff = hasStaff && TASK_IDS_WITH_STAFF[team.id].includes(task.id);
              return (
                <div key={task.id}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 10px", borderRadius: 8, background: task.done ? team.color + "18" : "#0f1f38", border: `1px solid ${task.done ? team.color + "44" : "#1a3050"}`, cursor: taskHasStaff ? "default" : "pointer", transition: "background 0.2s" }} onClick={() => { if (!taskHasStaff) onToggle(task.id); }}>
                    {!taskHasStaff && <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${task.done ? team.color : "#3a3a5a"}`, background: task.done ? team.color : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{task.done && <Checkmark />}</div>}
                    {editingLabel === task.id ? (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }} onClick={e => e.stopPropagation()}>
                        <textarea autoFocus value={labelVal} onChange={e => setLabelVal(e.target.value)} onKeyDown={e => e.key === "Escape" && setEditingLabel(null)} rows={3} style={{ background: "#0f1f38", border: `1px solid ${team.color}66`, borderRadius: 6, color: "#fff", fontFamily: "monospace", fontSize: 14, outline: "none", padding: "8px", resize: "none", lineHeight: 1.5, width: "100%" }} />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { onEditLabel(task.id, labelVal); setEditingLabel(null); }} style={{ flex: 1, background: team.color, border: "none", borderRadius: 6, color: "#000", fontFamily: "monospace", fontWeight: 700, fontSize: 11, padding: "6px", cursor: "pointer" }}>SAVE</button>
                          <button onClick={() => setEditingLabel(null)} style={{ background: "transparent", border: "1px solid #1a3050", borderRadius: 6, color: "#555", fontFamily: "monospace", fontSize: 11, padding: "6px 10px", cursor: "pointer" }}>CANCEL</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span onDoubleClick={e => { e.stopPropagation(); setEditingLabel(task.id); setLabelVal(task.label); }} style={{ flex: 1, fontFamily: "monospace", fontSize: 17, color: "#ffffff", lineHeight: 1.5, cursor: "text", whiteSpace: "pre-wrap", wordBreak: "break-word", minWidth: 0 }} title="Double-click to edit">{task.label}{task.done && task.doneBy && <span style={{ display: "block", fontSize: 11, color: team.color, marginTop: 2 }}>✓ {task.doneBy}</span>}</span>
                        <button onClick={e => { e.stopPropagation(); onDeleteTask(task.id); }} style={{ background: "none", border: "none", color: "#3a3a5a", fontSize: 18, cursor: "pointer", padding: "0 2px", lineHeight: 1, fontWeight: 700, flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = "#ff4444"} onMouseLeave={e => e.currentTarget.style.color = "#3a3a5a"}>×</button>
                      </>
                    )}
                  </div>
                  {taskHasStaff && (
                    <StaffRow teamId={team.id} taskId={task.id} date={date} color={team.color} />
                  )}
                </div>
              );
            })}
          </div>
          <div>
            {adding
              ? <div style={{ display: "flex", gap: 6 }}>
                  <input autoFocus value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newTask.trim()) { onAddTask(newTask.trim()); setNewTask(""); setAdding(false); } if (e.key === "Escape") { setAdding(false); setNewTask(""); } }} placeholder="Task name..." style={{ flex: 1, background: "#0f1f38", border: `1px solid ${team.color}66`, borderRadius: 6, padding: "6px 10px", color: "#fff", fontFamily: "monospace", fontSize: 11, outline: "none" }} />
                  <button onClick={() => { if (newTask.trim()) { onAddTask(newTask.trim()); setNewTask(""); setAdding(false); } }} style={{ background: team.color, border: "none", borderRadius: 6, color: "#000", fontWeight: 700, fontSize: 12, padding: "0 10px", cursor: "pointer" }}>+</button>
                </div>
              : <button onClick={() => setAdding(true)} style={{ width: "100%", background: "transparent", border: "1px dashed #1a3050", borderRadius: 8, padding: "7px", color: "#444", fontFamily: "monospace", fontSize: 10, cursor: "pointer", letterSpacing: 1 }} onMouseEnter={e => { e.target.style.borderColor = team.color; e.target.style.color = team.color; }} onMouseLeave={e => { e.target.style.borderColor = "#1a3050"; e.target.style.color = "#444"; }}>+ ADD TASK</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ team, onStatsChange, isMobile }) {
  const [stats, setStats] = useState(team.stats || []);
  const [collapsed, setCollapsed] = useState(true);
  useEffect(() => setStats(team.stats || []), [team]);
  const [addingTo, setAddingTo] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  const update = (id, val) => { const u = stats.map(s => s.id === id ? { ...s, value: val } : s); setStats(u); onStatsChange && onStatsChange(u); };
  const deleteStat = (id) => { const u = stats.filter(s => s.id !== id); setStats(u); onStatsChange && onStatsChange(u); };
  const addStat = (section) => {
    if (!newLabel.trim()) return;
    let baseId = section === "ref" ? 619 : section === "tm" ? 650 : 604;
    while (stats.find(s => s.id === baseId)) baseId++;
    const u = [...stats, { id: baseId, label: newLabel.trim(), value: "" }];
    setStats(u); onStatsChange && onStatsChange(u);
    setNewLabel(""); setAddingTo(null);
  };
  const top = stats.filter(s => [600, 6001, 601, 602, 603, 604, 605, 606, 607, 608, 609].includes(Number(s.id)));
  const ref = stats.filter(s => Number(s.id) >= 610 && Number(s.id) <= 649);
  const tm = stats.filter(s => Number(s.id) >= 650);
  const inp = (s, big) => <input value={s.value} onChange={e => update(s.id, e.target.value)} placeholder="—" style={{ background: "transparent", border: "none", borderBottom: `1px solid ${team.color}44`, color: team.nameColor || "#fff", fontFamily: big ? "sans-serif" : "monospace", fontWeight: 700, fontSize: big ? 22 : 14, width: "100%", outline: "none", padding: "2px 0" }} />;
  return (
    <div className="shimmer-orange" style={{ width: isMobile ? "92vw" : 358, maxWidth: isMobile ? "92vw" : "none", flexShrink: 0, background: "#0a1628", border: "1.5px solid #1a3050", borderRadius: 16, padding: isMobile ? "18px 14px" : "20px 18px", minHeight: 202, overflow: "visible", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: 31, color: team.nameColor || "#fff", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.85 }}><circle cx="12" cy="12" r="4" stroke="#FF6B35" strokeWidth="1.5"/><line x1="12" y1="2" x2="12" y2="5" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="22" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="12" x2="5" y2="12" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="19" y1="12" x2="22" y2="12" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="4.93" y1="4.93" x2="7.05" y2="7.05" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="16.95" y1="16.95" x2="19.07" y2="19.07" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="19.07" y1="4.93" x2="16.95" y2="7.05" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="7.05" y1="16.95" x2="4.93" y2="19.07" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/></svg>
          {team.name}
        </div>
        {team.subtitle && <div style={{ fontSize: 14, color: "#bbb", fontFamily: "monospace", letterSpacing: 1, marginTop: 1 }}>{team.subtitle}</div>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <div style={{ fontSize: 14, color: team.color, fontFamily: "monospace", letterSpacing: 1 }}>LIVE STATS</div>
          <div onClick={() => setCollapsed(c => !c)} style={{ cursor: "pointer", color: "#555", fontSize: 16, userSelect: "none", transition: "transform 0.3s", transform: collapsed ? "rotate(0deg)" : "rotate(180deg)" }}>▾</div>
        </div>
      </div>
      {!collapsed && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            {top.slice(0, 2).map(s => <div key={s.id} style={{ background: "#0f1f38", border: `1px solid ${team.color}33`, borderRadius: 8, padding: "10px" }}><div style={{ fontFamily: "monospace", fontSize: 8, color: "#555", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>{s.label}</div>{inp(s, true)}</div>)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {top.slice(2).map(s => <div key={s.id} style={{ background: "#0f1f38", border: "1px solid #1a3050", borderRadius: 8, padding: "7px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><div style={{ fontFamily: "monospace", fontSize: 9, color: "#555", textTransform: "uppercase", flex: 1 }}>{s.label}</div><input value={s.value} onChange={e => update(s.id, e.target.value)} placeholder="—" style={{ background: "transparent", border: "none", borderBottom: `1px solid ${team.color}44`, color: team.nameColor || "#fff", fontFamily: "monospace", fontWeight: 600, fontSize: 13, width: 60, outline: "none", padding: "1px 0", textAlign: "right" }} /></div>)}
          </div>
          <div style={{ borderTop: `1px solid ${team.color}33`, paddingTop: 10, marginBottom: 10 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: team.color, letterSpacing: 2, marginBottom: 8 }}>REFERRAL SOURCE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {ref.map(s => <div key={s.id} style={{ background: "#0f1f38", border: "1px solid #1a3050", borderRadius: 6, padding: "6px 8px", position: "relative" }}><div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ fontFamily: "monospace", fontSize: 8, color: "#444", marginBottom: 3, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</div><span onClick={() => deleteStat(s.id)} style={{ color: "#3a3a5a", fontSize: 11, cursor: "pointer", lineHeight: 1 }} onMouseEnter={e => e.target.style.color = "#ff4444"} onMouseLeave={e => e.target.style.color = "#3a3a5a"}>×</span></div>{inp(s, false)}</div>)}
            </div>
            {addingTo === "ref" ? (
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}><input autoFocus value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addStat("ref"); if (e.key === "Escape") setAddingTo(null); }} placeholder="Source name..." style={{ flex: 1, background: "#0f1f38", border: `1px solid ${team.color}66`, borderRadius: 6, padding: "4px 8px", color: "#fff", fontFamily: "monospace", fontSize: 11, outline: "none" }} /><button onClick={() => addStat("ref")} style={{ background: team.color, border: "none", borderRadius: 5, color: "#000", fontWeight: 700, fontSize: 11, padding: "0 8px", cursor: "pointer" }}>+</button></div>
            ) : <button onClick={() => setAddingTo("ref")} style={{ width: "100%", marginTop: 6, background: "transparent", border: "1px dashed #1a3050", borderRadius: 6, padding: "5px", color: "#444", fontFamily: "monospace", fontSize: 9, cursor: "pointer", letterSpacing: 1 }}>+ ADD SOURCE</button>}
          </div>
          <div style={{ borderTop: `1px solid ${team.color}33`, paddingTop: 10 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: team.color, letterSpacing: 2, marginBottom: 8 }}>TEAM MEMBER</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {tm.map(s => <div key={s.id} style={{ background: "#0f1f38", border: "1px solid #1a3050", borderRadius: 6, padding: "6px 8px" }}><div style={{ display: "flex", justifyContent: "space-between" }}><div style={{ fontFamily: "monospace", fontSize: 8, color: "#444", marginBottom: 3, textTransform: "uppercase" }}>{s.label}</div><span onClick={() => deleteStat(s.id)} style={{ color: "#3a3a5a", fontSize: 11, cursor: "pointer", lineHeight: 1 }} onMouseEnter={e => e.target.style.color = "#ff4444"} onMouseLeave={e => e.target.style.color = "#3a3a5a"}>×</span></div>{inp(s, false)}</div>)}
            </div>
            {addingTo === "tm" ? (
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}><input autoFocus value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addStat("tm"); if (e.key === "Escape") setAddingTo(null); }} placeholder="Member name..." style={{ flex: 1, background: "#0f1f38", border: `1px solid ${team.color}66`, borderRadius: 6, padding: "4px 8px", color: "#fff", fontFamily: "monospace", fontSize: 11, outline: "none" }} /><button onClick={() => addStat("tm")} style={{ background: team.color, border: "none", borderRadius: 5, color: "#000", fontWeight: 700, fontSize: 11, padding: "0 8px", cursor: "pointer" }}>+</button></div>
            ) : <button onClick={() => setAddingTo("tm")} style={{ width: "100%", marginTop: 6, background: "transparent", border: "1px dashed #1a3050", borderRadius: 6, padding: "5px", color: "#444", fontFamily: "monospace", fontSize: 9, cursor: "pointer", letterSpacing: 1 }}>+ ADD MEMBER</button>}
          </div>
        </div>
      )}
    </div>
  );
}

function RainMakersCard({ team, date, onToggle, onDeleteTask, onAddTask, onEditLabel, isMobile }) {
  const pct = getProgress(team.tasks, team.id);
  const complete = pct === 100;
  const [stats, setStats] = useState(team.stats || []);
  const [notes, setNotes] = useState({ 721: "", 722: "", 723: "" });
  const [amounts, setAmounts] = useState({ 717: "", 718: "" });
  const [collapsed, setCollapsed] = useState(true);
  const [editingLabel, setEditingLabel] = useState(null);
  const [labelVal, setLabelVal] = useState("");
  useEffect(() => setStats(team.stats || []), [team]);
  return (
    <div className="shimmer-cobalt" style={{ width: isMobile ? "92vw" : 358, maxWidth: isMobile ? "92vw" : "none", flexShrink: 0, background: "#0a1628", border: `1.5px solid ${complete ? team.color : "#1a3050"}`, borderRadius: 16, padding: isMobile ? "18px 14px" : "20px 18px", boxShadow: complete ? `0 0 24px ${team.color}44` : "none", transition: "all 0.4s", minHeight: 202, overflow: "visible", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
        <div>
          <div style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: isMobile ? 24 : 31, color: team.nameColor || "#fff", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="10" height="22" viewBox="0 0 10 22" fill="none" style={{ flexShrink: 0, opacity: 0.85 }}><path d="M5 0 C5 0 2 3.5 2 5.5 C2 7.1 3.35 8 5 8 C6.65 8 8 7.1 8 5.5 C8 3.5 5 0 5 0Z" fill="#4169E133" stroke="#4169E1" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5 7 C5 7 2 10.5 2 12.5 C2 14.1 3.35 15 5 15 C6.65 15 8 14.1 8 12.5 C8 10.5 5 7 5 7Z" fill="#4169E144" stroke="#4169E1" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5 14 C5 14 2 17.5 2 19.5 C2 21.1 3.35 22 5 22 C6.65 22 8 21.1 8 19.5 C8 17.5 5 14 5 14Z" fill="#89CFF055" stroke="#89CFF0" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            <div style={{ lineHeight: 0.88 }}><div>Rain</div><div>Makers</div></div>
          </div>
          {team.subtitle && <div style={{ fontSize: 14, color: "#bbb", fontFamily: "monospace", letterSpacing: 1, marginTop: 1 }}>{team.subtitle}</div>}
          <div style={{ fontSize: 14, color: team.color, fontFamily: "monospace", marginTop: 2, letterSpacing: 1 }}>{complete ? "✓ COMPLETE" : "IN PROGRESS"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <ProgressRing pct={pct} color={team.color} size={isMobile ? 50 : 72} />
          <div onClick={() => setCollapsed(c => !c)} style={{ cursor: "pointer", color: "#555", fontSize: 16, userSelect: "none", transition: "transform 0.3s", transform: collapsed ? "rotate(0deg)" : "rotate(180deg)" }}>▾</div>
        </div>
      </div>
      {!collapsed && (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {stats.map(s => <div key={s.id} style={{ background: "#0f1f38", border: `1px solid ${team.color}33`, borderRadius: 8, padding: "8px 10px" }}><div style={{ fontFamily: "monospace", fontSize: 8, color: "#555", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>{s.label}</div><input value={s.value} onChange={e => setStats(p => p.map(x => x.id === s.id ? { ...x, value: e.target.value } : x))} placeholder="$ —" style={{ background: "transparent", border: "none", borderBottom: `1px solid ${team.color}66`, color: team.nameColor || "#fff", fontFamily: "sans-serif", fontWeight: 700, fontSize: 18, width: "100%", outline: "none", padding: "2px 0" }} /></div>)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {team.tasks.map(task => {
              if (task.header) return <SectionHeader key={task.id} label={task.label} color={team.color} />;
              if (task.isNote) return <input key={task.id} value={notes[task.id] || ""} onChange={e => setNotes(p => ({ ...p, [task.id]: e.target.value }))} placeholder="Add a note..." style={{ background: "transparent", border: "none", borderBottom: "1px solid #1a3050", color: "#aaa", fontFamily: "monospace", fontSize: 13, width: "100%", outline: "none", padding: "6px 0" }} />;
              if (task.hasFillIn) return (
                <div key={task.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 8, background: task.done ? team.color + "18" : "#0f1f38", border: `1px solid ${task.done ? team.color + "44" : "#1a3050"}`, cursor: "pointer" }} onClick={() => onToggle(task.id)}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${task.done ? team.color : "#3a3a5a"}`, background: task.done ? team.color : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{task.done && <Checkmark />}</div>
                    <span style={{ fontFamily: "monospace", fontSize: 14, color: task.done ? team.color : "#ffffff", whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.5 }}>{task.label}</span>
                  </div>
                  <input value={amounts[task.id] || ""} onChange={e => setAmounts(p => ({ ...p, [task.id]: e.target.value }))} placeholder="$ amount" style={{ background: "transparent", border: "none", borderBottom: `1px solid ${team.color}44`, color: "#FFD700", fontFamily: "monospace", fontWeight: 600, fontSize: 13, width: "100%", outline: "none", padding: "4px 10px" }} />
                </div>
              );
              const rmHasStaff = TASK_IDS_WITH_STAFF[7] && TASK_IDS_WITH_STAFF[7].includes(task.id);
              return (
                <div key={task.id}>
                  <div onClick={() => { if (!rmHasStaff) onToggle(task.id); }} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 10px", borderRadius: 8, background: task.done ? team.color + "18" : "#0f1f38", border: `1px solid ${task.done ? team.color + "44" : "#1a3050"}`, cursor: rmHasStaff ? "default" : "pointer", transition: "background 0.2s" }}>
                    {!rmHasStaff && <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${task.done ? team.color : "#3a3a5a"}`, background: task.done ? team.color : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>{task.done && <Checkmark />}</div>}
                    {editingLabel === task.id ? (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }} onClick={e => e.stopPropagation()}>
                        <textarea autoFocus value={labelVal} onChange={e => setLabelVal(e.target.value)} onKeyDown={e => e.key === "Escape" && setEditingLabel(null)} rows={3} style={{ background: "#0f1f38", border: `1px solid ${team.color}66`, borderRadius: 6, color: "#fff", fontFamily: "monospace", fontSize: 14, outline: "none", padding: "8px", resize: "none", lineHeight: 1.5, width: "100%" }} />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { onEditLabel(task.id, labelVal); setEditingLabel(null); }} style={{ flex: 1, background: team.color, border: "none", borderRadius: 6, color: "#000", fontFamily: "monospace", fontWeight: 700, fontSize: 11, padding: "6px", cursor: "pointer" }}>SAVE</button>
                          <button onClick={() => setEditingLabel(null)} style={{ background: "transparent", border: "1px solid #1a3050", borderRadius: 6, color: "#555", fontFamily: "monospace", fontSize: 11, padding: "6px 10px", cursor: "pointer" }}>CANCEL</button>
                        </div>
                      </div>
                    ) : (
                      <span onDoubleClick={e => { e.stopPropagation(); setEditingLabel(task.id); setLabelVal(task.label); }} style={{ flex: 1, fontFamily: "monospace", fontSize: 14, color: "#ffffff", lineHeight: 1.5, whiteSpace: "normal", wordBreak: "break-word", cursor: "text" }} title="Double-click to edit">{task.label}{task.done && task.doneBy && <span style={{ display: "block", fontSize: 11, color: team.color, marginTop: 2 }}>✓ {task.doneBy}</span>}</span>
                    )}
                    <button onClick={e => { e.stopPropagation(); onDeleteTask(task.id); }} style={{ background: "none", border: "none", color: "#3a3a5a", fontSize: 18, cursor: "pointer", padding: "0 2px", lineHeight: 1, fontWeight: 700, flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.color = "#ff4444"} onMouseLeave={e => e.currentTarget.style.color = "#3a3a5a"}>×</button>
                  </div>
                  {rmHasStaff && (
                    <StaffRow teamId={7} taskId={task.id} date={date} color={team.color} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ team, onUpdate, isMobile }) {
  const [sections, setSections] = useState(team.sections || []);
  const [collapsed, setCollapsed] = useState(true);
  useEffect(() => setSections(team.sections || []), [team]);

  const updateCell = (sIdx, rIdx, cIdx, val) => {
    const ns = sections.map((s, si) => si !== sIdx ? s : {
      ...s, rows: s.rows.map((r, ri) => ri !== rIdx ? r : { ...r, cells: r.cells.map((c, ci) => ci === cIdx ? val : c) })
    });
    setSections(ns); onUpdate && onUpdate(ns);
  };

  const addRow = (sIdx) => {
    const ns = sections.map((s, si) => si !== sIdx ? s : {
      ...s, rows: [...s.rows, { id: "r" + Date.now(), cells: s.cols.map(() => "") }]
    });
    setSections(ns); onUpdate && onUpdate(ns);
  };

  const deleteRow = (sIdx, rIdx) => {
    const ns = sections.map((s, si) => si !== sIdx ? s : { ...s, rows: s.rows.filter((_, ri) => ri !== rIdx) });
    setSections(ns); onUpdate && onUpdate(ns);
  };

  return (
    <div className="shimmer-cobalt" style={{ width: isMobile ? "calc(100vw - 40px)" : (collapsed ? 358 : 560), maxWidth: isMobile ? "calc(100vw - 40px)" : "none", flexShrink: 0, background: "#0a1628", border: "1.5px solid #1a3050", borderRadius: 16, padding: "20px 18px", minHeight: 202, overflow: "hidden", transition: "width 0.3s ease" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
        <div>
          <div style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: isMobile ? 24 : 31, color: team.nameColor || "#fff", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="10" height="22" viewBox="0 0 10 22" fill="none" style={{ flexShrink: 0, opacity: 0.85 }}><path d="M5 0 C5 0 2 3.5 2 5.5 C2 7.1 3.35 8 5 8 C6.65 8 8 7.1 8 5.5 C8 3.5 5 0 5 0Z" fill="#4169E133" stroke="#4169E1" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5 7 C5 7 2 10.5 2 12.5 C2 14.1 3.35 15 5 15 C6.65 15 8 14.1 8 12.5 C8 10.5 5 7 5 7Z" fill="#4169E144" stroke="#4169E1" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5 14 C5 14 2 17.5 2 19.5 C2 21.1 3.35 22 5 22 C6.65 22 8 21.1 8 19.5 C8 17.5 5 14 5 14Z" fill="#89CFF055" stroke="#89CFF0" strokeWidth="1.2" strokeLinejoin="round"/></svg>
            <div style={{ lineHeight: 0.88 }}><div>Rain</div><div>Makers</div></div>
          </div>
          {team.subtitle && <div style={{ fontSize: 14, color: "#bbb", fontFamily: "monospace", letterSpacing: 1, marginTop: 1 }}>{team.subtitle}</div>}
          <div style={{ fontSize: 14, color: team.color, fontFamily: "monospace", marginTop: 2, letterSpacing: 1 }}>SCORECARD</div>
        </div>
        <div onClick={() => setCollapsed(c => !c)} style={{ cursor: "pointer", color: "#555", fontSize: 16, userSelect: "none", transition: "transform 0.3s", transform: collapsed ? "rotate(0deg)" : "rotate(180deg)" }}>▾</div>
      </div>
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sections.map((sec, sIdx) => (
            <div key={sec.id}>
              <div style={{ background: sec.color, borderRadius: 8, padding: "9px 14px", marginBottom: 10, textAlign: "center", fontFamily: "sans-serif", fontWeight: 700, fontSize: 17, color: "#fff", letterSpacing: 1 }}>{sec.title}</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: 14 }}>
                  <thead>
                    <tr>
                      {sec.cols.map((c, ci) => <th key={ci} style={{ color: "#999", fontWeight: 600, fontSize: 11, textAlign: ci === 0 ? "left" : "center", padding: "5px 6px", borderBottom: "1px solid #1a3050", whiteSpace: "nowrap" }}>{c}</th>)}
                      <th style={{ width: 18 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.rows.map((row, rIdx) => (
                      <tr key={row.id}>
                        {row.cells.map((cell, ci) => (
                          <td key={ci} style={{ padding: "2px 3px", borderBottom: "1px solid #0f1f38" }}>
                            <input value={cell} onChange={e => updateCell(sIdx, rIdx, ci, e.target.value)}
                              style={{ width: ci === 0 ? 80 : 60, background: "transparent", border: "none", color: ci === 0 ? "#fff" : (ci === 1 || ci === 2) ? "#FFD700" : "#89CFF0", fontFamily: "monospace", fontSize: 14, fontWeight: ci === 0 ? 600 : (ci === 1 ? 700 : 400), outline: "none", textAlign: ci === 0 ? "left" : "center", padding: "4px 3px" }} />
                          </td>
                        ))}
                        <td style={{ textAlign: "center" }}>
                          <span onClick={() => deleteRow(sIdx, rIdx)} style={{ color: "#3a3a5a", fontSize: 12, cursor: "pointer" }} onMouseEnter={e => e.target.style.color = "#ff4444"} onMouseLeave={e => e.target.style.color = "#3a3a5a"}>×</span>
                        </td>
                      </tr>
                    ))}
                    {(() => {
                      const num = (v) => { const n = parseFloat(String(v).replace(/[$,%]/g, "")); return isNaN(n) ? 0 : n; };
                      const isDollar = (v) => String(v).includes("$");
                      const isPct = (v) => String(v).includes("%");
                      const totals = sec.cols.map((col, ci) => {
                        if (ci === 0) return "Total/Avg.";
                        const vals = sec.rows.map(r => r.cells[ci]);
                        const nums = vals.map(num);
                        if (vals.some(isPct)) {
                          const avg = nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
                          return Math.round(avg) + "%";
                        }
                        const sum = nums.reduce((a, b) => a + b, 0);
                        if (vals.some(isDollar)) return "$" + sum.toLocaleString();
                        return String(sum);
                      });
                      return (
                        <tr>
                          {totals.map((t, ci) => (
                            <td key={ci} style={{ padding: "6px 3px", borderTop: `2px solid ${team.color}55`, fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: ci === 0 ? "#fff" : (ci === 1 || ci === 2) ? "#FFD700" : "#89CFF0", textAlign: ci === 0 ? "left" : "center" }}>{t}</td>
                          ))}
                          <td style={{ borderTop: `2px solid ${team.color}55` }}></td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
              <button onClick={() => addRow(sIdx)} style={{ width: "100%", marginTop: 6, background: "transparent", border: "1px dashed #1a3050", borderRadius: 6, padding: "5px", color: "#444", fontFamily: "monospace", fontSize: 9, cursor: "pointer", letterSpacing: 1 }}>+ ADD ROW</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SyncButton({ date }) {
  const [status, setStatus] = useState("idle");
  const [counts, setCounts] = useState(null);

  const doSync = (d) => {
    setStatus("loading");
    fetch("https://sheets.googleapis.com/v4/spreadsheets/1MvMoBEpwWFykWWjWv5T0yhcNgltCW8kX9HvkPSZvcyA/values/A:E?key=AIzaSyB2kwRqpvTFIUKOZQEU4xlF4N2YlDrFL9E")
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(json => {
        const rows = json.values || [];
        const [yr, mo, dy] = d.split("-");
        const dateStr = `${parseInt(mo)}/${parseInt(dy)}/${yr}`;
        const isYes = c => c && c.trim().toLowerCase() === "yes";
        const todayYes = rows.filter(r => r[3] && r[3].trim() === dateStr && isYes(r[4])).length;
        const monthYes = rows.filter(r => {
          if (!r[3] || !isYes(r[4])) return false;
          const p = r[3].trim().split("/");
          return p.length === 3 && parseInt(p[0]) === parseInt(mo) && p[2] === yr;
        }).length;
        setCounts({ todayYes, monthYes });
        setStatus("done");
      })
      .catch(e => { console.error(e); setStatus("error"); });

  };

  useEffect(() => { doSync(date); }, [date]);

  const bg = status === "done" ? "#4ECDC422" : status === "error" ? "#ff444422" : "transparent";
  const border = status === "done" ? "#4ECDC4" : status === "error" ? "#ff4444" : "#1a3050";
  const color = status === "done" ? "#4ECDC4" : status === "error" ? "#ff4444" : "#555";
  const label = status === "loading" ? "⟳ SYNCING..." : status === "done" && counts ? `✓ TODAY: ${counts.todayYes} | MONTH: ${counts.monthYes}` : status === "error" ? "⚠ CLICK TO RETRY" : "↺ SYNC SHEETS";

  return (
    <button onClick={() => doSync(date)} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, color, fontFamily: "monospace", fontSize: 10, padding: "6px 12px", cursor: "pointer", letterSpacing: 1, whiteSpace: "nowrap" }}>
      {label}
    </button>
  );
}

const TENSTAR_KEY = "anchorchain_tenstar_v1";
function loadTenStar() { try { const r = localStorage.getItem(TENSTAR_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveTenStar(d) { try { localStorage.setItem(TENSTAR_KEY, JSON.stringify(d)); } catch {} }

function TenStarExperience({ date }) {
  const [data, setData] = useState(() => loadTenStar() || {});
  const cards = data[date] || [{ id: 1, note: "" }, { id: 2, note: "" }];

  const updateCards = (newCards) => {
    const d = { ...data, [date]: newCards };
    setData(d); saveTenStar(d);
  };
  const updateNote = (id, note) => updateCards(cards.map(c => c.id === id ? { ...c, note } : c));
  const addCard = () => updateCards([...cards, { id: Date.now(), note: "" }]);
  const deleteCard = (id) => updateCards(cards.filter(c => c.id !== id));

  return (
    <div style={{ padding: "30px 40px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>⭐</span>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "#FFD700", fontFamily: "sans-serif", letterSpacing: -0.5 }}>10 Star Experience</h2>
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        {cards.map((card, i) => (
          <div key={card.id} style={{ display: "flex", alignItems: "center" }}>
            <div className="shimmer-gold" style={{ width: 300, background: "#0a1628", border: "1.5px solid #FFD70044", borderRadius: 16, padding: "18px", minHeight: 180 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 16 }}>⭐</span>
                  <span style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: 22, color: "#FFD700" }}>Patient</span>
                </div>
                <button onClick={() => deleteCard(card.id)} style={{ background: "none", border: "none", color: "#3a3a5a", fontSize: 18, cursor: "pointer", fontWeight: 700 }} onMouseEnter={e => e.currentTarget.style.color = "#ff4444"} onMouseLeave={e => e.currentTarget.style.color = "#3a3a5a"}>×</button>
              </div>
              <textarea value={card.note} onChange={e => updateNote(card.id, e.target.value)} placeholder="Notes about this patient's 10-star experience..."
                style={{ width: "100%", minHeight: 120, background: "#0f1f38", border: "1px solid #1a3050", borderRadius: 8, color: "#fff", fontFamily: "monospace", fontSize: 13, padding: "10px", resize: "vertical", outline: "none", lineHeight: 1.5 }} />
            </div>
            {i < cards.length - 1 && <div style={{ padding: "0 6px" }}><div style={{ width: 30, height: 2, background: "linear-gradient(90deg,#FFD700,#FF6B35)", borderRadius: 2 }} /></div>}
          </div>
        ))}
        <button onClick={addCard} style={{ alignSelf: "center", background: "transparent", border: "1px dashed #FFD70066", borderRadius: 12, padding: "16px 20px", color: "#FFD700", fontFamily: "monospace", fontSize: 11, cursor: "pointer", letterSpacing: 1, whiteSpace: "nowrap" }}>+ ADD PATIENT</button>
      </div>
    </div>
  );
}

const CULTURE_KEY = "anchorchain_culture_v1";
function loadCulture() { try { const r = localStorage.getItem(CULTURE_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function saveCulture(d) { try { localStorage.setItem(CULTURE_KEY, JSON.stringify(d)); } catch {} }

function OfficeCulture({ date }) {
  const [data, setData] = useState(() => loadCulture() || {});
  const cards = data[date] || [{ id: 1, name: "", note: "" }, { id: 2, name: "", note: "" }, { id: 3, name: "", note: "" }, { id: 4, name: "", note: "" }];

  const updateCards = (newCards) => {
    const d = { ...data, [date]: newCards };
    setData(d); saveCulture(d);
  };
  const updateCard = (id, field, val) => updateCards(cards.map(c => c.id === id ? { ...c, [field]: val } : c));
  const addCard = () => updateCards([...cards, { id: Date.now(), name: "", note: "" }]);
  const deleteCard = (id) => updateCards(cards.filter(c => c.id !== id));

  return (
    <div style={{ padding: "30px 40px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>🤝</span>
        <h2 style={{ fontSize: 24, fontWeight: 900, color: "#89CFF0", fontFamily: "sans-serif", letterSpacing: -0.5 }}>Office Culture</h2>
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        {cards.map((card, i) => (
          <div key={card.id} style={{ display: "flex", alignItems: "center" }}>
            <div className="shimmer-silver" style={{ width: 300, background: "#0a1628", border: "1.5px solid #89CFF044", borderRadius: 16, padding: "18px", minHeight: 200 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: 20, color: "#89CFF0" }}>Team Member</span>
                <button onClick={() => deleteCard(card.id)} style={{ background: "none", border: "none", color: "#3a3a5a", fontSize: 18, cursor: "pointer", fontWeight: 700 }} onMouseEnter={e => e.currentTarget.style.color = "#ff4444"} onMouseLeave={e => e.currentTarget.style.color = "#3a3a5a"}>×</button>
              </div>
              <input value={card.name} onChange={e => updateCard(card.id, "name", e.target.value)} placeholder="Name..."
                style={{ width: "100%", background: "#0f1f38", border: "1px solid #1a3050", borderRadius: 8, color: "#fff", fontFamily: "sans-serif", fontWeight: 700, fontSize: 16, padding: "8px 10px", outline: "none", marginBottom: 8 }} />
              <div style={{ fontFamily: "monospace", fontSize: 9, color: "#89CFF0", letterSpacing: 1, marginBottom: 4 }}>HOW THEY HELPED TODAY</div>
              <textarea value={card.note} onChange={e => updateCard(card.id, "note", e.target.value)} placeholder="What they did to help..."
                style={{ width: "100%", minHeight: 90, background: "#0f1f38", border: "1px solid #1a3050", borderRadius: 8, color: "#fff", fontFamily: "monospace", fontSize: 13, padding: "10px", resize: "vertical", outline: "none", lineHeight: 1.5 }} />
            </div>
            {i < cards.length - 1 && <div style={{ padding: "0 6px" }}><div style={{ width: 30, height: 2, background: "linear-gradient(90deg,#89CFF0,#4ECDC4)", borderRadius: 2 }} /></div>}
          </div>
        ))}
        <button onClick={addCard} style={{ alignSelf: "center", background: "transparent", border: "1px dashed #89CFF066", borderRadius: 12, padding: "16px 20px", color: "#89CFF0", fontFamily: "monospace", fontSize: 11, cursor: "pointer", letterSpacing: 1, whiteSpace: "nowrap" }}>+ ADD MEMBER</button>
      </div>
    </div>
  );
}

const WIN_KEY = "anchorchain_win_v1";
function WinOfTheDay({ date, userName }) {
  const [data, setData] = useState(() => { try { return JSON.parse(localStorage.getItem(WIN_KEY) || "{}"); } catch { return {}; } });
  const entry = data[date] || { wins: [], improves: [] };
  const wins = entry.wins || [];
  const improves = entry.improves || [];
  const save = (newEntry) => { const d = { ...data, [date]: newEntry }; setData(d); try { localStorage.setItem(WIN_KEY, JSON.stringify(d)); } catch {} };

  const EntryList = ({ items, field, accent, icon, title, placeholder }) => {
    const [text, setText] = useState("");
    const add = () => {
      if (!text.trim()) return;
      save({ ...entry, [field]: [...items, { id: Date.now(), name: userName || "Anonymous", text: text.trim() }] });
      setText("");
    };
    const remove = (id) => save({ ...entry, [field]: items.filter(i => i.id !== id) });
    return (
      <div style={{ flex: "1 1 320px", background: `linear-gradient(135deg, ${accent}22, #0a1628)`, border: `1.5px solid ${accent}55`, borderRadius: 14, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: accent, letterSpacing: 1 }}>{title}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {items.map(item => (
            <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#0f1f38", borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: "monospace", fontSize: 11, color: accent, fontWeight: 700 }}>{item.name}: </span>
                <span style={{ fontFamily: "sans-serif", fontSize: 14, color: "#fff" }}>{item.text}</span>
              </div>
              <span onClick={() => remove(item.id)} style={{ color: "#3a3a5a", fontSize: 14, cursor: "pointer" }} onMouseEnter={e => e.target.style.color = "#ff4444"} onMouseLeave={e => e.target.style.color = "#3a3a5a"}>×</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} placeholder={placeholder} style={{ flex: 1, background: "#0f1f38", border: `1px solid ${accent}33`, borderRadius: 6, color: "#fff", fontFamily: "sans-serif", fontSize: 14, padding: "6px 10px", outline: "none" }} />
          <button onClick={add} style={{ background: accent, border: "none", borderRadius: 6, color: "#000", fontWeight: 700, fontSize: 16, padding: "0 12px", cursor: "pointer" }}>+</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: "0 40px 0", display: "flex", gap: 16, flexWrap: "wrap" }}>
      <EntryList items={wins} field="wins" accent="#FFD700" icon="🏆" title="WINS OF THE DAY" placeholder="Share a win... 🎉" />
      <EntryList items={improves} field="improves" accent="#4ECDC4" icon="💡" title="WHAT CAN WE IMPROVE?" placeholder="Suggest an improvement..." />
    </div>
  );
}

function CEODashboard({ yesterdayPct, streak, date }) {
  const [metrics, setMetrics] = useState(() => loadDashboard() || {
    production: { value: "", goal: "" },
    scheduled: { value: "", goal: "" },
    newPatients: { value: "", goal: "" },
  });
  const [editing, setEditing] = useState(null);
  const [npSync, setNpSync] = useState("idle"); // idle, loading, done, error
  const [npCount, setNpCount] = useState(null);

  const syncNewPatients = () => {
    setNpSync("loading");
    fetch("https://sheets.googleapis.com/v4/spreadsheets/1MvMoBEpwWFykWWjWv5T0yhcNgltCW8kX9HvkPSZvcyA/values/A:E?key=AIzaSyB2kwRqpvTFIUKOZQEU4xlF4N2YlDrFL9E")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(json => {
        const rows = json.values || [];
        const [yr, mo, dy] = date.split("-");
        const dateStr = `${parseInt(mo)}/${parseInt(dy)}/${yr}`;
        const isYes = c => c && c.trim().toLowerCase() === "yes";
        const todayYes = rows.filter(r => r[3] && r[3].trim() === dateStr && isYes(r[4])).length;
        setNpCount(todayYes);
        setNpSync("done");
        // Auto-fill the New Patients card value
        setMetrics(prev => {
          const m = { ...prev, newPatients: { ...prev.newPatients, value: String(todayYes) } };
          saveDashboard(m);
          return m;
        });
      })
      .catch(() => setNpSync("error"));
  };

  useEffect(() => { syncNewPatients(); }, [date]);

  const update = (key, field, val) => {
    const m = { ...metrics, [key]: { ...metrics[key], [field]: val } };
    setMetrics(m); saveDashboard(m);
  };

  const num = v => { const n = parseFloat(String(v).replace(/[$,%]/g, "")); return isNaN(n) ? 0 : n; };
  const pctOf = (v, g) => { const gg = num(g); return gg ? Math.min(100, Math.round((num(v) / gg) * 100)) : 0; };

  const cards = [
    { key: "production", icon: "💰", label: "MONTHLY PRODUCTION", color: "#FFD700", prefix: "$" },
    { key: "scheduled", icon: "📅", label: "SCHEDULED TODAY", color: "#4ECDC4", prefix: "" },
    { key: "newPatients", icon: "✨", label: "NEW PATIENTS", color: "#FF69B4", prefix: "", sheetSync: true },
  ];

  return (
    <div style={{ padding: "20px 40px 0", display: "flex", gap: 16, flexWrap: "wrap" }}>
      {cards.map(c => {
        const m = metrics[c.key];
        const p = pctOf(m.value, m.goal);
        const hit = p >= 100;
        return (
          <div key={c.key} style={{ flex: "1 1 200px", minWidth: 200, background: hit ? "linear-gradient(135deg, #4ECDC422, #0a1628)" : "#0a1628", border: `1.5px solid ${hit ? "#4ECDC4" : c.color + "44"}`, borderRadius: 14, padding: "16px 18px", boxShadow: hit ? "0 0 20px #4ECDC433" : `0 0 16px ${c.color}11` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>{hit ? "✅" : c.icon}</span>
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "#888", letterSpacing: 1 }}>{c.label}</span>
              {c.sheetSync && (
                <span onClick={syncNewPatients} title="Sync from Google Sheets" style={{ marginLeft: "auto", fontFamily: "monospace", fontSize: 9, cursor: "pointer", color: npSync === "done" ? "#4ECDC4" : npSync === "error" ? "#ff6666" : npSync === "loading" ? "#FFD700" : "#555" }}>
                  {npSync === "loading" ? "⟳" : npSync === "done" ? `📊 ${npCount}` : npSync === "error" ? "↺ retry" : "📊"}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
              <span style={{ color: c.color, fontSize: 13, fontWeight: 700 }}>{c.prefix}</span>
              <input value={m.value} onChange={e => update(c.key, "value", e.target.value)} placeholder="0"
                style={{ background: "transparent", border: "none", borderBottom: `1px solid ${c.color}33`, color: "#fff", fontFamily: "sans-serif", fontWeight: 800, fontSize: 30, width: 90, outline: "none" }} />
              <span style={{ color: "#555", fontFamily: "monospace", fontSize: 11 }}>/</span>
              <input value={m.goal} onChange={e => update(c.key, "goal", e.target.value)} placeholder="goal"
                style={{ background: "transparent", border: "none", borderBottom: `1px solid #1a3050`, color: "#888", fontFamily: "monospace", fontSize: 13, width: 60, outline: "none" }} />
            </div>
            <div style={{ width: "100%", height: 6, background: "#0f1f38", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${p}%`, background: c.color, borderRadius: 3, transition: "width 0.5s" }} />
            </div>
            <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, color: hit ? "#4ECDC4" : c.color, marginTop: 4, textAlign: "right" }}>{hit ? "GOAL HIT! 🎉" : p + "% of goal"}</div>
          </div>
        );
      })}
      <div style={{ flex: "1 1 200px", minWidth: 200, background: "#0a1628", border: "1.5px solid #4ECDC444", borderRadius: 14, padding: "16px 18px", boxShadow: "0 0 16px #4ECDC411" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>⚓</span>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "#888", letterSpacing: 1 }}>YESTERDAY'S ANCHORCHAIN</span>
        </div>
        <div style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: 36, color: yesterdayPct === 100 ? "#4ECDC4" : "#fff", marginBottom: 8 }}>{yesterdayPct}<span style={{ fontSize: 18, color: "#555" }}>%</span></div>
        <div style={{ width: "100%", height: 6, background: "#0f1f38", borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${yesterdayPct}%`, background: "linear-gradient(90deg,#FF6B35,#4ECDC4)", borderRadius: 3, transition: "width 0.5s" }} />
        </div>
        <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 600, color: "#4ECDC4", marginTop: 4, textAlign: "right" }}>completed</div>
      </div>
    </div>
  );
}

function CalendarModal({ onClose, onSelectDate, selectedDate, allData }) {
  const today = new Date();
  const [yr, setYr] = useState(today.getFullYear());
  const [mo, setMo] = useState(today.getMonth());
  const monthName = new Date(yr, mo, 1).toLocaleString("default", { month: "long" });
  const firstDay = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const prevMo = () => mo === 0 ? (setMo(11), setYr(y => y - 1)) : setMo(m => m - 1);
  const nextMo = () => mo === 11 ? (setMo(0), setYr(y => y + 1)) : setMo(m => m + 1);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#0a1628", border: "1.5px solid #1a3050", borderRadius: 20, padding: 28, width: 340 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <button onClick={prevMo} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>‹</button>
          <div style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>{monthName} {yr}</div>
          <button onClick={nextMo} style={{ background: "none", border: "none", color: "#555", fontSize: 20, cursor: "pointer" }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d} style={{ textAlign: "center", fontFamily: "monospace", fontSize: 9, color: "#444", letterSpacing: 1 }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} />;
            const ds = `${yr}-${String(mo+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const isToday = ds === todayStr(), isSel = ds === selectedDate;
            const pct = allData[ds] ? getDayPct(allData[ds]) : null;
            const dot = pct === 100 ? "#4ECDC4" : pct > 0 ? "#FF6B35" : "#333";
            return (
              <div key={i} onClick={() => { onSelectDate(ds); onClose(); }} style={{ textAlign: "center", padding: "6px 2px", borderRadius: 8, cursor: "pointer", background: isSel ? "#4ECDC4" : isToday ? "#0f1f38" : "transparent", border: isToday && !isSel ? "1px solid #1a3050" : "1px solid transparent" }}>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: isSel ? "#000" : "#fff", fontWeight: isToday ? 700 : 400 }}>{day}</div>
                {pct !== null ? <div style={{ width: 4, height: 4, borderRadius: "50%", background: dot, margin: "2px auto 0" }} /> : <div style={{ height: 6 }} />}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #0f1f38", display: "flex", gap: 12, justifyContent: "center" }}>
          {[["#4ECDC4","100%"],["#FF6B35","In progress"],["#333","No data"]].map(([c,l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: c }} />
              <span style={{ fontFamily: "monospace", fontSize: 9, color: "#555" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => {
    try { return localStorage.getItem("anchorchain_authed") === "yes"; } catch { return false; }
  });
  const [userName, setUserName] = useState(() => {
    try { return localStorage.getItem("anchorchain_username") || ""; } catch { return ""; }
  });
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [allData, setAllData] = useState(() => loadAllData());
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [showCal, setShowCal] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [nextId, setNextId] = useState(900000);
  const scrollRef = useRef(null);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Load shared board from cloud on startup (once authed)
  useEffect(() => {
    if (!authed || !userName) return;
    cloudLoad().then(ok => {
      if (ok) setAllData(loadAllData());
      setCloudLoaded(true);
    });
  }, [authed, userName]);

  const tryLogin = () => {
    if (pwInput === TEAM_PASSWORD) {
      try { localStorage.setItem("anchorchain_authed", "yes"); } catch {}
      setAuthed(true); setPwError(false);
    } else { setPwError(true); }
  };

  const setName = () => {
    if (!nameInput.trim()) return;
    try { localStorage.setItem("anchorchain_username", nameInput.trim()); } catch {}
    setUserName(nameInput.trim());
  };

  const logout = () => {
    try { localStorage.removeItem("anchorchain_authed"); localStorage.removeItem("anchorchain_username"); } catch {}
    setAuthed(false); setUserName(""); setPwInput(""); setNameInput("");
  };

  const LoginShell = ({ children }) => (
    <div style={{ minHeight: "100vh", background: "#050d1a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", padding: 20 }}>
      <div style={{ background: "#0a1628", border: "1.5px solid #1a3050", borderRadius: 20, padding: "40px 32px", width: "100%", maxWidth: 360, textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#89CFF0", letterSpacing: -1 }}>Anchorchain</h1>
          <svg width="98" height="18" viewBox="0 0 272 52" fill="none">
            <defs><linearGradient id="lg" x1="0" y1="0" x2="272" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#4a9fd4"/><stop offset="100%" stopColor="#89CFF0"/></linearGradient></defs>
            <rect x="2" y="6" width="60" height="40" rx="8" fill="#050d1a" stroke="url(#lg)" strokeWidth="5"/><rect x="13" y="18" width="38" height="16" rx="4" fill="#050d1a"/>
            <rect x="72" y="6" width="60" height="40" rx="8" fill="#050d1a" stroke="url(#lg)" strokeWidth="5"/><rect x="83" y="18" width="38" height="16" rx="4" fill="#050d1a"/>
            <rect x="142" y="6" width="60" height="40" rx="8" fill="#050d1a" stroke="url(#lg)" strokeWidth="5"/><rect x="153" y="18" width="38" height="16" rx="4" fill="#050d1a"/>
            <rect x="212" y="6" width="58" height="40" rx="8" fill="#050d1a" stroke="url(#lg)" strokeWidth="5"/><rect x="223" y="18" width="36" height="16" rx="4" fill="#050d1a"/>
            <rect x="62" y="22" width="10" height="8" rx="2" fill="url(#lg)"/><rect x="132" y="22" width="10" height="8" rx="2" fill="url(#lg)"/><rect x="202" y="22" width="10" height="8" rx="2" fill="url(#lg)"/>
          </svg>
        </div>
        {children}
      </div>
    </div>
  );

  if (!authed) {
    return (
      <LoginShell>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#888", letterSpacing: 1, marginBottom: 16 }}>ENTER TEAM PASSWORD</div>
        <input type="password" autoFocus value={pwInput} onChange={e => { setPwInput(e.target.value); setPwError(false); }} onKeyDown={e => e.key === "Enter" && tryLogin()} placeholder="Password"
          style={{ width: "100%", background: "#0f1f38", border: `1.5px solid ${pwError ? "#ff4444" : "#1a3050"}`, borderRadius: 10, padding: "12px 14px", color: "#fff", fontFamily: "monospace", fontSize: 15, outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
        {pwError && <div style={{ color: "#ff4444", fontFamily: "monospace", fontSize: 11, marginBottom: 12 }}>Incorrect password</div>}
        <button onClick={tryLogin} style={{ width: "100%", background: "#4ECDC4", border: "none", borderRadius: 10, padding: "12px", color: "#000", fontFamily: "sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Enter</button>
      </LoginShell>
    );
  }

  if (!userName) {
    return (
      <LoginShell>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: "#888", letterSpacing: 1, marginBottom: 16 }}>WHAT'S YOUR NAME?</div>
        <input autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)} onKeyDown={e => e.key === "Enter" && setName()} placeholder="Your name"
          style={{ width: "100%", background: "#0f1f38", border: "1.5px solid #1a3050", borderRadius: 10, padding: "12px 14px", color: "#fff", fontFamily: "sans-serif", fontSize: 15, outline: "none", marginBottom: 12, boxSizing: "border-box" }} />
        <button onClick={setName} style={{ width: "100%", background: "#89CFF0", border: "none", borderRadius: 10, padding: "12px", color: "#000", fontFamily: "sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Continue</button>
      </LoginShell>
    );
  }


  const savedTeams = allData[selectedDate];
  const teams = (() => {
    if (!savedTeams) return deepClone();
    // Merge in any new steps from TEMPLATE_TEAMS that aren't in saved data
    const savedIds = savedTeams.map(t => t.id);
    const missing = TEMPLATE_TEAMS.filter(t => !savedIds.includes(t.id)).map(t => JSON.parse(JSON.stringify(t)));
    if (missing.length === 0) return savedTeams;
    // Insert missing steps in correct template order
    const merged = [...savedTeams, ...missing];
    return merged.sort((a, b) => {
      const ia = TEMPLATE_TEAMS.findIndex(t => t.id === a.id);
      const ib = TEMPLATE_TEAMS.findIndex(t => t.id === b.id);
      return ia - ib;
    });
  })();
  const save = (t) => { const u = { ...allData, [selectedDate]: t }; setAllData(u); saveAllData(u); };
  const toggleTask = (tid, kid) => save(teams.map(t => t.id === tid ? { ...t, tasks: t.tasks.map(tk => tk.id === kid ? { ...tk, done: !tk.done, doneBy: !tk.done ? userName : null } : tk) } : t));
  const deleteTask = (tid, kid) => {
    const updatedTeams = teams.map(t => t.id === tid ? { ...t, tasks: t.tasks.filter(tk => tk.id !== kid) } : t);
    save(updatedTeams);
    const tmpl = deepClone();
    const updatedTmpl = tmpl.map(t => t.id === tid ? { ...t, tasks: t.tasks.filter(tk => tk.id !== kid) } : t);
    try { localStorage.setItem("anchorchain_template_v1", JSON.stringify(updatedTmpl)); } catch {}
  };

  const addTask = (tid, label) => {
    const newTask = { id: nextId, label, done: false };
    const updatedTeams = teams.map(t => t.id === tid ? { ...t, tasks: [...t.tasks, newTask] } : t);
    save(updatedTeams);
    // Also save to template so it appears every future day
    const tmpl = deepClone();
    const updatedTmpl = tmpl.map(t => t.id === tid ? { ...t, tasks: [...t.tasks, { ...newTask, done: false }] } : t);
    try { localStorage.setItem("anchorchain_template_v1", JSON.stringify(updatedTmpl)); } catch {}
    setNextId(n => n + 1);
  };
  const renameTeam = (tid, name) => save(teams.map(t => t.id === tid ? { ...t, name } : t));
  const updateStats = (tid, stats) => save(teams.map(t => t.id === tid ? { ...t, stats } : t));
  const updateTaskLabel = (teamId, taskId, newLabel) => {
    save(teams.map(t => t.id === teamId ? { ...t, tasks: t.tasks.map(tk => tk.id === taskId ? { ...tk, label: newLabel } : tk) } : t));
    const tmpl = deepClone();
    const updatedTmpl = tmpl.map(t => t.id === teamId ? { ...t, tasks: t.tasks.map(tk => tk.id === taskId ? { ...tk, label: newLabel } : tk) } : t);
    try { localStorage.setItem("anchorchain_template_v1", JSON.stringify(updatedTmpl)); } catch {}
  };

  const pct = getDayPct(teams);
  const yesterdayPct = (() => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() - 1);
    const ys = d.toISOString().slice(0, 10);
    return allData[ys] ? getDayPct(allData[ys]) : 0;
  })();
  const streak = (() => {
    let count = 0;
    const d = new Date(selectedDate + "T12:00:00");
    // Count back from yesterday for consecutive 100% days
    for (let i = 1; i <= 365; i++) {
      const check = new Date(d);
      check.setDate(check.getDate() - i);
      const cs = check.toISOString().slice(0, 10);
      if (allData[cs] && getDayPct(allData[cs]) === 100) count++;
      else break;
    }
    return count;
  })();
  const isToday = selectedDate === todayStr();
  const displayDate = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const scrollBy = (dir) => scrollRef.current && scrollRef.current.scrollBy({ left: dir * 420, behavior: "smooth" });

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050d1a; }
        @keyframes shimmer-orange { 0%,100% { border-color: #FF4500; box-shadow: 0 0 8px #FF450044; } 50% { border-color: #FF6B35; box-shadow: 0 0 18px #FF6B3588; } }
        @keyframes shimmer-pink { 0%,100% { border-color: #FF69B4; box-shadow: 0 0 8px #FF69B444; } 50% { border-color: #ffb3d9; box-shadow: 0 0 18px #ffb3d988; } }
        @keyframes shimmer-silver { 0%,100% { border-color: #C0C0FF; box-shadow: 0 0 8px #C0C0FF44; } 50% { border-color: #ffffff; box-shadow: 0 0 18px #ffffffaa; } }
        @keyframes shimmer-gold { 0%,100% { border-color: #FFD700; box-shadow: 0 0 8px #FFD70044; } 50% { border-color: #fff0a0; box-shadow: 0 0 18px #fff0a088; } }
        @keyframes shimmer-magenta { 0%,100% { border-color: #FF00FF; box-shadow: 0 0 8px #FF00FF44; } 50% { border-color: #ff99ff; box-shadow: 0 0 18px #ff99ff88; } }
        @keyframes shimmer-cobalt { 0%,100% { border-color: #4169E1; box-shadow: 0 0 8px #4169E144; } 50% { border-color: #89CFF0; box-shadow: 0 0 18px #89CFF088; } }
        .shimmer-orange { animation: shimmer-orange 8s ease-in-out infinite; }
        .shimmer-pink { animation: shimmer-pink 8s ease-in-out infinite; }
        .shimmer-silver { animation: shimmer-silver 8s ease-in-out infinite; }
        .shimmer-gold { animation: shimmer-gold 8s ease-in-out infinite; }
        .shimmer-magenta { animation: shimmer-magenta 8s ease-in-out infinite; }
        .shimmer-cobalt { animation: shimmer-cobalt 8s ease-in-out infinite; }
        ::-webkit-scrollbar { height: 28px; width: 8px; }
        ::-webkit-scrollbar-track { background: #0a1628; }
        ::-webkit-scrollbar-thumb { background: #4169E1; border-radius: 8px; border: 3px solid #050d1a; }
      `}</style>

      {showCal && <CalendarModal onClose={() => setShowCal(false)} onSelectDate={setSelectedDate} selectedDate={selectedDate} allData={allData} />}

      <div style={{ minHeight: "100vh", background: "#050d1a", color: "#fff", fontFamily: "sans-serif", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "32px 40px 24px", borderBottom: "1px solid #0f1f38" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#4ECDC4", fontFamily: "monospace", marginBottom: 6, display: "flex", alignItems: "center", gap: 10 }}>
                DAILY OPS / TASK TRACKER
                <span style={{ color: "#555" }}>•</span>
                <span style={{ color: "#89CFF0" }}>👤 {userName}</span>
                <span onClick={logout} style={{ color: "#555", cursor: "pointer", textDecoration: "underline" }}>logout</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, lineHeight: 1, color: "#89CFF0" }}>Anchorchain</h1>
                <svg width="98" height="18" viewBox="0 0 272 52" fill="none">
                  <defs><linearGradient id="cg" x1="0" y1="0" x2="272" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#4a9fd4"/><stop offset="100%" stopColor="#89CFF0"/></linearGradient></defs>
                  <rect x="2" y="6" width="60" height="40" rx="8" fill="#050d1a" stroke="url(#cg)" strokeWidth="5"/><rect x="13" y="18" width="38" height="16" rx="4" fill="#050d1a"/>
                  <rect x="72" y="6" width="60" height="40" rx="8" fill="#050d1a" stroke="url(#cg)" strokeWidth="5"/><rect x="83" y="18" width="38" height="16" rx="4" fill="#050d1a"/>
                  <rect x="142" y="6" width="60" height="40" rx="8" fill="#050d1a" stroke="url(#cg)" strokeWidth="5"/><rect x="153" y="18" width="38" height="16" rx="4" fill="#050d1a"/>
                  <rect x="212" y="6" width="58" height="40" rx="8" fill="#050d1a" stroke="url(#cg)" strokeWidth="5"/><rect x="223" y="18" width="36" height="16" rx="4" fill="#050d1a"/>
                  <rect x="62" y="22" width="10" height="8" rx="2" fill="url(#cg)"/><rect x="132" y="22" width="10" height="8" rx="2" fill="url(#cg)"/><rect x="202" y="22" width="10" height="8" rx="2" fill="url(#cg)"/>
                </svg>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                <button onClick={() => setShowCal(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#0a1628", border: "1px solid #1a3050", borderRadius: 8, padding: "6px 12px", color: "#fff", fontFamily: "monospace", fontSize: 11, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#4ECDC4"} onMouseLeave={e => e.currentTarget.style.borderColor = "#1a3050"}>📅 {displayDate}</button>
                {!isToday && <button onClick={() => setSelectedDate(todayStr())} style={{ background: "#4ECDC422", border: "1px solid #4ECDC4", borderRadius: 8, padding: "6px 10px", color: "#4ECDC4", fontFamily: "monospace", fontSize: 10, cursor: "pointer" }}>→ TODAY</button>}
                
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#555", letterSpacing: 1 }}>OVERALL</div>
                <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 600, color: pct === 100 ? "#4ECDC4" : "#fff" }}>{pct}<span style={{ fontSize: 14, color: "#555" }}>%</span></div>
              </div>
              <div style={{ width: 120, height: 6, background: "#0f1f38", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#FF6B35,#4ECDC4)", borderRadius: 3, transition: "width 0.5s" }} />
              </div>
              <button onClick={() => { try { localStorage.removeItem("anchorchain_template_v1"); } catch {} save(JSON.parse(JSON.stringify(TEMPLATE_TEAMS))); }} style={{ background: "transparent", border: "1px solid #1a3050", borderRadius: 8, color: "#555", fontFamily: "monospace", fontSize: 10, padding: "6px 12px", cursor: "pointer", letterSpacing: 1 }} onMouseEnter={e => { e.target.style.borderColor = "#FF6B35"; e.target.style.color = "#FF6B35"; }} onMouseLeave={e => { e.target.style.borderColor = "#1a3050"; e.target.style.color = "#555"; }}>RESET</button>
              <button onClick={() => setZoomed(z => !z)} style={{ background: zoomed ? "#89CFF022" : "transparent", border: `1px solid ${zoomed ? "#89CFF0" : "#1a3050"}`, borderRadius: 8, color: zoomed ? "#89CFF0" : "#555", fontFamily: "monospace", fontSize: 10, padding: "6px 12px", cursor: "pointer", letterSpacing: 1 }}>{zoomed ? "⊕ NORMAL" : "⊖ ZOOM OUT"}</button>
            </div>
          </div>
        </div>

        <CEODashboard yesterdayPct={yesterdayPct} streak={streak} date={selectedDate} />
        <WinOfTheDay date={selectedDate} userName={userName} />

        <div style={{ position: "relative", flex: 1 }}>
          {!isMobile && <div onClick={() => scrollBy(-1)} style={{ position: "fixed", left: 12, top: "50%", transform: "translateY(-50%)", zIndex: 50, cursor: "pointer", background: "#0a1628cc", border: "1.5px solid #1a3050", borderRadius: 12, width: 44, height: 72, display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#89CFF0"} onMouseLeave={e => e.currentTarget.style.borderColor = "#1a3050"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 18L9 12L15 6" stroke="#89CFF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>}
          {!isMobile && <div onClick={() => scrollBy(1)} style={{ position: "fixed", right: 12, top: "50%", transform: "translateY(-50%)", zIndex: 50, cursor: "pointer", background: "#0a1628cc", border: "1.5px solid #1a3050", borderRadius: 12, width: 44, height: 72, display: "flex", alignItems: "center", justifyContent: "center" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#89CFF0"} onMouseLeave={e => e.currentTarget.style.borderColor = "#1a3050"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 6L15 12L9 18" stroke="#89CFF0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>}
          <div ref={scrollRef} style={{ padding: isMobile ? "30px 16px 40px" : "50px 60px 80px", overflowX: isMobile ? "visible" : "auto", overflowY: "visible" }}>
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "center" : "flex-start", minWidth: isMobile ? "auto" : "max-content", gap: isMobile ? 24 : 0, transform: (!isMobile && zoomed) ? `scale(${Math.min(0.99, (window.innerWidth - 120) / (teams.length * 400))})` : "scale(1)", transformOrigin: "top left", transition: "transform 0.4s ease" }}>
              {teams.map((team, i) => (
                <div key={team.id} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", width: isMobile ? "100%" : "auto" }}>
                  <div style={{ position: "relative", width: isMobile ? "100%" : "auto" }}>
                    <div style={{ position: "absolute", top: -32, left: 0, fontFamily: "monospace", fontSize: 16, color: "#555", letterSpacing: 2 }}>STEP {String(i + 1).padStart(2, "0")}</div>
                    {team.isStatCard
                      ? <StatCard team={team} isMobile={isMobile} onStatsChange={s => updateStats(team.id, s)} />
                      : team.isScoreCard
                        ? <ScoreCard team={team} isMobile={isMobile} onUpdate={s => save(teams.map(t => t.id === team.id ? { ...t, sections: s } : t))} />
                      : team.isRainMakers
                        ? <RainMakersCard team={team} date={selectedDate} isMobile={isMobile} onToggle={kid => toggleTask(team.id, kid)} onDeleteTask={kid => deleteTask(team.id, kid)} onAddTask={l => addTask(team.id, l)} onEditLabel={(kid, nl) => updateTaskLabel(team.id, kid, nl)} />
                        : <TeamCard team={team} date={selectedDate} isMobile={isMobile} onToggle={kid => toggleTask(team.id, kid)} onAddTask={l => addTask(team.id, l)} onRename={n => renameTeam(team.id, n)} onEditLabel={(kid, nl) => updateTaskLabel(team.id, kid, nl)} onDeleteTask={kid => deleteTask(team.id, kid)} />
                    }
                  </div>
                  {!isMobile && i < teams.length - 1 && <div style={{ paddingTop: 60 }}><Arrow /></div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <TenStarExperience date={selectedDate} />
        <OfficeCulture date={selectedDate} />
      </div>
    </>
  );
}
