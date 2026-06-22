import { useState, useEffect, useRef } from "react";

// ===== SUPABASE CONFIG =====
const SUPABASE_URL = "https://qtiuszigqlyiofpuksxz.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0aXVzemlncWx5aW9mcHVrc3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDE2NDksImV4cCI6MjA5NTk3NzY0OX0.qGlvpF8LB8tbrv3q065PdgKHJI_pqTJ7-8QwH8ntHrU";
const TEAM_PASSWORD = "anchor2026";
const BOARD_ID = "shared_board";

// Cloud sync: mirrors all localStorage keys to one Supabase row
const SYNC_KEYS = [
  "anchorchain_v2", "anchorchain_dashboard_v2", "anchorchain_staff_v2",
  "anchorchain_day_defaults_v1", "anchorchain_tenstar_v1",
  "anchorchain_culture_v1", "anchorchain_win_v1", "anchorchain_template_v1",
  "anchorchain_np_running_v2", "anchorchain_np_filled_v1", "anchorchain_sc_filled_v1", "anchorchain_sheet_pulled_v1"
];

async function cloudLoad() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/anchorchain_data?id=eq.${BOARD_ID}&select=data,updated_at`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
    });
    const rows = await res.json();
    if (rows && rows[0] && rows[0].data) {
      const cloud = rows[0].data;
      SYNC_KEYS.forEach(k => { if (cloud[k] !== undefined) localStorage.setItem(k, JSON.stringify(cloud[k])); });
      window.__acLastCloudStamp = rows[0].updated_at || "";
      return true;
    }
  } catch (e) { console.error("Cloud load failed:", e); }
  return false;
}

// Lightweight check: returns the cloud's updated_at without overwriting local data
async function cloudCheckStamp() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/anchorchain_data?id=eq.${BOARD_ID}&select=updated_at`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
    });
    const rows = await res.json();
    if (rows && rows[0]) return rows[0].updated_at || "";
  } catch (e) {}
  return null;
}

let saveTimer = null;
function cloudSave() {
  if (saveTimer) clearTimeout(saveTimer);
  window.__acLastLocalEdit = Date.now();
  saveTimer = setTimeout(async () => {
    try {
      const payload = {};
      SYNC_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v) try { payload[k] = JSON.parse(v); } catch {} });
      const stamp = new Date().toISOString();
      await fetch(`${SUPABASE_URL}/rest/v1/anchorchain_data`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`,
          "Content-Type": "application/json", Prefer: "resolution=merge-duplicates"
        },
        body: JSON.stringify({ id: BOARD_ID, data: payload, updated_at: stamp })
      });
      // Remember our own stamp so polling doesn't treat our save as someone else's change
      window.__acLastCloudStamp = stamp;
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
  7: [703,704,706,707,708,709,710,712,713,714,715,717,718,719],
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
      { id: 301, label: "Fill holes! NP + Doc Side + Move pts!", done: false },
      { id: 302, label: "Diagnose!", done: false },
      { id: 303, label: "Overjet for possible SRP", done: false },
    ],
  },
  {
    id: 4, name: "Growth Gang", subtitle: "marketing", color: "#4ECDC4", nameColor: "#FFD700",
    tasks: [
      { id: 401, label: "GMB! Take a photo/vid", done: false },
      { id: 402, label: "Check Social Media", done: false },
      { id: 403, label: "10-Star Experience (2)", done: false },
      { id: 404, label: "Hooligans! Collaborate + Galvanize!", done: false },
      { id: 405, label: "Go Karaling!", done: false },
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
      { id: 619, label: "Megan", value: "" },
      { id: 620, label: "Hannah", value: "" },
      { id: 621, label: "MC", value: "" },
      { id: 622, label: "Julia", value: "" },
      { id: 623, label: "Liza", value: "" },
      { id: 624, label: "Litzy", value: "" },
      { id: 625, label: "Brianna", value: "" },
      { id: 626, label: "Ashanty", value: "" },
      { id: 628, label: "Sheila", value: "" },
      { id: 629, label: "Michii", value: "" },
      { id: 630, label: "Charmaine", value: "" },
      { id: 631, label: "Isa", value: "" },
      { id: 632, label: "NA", value: "" },
      { id: 633, label: "Kara", value: "" },
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
      { id: 501, label: "Assign resources / Personnel to tasks", done: false },
      { id: 502, label: "Top right Production number", done: false },
      { id: 503, label: "Proactiveness / Plan", done: false },
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
        rows: [],
      },
      {
        id: "other", title: "Other", color: "#1a2f5a",
        cols: ["Team Member", "Attempts", "Contacted", "%", "Completed", "%"],
        rows: [],
      },
      {
        id: "broken", title: "Unscheduled Broken Appointment", color: "#1a9c4a",
        cols: ["Team Member", "Schedule $", "$ Per Attempt", "Attempts", "Contacted", "%", "Completed", "%", "Patients"],
        rows: [],
      },
      {
        id: "unsched", title: "Unscheduled Treatment", color: "#4a7c1f",
        cols: ["Team Member", "Total $", "$ Per Attempt", "Attempts", "Contacted", "%", "Successes", "%"],
        rows: [],
      },
    ],
  },
];

const STORAGE_KEY = "anchorchain_v2";
const DASHBOARD_KEY = "anchorchain_dashboard_v2";
// Per-date dashboard numbers. Stored as { "2026-06-14": {...}, "2026-06-13": {...} }
function loadDashboardAll() { try { const r = localStorage.getItem(DASHBOARD_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; } }
function loadDashboard(date) {
  const all = loadDashboardAll();
  return all[date] || null;
}
function saveDashboard(date, d) {
  try {
    const all = loadDashboardAll();
    all[date] = d;
    localStorage.setItem(DASHBOARD_KEY, JSON.stringify(all));
  } catch {}
}
const STAFF_KEY = "anchorchain_staff_v2";
// Field IDs that should reset to 0 every DAY (stored per-date) instead of accumulating monthly
const DAILY_RESET_FIELDS = [6001, 601]; // NP Sch'd For Future, NP Seen Today
// Running totals for stat fields. Most accumulate monthly; DAILY_RESET_FIELDS are stored per-day.
const NP_RUNNING_KEY = "anchorchain_np_running_v2";
function monthKeyFor(date) { return date.slice(0, 7); } // "2026-06-14" -> "2026-06"
function loadStatTotals() { try { return JSON.parse(localStorage.getItem(NP_RUNNING_KEY) || "{}"); } catch { return {}; } }
// Return the totals object for a date: monthly fields keyed by month, daily fields keyed by exact date
function getStatTotals(date) {
  const all = loadStatTotals();
  const monthly = all[monthKeyFor(date)] || {};
  const daily = all[date] || {};
  const merged = { ...monthly };
  // Daily-reset fields come from the exact-date bucket (default 0 = fresh each day)
  DAILY_RESET_FIELDS.forEach(id => { merged[id] = daily[id] || 0; });
  return merged;
}
function setStatTotal(date, fieldId, total) {
  try {
    const all = loadStatTotals();
    const isDaily = DAILY_RESET_FIELDS.includes(Number(fieldId));
    const bucket = isDaily ? date : monthKeyFor(date);
    if (!all[bucket]) all[bucket] = {};
    all[bucket][fieldId] = total;
    localStorage.setItem(NP_RUNNING_KEY, JSON.stringify(all));
  } catch {}
}
// Remaining Monday-Friday business days from `date` through end of that month (inclusive of date)
// Per-date "New Patients filled today" flag, stored as { "2026-06-14": true }
const NP_FILLED_KEY = "anchorchain_np_filled_v1";
// Per-date "Rain Makers scorecard filled" flag (set when Scheduled Today photo fills it)
const SC_FILLED_KEY = "anchorchain_sc_filled_v1";
function getScFilled(date) { try { const a = JSON.parse(localStorage.getItem(SC_FILLED_KEY) || "{}"); return !!a[date]; } catch { return false; } }
function setScFilled(date, val) {
  try { const a = JSON.parse(localStorage.getItem(SC_FILLED_KEY) || "{}"); if (val) a[date] = true; else delete a[date]; localStorage.setItem(SC_FILLED_KEY, JSON.stringify(a)); } catch {}
}
// Tracks how many sheet patients have already been pulled into each field, per date:
// { "2026-06-13": { "610": 4, "619": 2 }, ... } so re-opening only adds NEW ones
const SHEET_PULLED_KEY = "anchorchain_sheet_pulled_v1";
function getSheetPulled(date) { try { const a = JSON.parse(localStorage.getItem(SHEET_PULLED_KEY) || "{}"); return a[date] || {}; } catch { return {}; } }
function setSheetPulled(date, obj) {
  try { const a = JSON.parse(localStorage.getItem(SHEET_PULLED_KEY) || "{}"); a[date] = obj; localStorage.setItem(SHEET_PULLED_KEY, JSON.stringify(a)); } catch {}
}
function getNpFilled(date) { try { const a = JSON.parse(localStorage.getItem(NP_FILLED_KEY) || "{}"); return !!a[date]; } catch { return false; } }
function setNpFilled(date, val) {
  try { const a = JSON.parse(localStorage.getItem(NP_FILLED_KEY) || "{}"); if (val) a[date] = true; else delete a[date]; localStorage.setItem(NP_FILLED_KEY, JSON.stringify(a)); } catch {}
}

// Remaining Monday-Friday business days from `date` through end of that month (inclusive of date)
function businessDaysLeft(date) {
  const d = new Date(date + "T12:00:00");
  const year = d.getFullYear(), month = d.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  let count = 0;
  for (let day = d.getDate(); day <= lastDay; day++) {
    const wd = new Date(year, month, day).getDay();
    if (wd >= 1 && wd <= 5) count++;
  }
  return count;
}
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
    const [yr, mo, dy] = date.split("-");
    const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const tabName = `${MONTHS[parseInt(mo) - 1]} ${yr}`; // e.g. "June 2026"
    const range = encodeURIComponent(`${tabName}!A:I`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/1MvMoBEpwWFykWWjWv5T0yhcNgltCW8kX9HvkPSZvcyA/values/${range}?key=AIzaSyB2kwRqpvTFIUKOZQEU4xlF4N2YlDrFL9E`;
    const res = await fetch(url);
    const json = await res.json();
    const rows = json.values || [];

    // Parse date to match sheet format MM/DD/YYYY (handles "6/9/2026" and "06/09/2026")
    const norm = (s) => {
      if (!s) return "";
      const parts = String(s).trim().split("/");
      if (parts.length !== 3) return String(s).trim();
      return `${parseInt(parts[0])}/${parseInt(parts[1])}/${parts[2]}`;
    };
    const target = `${parseInt(mo)}/${parseInt(dy)}/${yr}`;

    const isYes = (r) => r[4] && r[4].trim().toLowerCase() === "yes";
    const todayRows = rows.filter(r => norm(r[3]) === target && isYes(r));

    const todayYes = todayRows.length;
    const monthYes = rows.filter(r => isYes(r) && norm(r[3]).endsWith(`/${yr}`) && norm(r[3]).split("/")[0] === String(parseInt(mo))).length;

    // Count by team member (col H = index 7) and referral source (col I = index 8) for today's Yes rows
    const teamCounts = {};
    const refCounts = {};
    todayRows.forEach(r => {
      const tm = (r[7] || "").trim();
      const ref = (r[8] || "").trim();
      if (tm) teamCounts[tm] = (teamCounts[tm] || 0) + 1;
      if (ref) refCounts[ref] = (refCounts[ref] || 0) + 1;
    });

    return { todayYes, monthYes, teamCounts, refCounts };
  } catch(e) {
    console.error("Sheets fetch error:", e);
    return null;
  }
}

