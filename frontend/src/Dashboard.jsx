import React, { useState } from "react";

/**
 * Dashboard — the Flarecast home screen, converted to plain React + Tailwind.
 * No charting/date libraries: the trends line chart is hand-drawn SVG and the
 * calendar is built with native Date.
 *
 * Props:
 *   profile     — from onboarding (uses profile.name)
 *   onLogPain   — called when the user wants to open the 3D body map
 *   onLogActivity — optional, for the "Log Activity" button
 *
 * The calendar / trends / factors below use SAMPLE data. Where you see
 * "// REAL DATA:" is where you'd swap in entries fetched from your backend.
 */

const NAVY = "#12344e";
const CREAM = "#faf6ee";
const SUN = "#f2b705";

// pain level -> bucket + color
const MILD = "#22c55e", MOD = "#f5b301", SEV = "#ef4444";
function levelColor(n) { return n >= 7 ? SEV : n >= 4 ? MOD : MILD; }
const FSvg = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" {...props} />
);
const ChevDown = () => <FSvg><polyline points="6 9 12 15 18 9" /></FSvg>;
const ChevUp = () => <FSvg><polyline points="6 15 12 9 18 15" /></FSvg>;
const Check = () => <FSvg><polyline points="20 6 9 17 4 12" /></FSvg>;
const ThumbUp = () => (
  <FSvg><path d="M7 22V11" /><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.3a2 2 0 0 0 2-1.7l1.4-9a2 2 0 0 0-2-2.3H14z" /></FSvg>
);
const FEEDBACK = [
  { key: "low",  label: "Too Low",  icon: <ChevDown />, msg: "Got it — we'll raise tomorrow's prediction." },
  { key: "yes",  label: "Yes",      icon: <ThumbUp />,  msg: "Thanks — we'll keep doing what's working." },
  { key: "high", label: "Too High", icon: <ChevUp />,   msg: "Got it — we'll soften tomorrow's prediction." },
];
function levelWord(n) { return n >= 7 ? "Severe" : n >= 4 ? "Moderate" : "Mild"; }

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "good morning";
  if (h < 18) return "good afternoon";
  return "good evening";
}

// ---- sun illustration -------------------------------------------------------
function SunArt({ className = "h-40 w-40" }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="48" fill="#eaf3fb" />
      <circle cx="60" cy="60" r="22" fill={SUN} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        return (
          <line key={i}
            x1={60 + Math.cos(a) * 30} y1={60 + Math.sin(a) * 30}
            x2={60 + Math.cos(a) * 42} y2={60 + Math.sin(a) * 42}
            stroke={SUN} strokeWidth="4" strokeLinecap="round" />
        );
      })}
    </svg>
  );
}

function Card({ className = "", children }) {
  return (
    <div className={"rounded-3xl border bg-white p-6 shadow-sm " + className} style={{ borderColor: "#ece6d6" }}>
      {children}
    </div>
  );
}

// ---- greeting card ----------------------------------------------------------
function GreetingCard({ profile, onLogActivity }) {
  const [feedback, setFeedback] = useState(null);
  const today = new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const predicted = 5; // REAL DATA: today's predicted pain level from your model

  return (
    <Card className="relative overflow-hidden">
      <h1 className="text-4xl font-extrabold leading-tight" style={{ color: NAVY }}>
        {greeting()},<br />{profile?.name || "there"}
      </h1>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
        style={{ background: "#dcecfa", color: NAVY }}>
        <span aria-hidden>📅</span> {today}
      </div>

      <p className="mt-4 text-slate-500">Track your pain and activities to improve predictions.</p>

      <button onClick={onLogActivity}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-white font-bold shadow hover:opacity-90"
        style={{ background: NAVY }}>
        <span className="text-lg leading-none">＋</span> Log Activity
      </button>

      <div className="mt-6 text-slate-700">
        Your predicted pain today was{" "}
        <span className="rounded-md px-2 py-0.5 text-sm font-semibold" style={{ background: "#fde9b8", color: NAVY }}>
          {predicted} · {levelWord(predicted)}
        </span>{" "}
        Was this correct?
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {FEEDBACK.map((f) => {
          const sel = feedback === f.key;
          return (
            <button key={f.key} onClick={() => setFeedback(f.key)}
              style={sel
                ? { background: "#dcecfa", color: NAVY, border: `2px solid ${NAVY}` }
                : { background: NAVY, color: "white", border: "2px solid transparent" }}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition">
              {sel ? <Check /> : f.icon}
              {f.label}
            </button>
          );
        })}
      </div>
      {feedback && (
        <p className="mt-3 inline-flex items-center gap-2 text-sm font-medium" style={{ color: NAVY }}>
          <Check />
          {FEEDBACK.find((f) => f.key === feedback).msg}
        </p>
      )}

      <div className="pointer-events-none absolute -right-6 top-24 hidden sm:block">
        <SunArt />
      </div>
    </Card>
  );
}

