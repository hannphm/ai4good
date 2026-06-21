import React, { useState } from "react";
import PainScaleModal from "./PainScaleModal";

/**
 * Onboarding — 6-step intake wizard, restyled to match the Flarecast dashboard
 * (cream background, wide centered white card, navy + sun palette). No phone
 * frame, no external deps.
 *
 * Usage: <Onboarding onComplete={(profile) => {...}} />
 */

const STEPS = 6;
const NAVY = "#12344e";
const SUN = "#f2b705";

// ---- inline icons -----------------------------------------------------------
const Svg = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...props} />
);
const IconPencil = (p) => <Svg {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Svg>;
const IconSparkles = (p) => <Svg {...p}><path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8Z" /></Svg>;
const IconTrend = (p) => <Svg {...p}><polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" /></Svg>;
const IconWatch = (p) => <Svg {...p}><circle cx="12" cy="12" r="5" /><path d="M9 3h6M9 21h6M12 9v3l2 1" /></Svg>;
const IconCalendar = (p) => <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></Svg>;
const IconCheck = (p) => <Svg {...p} strokeWidth="3"><polyline points="20 6 9 17 4 12" /></Svg>;

// haloed sun, same as the dashboard
function Sun({ className = "h-28 w-28" }) {
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

// ---- shell + shared bits ----------------------------------------------------
function Shell({ children }) {
  return (
    <div className="min-h-screen w-full bg-[#faf6ee] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-xl">
        <div className="rounded-3xl border border-[#ece6d6] bg-white shadow-sm flex flex-col min-h-[560px] overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

function TopBar({ step, total, onBack }) {
  return (
    <div className="flex items-center gap-3 px-6 sm:px-8 pt-6 pb-4">
      <button onClick={onBack} disabled={step === 0}
        className="text-sm font-semibold text-[#12344e] disabled:opacity-30" aria-label="Back">← Back</button>
      <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step + 1}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-[#12344e]" : "bg-[#e7e0d1]"}`} />
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-500 tabular-nums">{step + 1}/{total}</span>
    </div>
  );
}

function PrimaryButton({ children, ...rest }) {
  return (
    <button {...rest}
      style={{ background: "#12344e" }}
      className="w-full h-14 rounded-2xl bg-[#12344e] text-white text-base font-bold shadow hover:opacity-90 active:scale-[0.99] transition disabled:opacity-50">
      {children}
    </button>
  );
}

function SkipLink({ onClick }) {
  return (
    <button onClick={onClick} className="w-full pt-4 text-center text-sm font-semibold text-slate-500 hover:text-[#12344e]">
      Skip for now
    </button>
  );
}

function StepIcon({ children }) {
  return <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#eaf3fb] text-[#12344e]">{children}</div>;
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-base font-extrabold text-[#12344e]">{label}</label>
      {children}
    </div>
  );
}

const FIELD_CLS = "w-full h-12 rounded-xl border-2 border-[#ece6d6] bg-white px-3 text-base text-[#12344e] focus:outline-none focus:ring-2 focus:ring-[#12344e]/30";
const INFO_BOX = "rounded-2xl bg-[#f3eee2] p-5 text-sm leading-relaxed text-slate-600";

// ---- screens ----------------------------------------------------------------
function Welcome({ onNext }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Sun />
        <h1 className="mt-6 text-4xl font-extrabold tracking-tight">
          <span className="text-[#12344e]">Flare</span><span style={{ color: SUN }}>cast</span>
        </h1>
        <h2 className="mt-6 text-2xl font-extrabold text-[#12344e]">Plan around your pain</h2>
        <p className="mt-3 max-w-sm text-slate-500 leading-relaxed">
          An app that helps people living with chronic pain track, manage, and anticipate when flare-ups might happen.
        </p>
      </div>
      <div className="pt-4">
        <PrimaryButton onClick={onNext}>Get started</PrimaryButton>
        <p className="pt-4 text-center text-sm text-slate-500">Not medical advice.</p>
      </div>
    </div>
  );
}

function HowItWorks({ onNext }) {
  const steps = [
    { icon: <IconPencil className="h-6 w-6" />, title: "Log", body: "Note your pain and day in seconds." },
    { icon: <IconSparkles className="h-6 w-6" />, title: "Learn", body: "It learns your personal patterns." },
    { icon: <IconTrend className="h-6 w-6" />, title: "Forecast", body: "See possible flare-ups ahead and plan." },
  ];
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-3xl font-extrabold text-[#12344e]">How Flarecast works</h1>
      <p className="mt-1 text-slate-500">Three simple steps.</p>
      <div className="mt-8 space-y-5">
        {steps.map((s) => (
          <div key={s.title} className="flex items-start gap-4">
            <StepIcon>{s.icon}</StepIcon>
            <div className="min-w-0 pt-1">
              <h3 className="text-lg font-extrabold text-[#12344e]">{s.title}</h3>
              <p className="text-slate-500">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1" />
      <div className={"mt-6 " + INFO_BOX}>
        Flarecast personalizes to you over the first few weeks as it learns from your entries. Early predictions are rough estimates and get more accurate the more you log.
      </div>
      <div className="pt-4"><PrimaryButton onClick={onNext}>Continue</PrimaryButton></div>
    </div>
  );
}

function About(props) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-3xl font-extrabold text-[#12344e]">A little about you</h1>
      <p className="mt-1 text-slate-500">Optional — helps personalize your setup.</p>

      <div className="mt-6 space-y-5">
        <Field label="What should we call you?">
          <input value={props.name} onChange={(e) => props.setName(e.target.value)} placeholder="Username" className={FIELD_CLS} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <select value={props.age} onChange={(e) => props.setAge(e.target.value)} className={FIELD_CLS + (props.age ? "" : " text-slate-400")}>
              <option value="" disabled>Select</option>
              {["Under 18", "18–24", "25–34", "35–44", "45–54", "55–64", "65+"].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Sex">
            <select value={props.sex} onChange={(e) => props.setSex(e.target.value)} className={FIELD_CLS + (props.sex ? "" : " text-slate-400")}>
              <option value="" disabled>Select</option>
              {["Female", "Male", "Intersex", "Prefer not to say"].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Condition">
          <select value={props.condition} onChange={(e) => props.setCondition(e.target.value)} className={FIELD_CLS + (props.condition ? "" : " text-slate-400")}>
            <option value="" disabled>Select</option>
            {["Neuropathy", "Fibromyalgia", "Migraine", "Arthritis", "Endometriosis", "Back pain", "Other", "Prefer not to say"].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </Field>

        <Field label="Years living with it">
          <input type="number" min={0} value={props.years} onChange={(e) => props.setYears(e.target.value)} placeholder="0" className={FIELD_CLS} />
        </Field>

        <p className="text-sm text-slate-500">Height &amp; weight are optional and never shown back to you.</p>
      </div>

      <div className="flex-1" />
      <div className="pt-6">
        <PrimaryButton onClick={props.onNext}>Continue</PrimaryButton>
        <SkipLink onClick={props.onSkip} />
      </div>
    </div>
  );
}

function painWord(n) {
  if (n <= 2) return "Very mild";
  if (n <= 4) return "Mild";
  if (n <= 6) return "Moderate";
  if (n <= 8) return "Severe";
  return "Very severe";
}

function FlarePoint({ value, setValue, onNext, onSkip }) {
  const [showScale, setShowScale] = useState(false);
  const roundBtn = "grid h-12 w-12 shrink-0 place-items-center rounded-full border-2 border-[#ece6d6] text-[#12344e] text-xl leading-none hover:bg-[#eaf3fb]";
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-3xl font-extrabold text-[#12344e]">Your flare-up point</h1>
      <p className="mt-1 text-slate-500">At what pain level does a day start to feel like a flare-up for you?</p>

      <div className="mt-10 text-center">
        <div className="text-6xl font-extrabold text-[#12344e] tabular-nums">{value}</div>
        <div className="mt-2 text-base font-semibold text-slate-500">{value} — {painWord(value)}</div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <button aria-label="Decrease" onClick={() => setValue(Math.max(1, value - 1))} className={roundBtn}>−</button>
        <input type="range" min={1} max={10} step={1} value={value} onChange={(e) => setValue(Number(e.target.value))} className="flex-1" />
        <button aria-label="Increase" onClick={() => setValue(Math.min(10, value + 1))} className={roundBtn}>+</button>
      </div>
      <div className="mt-2 flex justify-between text-xs font-semibold text-slate-500">
        <span>1 None</span><span>10 Worst</span>
      </div>

      <button type="button" onClick={() => setShowScale(true)}
        style={{ color: "#12344e" }}
        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold hover:underline">
        <span aria-hidden style={{ background: "#12344e" }}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-bold">?</span>
        See what each level means
      </button>

      <div className="mt-6 rounded-2xl bg-[#f3eee2] p-5 text-sm leading-relaxed text-slate-600">
        Not sure? Leave the default — Flarecast also learns your personal pattern over time, and you can change this anytime.
      </div>

      <div className="flex-1" />
      <div className="pt-6">
        <PrimaryButton onClick={onNext}>Continue</PrimaryButton>
        <SkipLink onClick={onSkip} />
      </div>

      <PainScaleModal open={showScale} onClose={() => setShowScale(false)} />
    </div>
  );
}

function ConnectCard({ icon, title, body, connected, onToggle }) {
  return (
    <div className="rounded-2xl border-2 border-[#ece6d6] bg-white p-4 flex items-start gap-4">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#eaf3fb] text-[#12344e]">{icon}</div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-extrabold text-[#12344e] leading-tight">{title}</h3>
        <p className="text-sm text-slate-500 mt-1">{body}</p>
      </div>
      <button onClick={onToggle} aria-pressed={connected}
        className={`shrink-0 self-center h-11 px-4 rounded-xl border-2 text-sm font-bold transition ${
          connected ? "bg-[#12344e] text-white border-[#12344e]" : "border-[#ece6d6] text-[#12344e] hover:bg-[#eaf3fb]"}`}>
        {connected ? "Connected ✓" : "Connect"}
      </button>
    </div>
  );
}

function Connect(props) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-3xl font-extrabold text-[#12344e]">Connect your data</h1>
      <p className="mt-1 text-slate-500">Optional — so you don't have to enter everything by hand.</p>

      <div className="mt-6 space-y-3">
        <ConnectCard icon={<IconWatch className="h-6 w-6" />} title="Smartwatch or fitness band" body="Sleep, steps, activity"
          connected={props.watchConn} onToggle={() => props.setWatchConn(!props.watchConn)} />
        <ConnectCard icon={<IconCalendar className="h-6 w-6" />} title="Your calendar" body="Plan around busier days"
          connected={props.calConn} onToggle={() => props.setCalConn(!props.calConn)} />
      </div>

      <p className="mt-4 text-sm text-slate-500">You choose what to connect, and can disconnect anytime.</p>

      <div className="flex-1" />
      <div className="pt-6">
        <PrimaryButton onClick={props.onNext}>Continue</PrimaryButton>
        <SkipLink onClick={props.onSkip} />
      </div>
    </div>
  );
}

function AllSet({ onEnter }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-[#eaf3fb] text-[#12344e]">
          <IconCheck className="h-9 w-9" />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-[#12344e]">You're all set</h1>
        <p className="mt-3 max-w-sm text-slate-500 leading-relaxed">
          No account needed — your entries stay on your device. Jump right in.
        </p>
        <div className="mt-8 w-full"><PrimaryButton onClick={onEnter}>Enter Flarecast</PrimaryButton></div>
      </div>
      <div className={INFO_BOX}>
        Not medical advice. Your data is protected, and any data used to improve the app is anonymized.
      </div>
    </div>
  );
}

// ---- main component ---------------------------------------------------------
export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [condition, setCondition] = useState("");
  const [years, setYears] = useState("");
  const [flarePoint, setFlarePoint] = useState(5);
  const [watchConn, setWatchConn] = useState(false);
  const [calConn, setCalConn] = useState(false);
  const [done, setDone] = useState(false);

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    const profile = {
      name, age, sex, condition,
      years_with_condition: years === "" ? null : Number(years),
      flare_threshold: flarePoint,
      connections: { smartwatch: watchConn, calendar: calConn },
    };
    if (onComplete) onComplete(profile);
    else setDone(true);
  };

  if (done) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center px-6 sm:px-8 py-10 text-center">
          <Sun className="h-32 w-32" />
          <h1 className="mt-6 text-3xl font-extrabold text-[#12344e]">Welcome to Flarecast</h1>
          <p className="mt-3 text-slate-500">This is where your home screen would live.</p>
          <button onClick={() => { setDone(false); setStep(0); }}
            className="mt-8 px-5 py-2.5 rounded-xl border-2 border-[#ece6d6] text-[#12344e] font-semibold hover:bg-[#eaf3fb]">
            Restart onboarding
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <TopBar step={step} total={STEPS} onBack={back} />
      <div key={step} className="flex flex-1 flex-col px-6 sm:px-8 pb-6 sm:pb-8">
        {step === 0 && <Welcome onNext={next} />}
        {step === 1 && <HowItWorks onNext={next} />}
        {step === 2 && (
          <About
            name={name} setName={setName}
            age={age} setAge={setAge}
            sex={sex} setSex={setSex}
            condition={condition} setCondition={setCondition}
            years={years} setYears={setYears}
            onNext={next} onSkip={next}
          />
        )}
        {step === 3 && <FlarePoint value={flarePoint} setValue={setFlarePoint} onNext={next} onSkip={next} />}
        {step === 4 && (
          <Connect
            watchConn={watchConn} setWatchConn={setWatchConn}
            calConn={calConn} setCalConn={setCalConn}
            onNext={next} onSkip={next}
          />
        )}
        {step === 5 && <AllSet onEnter={finish} />}
      </div>
    </Shell>
  );
}