// Map sheet labels -> app field labels (so counts land in the right box)
const SHEET_REF_MAP = {
  "google/google ad": "Google",
  "google": "Google",
  "wom, friend family": "Internal (Friend/Family) WOM",
  "wom friend family": "Internal (Friend/Family) WOM",
  "dr. referral": "Dr Referral",
  "dr referral": "Dr Referral",
  "returning pt": "Returning Patient",
  "drive by/saw sign": "Walk In / Drive By",
  "walk in": "Walk In / Drive By",
  "insurance": "Insurance",
  "social media": "Social Media",
  "website": "Website",
};
const SHEET_TM_MAP = {
  "megan": "Megan", "hannah": "Hannah", "mc": "MC", "julia": "Julia",
  "liza": "Liza", "litzy": "Litzy", "brianna": "Brianna", "bri": "Brianna",
  "ashanty": "Ashanty", "sheila": "Sheila", "michii": "Michii",
  "charmaine": "Charmaine", "charm": "Charmaine", "isa": "Isa", "kara": "Kara",
};
function mapSheetLabel(map, raw) {
  if (!raw) return null;
  const k = raw.trim().toLowerCase();
  if (map[k]) return map[k];
  // partial match (e.g. "Charm…" truncated)
  for (const key in map) { if (k.startsWith(key.slice(0, 4)) || key.startsWith(k.slice(0, 4))) return map[key]; }
  return null;
}

