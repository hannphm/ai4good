import React, { useState } from "react";

/**
 * PredictionForm — the "Log activity" page. Collects today's inputs, posts them
 * to the backend, and shows the predicted pain level + flare-up risk.
 * Cream/navy theme, inline-styled colors (safe from the arbitrary-class issue).
 */

// 🔧 Point this at your backend.
const API_URL = "http://localhost:8000/predict";

const NAVY = "#12344e", CREAM = "#faf6ee", BORDER = "#ece6d6";
const SCALE_COLORS = {
  0: "#06b6d4", 1: "#10b981", 2: "#22c55e", 3: "#4ade80", 4: "#84cc16",
  5: "#eab308", 6: "#f97316", 7: "#ea580c", 8: "#dc2626", 9: "#b91c1c", 10: "#7f1d1d",
};
const painColor = (v) => SCALE_COLORS[Math.max(0, Math.min(10, Math.round(v)))];

const INITIAL = {
  patient_id: "", flare_threshold: "",
  sleep_hours: "7", sleep_quality: 7, stress_level: 4, mood: 7,
  exercise_minutes: "30", steps: "8000", medication_taken: 0,
  water_intake_liters: "2", screen_time_hours: "4", years_with_condition: "5", degenerative: 0,
};

function NumberField({ label, value, onChange, step = 1, suffix, optional, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={{ color: NAVY }}>
        {label}{optional && <span className="font-normal text-slate-400"> (optional)</span>}
      </label>
      <div className="flex items-center gap-2">
        <input type="number" step={step} value={value} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border-2 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          style={{ borderColor: BORDER, color: NAVY }} />
        {suffix && <span className="text-sm text-slate-400 shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

function ScaleField({ label, value, onChange }) {
  const clamp = (v) => Math.max(0, Math.min(10, v));
  const btn = "w-7 h-7 shrink-0 flex items-center justify-center rounded border text-sm leading-none hover:bg-slate-100";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium" style={{ color: NAVY }}>{label}</label>
        <span className="text-sm font-semibold" style={{ color: NAVY }}>{value}</span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(clamp(value - 1))} style={{ borderColor: BORDER, color: NAVY }} className={btn}>−</button>
        <input type="range" min={0} max={10} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" />
        <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(clamp(value + 1))} style={{ borderColor: BORDER, color: NAVY }} className={btn}>+</button>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium" style={{ color: NAVY }}>{label}</label>
      <div className="flex rounded-xl border-2 overflow-hidden" style={{ borderColor: BORDER }}>
        <button type="button" onClick={() => onChange(1)} style={value ? { background: NAVY, color: "white" } : { color: NAVY }} className="px-4 py-1.5 text-sm font-semibold">Yes</button>
        <button type="button" onClick={() => onChange(0)} style={!value ? { background: NAVY, color: "white" } : { color: NAVY }} className="px-4 py-1.5 text-sm font-semibold">No</button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      {children}
    </div>
  );
}

