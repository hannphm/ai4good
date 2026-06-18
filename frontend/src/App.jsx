import React, { useState } from "react";
import Onboarding from "./Onboarding";
import PainBodySelector from "./PainBodySelector";
import PredictionForm from "./PredictionForm";
import Dashboard from "./Dashboard";
import UserHistory from "./UserHistory";
import Resources from "./Resources";

/**
 * App — the single entry point that unifies everything:
 *   1. First run  -> Onboarding wizard (collects the patient profile).
 *   2. After that -> the main app with a top nav:
 *        Home    : where the Pain Compass dashboard will go (placeholder for now)
 *        Log pain: your 3D Three.js body map
 *        Predict : the prediction form
 *
 * The onboarding profile is saved to localStorage so the wizard only shows once.
 */

const SUN = "#e9a93a";
const PROFILE_KEY = "flarecast_profile";

function loadProfile() {
  try {
    const s = localStorage.getItem(PROFILE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function TopNav({ tab, setTab, name, onReset }) {
  const tabBtn = (id, label) => (
    <button
      onClick={() => setTab(id)}
      className={"px-3 py-1.5 rounded-md text-sm font-medium transition " +
        (tab === id ? "bg-slate-800 text-white" : "text-slate-600 hover:bg-slate-100")}
    >
      {label}
    </button>
  );
  return (
    <header className="h-14 shrink-0 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-5">
        <span className="font-extrabold tracking-tight text-lg">
          <span className="text-slate-800">Flare</span><span style={{ color: SUN }}>cast</span>
        </span>
        <nav className="flex items-center gap-1">
          {tabBtn("home", "Dashboard")}
          {tabBtn("history", "User History")}
          {tabBtn("resources", "Resources")}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        {name && <span className="text-sm text-slate-500 hidden sm:block">Hi, {name}</span>}
        <button onClick={onReset} className="text-xs text-slate-400 hover:text-slate-600">Reset</button>
      </div>
    </header>
  );
}

// Placeholder Home — the Pain Compass dashboard will be converted into here next.
function Home({ profile, setTab }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-extrabold text-slate-800">
        Welcome{profile?.name ? `, ${profile.name}` : ""}
      </h1>
      <p className="mt-1 text-slate-500">
        Your dashboard will live here — calendar, trends, and contributing factors. For now, jump into a task:
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={() => setTab("log")}
          className="text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400 transition">
          <div className="text-base font-bold text-slate-800">Log pain</div>
          <div className="text-sm text-slate-500 mt-1">Mark where it hurts on the 3D body map.</div>
        </button>
        <button onClick={() => setTab("predict")}
          className="text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400 transition">
          <div className="text-base font-bold text-slate-800">Predict</div>
          <div className="text-sm text-slate-500 mt-1">Get today’s predicted pain & flare-up risk.</div>
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Your profile (from onboarding)</h2>
        <pre className="text-xs bg-slate-900 text-slate-100 rounded p-3 overflow-x-auto">
{JSON.stringify(profile, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState(loadProfile);
  const [tab, setTab] = useState("home");

  const completeOnboarding = (p) => {
    setProfile(p);
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {}
    setTab("home");
  };

  const reset = () => {
    try { localStorage.removeItem(PROFILE_KEY); } catch {}
    setProfile(null);
  };

  // Until onboarding is finished, that's the whole screen.
  if (!profile) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800">
      <TopNav tab={tab} setTab={setTab} name={profile.name} onReset={reset} />
      <main className="flex-1 min-h-0">
        {tab === "home" && <div className="h-full overflow-y-auto"><Dashboard profile={profile} onLogPain={() => setTab("log")} onLogActivity={() => setTab("predict")} /></div>}
        {tab === "log" && <div className="h-full"><PainBodySelector /></div>}
        {tab === "predict" && <div className="h-full overflow-y-auto"><PredictionForm /></div>}
        {tab === "history" && <div className="h-full overflow-y-auto"><UserHistory /></div>}
        {tab === "resources" && <div className="h-full overflow-y-auto"><Resources /></div>}
      </main>
    </div>
  );
}