function getProgress(tasks, teamId, date) {
  const staffIds = teamId ? (TASK_IDS_WITH_STAFF[teamId] || []) : [];
  const real = tasks.filter(t => !t.header && !t.isNote && !staffIds.includes(t.id));

  // Count staff checkmarks for staff-tasks (doctors checked off across all staff-tasks)
  let staffTotal = 0, staffDone = 0;
  if (staffIds.length && date) {
    try {
      const staffData = JSON.parse(localStorage.getItem(STAFF_KEY) || "{}");
      const dayDefaults = JSON.parse(localStorage.getItem(DAY_DEFAULTS_KEY) || "{}");
      const day = new Date(date + "T12:00:00").getDay();
      const scheduled = STAFF.filter(name => DAY_SCHEDULE[name] && DAY_SCHEDULE[name].includes(day));
      staffIds.forEach(tid => {
        const key = `${date}_${teamId}_${tid}`;
        const defKey = `default_${day}_${teamId}_${tid}`;
        const entry = staffData[key] || {};
        const def = dayDefaults[defKey] || {};
        const hidden = entry.hidden !== undefined ? entry.hidden : (def.hidden || []);
        const extras = entry.extras !== undefined ? entry.extras : (def.extras || []);
        const done = entry.done || {};
        const people = [...scheduled.filter(n => !hidden.includes(n)), ...extras];
        people.forEach(name => {
          staffTotal++;
          if (done[name] === true || (done[name] && done[name].checked)) staffDone++;
        });
      });
    } catch {}
  }

  const totalItems = real.length + staffTotal;
  if (!totalItems) return 0;
  const doneItems = real.filter(t => t.done).length + staffDone;
  return Math.round((doneItems / totalItems) * 100);
}
function getDayPct(teams, date) {
  // Build an ordered list of "cards" each with its own done/total fraction.
  const cards = [];
  teams.forEach(t => {
    const staffIds = t.id ? (TASK_IDS_WITH_STAFF[t.id] || []) : [];
    const real = (t.tasks || []).filter(tk => !tk.header && !tk.isNote && !staffIds.includes(tk.id));
    let cardTotal = real.length;
    let cardDone = real.filter(tk => tk.done).length;
    if (staffIds.length && date) {
      try {
        const staffData = JSON.parse(localStorage.getItem(STAFF_KEY) || "{}");
        const dayDefaults = JSON.parse(localStorage.getItem(DAY_DEFAULTS_KEY) || "{}");
        const day = new Date(date + "T12:00:00").getDay();
        const scheduled = STAFF.filter(name => DAY_SCHEDULE[name] && DAY_SCHEDULE[name].includes(day));
        staffIds.forEach(tid => {
          const key = `${date}_${t.id}_${tid}`;
          const defKey = `default_${day}_${t.id}_${tid}`;
          const entry = staffData[key] || {};
          const def = dayDefaults[defKey] || {};
          const hidden = entry.hidden !== undefined ? entry.hidden : (def.hidden || []);
          const extras = entry.extras !== undefined ? entry.extras : (def.extras || []);
          const dn = entry.done || {};
          const people = [...scheduled.filter(n => !hidden.includes(n)), ...extras];
          people.forEach(name => {
            cardTotal++;
            if (dn[name] === true || (dn[name] && dn[name].checked)) cardDone++;
          });
        });
      } catch {}
    }
    // Only include cards that actually have something to complete
    if (cardTotal > 0) cards.push({ done: cardDone, total: cardTotal });
    // The Rain Makers scorecard (no tasks) counts as one card, done when filled
    if (t.isScoreCard && date) cards.push({ done: getScFilled(date) ? 1 : 0, total: 1 });
  });
  // New Patients "Filled Today" is its own card (1 item)
  if (date) cards.push({ done: getNpFilled(date) ? 1 : 0, total: 1 });

  if (!cards.length) return 0;

  // SEQUENTIAL: each card is worth an equal share. You only earn a card's
  // progress once every card BEFORE it is fully complete. The first incomplete
  // card earns partial credit; cards after it earn nothing until reached.
  const share = 1 / cards.length;
  let earned = 0;
  for (let i = 0; i < cards.length; i++) {
    const frac = cards[i].done / cards[i].total;
    earned += frac * share;
    if (frac < 1) break; // stop at the first card that isn't fully done
  }
  return Math.round(earned * 100);
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
function StaffRow({ teamId, taskId, date, color, onStaffChange }) {
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

  // When the date (or task) changes, reload this row's data for that specific day
  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(STAFF_KEY) || "{}");
      const defaults = JSON.parse(localStorage.getItem(DAY_DEFAULTS_KEY) || "{}");
      const entry = d[key] || {};
      setExtras(entry.extras !== undefined ? entry.extras : ((defaults[defaultKey] && defaults[defaultKey].extras) || []));
      setHidden(entry.hidden !== undefined ? entry.hidden : ((defaults[defaultKey] && defaults[defaultKey].hidden) || []));
      setDone(entry.done || {});
    } catch {
      setExtras([]); setHidden([]); setDone({});
    }
  }, [key, defaultKey]);

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
    const currentUser = (() => { try { return localStorage.getItem("anchorchain_username") || ""; } catch { return ""; } })();
    const isDone = done[name] && done[name].checked;
    const nd = { ...done, [name]: isDone ? { checked: false } : { checked: true, by: currentUser } };
    setDone(nd);
    persist(extras, nd, hidden);
    if (onStaffChange) onStaffChange();
  };

  const add = () => {
    if (!newName.trim()) return;
    const ne = [...extras, newName.trim()];
    setExtras(ne);
    persist(ne, done, hidden);
    setNewName("");
    setAdding(false);
    if (onStaffChange) onStaffChange();
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
    if (onStaffChange) onStaffChange();
  };

  const all = [...scheduled.filter(n => !hidden.includes(n)).map(n => ({ name: n, isExtra: false })), ...extras.map(n => ({ name: n, isExtra: true }))];
  // Normalize: old format stored boolean, new format stores {checked, by}
  const isChecked = (name) => done[name] === true || (done[name] && done[name].checked);
  const checkedBy = (name) => (done[name] && done[name].by) || "";

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
        <div key={name + isExtra} style={{ display: "flex", alignItems: "center", gap: 2, background: "#0f1f38", borderRadius: 6, padding: "3px 6px", border: `1px solid ${isChecked(name) ? color + "66" : "#1a3050"}` }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${isChecked(name) ? color : "#3a3a5a"}`, background: isChecked(name) ? color : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => toggle(name)}>
            {isChecked(name) && <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span style={{ fontFamily: "monospace", fontSize: 12, color: isChecked(name) ? color : "#aaa", textDecoration: isChecked(name) ? "line-through" : "none", cursor: "pointer", userSelect: "none" }} onClick={() => toggle(name)}>{name}</span>
          {isChecked(name) && checkedBy(name) && <span style={{ fontFamily: "monospace", fontSize: 10, color: "#888", marginLeft: 2 }}>✓{checkedBy(name)}</span>}
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

function TeamCard({ team, date, onToggle, onAddTask, onRename, onEditLabel, onDeleteTask, isMobile, onFixTasks, onStaffChangeOverall }) {
  const [staffTick, setStaffTick] = useState(0);
  const pct = getProgress(team.tasks, team.id, date);
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
                    <StaffRow teamId={team.id} taskId={task.id} date={date} color={team.color} onStaffChange={() => { setStaffTick(t => t + 1); if (onStaffChangeOverall) onStaffChangeOverall(); }} />
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
            {(team.id === 4 || team.id === 3 || team.id === 5) && onFixTasks && (
              <button onClick={onFixTasks} style={{ width: "100%", marginTop: 8, background: "transparent", border: `1px solid ${team.color}66`, borderRadius: 8, padding: "7px", color: team.color, fontFamily: "monospace", fontSize: 10, cursor: "pointer", letterSpacing: 1 }}>↺ RESET TO STANDARD TASKS</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ team, date, onStatsChange, isMobile, onFilledChange }) {
  const [stats, setStats] = useState(team.stats || []);
  const [collapsed, setCollapsed] = useState(true);
  useEffect(() => setStats(team.stats || []), [team]);
  const [addingTo, setAddingTo] = useState(null);
  const [newLabel, setNewLabel] = useState("");
  // Monthly running totals for all accumulating stat fields, keyed by field id
  const [totals, setTotals] = useState(() => getStatTotals(date));
  const [addInputs, setAddInputs] = useState({}); // { fieldId: "typed amount" }
  const [filled, setFilled] = useState(() => getNpFilled(date));
  useEffect(() => { setTotals(getStatTotals(date)); setAddInputs({}); setFilled(getNpFilled(date)); }, [date]);

  // Auto-pull referral source & team member counts from the Google Sheet for this day.
  // Only adds patients not already pulled (tracked per-date), so re-opening never double-counts.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await fetchNPData(date);
      if (!data || cancelled) return;
      const curStats = team.stats || [];
      // Build label -> field id lookup for ref (610-618,700-799) and tm (619-699,800+)
      const labelToId = {};
      curStats.forEach(s => { labelToId[s.label.trim().toLowerCase()] = s.id; });
      const findId = (appLabel) => labelToId[appLabel.trim().toLowerCase()];

      // Translate sheet counts into { fieldId: countFromSheet }
      const sheetByField = {};
      Object.entries(data.refCounts || {}).forEach(([raw, n]) => {
        const appLabel = mapSheetLabel(SHEET_REF_MAP, raw);
        const id = appLabel && findId(appLabel);
        if (id) sheetByField[id] = (sheetByField[id] || 0) + n;
      });
      Object.entries(data.teamCounts || {}).forEach(([raw, n]) => {
        const appLabel = mapSheetLabel(SHEET_TM_MAP, raw);
        const id = appLabel && findId(appLabel);
        if (id) sheetByField[id] = (sheetByField[id] || 0) + n;
      });

      const alreadyPulled = getSheetPulled(date); // { fieldId: count previously pulled }
      const curTotals = getStatTotals(date);
      const newTotals = { ...curTotals };
      const newPulled = { ...alreadyPulled };
      let changed = false;
      Object.entries(sheetByField).forEach(([id, sheetCount]) => {
        const prev = alreadyPulled[id] || 0;
        const diff = sheetCount - prev; // only add genuinely new patients
        if (diff !== 0) {
          newTotals[id] = (newTotals[id] || 0) + diff;
          newPulled[id] = sheetCount;
          changed = true;
        }
      });
      if (changed && !cancelled) {
        // persist each changed total
        Object.keys(sheetByField).forEach(id => { if (newTotals[id] !== undefined) setStatTotal(date, id, newTotals[id]); });
        setSheetPulled(date, newPulled);
        setTotals(newTotals);
      }

      // "NP Sch'd For Future" (6001) mirrors the dashboard New Patients = today's Yes count
      if (!cancelled && typeof data.todayYes === "number") {
        const cur6001 = getStatTotals(date)[6001] || 0;
        if (cur6001 !== data.todayYes) {
          setStatTotal(date, 6001, data.todayYes);
          setTotals(prev => ({ ...prev, 6001: data.todayYes }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [date, team]);
  const toggleFilled = () => { const v = !filled; setFilled(v); setNpFilled(date, v); if (onFilledChange) onFilledChange(); };
  const monthLabel = new Date(date + "T12:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const totalFor = (id) => totals[id] || 0;
  const addTo = (id) => {
    const raw = addInputs[id] || "";
    const n = parseInt(String(raw).replace(/[^0-9-]/g, ""), 10);
    if (isNaN(n)) return;
    const nt = totalFor(id) + n;
    const u = { ...totals, [id]: nt };
    setTotals(u); setStatTotal(date, id, nt);
    setAddInputs(prev => ({ ...prev, [id]: "" }));
  };
  const editTotal = (id, label) => {
    const cur = window.prompt("Edit " + label + " total for " + monthLabel + ":", String(totalFor(id)));
    if (cur === null) return;
    const n = parseInt(cur.replace(/[^0-9-]/g, ""), 10);
    if (isNaN(n)) return;
    const u = { ...totals, [id]: n };
    setTotals(u); setStatTotal(date, id, n);
  };

  // Field id 603 = "Days Left In Month" is auto-calculated, not accumulated
  const DAYS_LEFT_ID = 603;
  const daysLeft = businessDaysLeft(date);

  const deleteStat = (id) => { const u = stats.filter(s => s.id !== id); setStats(u); onStatsChange && onStatsChange(u); };
  const addStat = (section) => {
    if (!newLabel.trim()) return;
    let baseId = section === "ref" ? 700 : section === "tm" ? 800 : 604;
    while (stats.find(s => s.id === baseId)) baseId++;
    const u = [...stats, { id: baseId, label: newLabel.trim(), value: "" }];
    setStats(u); onStatsChange && onStatsChange(u);
    setNewLabel(""); setAddingTo(null);
  };
  const top = stats.filter(s => [600, 6001, 601, 602, 603, 604, 605, 606, 607, 608, 609].includes(Number(s.id)));
  const ref = stats.filter(s => { const n = Number(s.id); return (n >= 610 && n <= 618) || (n >= 700 && n <= 799); });
  const tm = stats.filter(s => { const n = Number(s.id); return (n >= 619 && n <= 699) || n >= 800; });

  // A running-total tile: shows the month total + a small +add row
  const tile = (s, opts = {}) => {
    const id = s.id;
    if (Number(id) === DAYS_LEFT_ID) {
      return (
        <div key={id} style={{ background: "#0f1f38", border: `1px solid ${team.color}33`, borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#dfe7f0", letterSpacing: 1, marginBottom: 3, textTransform: "uppercase" }}>{s.label} (M-F)</div>
          <div style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: opts.big ? 22 : 18, color: team.nameColor || "#fff" }}>{daysLeft}</div>
          <div style={{ fontFamily: "monospace", fontSize: 8, color: "#8a97a8", marginTop: 2 }}>auto-calculated</div>
        </div>
      );
    }
    return (
      <div key={id} style={{ background: "#0f1f38", border: opts.showDelete ? "1px solid #1a3050" : `1px solid ${team.color}33`, borderRadius: opts.small ? 6 : 8, padding: opts.small ? "6px 8px" : "8px 10px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: opts.labelColor || "#dfe7f0", letterSpacing: 1, marginBottom: 3, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{s.label}</div>
          {opts.showDelete && <span onClick={() => deleteStat(id)} style={{ color: "#7a8aa0", fontSize: 13, cursor: "pointer", lineHeight: 1, marginLeft: 4 }}>×</span>}
        </div>
        <div onClick={() => editTotal(id, s.label)} style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: opts.big ? 22 : 17, color: team.nameColor || "#fff", cursor: "pointer", lineHeight: 1.1 }} title="Tap to edit total">{totalFor(id)}</div>
        <div style={{ display: "flex", gap: 3, alignItems: "center", marginTop: 5 }}>
          <input value={addInputs[id] || ""} onChange={e => setAddInputs(prev => ({ ...prev, [id]: e.target.value }))} onKeyDown={e => e.key === "Enter" && addTo(id)} placeholder="+add" inputMode="numeric" style={{ flex: 1, minWidth: 0, background: "#0a1628", border: `1px solid ${team.color}33`, borderRadius: 5, color: "#fff", fontFamily: "monospace", fontSize: 11, padding: "4px 6px", outline: "none", boxSizing: "border-box" }} />
          <button onClick={() => addTo(id)} style={{ background: team.color, border: "none", borderRadius: 5, color: "#000", fontWeight: 700, fontSize: 12, padding: "4px 8px", cursor: "pointer", flexShrink: 0 }}>+</button>
        </div>
      </div>
    );
  };

  return (
    <div className="shimmer-orange" style={{ width: isMobile ? "92vw" : 358, maxWidth: isMobile ? "92vw" : "none", flexShrink: 0, background: "#0a1628", border: "1.5px solid #1a3050", borderRadius: 16, padding: isMobile ? "18px 14px" : "20px 18px", minHeight: 202, overflow: "visible", boxSizing: "border-box" }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: "sans-serif", fontWeight: 800, fontSize: 31, color: team.nameColor || "#fff", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.85 }}><circle cx="12" cy="12" r="4" stroke="#FF6B35" strokeWidth="1.5"/><line x1="12" y1="2" x2="12" y2="5" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="22" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="2" y1="12" x2="5" y2="12" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="19" y1="12" x2="22" y2="12" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="4.93" y1="4.93" x2="7.05" y2="7.05" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="16.95" y1="16.95" x2="19.07" y2="19.07" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="19.07" y1="4.93" x2="16.95" y2="7.05" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/><line x1="7.05" y1="16.95" x2="4.93" y2="19.07" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round"/></svg>
          {team.name}
        </div>
        {team.subtitle && <div style={{ fontSize: 14, color: "#bbb", fontFamily: "monospace", letterSpacing: 1, marginTop: 1 }}>{team.subtitle}</div>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <div style={{ fontSize: 14, color: team.color, fontFamily: "monospace", letterSpacing: 1 }}>LIVE STATS · {monthLabel.toUpperCase()}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ProgressRing pct={filled ? 100 : 0} color={team.color} size={isMobile ? 50 : 56} />
            <div onClick={() => setCollapsed(c => !c)} style={{ cursor: "pointer", color: "#555", fontSize: 16, userSelect: "none", transition: "transform 0.3s", transform: collapsed ? "rotate(0deg)" : "rotate(180deg)" }}>▾</div>
          </div>
        </div>
      </div>
      {top[0] && <div style={{ marginBottom: 14 }}>{tile(top[0], { big: true })}</div>}
      {!collapsed && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {top.slice(1).map(s => tile(s, {}))}
          </div>
          <div style={{ borderTop: `1px solid ${team.color}33`, paddingTop: 10, marginBottom: 10 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: team.color, letterSpacing: 2, marginBottom: 8 }}>REFERRAL SOURCE</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {ref.map(s => tile(s, { small: true, showDelete: true }))}
            </div>
            {addingTo === "ref" ? (
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}><input autoFocus value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addStat("ref"); if (e.key === "Escape") setAddingTo(null); }} placeholder="Source name..." style={{ flex: 1, background: "#0f1f38", border: `1px solid ${team.color}66`, borderRadius: 6, padding: "4px 8px", color: "#fff", fontFamily: "monospace", fontSize: 11, outline: "none" }} /><button onClick={() => addStat("ref")} style={{ background: team.color, border: "none", borderRadius: 5, color: "#000", fontWeight: 700, fontSize: 11, padding: "0 8px", cursor: "pointer" }}>+</button></div>
            ) : <button onClick={() => setAddingTo("ref")} style={{ width: "100%", marginTop: 6, background: "transparent", border: "1px dashed #1a3050", borderRadius: 6, padding: "5px", color: "#444", fontFamily: "monospace", fontSize: 9, cursor: "pointer", letterSpacing: 1 }}>+ ADD SOURCE</button>}
          </div>
          <div style={{ borderTop: `1px solid ${team.color}33`, paddingTop: 10 }}>
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#5fe3d0", letterSpacing: 2, marginBottom: 8 }}>TEAM MEMBER</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {tm.map(s => tile(s, { small: true, showDelete: true, labelColor: "#5fe3d0" }))}
            </div>
            {addingTo === "tm" ? (
              <div style={{ display: "flex", gap: 4, marginTop: 6 }}><input autoFocus value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => { if (e.key === "Enter") addStat("tm"); if (e.key === "Escape") setAddingTo(null); }} placeholder="Member name..." style={{ flex: 1, background: "#0f1f38", border: `1px solid ${team.color}66`, borderRadius: 6, padding: "4px 8px", color: "#fff", fontFamily: "monospace", fontSize: 11, outline: "none" }} /><button onClick={() => addStat("tm")} style={{ background: team.color, border: "none", borderRadius: 5, color: "#000", fontWeight: 700, fontSize: 11, padding: "0 8px", cursor: "pointer" }}>+</button></div>
            ) : <button onClick={() => setAddingTo("tm")} style={{ width: "100%", marginTop: 6, background: "transparent", border: "1px dashed #1a3050", borderRadius: 6, padding: "5px", color: "#444", fontFamily: "monospace", fontSize: 9, cursor: "pointer", letterSpacing: 1 }}>+ ADD MEMBER</button>}
          </div>
        </div>
      )}
      <button onClick={toggleFilled} style={{ width: "100%", marginTop: 14, background: filled ? "#4ECDC4" : "transparent", border: filled ? "none" : `1.5px solid ${team.color}`, borderRadius: 10, padding: "12px", color: filled ? "#000" : team.color, fontFamily: "sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer", letterSpacing: 0.5 }}>
        {filled ? "✓ Filled Today" : "Filled Today"}
      </button>
    </div>
  );
}

function RainMakersCard({ team, date, onToggle, onDeleteTask, onAddTask, onEditLabel, isMobile, onStaffChangeOverall }) {
  const [staffTick, setStaffTick] = useState(0);
  const pct = getProgress(team.tasks, team.id, date);
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
              if (task.hasFillIn) {
                const fillHasStaff = TASK_IDS_WITH_STAFF[7] && TASK_IDS_WITH_STAFF[7].includes(task.id);
                return (
                <div key={task.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 8, background: task.done ? team.color + "18" : "#0f1f38", border: `1px solid ${task.done ? team.color + "44" : "#1a3050"}`, cursor: "pointer" }} onClick={() => onToggle(task.id)}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${task.done ? team.color : "#3a3a5a"}`, background: task.done ? team.color : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{task.done && <Checkmark />}</div>
                    <span style={{ fontFamily: "monospace", fontSize: 14, color: task.done ? team.color : "#ffffff", whiteSpace: "normal", wordBreak: "break-word", lineHeight: 1.5 }}>{task.label}</span>
                  </div>
                  <input value={amounts[task.id] || ""} onChange={e => setAmounts(p => ({ ...p, [task.id]: e.target.value }))} placeholder="$ amount" style={{ background: "transparent", border: "none", borderBottom: `1px solid ${team.color}44`, color: "#FFD700", fontFamily: "monospace", fontWeight: 600, fontSize: 13, width: "100%", outline: "none", padding: "4px 10px" }} />
                  {fillHasStaff && (
                    <StaffRow teamId={7} taskId={task.id} date={date} color={team.color} onStaffChange={() => { setStaffTick(t => t + 1); if (onStaffChangeOverall) onStaffChangeOverall(); }} />
                  )}
                </div>
                );
              }
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
                    <StaffRow teamId={7} taskId={task.id} date={date} color={team.color} onStaffChange={() => { setStaffTick(t => t + 1); if (onStaffChangeOverall) onStaffChangeOverall(); }} />
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

