import React from "react";

/**
 * Resources — crisis lines + curated reading/coping links. Cream/navy palette,
 * inline-styled colors, no external deps.
 *
 * NOTE: the link URLs below point to each organization's site. Set them to the
 * exact article pages you want before shipping (marked // LINK).
 */

const NAVY = "#12344e";
const CREAM = "#faf6ee";
const BORDER = "#ece6d6";

const CRISIS = [
  { region: "US", name: "988 Suicide & Crisis Lifeline", contact: "988", url: "https://988lifeline.org" },
  { region: "UK", name: "Samaritans", contact: "116 123", url: "https://www.samaritans.org" },
  { region: "GLOBAL", name: "Find a helpline", contact: "findahelpline.com", url: "https://findahelpline.com" },
];

const SECTIONS = [
  {
    title: "Understanding chronic pain",
    subtitle: "Plain-language primers from clinical organizations.",
    icon: "book",
    items: [
      { org: "NHS", title: "What is chronic pain?", desc: "Overview of how persistent pain differs from acute pain.", url: "https://www.nhs.uk/conditions/chronic-pain/" }, // LINK
      { org: "IASP", title: "Pain & the nervous system", desc: "How sensitization explains pain that outlives an injury.", url: "https://www.iasp-pain.org/" }, // LINK
      { org: "Mayo Clinic", title: "Tracking & flare patterns", desc: "Why journaling improves diagnosis and treatment plans.", url: "https://www.mayoclinic.org/diseases-conditions/chronic-pain" }, // LINK
    ],
  },
  {
    title: "Coping & mental wellbeing",
    subtitle: "Strategies that reduce the burden of long-term pain.",
    icon: "heart",
    items: [
      { org: "APA", title: "CBT for chronic pain", desc: "How cognitive behavioral therapy retrains the pain response.", url: "https://www.apa.org/" }, // LINK
      { org: "Harvard Health", title: "Mindfulness & pacing", desc: "Evidence-based pacing techniques to prevent flare-ups.", url: "https://www.health.harvard.edu/" }, // LINK
      { org: "Sleep Foundation", title: "Sleep hygiene for pain", desc: "Small habits that protect your most restorative sleep.", url: "https://www.sleepfoundation.org/" }, // LINK
    ],
  },
];

const Svg = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" {...props} />
);
const IconPhone = () => <Svg style={{ color: "#dc2626" }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></Svg>;
const IconBook = () => <Svg><path d="M2 5a2 2 0 0 1 2-2h6v17H4a2 2 0 0 1-2-2Z" /><path d="M22 5a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 0 2-2Z" /></Svg>;
const IconHeart = () => <Svg><path d="M20.8 4.6a5 5 0 0 0-7.1 0L12 6.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 20.5l8.8-8.8a5 5 0 0 0 0-7.1Z" /></Svg>;
const IconExternal = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-slate-400"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /></svg>;

function IconTile({ name }) {
  return (
    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: "#eaf3fb", color: NAVY }}>
      {name === "book" ? <IconBook /> : <IconHeart />}
    </div>
  );
}

function LinkCard({ org, title, desc, url }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="block rounded-2xl border bg-white p-5 transition hover:shadow-sm" style={{ borderColor: BORDER }}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{org}</div>
      <div className="mt-1 flex items-start justify-between gap-2">
        <h3 className="font-bold leading-tight" style={{ color: NAVY }}>{title}</h3>
        <IconExternal />
      </div>
      <p className="mt-2 text-sm text-slate-500">{desc}</p>
    </a>
  );
}

export default function Resources() {
  return (
    <div className="min-h-full p-4 sm:p-6" style={{ background: CREAM }}>
      <div className="mx-auto max-w-5xl">
        <div className="text-sm font-semibold text-slate-500">🛟 Resources</div>
        <h1 className="text-4xl font-extrabold" style={{ color: NAVY }}>Live better with chronic pain</h1>
        <p className="mt-2 max-w-2xl text-slate-500">
          Hand-picked reading, exercises, and communities. These are educational — they don't replace your clinician, but they can help you ask better questions.
        </p>

        {/* crisis */}
        <div className="mt-6 rounded-2xl border p-5" style={{ background: "#fdeaea", borderColor: "#f6d5d5" }}>
          <div className="flex items-start gap-3">
            <IconPhone />
            <div>
              <h2 className="font-bold" style={{ color: NAVY }}>In crisis? Reach a person now.</h2>
              <p className="text-sm text-slate-500">Chronic pain can feel overwhelming. You don't have to handle a hard moment alone.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CRISIS.map((c) => (
              <a key={c.region} href={c.url} target="_blank" rel="noopener noreferrer"
                className="block rounded-xl border bg-white p-4 hover:shadow-sm" style={{ borderColor: BORDER }}>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{c.region}</div>
                <div className="mt-1 font-bold" style={{ color: NAVY }}>{c.name}</div>
                <div className="text-slate-500">{c.contact}</div>
              </a>
            ))}
          </div>
        </div>

        {/* sections */}
        {SECTIONS.map((s) => (
          <div key={s.title} className="mt-8">
            <div className="flex items-center gap-3">
              <IconTile name={s.icon} />
              <div>
                <h2 className="text-xl font-extrabold" style={{ color: NAVY }}>{s.title}</h2>
                <p className="text-sm text-slate-500">{s.subtitle}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {s.items.map((it) => <LinkCard key={it.title} {...it} />)}
            </div>
          </div>
        ))}

        <p className="mt-8 pb-8 text-center text-xs text-slate-400">
          Educational resources only — not medical advice. Always consult your clinician.
        </p>
      </div>
    </div>
  );
}