export default function PredictionForm() {
  const [form, setForm] = useState(INITIAL);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (String(form.patient_id).trim() === "") {
      setError("Please enter a Patient ID."); setStatus("error"); return;
    }
    setStatus("loading"); setError(""); setResult(null);

    const payload = {
      patient_id: Number(form.patient_id),
      sleep_hours: Number(form.sleep_hours),
      sleep_quality: Number(form.sleep_quality),
      stress_level: Number(form.stress_level),
      mood: Number(form.mood),
      exercise_minutes: Number(form.exercise_minutes),
      steps: Number(form.steps),
      medication_taken: form.medication_taken ? 1 : 0,
      water_intake_liters: Number(form.water_intake_liters),
      screen_time_hours: Number(form.screen_time_hours),
      years_with_condition: Number(form.years_with_condition),
      degenerative: form.degenerative ? 1 : 0,
    };
    if (String(form.flare_threshold).trim() !== "") payload.flare_threshold = Number(form.flare_threshold);

    try {
      const res = await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      setResult(await res.json()); setStatus("done");
    } catch (e) {
      setError(e.message || "Request failed"); setStatus("error");
    }
  };

  // Adjust these key names to match your backend's response.
  const pain = result?.predicted_pain_level ?? result?.pain_level ?? result?.predicted_pain ?? null;
  const flareRaw = result?.flare_risk ?? result?.flare_up_risk ?? result?.flare_probability ?? result?.flare_up ?? null;
  const flareText =
    flareRaw == null ? null
    : typeof flareRaw === "number" && flareRaw >= 0 && flareRaw <= 1 ? `${(flareRaw * 100).toFixed(0)}%`
    : flareRaw === 1 || flareRaw === true ? "Yes"
    : flareRaw === 0 || flareRaw === false ? "No"
    : String(flareRaw);

  return (
    <div className="min-h-full p-4 sm:p-6" style={{ background: CREAM }}>
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-extrabold" style={{ color: NAVY }}>Log today's activity</h1>
        <p className="mt-1 text-slate-500">Fill in today's details — Flarecast updates your predicted pain and flare-up risk.</p>

        <div className="mt-6 rounded-3xl border bg-white p-6 space-y-6" style={{ borderColor: BORDER }}>
          <Section title="Patient">
            <NumberField label="Patient ID" value={form.patient_id} onChange={set("patient_id")} placeholder="e.g. 123" />
            <NumberField label="Flare-up threshold" value={form.flare_threshold} onChange={set("flare_threshold")} step={0.1} optional placeholder="Auto-filled from Patient ID if blank" />
          </Section>

          <Section title="Sleep">
            <NumberField label="Sleep hours" value={form.sleep_hours} onChange={set("sleep_hours")} step={0.5} suffix="hrs" />
            <ScaleField label="Sleep quality" value={form.sleep_quality} onChange={set("sleep_quality")} />
          </Section>

          <Section title="Wellbeing">
            <ScaleField label="Stress level" value={form.stress_level} onChange={set("stress_level")} />
            <ScaleField label="Mood" value={form.mood} onChange={set("mood")} />
          </Section>

          <Section title="Activity">
            <NumberField label="Exercise minutes" value={form.exercise_minutes} onChange={set("exercise_minutes")} step={5} suffix="min" />
            <NumberField label="Daily steps" value={form.steps} onChange={set("steps")} step={100} />
          </Section>

          <Section title="Lifestyle">
            <Toggle label="Medication taken today?" value={form.medication_taken} onChange={set("medication_taken")} />
            <NumberField label="Water intake" value={form.water_intake_liters} onChange={set("water_intake_liters")} step={0.1} suffix="L" />
            <NumberField label="Screen time" value={form.screen_time_hours} onChange={set("screen_time_hours")} step={0.5} suffix="hrs" />
          </Section>

          <Section title="Condition">
            <NumberField label="Years with condition" value={form.years_with_condition} onChange={set("years_with_condition")} step={1} suffix="yrs" />
            <Toggle label="Is the condition degenerative?" value={form.degenerative} onChange={set("degenerative")} />
          </Section>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="button" onClick={submit} disabled={status === "loading"}
            style={{ background: NAVY }}
            className="w-full py-3 rounded-2xl text-white text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
            {status === "loading" ? "Predicting…" : "Save & predict"}
          </button>
        </div>

        {status === "done" && (
          <div className="mt-6 rounded-3xl border bg-white p-6" style={{ borderColor: BORDER }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: NAVY }}>Prediction</h3>
            {pain != null && (
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ background: painColor(pain), color: Math.round(pain) >= 7 ? "#fff" : NAVY }}>
                  {Number(pain).toFixed(1)}
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: NAVY }}>Predicted pain level</div>
                  <div className="text-xs text-slate-500">on the 0–10 scale</div>
                </div>
              </div>
            )}
            {flareText != null && (
              <div className="text-sm" style={{ color: NAVY }}>Flare-up risk: <span className="font-semibold">{flareText}</span></div>
            )}
            <details className="mt-3">
              <summary className="text-xs text-slate-400 cursor-pointer select-none">Raw response</summary>
              <pre className="mt-1 text-[11px] bg-slate-900 text-slate-100 rounded p-2 overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}
