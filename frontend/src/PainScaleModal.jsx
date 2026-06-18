import React, { useEffect } from "react";

// 0–10 pain severity scale (Comparative Pain Scale).
const PAIN_SCALE = [
  { level: 10, label: "Unable to Move",  color: "#7f1d1d", desc: "I am in bed and can’t move due to my pain. I need someone to take me to the emergency room to get help for my pain." },
  { level: 9,  label: "Severe",          color: "#b91c1c", desc: "My pain is all that I can think about. I can barely talk or move because of the pain." },
  { level: 8,  label: "Intense",         color: "#dc2626", desc: "My pain is so severe that it is hard to think of anything else. Talking and listening are difficult." },
  { level: 7,  label: "Unmanageable",    color: "#ea580c", desc: "I am in pain all the time. It keeps me from doing most activities." },
  { level: 6,  label: "Distressing",     color: "#f97316", desc: "I think about my pain all of the time. I give up many activities because of my pain." },
  { level: 5,  label: "Distracting",     color: "#eab308", desc: "I think about my pain most of the time. I cannot do some of the activities I need to do each day because of the pain." },
  { level: 4,  label: "Moderate",        color: "#84cc16", desc: "I am constantly aware of my pain but I can continue most activities." },
  { level: 3,  label: "Uncomfortable",   color: "#4ade80", desc: "My pain bothers me but I can ignore it most of the time." },
  { level: 2,  label: "Mild",            color: "#22c55e", desc: "I have a low level of pain. I am aware of my pain only when I pay attention to it." },
  { level: 1,  label: "Minimal",         color: "#10b981", desc: "My pain is hardly noticeable." },
  { level: 0,  label: "No Pain",         color: "#06b6d4", desc: "I have no pain." },
];

export default function PainScaleModal({ open, onClose }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pain-scale-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 id="pain-scale-title" className="text-base font-semibold text-slate-800">0–10 pain severity scale</h2>
          <button type="button" onClick={onClose} aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">✕</button>
        </div>

        <div className="overflow-y-auto px-5 py-3 space-y-1.5">
          {PAIN_SCALE.map((p) => (
            <div key={p.level} className="flex items-start gap-3">
              <div
                className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: p.color, color: p.level >= 7 ? "#ffffff" : "#1f2937" }}
              >
                {p.level}
              </div>
              <div className="pt-0.5">
                <div className="text-sm font-semibold text-slate-800 leading-tight">{p.label}</div>
                <div className="text-xs text-slate-500 leading-snug">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 text-right">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-700">Got it</button>
        </div>
      </div>
    </div>
  );
}