// ---- log pain launch --------------------------------------------------------
function LogPainCard({ onLogPain }) {
  return (
    <Card className="flex flex-col">
      <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>Log your pain</h2>
      <p className="mt-2 text-slate-500">Open the 3D body map to mark where it hurts, set intensity, and pick the pain type.</p>

      <div className="my-6 flex flex-1 items-center justify-center gap-6">
        {["FRONT", "BACK"].map((side) => (
          <div key={side} className="text-center">
            <svg viewBox="0 0 60 140" className="h-44 w-auto">
              <g fill="#d8dde3">
                <circle cx="30" cy="16" r="10" />
                <rect x="18" y="28" width="24" height="40" rx="10" />
                <rect x="8" y="32" width="9" height="36" rx="4" />
                <rect x="43" y="32" width="9" height="36" rx="4" />
                <rect x="20" y="66" width="9" height="50" rx="4" />
                <rect x="31" y="66" width="9" height="50" rx="4" />
              </g>
            </svg>
            <div className="mt-1 text-xs font-semibold text-slate-400">{side}</div>
          </div>
        ))}
      </div>

      <button onClick={onLogPain}
        className="w-full rounded-2xl py-3 text-white font-bold shadow hover:opacity-90" style={{ background: NAVY }}>
        Open body map →
      </button>
    </Card>
  );
}

// ---- pain trends (hand-drawn SVG) -------------------------------------------
// REAL DATA: replace with {level, predicted} per day from your history + forecast
const TREND = [
  4, 6, 7, 7, 5, 7, 6, 5, 6, 7, 5, 6, 5, 5,   // past 2 weeks (last = today)
  5, 4, 5, 7, 8, 7, 4,                          // next 7 days (predicted)
];
const TODAY_IDX = 13;

