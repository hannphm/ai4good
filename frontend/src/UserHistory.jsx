import React, { useMemo, useState } from "react";

/**
 * UserHistory — the "Pain entries" page. Cream/navy palette, inline-styled
 * colors, no external deps. Uses SAMPLE entries; swap SAMPLE_ENTRIES for data
 * fetched from your backend (same shape).
 */

const NAVY = "#12344e";
const CREAM = "#faf6ee";
const BORDER = "#ece6d6";
const MILD = "#22c55e", MOD = "#f5b301", SEV = "#ef4444";
const levelColor = (n) => (n >= 7 ? SEV : n >= 4 ? MOD : MILD);
const levelWord = (n) => (n >= 7 ? "SEVERE" : n >= 4 ? "MODERATE" : "MILD");

// REAL DATA: replace with entries from your backend
const SAMPLE_ENTRIES = [
  { id: 1, date: "2026-06-15", level: 5, areas: ["Right knee", "Lower abdomen"], types: ["Cramping"], note: "Stressful meetings, tension built up in the neck.", factors: ["Poor sleep (<6h)", "Weather pressure drop", "High stress day"] },
  { id: 2, date: "2026-06-14", level: 5, areas: ["Left temple", "Neck"], types: ["Burning", "Tingling"], note: "Weather shift today, joints felt heavy.", factors: ["Poor sleep (<6h)", "Weather pressure drop", "High stress day", "Skipped stretching"] },
  { id: 3, date: "2026-06-13", level: 6, areas: ["Lower back"], types: ["Aching"], note: "Long day on my feet.", factors: ["Skipped stretching", "Dehydration"] },
  { id: 4, date: "2026-06-12", level: 7, areas: ["Lower back", "Right hip"], types: ["Stabbing"], note: "Bad flare after poor sleep.", factors: ["Poor sleep (<6h)", "High stress day"] },
  { id: 5, date: "2026-06-11", level: 4, areas: ["Neck"], types: ["Aching"], note: "Manageable today.", factors: ["Light exercise"] },
  { id: 6, date: "2026-06-10", level: 6, areas: ["Shoulders"], types: ["Throbbing"], note: "Tense from desk work.", factors: ["High stress day", "Skipped stretching"] },
  { id: 7, date: "2026-06-09", level: 3, areas: ["Left knee"], types: ["Aching"], note: "Good day.", factors: ["Light exercise"] },
  { id: 8, date: "2026-06-08", level: 7, areas: ["Lower back", "Abdomen"], types: ["Cramping"], note: "Pressure dropped, rough morning.", factors: ["Weather pressure drop", "Poor sleep (<6h)"] },
  { id: 9, date: "2026-06-07", level: 6, areas: ["Hands"], types: ["Tingling", "Numbness"], note: "Cold and damp.", factors: ["Weather pressure drop"] },
  { id: 10, date: "2026-06-06", level: 4, areas: ["Neck", "Shoulders"], types: ["Aching"], note: "Stretched in the morning, helped.", factors: ["Light exercise"] },
  { id: 11, date: "2026-06-05", level: 5, areas: ["Lower back"], types: ["Aching"], note: "Average.", factors: ["Dehydration"] },
  { id: 12, date: "2026-06-04", level: 8, areas: ["Lower back", "Both hips"], types: ["Stabbing"], note: "Worst day this month.", factors: ["Poor sleep (<6h)", "High stress day", "Weather pressure drop"] },
];

const RANGES = [["7", "Past 7 days"], ["30", "Past 30 days"], ["all", "All time"]];

function StatCard({ label, children }) {
  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: BORDER }}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      {children}
    </div>
  );
}

function IconSearch() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4"><circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" /></svg>;
}

export default function UserHistory({ entries = SAMPLE_ENTRIES }) {
  const [query, setQuery] = useState("");
  const [range, setRange] = useState("30");

  const now = useMemo(
    () => entries.reduce((m, e) => (new Date(e.date) > m ? new Date(e.date) : m), new Date(0)),
    [entries]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (range !== "all") {
        const days = (now - new Date(e.date)) / 86400000;
        if (days > Number(range)) return false;
      }
      if (!q) return true;
      const hay = [...e.areas, ...e.types, e.note].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [entries, query, range, now]);

  const avg = filtered.length ? (filtered.reduce((s, e) => s + e.level, 0) / filtered.length) : 0;
  const flareDays = filtered.filter((e) => e.level >= 6).length;

  return (
    <div className="min-h-full p-4 sm:p-6" style={{ background: CREAM }}>
      <div className="mx-auto max-w-5xl">
        <div className="text-sm font-semibold text-slate-500">Your history</div>
        <h1 className="text-4xl font-extrabold" style={{ color: NAVY }}>Pain entries</h1>
        <p className="mt-2 text-slate-500">A day-by-day record of pain you've logged. Filter by range or search by location, type, or note text.</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Entries shown"><div className="mt-1 text-4xl font-extrabold" style={{ color: NAVY }}>{filtered.length}</div></StatCard>
          <StatCard label="Average pain">
            <div className="mt-1 flex items-center gap-2 text-4xl font-extrabold" style={{ color: NAVY }}>
              {avg.toFixed(1)}<span className="h-3 w-3 rounded-full" style={{ background: levelColor(Math.round(avg)) }} />
            </div>
          </StatCard>
          <StatCard label="Flare days">
            <div className="mt-1 text-4xl font-extrabold" style={{ color: NAVY }}>{flareDays}</div>
            <div className="text-sm text-slate-400">pain ≥ 6</div>
          </StatCard>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border bg-white p-3 sm:flex-row sm:items-center" style={{ borderColor: BORDER }}>
          <div className="flex flex-1 items-center gap-2 px-2 text-slate-400">
            <IconSearch />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search location, type, or notes"
              className="w-full bg-transparent py-1.5 text-sm text-slate-700 focus:outline-none" />
          </div>
          <div className="flex gap-1">
            {RANGES.map(([k, label]) => {
              const sel = range === k;
              return (
                <button key={k} onClick={() => setRange(k)}
                  style={sel ? { background: "#dcecfa", color: NAVY } : {}}
                  className={"rounded-full px-3 py-1.5 text-sm font-medium " + (sel ? "" : "text-slate-500 hover:bg-slate-100")}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 space-y-4 pb-8">
          {filtered.length === 0 && <p className="py-8 text-center text-slate-400">No entries match your search.</p>}
          {filtered.map((e) => {
            const d = new Date(e.date + "T00:00:00");
            const pretty = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
            return (
              <div key={e.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: BORDER }}>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 text-center">
                    <div className="grid h-14 w-14 place-items-center rounded-full text-lg font-bold text-white" style={{ background: levelColor(e.level) }}>{e.level}</div>
                    <div className="mt-1 text-[10px] font-semibold text-slate-400">{levelWord(e.level)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold" style={{ color: NAVY }}>{pretty}</span>
                      <span className="text-sm text-slate-400">📅 {e.date}</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Areas: {e.areas.join(", ")} <span className="text-slate-300">·</span> Type: {e.types.join(", ")}
                    </div>
                    {e.note && (
                      <div className="mt-3 rounded-xl p-3 text-sm italic text-slate-600" style={{ background: "#f4f1e8" }}>
                        “{e.note}”
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {e.factors.map((f) => (
                        <span key={f} className="rounded-full border px-2.5 py-0.5 text-xs text-slate-500" style={{ borderColor: BORDER }}>{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