function ScoreCard({ team, date, onUpdate, isMobile, onScFilledChange }) {
  const [sections, setSections] = useState(team.sections || []);
  const [collapsed, setCollapsed] = useState(true);
  const [filled, setFilled] = useState(() => getScFilled(date));
  useEffect(() => setSections(team.sections || []), [team]);
  useEffect(() => setFilled(getScFilled(date)), [date]);
  const toggleFilled = () => { const v = !filled; setFilled(v); setScFilled(date, v); if (onScFilledChange) onScFilledChange(); };

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
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ProgressRing pct={filled ? 100 : 0} color={team.color} size={isMobile ? 50 : 72} />
          <div onClick={() => setCollapsed(c => !c)} style={{ cursor: "pointer", color: "#555", fontSize: 16, userSelect: "none", transition: "transform 0.3s", transform: collapsed ? "rotate(0deg)" : "rotate(180deg)" }}>▾</div>
        </div>
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
          <button onClick={toggleFilled} style={{ width: "100%", marginTop: 4, background: filled ? "#0047AB" : "transparent", border: filled ? "none" : `1.5px solid ${team.color}`, borderRadius: 10, padding: "12px", color: filled ? "#fff" : team.color, fontFamily: "sans-serif", fontWeight: 700, fontSize: 15, cursor: "pointer", letterSpacing: 0.5 }}>
            {filled ? "✓ Scorecard Done Today" : "Mark Scorecard Done Today"}
          </button>
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

function CEODashboard({ yesterdayPct, streak, date, onScorecardData }) {
  const blankMetrics = {
    production: { value: "", goal: "" },
    scheduled: { value: "", goal: "" },
    newPatients: { value: "", goal: "" },
  };
  const [metrics, setMetrics] = useState(() => loadDashboard(date) || blankMetrics);
  // When the selected date changes, load that date's numbers (or blank)
  useEffect(() => {
    setMetrics(loadDashboard(date) || blankMetrics);
  }, [date]);
  const [editing, setEditing] = useState(null);
  const [npSync, setNpSync] = useState("idle"); // idle, loading, done, error
  const [npCount, setNpCount] = useState(null);
  const [photoReading, setPhotoReading] = useState(null); // which card is reading

  // Read a number from an uploaded photo via our secure serverless function
  const readPhotoNumber = (cardKey, file) => {
    setPhotoReading(cardKey);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        // Resize/compress the image in-browser to stay under the request size limit
        const img = new Image();
        img.onload = async () => {
          try {
            const maxDim = 1500;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              const scale = maxDim / Math.max(width, height);
              width = Math.round(width * scale);
              height = Math.round(height * scale);
            }
            const canvas = document.createElement("canvas");
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.7);
            const base64 = compressed.split(",")[1];
            const res = await fetch("/api/read-number", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageBase64: base64, mediaType: "image/jpeg", kind: cardKey })
            });
            const data = await res.json();
            if (data.number) {
              const prettyDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
              const confirmed = window.prompt(
                "Saving to: " + prettyDate + "\n\nI read this number from your photo. Check it and fix it if needed, then press OK. (If this is the wrong day, press Cancel and change the date first.)",
                data.number
              );
              if (confirmed !== null && confirmed.trim() !== "") {
                const cleaned = confirmed.replace(/[^0-9.]/g, "");
                setMetrics(prev => {
                  const m = { ...prev, [cardKey]: { ...prev[cardKey], value: cleaned } };
                  saveDashboard(date, m);
                  return m;
                });
              }
              // If this is the Scheduled Today card, also read the full scorecard from the same photo
              if (cardKey === "scheduled" && onScorecardData) {
                try {
                  const scRes = await fetch("/api/read-number", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64: base64, mediaType: "image/jpeg", kind: "scorecard" })
                  });
                  const scData = await scRes.json();
                  if (scData.sections) {
                    onScorecardData(scData.sections);
                    alert("Scorecard updated for " + new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + " ✓");
                  } else {
                    alert("Filled the total, but couldn't read the scorecard table. Details: " + (scData.debug || "unknown"));
                  }
                } catch (scErr) {
                  alert("Filled the total, but the scorecard read failed: " + (scErr.message || scErr));
                }
              }
              setPhotoReading(null);
            } else {
              alert("Couldn't read a number. Details: " + (data.debug || "unknown"));
              setPhotoReading(null);
            }
          } catch (e) {
            console.error("Photo read failed:", e);
            setPhotoReading(null);
          }
        };
        img.src = reader.result;
      } catch (e) {
        console.error("Photo read failed:", e);
        setPhotoReading(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const syncNewPatients = () => {
    setNpSync("loading");
    fetch("https://sheets.googleapis.com/v4/spreadsheets/1MvMoBEpwWFykWWjWv5T0yhcNgltCW8kX9HvkPSZvcyA/values/A:E?key=AIzaSyB2kwRqpvTFIUKOZQEU4xlF4N2YlDrFL9E")
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(json => {
        const rows = json.values || [];
        const [yr, mo, dy] = date.split("-");
        // Normalize any date to M/D/YYYY (strip leading zeros) for comparison
        const normalize = (s) => {
          if (!s) return "";
          const parts = s.trim().split("/");
          if (parts.length !== 3) return s.trim();
          return `${parseInt(parts[0])}/${parseInt(parts[1])}/${parts[2]}`;
        };
        const target = `${parseInt(mo)}/${parseInt(dy)}/${yr}`;
        const isYes = c => c && c.trim().toLowerCase() === "yes";
        const todayYes = rows.filter(r => r[3] && normalize(r[3]) === target && isYes(r[4])).length;
        setNpCount(todayYes);
        setNpSync("done");
        // Auto-fill the New Patients card value
        setMetrics(prev => {
          const m = { ...prev, newPatients: { ...prev.newPatients, value: String(todayYes) } };
          saveDashboard(date, m);
          return m;
        });
      })
      .catch(() => setNpSync("error"));
  };

  useEffect(() => { syncNewPatients(); }, [date]);

  const update = (key, field, val) => {
    const m = { ...metrics, [key]: { ...metrics[key], [field]: val } };
    setMetrics(m); saveDashboard(date, m);
  };

  const num = v => { const n = parseFloat(String(v).replace(/[$,%]/g, "")); return isNaN(n) ? 0 : n; };
  const pctOf = (v, g) => { const gg = num(g); return gg ? Math.min(100, Math.round((num(v) / gg) * 100)) : 0; };

  const cards = [
    { key: "production", icon: "💰", label: "MONTHLY PRODUCTION", color: "#FFD700", prefix: "$", photoRead: true },
    { key: "scheduled", icon: "📅", label: "SCHEDULED TODAY", color: "#4ECDC4", prefix: "$", photoRead: true },
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
              {c.photoRead && (
                <label title="Upload a photo to read the number" style={{ marginLeft: "auto", fontSize: 14, cursor: "pointer", opacity: photoReading === c.key ? 0.5 : 1 }}>
                  {photoReading === c.key ? "⟳" : "📷"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) readPhotoNumber(c.key, e.target.files[0]); }} />
                </label>
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
            const pct = allData[ds] ? getDayPct(allData[ds], ds) : null;
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
  const [allData, setAllData] = useState(() => {
    const data = loadAllData();
    // One-time cleanup: fix duplicate task IDs within each team for each day
    let changed = false;
    let counter = 950000 + (Date.now() % 40000000);
    // Clean fixed task list for Growth Gang (team id 4)
    const GROWTH_GANG_TASKS = [
      { id: 401, label: "GMB! Take a photo/vid" },
      { id: 402, label: "Check Social Media" },
      { id: 403, label: "10-Star Experience (2)" },
      { id: 404, label: "Hooligans! Collaborate + Galvanize!" },
      { id: 405, label: "Go Karaling!" },
    ];
    // One-time hard reset of Growth Gang, controlled by a version flag
    let ggReset = false;
    try { ggReset = localStorage.getItem("anchorchain_gg_reset_v2") === "yes"; } catch {}

    Object.keys(data).forEach(dk => {
      if (!Array.isArray(data[dk])) return;
      data[dk] = data[dk].map(team => {
        if (!team.tasks) return team;
        // Hard reset Growth Gang (id 4) to the clean fixed list (only once, via version flag)
        if (team.id === 4 && !ggReset) {
          changed = true;
          return { ...team, tasks: GROWTH_GANG_TASKS.map(x => ({ ...x, done: false })) };
        }
        const seen = new Set();
        const tasks = team.tasks.map(tk => {
          if (seen.has(tk.id)) { changed = true; return { ...tk, id: counter++ }; }
          seen.add(tk.id);
          return tk;
        });
        return { ...team, tasks };
      });
    });
    // Also fix the saved template's Growth Gang
    if (!ggReset) {
      try {
        const tmplRaw = localStorage.getItem("anchorchain_template_v1");
        if (tmplRaw) {
          const tmpl = JSON.parse(tmplRaw);
          const fixed = tmpl.map(t => t.id === 4 ? { ...t, tasks: GROWTH_GANG_TASKS.map(x => ({ ...x, done: false })) } : t);
          localStorage.setItem("anchorchain_template_v1", JSON.stringify(fixed));
        }
      } catch {}
      try { localStorage.setItem("anchorchain_gg_reset_v2", "yes"); } catch {}
    }
    if (changed) { try { saveAllData(data); } catch {} }
    return data;
  });
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [filledTick, setFilledTick] = useState(0);
  const [overallTick, setOverallTick] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);
  const [showCal, setShowCal] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [nextId, setNextId] = useState(() => {
    // Base on current time to guarantee uniqueness across sessions/devices
    return 900000 + (Date.now() % 90000000);
  });
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
      if (ok) {
        // Re-apply Growth Gang clean-up after cloud data loads (cloud may carry old messy data)
        const data = loadAllData();
        const GG = [
          { id: 401, label: "GMB! Take a photo/vid" },
          { id: 402, label: "Check Social Media" },
          { id: 403, label: "10-Star Experience (2)" },
          { id: 404, label: "Hooligans! Collaborate + Galvanize!" },
          { id: 405, label: "Go Karaling!" },
        ];
        let counter = 950000 + (Date.now() % 40000000);
        Object.keys(data).forEach(dk => {
          if (!Array.isArray(data[dk])) return;
          data[dk] = data[dk].map(team => {
            if (!team.tasks) return team;
            if (team.id === 4) {
              // Keep done-state for the 5 known tasks by matching id, else fresh
              const doneById = {};
              team.tasks.forEach(t => { doneById[t.id] = !!t.done; });
              return { ...team, tasks: GG.map(x => ({ ...x, done: doneById[x.id] || false })) };
            }
            const seen = new Set();
            const tasks = team.tasks.map(tk => {
              if (seen.has(tk.id)) return { ...tk, id: counter++ };
              seen.add(tk.id); return tk;
            });
            return { ...team, tasks };
          });
        });
        try { saveAllData(data); } catch {}
        setAllData(data);
      }
      setCloudLoaded(true);
    });
  }, [authed, userName]);

  // LIVE SYNC: poll the cloud every few seconds and refresh if someone else changed data.
  useEffect(() => {
    if (!authed || !userName) return;
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      // Skip if the user edited very recently (let their save settle first)
      const sinceEdit = Date.now() - (window.__acLastLocalEdit || 0);
      if (sinceEdit < 2000) return;
      const stamp = await cloudCheckStamp();
      if (stopped || stamp === null) return;
      const lastSeen = window.__acLastCloudStamp || "";
      if (stamp && stamp !== lastSeen) {
        // Someone else (or another device) updated the board — pull the latest
        const ok = await cloudLoad();
        if (ok && !stopped) {
          setAllData(loadAllData());
          setRefreshTick(t => t + 1);
        }
      }
    };
    const interval = setInterval(tick, 5000);
    // Also refresh when the tab regains focus
    const onFocus = () => { window.__acLastCloudStamp = ""; tick(); };
    window.addEventListener("focus", onFocus);
    return () => { stopped = true; clearInterval(interval); window.removeEventListener("focus", onFocus); };
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
    const tmpl = deepClone();
    // Merge in any new steps from the template that aren't in saved data
    const savedIds = savedTeams.map(t => t.id);
    const missing = tmpl.filter(t => !savedIds.includes(t.id)).map(t => JSON.parse(JSON.stringify(t)));
    // Sync permanent task LABELS from the template into each saved day,
    // while keeping that day's own done/doneBy/fill-in state.
    const synced = savedTeams.map(st => {
      const tt = tmpl.find(t => t.id === st.id);
      if (!tt || !tt.tasks || !st.tasks) return st;
      const tmplTasks = tt.tasks;
      const newTasks = st.tasks.map(task => {
        const match = tmplTasks.find(x => x.id === task.id);
        return match ? { ...task, label: match.label } : task;
      });
      return { ...st, tasks: newTasks };
    });
    const merged = [...synced, ...missing];
    return merged.sort((a, b) => {
      const ia = tmpl.findIndex(t => t.id === a.id);
      const ib = tmpl.findIndex(t => t.id === b.id);
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
  // Standard fixed task lists for reset buttons
  const STANDARD_TASKS = {
    3: [
      { id: 301, label: "Fill holes! NP + Doc Side + Move pts!" },
      { id: 302, label: "Diagnose!" },
      { id: 303, label: "Overjet for possible SRP" },
    ],
    5: [
      { id: 501, label: "Assign resources / Personnel to tasks" },
      { id: 502, label: "Top right Production number" },
      { id: 503, label: "Proactiveness / Plan" },
    ],
    4: [
      { id: 401, label: "GMB! Take a photo/vid" },
      { id: 402, label: "Check Social Media" },
      { id: 403, label: "10-Star Experience (2)" },
      { id: 404, label: "Hooligans! Collaborate + Galvanize!" },
      { id: 405, label: "Go Karaling!" },
    ],
  };
  // Manual reset of a team to its standard tasks, applied to all days + template
  const fixTeamTasks = (teamId) => {
    const std = STANDARD_TASKS[teamId];
    if (!std) return;
    setAllData(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(dk => {
        if (!Array.isArray(copy[dk])) return;
        copy[dk] = copy[dk].map(t => {
          if (t.id !== teamId) return t;
          const doneById = {};
          (t.tasks || []).forEach(tk => { doneById[tk.id] = !!tk.done; });
          return { ...t, tasks: std.map(x => ({ ...x, done: doneById[x.id] || false })) };
        });
      });
      saveAllData(copy);
      return copy;
    });
    try {
      const tmpl = deepClone();
      const fixed = tmpl.map(t => t.id === teamId ? { ...t, tasks: std.map(x => ({ ...x, done: false })) } : t);
      localStorage.setItem("anchorchain_template_v1", JSON.stringify(fixed));
    } catch {}
  };
  const fixGrowthGang = () => fixTeamTasks(4);
  const updateStats = (tid, stats) => save(teams.map(t => t.id === tid ? { ...t, stats } : t));
  const updateTaskLabel = (teamId, taskId, newLabel) => {
    save(teams.map(t => t.id === teamId ? { ...t, tasks: t.tasks.map(tk => tk.id === taskId ? { ...tk, label: newLabel } : tk) } : t));
    // Update the saved template so the rename is permanent across all days.
    // Start from a full template (merge saved template over the base so no team is missing).
    let base;
    try { base = JSON.parse(localStorage.getItem("anchorchain_template_v1")) || JSON.parse(JSON.stringify(TEMPLATE_TEAMS)); }
    catch { base = JSON.parse(JSON.stringify(TEMPLATE_TEAMS)); }
    // Ensure every base team from TEMPLATE_TEAMS exists in the template
    const baseIds = base.map(t => t.id);
    JSON.parse(JSON.stringify(TEMPLATE_TEAMS)).forEach(tt => { if (!baseIds.includes(tt.id)) base.push(tt); });
    const updatedTmpl = base.map(t => t.id === teamId ? { ...t, tasks: (t.tasks || []).map(tk => tk.id === taskId ? { ...tk, label: newLabel } : tk) } : t);
    try { localStorage.setItem("anchorchain_template_v1", JSON.stringify(updatedTmpl)); } catch {}
    // Also update every already-saved day so past/visited days reflect the new label immediately
    setAllData(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(dk => {
        copy[dk] = copy[dk].map(t => t.id === teamId ? { ...t, tasks: (t.tasks || []).map(tk => tk.id === taskId ? { ...tk, label: newLabel } : tk) } : t);
      });
      saveAllData(copy);
      return copy;
    });
  };

  const pct = getDayPct(teams, selectedDate);
  const yesterdayPct = (() => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() - 1);
    const ys = d.toISOString().slice(0, 10);
    return allData[ys] ? getDayPct(allData[ys], ys) : 0;
  })();
  const streak = (() => {
    let count = 0;
    const d = new Date(selectedDate + "T12:00:00");
    // Count back from yesterday for consecutive 100% days
    for (let i = 1; i <= 365; i++) {
      const check = new Date(d);
      check.setDate(check.getDate() - i);
      const cs = check.toISOString().slice(0, 10);
      if (allData[cs] && getDayPct(allData[cs], cs) === 100) count++;
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

        <CEODashboard yesterdayPct={yesterdayPct} streak={streak} date={selectedDate} onScorecardData={(sectionData) => {
          // Fill the Rain Makers scorecard (team id 10) for the selected date from photo data
          save(teams.map(t => {
            if (t.id !== 10 || !t.sections) return t;
            const newSections = t.sections.map(sec => {
              const rowsForSec = sectionData[sec.id];
              if (!rowsForSec || !Array.isArray(rowsForSec)) return sec;
              return { ...sec, rows: rowsForSec.map((cells, i) => ({ id: sec.id + "_p" + Date.now() + "_" + i, cells })) };
            });
            return { ...t, sections: newSections };
          }));
          // Mark the scorecard as filled for this date (counts as 100% complete)
          setScFilled(selectedDate, true);
          setOverallTick(t => t + 1);
        }} />
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
                <div key={`${team.id}_${refreshTick}`} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", width: isMobile ? "100%" : "auto" }}>
                  <div style={{ position: "relative", width: isMobile ? "100%" : "auto" }}>
                    <div style={{ position: "absolute", top: -32, left: 0, fontFamily: "monospace", fontSize: 16, color: "#555", letterSpacing: 2 }}>STEP {String(i + 1).padStart(2, "0")}</div>
                    {team.isStatCard
                      ? <StatCard team={team} date={selectedDate} isMobile={isMobile} onStatsChange={s => updateStats(team.id, s)} onFilledChange={() => setFilledTick(t => t + 1)} />
                      : team.isScoreCard
                        ? <ScoreCard team={team} date={selectedDate} isMobile={isMobile} onUpdate={s => save(teams.map(t => t.id === team.id ? { ...t, sections: s } : t))} onScFilledChange={() => setOverallTick(t => t + 1)} />
                      : team.isRainMakers
                        ? <RainMakersCard team={team} date={selectedDate} isMobile={isMobile} onToggle={kid => toggleTask(team.id, kid)} onDeleteTask={kid => deleteTask(team.id, kid)} onAddTask={l => addTask(team.id, l)} onEditLabel={(kid, nl) => updateTaskLabel(team.id, kid, nl)} onStaffChangeOverall={() => setOverallTick(t => t + 1)} />
                        : <TeamCard team={team} date={selectedDate} isMobile={isMobile} onToggle={kid => toggleTask(team.id, kid)} onAddTask={l => addTask(team.id, l)} onRename={n => renameTeam(team.id, n)} onEditLabel={(kid, nl) => updateTaskLabel(team.id, kid, nl)} onDeleteTask={kid => deleteTask(team.id, kid)} onFixTasks={() => fixTeamTasks(team.id)} onStaffChangeOverall={() => setOverallTick(t => t + 1)} />
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