function TrendsChart() {
  const W = 560, H = 220, padL = 26, padR = 10, padT = 10, padB = 26;
  const n = TREND.length;
  const x = (i) => padL + (i * (W - padL - padR)) / (n - 1);
  const y = (v) => padT + (1 - v / 10) * (H - padT - padB);
  const pts = TREND.map((v, i) => [x(i), y(v)]);

  const pastPath = pts.slice(0, TODAY_IDX + 1).map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  const futPath = pts.slice(TODAY_IDX).map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  const area = pastPath + ` L ${x(TODAY_IDX)} ${y(0)} L ${x(0)} ${y(0)} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 2, 4, 6, 8, 10].map((g) => (
        <g key={g}>
          <line x1={padL} y1={y(g)} x2={W - padR} y2={y(g)} stroke="#eee" strokeDasharray="3 3" />
          <text x={2} y={y(g) + 3} fontSize="9" fill="#9aa3ad">{g}</text>
        </g>
      ))}
      {/* today divider */}
      <line x1={x(TODAY_IDX)} y1={padT} x2={x(TODAY_IDX)} y2={H - padB} stroke={NAVY} strokeDasharray="4 4" opacity="0.5" />
      <text x={x(TODAY_IDX)} y={padT + 2} fontSize="9" fill={NAVY} textAnchor="middle">Today</text>
      {/* fill + lines */}
      <path d={area} fill={SUN} opacity="0.12" />
      <path d={pastPath} fill="none" stroke={SUN} strokeWidth="3" strokeLinejoin="round" />
      <path d={futPath} fill="none" stroke={NAVY} strokeWidth="3" strokeDasharray="5 5" opacity="0.55" strokeLinejoin="round" />
      {/* x labels */}
      {[0, 4, 8, 13, 17, 20].map((i) => (
        <text key={i} x={x(i)} y={H - 6} fontSize="9" fill="#9aa3ad" textAnchor="middle">
          {`Jun ${2 + i}`}
        </text>
      ))}
    </svg>
  );
}

// ---- contributing factors ---------------------------------------------------
// REAL DATA: from your model's SHAP / feature attributions
const FACTORS = [
  { label: "Poor sleep (<6h)", dir: "up" },
  { label: "Weather pressure drop", dir: "up" },
  { label: "High stress day", dir: "up" },
  { label: "Skipped stretching", dir: "up" },
  { label: "Dehydration", dir: "up" },
  { label: "Light exercise", dir: "down" },
];

function Factors() {
  return (
    <div className="space-y-2">
      {FACTORS.map((f) => (
        <div key={f.label} className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ borderColor: "#ece6d6" }}>
          <span className="text-lg leading-none" style={{ color: f.dir === "up" ? SEV : MILD }}>
            {f.dir === "up" ? "↗" : "↘"}
          </span>
          <span className="font-medium" style={{ color: NAVY }}>{f.label}</span>
        </div>
      ))}
    </div>
  );
}

// ---- calendar ---------------------------------------------------------------
// REAL DATA: map of "YYYY-MM-DD" -> { level, predicted }
const SAMPLE_LEVELS = [3, 4, 8, 8, 8, 5, 4, 7, 7, 6, 8, 4, 7, 5, 5, 4, 4, 7, 8, 7, 6, 5, 3, 4, 4, 4, 4, 3, 4, 4, 3];

function Calendar() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [view, setView] = useState("Month");

  const todayDate = now.getDate();
  const isThisMonth = month === now.getMonth() && year === now.getFullYear();
  const first = new Date(year, month, 1).getDay();
  const daysIn = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const shift = (d) => {
    let m = month + d, y = year;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  };

  const cells = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);

  const weekRowStart = isThisMonth ? Math.floor((first + todayDate - 1) / 7) * 7 : 0;
  const visible = view === "Week" ? cells.slice(weekRowStart, weekRowStart + 7) : cells;

  const dayInfo = (d) => {
    const level = SAMPLE_LEVELS[(d - 1) % SAMPLE_LEVELS.length];
    const predicted = isThisMonth && d > todayDate;
    return { level, predicted, flare: level >= 6 };
  };

  return (
    <Card>
      <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>Calendar View</h2>
      <p className="mt-1 text-slate-500">Past entries and future predicted pain levels</p>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => shift(-1)} className="text-slate-400 hover:text-slate-700">‹</button>
          <span className="font-bold" style={{ color: NAVY }}>{monthName}</span>
          <button onClick={() => shift(1)} className="text-slate-400 hover:text-slate-700">›</button>
        </div>
        <div className="flex rounded-full border overflow-hidden text-sm" style={{ borderColor: "#ece6d6" }}>
          {["Week", "Month"].map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={"px-3 py-1 font-medium " + (view === v ? "text-white" : "text-slate-500")}
              style={view === v ? { background: NAVY } : {}}>{v}</button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-slate-400">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1.5">
        {visible.map((d, i) => {
          if (!d) return <div key={i} />;
          const { level, predicted, flare } = dayInfo(d);
          const isToday = isThisMonth && d === todayDate;
          return (
            <div key={i}
              className="relative h-14 rounded-xl border flex flex-col items-center justify-start pt-1"
              style={{
                borderColor: isToday ? NAVY : "#ece6d6",
                background: isToday ? "#dcecfa" : flare ? "#fde8e8" : "white",
              }}>
              <span className="text-xs font-bold" style={{ color: NAVY }}>{d}</span>
              <span className="absolute bottom-1.5 h-2.5 w-2.5 rounded-full"
                style={predicted
                  ? { border: `2px dashed ${levelColor(level)}` }
                  : { background: levelColor(level) }} />
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <Legend color={MILD} label="Mild" /><Legend color={MOD} label="Moderate" /><Legend color={SEV} label="Severe" />
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ border: "2px dashed #9aa3ad" }} /> Predicted</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-3.5 rounded" style={{ background: "#fde8e8" }} /> Flare-up day</span>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl p-4 text-sm text-slate-500" style={{ background: "#f3eee2" }}>
        <span aria-hidden>ⓘ</span>
        Predicted scores are generated by AI and not 100% accurate. Please use predictions with caution and consult your clinician.
      </div>
    </Card>
  );
}

function Legend({ color, label }) {
  return <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {label}</span>;
}

// ---- the dashboard ----------------------------------------------------------
export default function Dashboard({ profile, onLogPain, onLogActivity }) {
  return (
    <div className="min-h-full p-4 sm:p-6" style={{ background: CREAM }}>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GreetingCard profile={profile} onLogActivity={onLogActivity} />
          <LogPainCard onLogPain={onLogPain} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Calendar />
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>Pain Trends</h2>
                <button className="rounded-full border px-3 py-1 text-sm text-slate-600" style={{ borderColor: "#ece6d6" }}>View Full Report</button>
              </div>
              <p className="mt-1 text-slate-500">Pain levels over the last 2 weeks and next 7 days</p>
              <div className="mt-4"><TrendsChart /></div>
            </Card>
            <Card>
              <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>Contributing Factors</h2>
              <p className="mt-1 text-slate-500">Factors most strongly impacting your predicted pain</p>
              <div className="mt-4"><Factors /></div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
