import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import PainScaleModal from "./PainScaleModal";

/**
 * PainBodySelector — 3D body map, styled to match the Flarecast dashboard
 * (cream/navy, card layout). Tap the single-mesh model; the tap location is
 * classified into a body region. Tunable constants are at the top.
 */

// ---- tunables (flip / adjust if orientation or size looks off) -------------
const Z_MIN = -1.3443, Z_MAX = 0.6630; // model height bounds (geometry space)
const LEFT_IS_POSITIVE_X = true;        // flip if left/right are mirrored
const FRONT_SIGN = -1;                  // flip if chest/back are swapped
const MODEL_SCALE = 3.0;                // how tall the figure renders

// ---- palette ----------------------------------------------------------------
const NAVY = "#12344e", CREAM = "#faf6ee", BORDER = "#ece6d6";

// ---- region scheme (your ML feature columns) -------------------------------
const REGIONS = [
  { id: "head_front", label: "Face / Head (front)", side: "center", group: "head" },
  { id: "head_back", label: "Head (back)", side: "center", group: "head" },
  { id: "neck", label: "Neck", side: "center", group: "neck" },
  { id: "chest", label: "Chest", side: "center", group: "torso" },
  { id: "upper_back", label: "Upper back", side: "center", group: "torso" },
  { id: "abdomen", label: "Abdomen", side: "center", group: "torso" },
  { id: "lower_back", label: "Lower back", side: "center", group: "torso" },
  { id: "shoulder_l", label: "Shoulder", side: "left", group: "arm" },
  { id: "shoulder_r", label: "Shoulder", side: "right", group: "arm" },
  { id: "upper_arm_l", label: "Upper arm", side: "left", group: "arm" },
  { id: "upper_arm_r", label: "Upper arm", side: "right", group: "arm" },
  { id: "forearm_l", label: "Forearm", side: "left", group: "arm" },
  { id: "forearm_r", label: "Forearm", side: "right", group: "arm" },
  { id: "hand_l", label: "Hand", side: "left", group: "arm" },
  { id: "hand_r", label: "Hand", side: "right", group: "arm" },
  { id: "hip_l", label: "Hip", side: "left", group: "leg" },
  { id: "hip_r", label: "Hip", side: "right", group: "leg" },
  { id: "thigh_l", label: "Thigh", side: "left", group: "leg" },
  { id: "thigh_r", label: "Thigh", side: "right", group: "leg" },
  { id: "knee_l", label: "Knee", side: "left", group: "leg" },
  { id: "knee_r", label: "Knee", side: "right", group: "leg" },
  { id: "calf_l", label: "Lower leg", side: "left", group: "leg" },
  { id: "calf_r", label: "Lower leg", side: "right", group: "leg" },
  { id: "foot_l", label: "Foot", side: "left", group: "leg" },
  { id: "foot_r", label: "Foot", side: "right", group: "leg" },
];
const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
const PAIN_TYPES = ["Aching", "Burning", "Stabbing", "Throbbing", "Tingling"];

function classifyPoint(p) {
  const h = (p.z - Z_MIN) / (Z_MAX - Z_MIN);
  const isLeft = LEFT_IS_POSITIVE_X ? p.x > 0 : p.x < 0;
  const S = isLeft ? "l" : "r";
  const front = p.y * FRONT_SIGN >= 0;
  const ax = Math.abs(p.x);
  if (ax > 0.3) {
    if (h > 0.8) return `shoulder_${S}`;
    if (h > 0.62) return `upper_arm_${S}`;
    if (h > 0.45) return `forearm_${S}`;
    return `hand_${S}`;
  }
  if (h > 0.93) return front ? "head_front" : "head_back";
  if (h > 0.87) return "neck";
  if (h > 0.68) return front ? "chest" : "upper_back";
  if (h > 0.52) return front ? "abdomen" : "lower_back";
  if (h > 0.45) return `hip_${S}`;
  if (h > 0.24) return `thigh_${S}`;
  if (h > 0.17) return `knee_${S}`;
  if (h > 0.06) return `calf_${S}`;
  return `foot_${S}`;
}

// ---- intensity -> color (matches the 0–10 pain scale) ----------------------
const SCALE_COLORS = {
  0: "#06b6d4", 1: "#10b981", 2: "#22c55e", 3: "#4ade80", 4: "#84cc16",
  5: "#eab308", 6: "#f97316", 7: "#ea580c", 8: "#dc2626", 9: "#b91c1c", 10: "#7f1d1d",
};
function intensityColor(intensity) {
  const level = Math.max(0, Math.min(10, Math.round(intensity)));
  return new THREE.Color(SCALE_COLORS[level]);
}

let MARK_SEQ = 0;

export default function PainBodySelector() {
  const mountRef = useRef(null);
  const outerGroupRef = useRef(null);
  const markersGroupRef = useRef(null);
  const targetsRef = useRef([]);
  const marksRef = useRef({});

  const [marks, setMarks] = useState({});
  const [defaultIntensity, setDefaultIntensity] = useState(5);
  const [status, setStatus] = useState("loading");
  const [showScale, setShowScale] = useState(false);
  const [note, setNote] = useState("");

  marksRef.current = marks;

  const addMark = useCallback((regionId, local) => {
    const r = REGION_BY_ID[regionId];
    const id = `m${MARK_SEQ++}`;
    setMarks((prev) => ({
      ...prev,
      [id]: { regionId, label: r.label, side: r.side, group: r.group,
        local: [local.x, local.y, local.z], intensity: defaultIntensity, type: PAIN_TYPES[0] },
    }));
  }, [defaultIntensity]);

  const updateMark = useCallback((id, patch) =>
    setMarks((prev) => (prev[id] ? { ...prev, [id]: { ...prev[id], ...patch } } : prev)), []);
  const removeMark = useCallback((id) =>
    setMarks((prev) => { const n = { ...prev }; delete n[id]; return n; }), []);
  const clearAll = useCallback(() => setMarks({}), []);

  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "display:block;position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab;";

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));
    const key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(2, 4, 5); scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35); fill.position.set(-3, 1, -4); scene.add(fill);

    const outerGroup = new THREE.Group(); scene.add(outerGroup); outerGroupRef.current = outerGroup;
    const markersGroup = new THREE.Group(); outerGroup.add(markersGroup); markersGroupRef.current = markersGroup;

    new GLTFLoader().load(
      "/bodymodel.glb",
      (gltf) => {
        const inner = new THREE.Group();
        inner.add(gltf.scene);
        let box = new THREE.Box3().setFromObject(inner);
        const s = box.getSize(new THREE.Vector3());
        if (s.z > s.y && s.z >= s.x) inner.rotation.x = -Math.PI / 2;
        else if (s.x > s.y && s.x > s.z) inner.rotation.z = Math.PI / 2;

        const targets = [];
        gltf.scene.traverse((o) => {
          if (o.isMesh) {
            o.material = new THREE.MeshStandardMaterial({ color: "#c4c9d2", roughness: 0.85, metalness: 0 });
            targets.push(o);
          }
        });
        targetsRef.current = targets;

        inner.updateMatrixWorld(true);
        box = new THREE.Box3().setFromObject(inner);
        const center = box.getCenter(new THREE.Vector3());
        const dims = box.getSize(new THREE.Vector3());
        inner.position.sub(center);
        outerGroup.add(inner);
        outerGroup.scale.setScalar(MODEL_SCALE / Math.max(dims.x, dims.y, dims.z));
        setStatus("ready");
      },
      undefined,
      (err) => { console.error("GLB load failed:", err); setStatus("error"); }
    );

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let dragging = false, moved = false, last = { x: 0, y: 0 };

    const setPointer = (cx, cy) => {
      const r = renderer.domElement.getBoundingClientRect();
      pointer.x = ((cx - r.left) / r.width) * 2 - 1;
      pointer.y = -((cy - r.top) / r.height) * 2 + 1;
    };
    const onDown = (e) => { dragging = true; moved = false; last = { x: e.clientX, y: e.clientY }; renderer.domElement.style.cursor = "grabbing"; };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - last.x, dy = e.clientY - last.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      outerGroup.rotation.y += dx * 0.01;
      outerGroup.rotation.x = Math.max(-0.5, Math.min(0.5, outerGroup.rotation.x + dy * 0.006));
      last = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e) => {
      renderer.domElement.style.cursor = "grab";
      if (dragging && !moved && targetsRef.current.length) {
        setPointer(e.clientX, e.clientY);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObjects(targetsRef.current, true);
        if (hits.length) {
          const mesh = hits[0].object;
          const original = mesh.worldToLocal(hits[0].point.clone());
          const localInGroup = outerGroup.worldToLocal(hits[0].point.clone());
          addMark(classifyPoint(original), localInGroup);
        }
      }
      dragging = false;
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    outerGroup.userData.setView = (which) => { outerGroup.rotation.x = 0; outerGroup.rotation.y = which === "back" ? Math.PI : 0; };

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    let pending = false;
    const ro = new ResizeObserver(() => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; resize(); });
    });
    ro.observe(mount);

    let raf;
    const tick = () => { renderer.render(scene, camera); raf = requestAnimationFrame(tick); };
    tick();

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addMark]);

  useEffect(() => {
    const g = markersGroupRef.current;
    if (!g) return;
    while (g.children.length) { const c = g.children.pop(); c.geometry?.dispose(); c.material?.dispose(); }
    const geo = new THREE.SphereGeometry(0.05, 16, 12);
    for (const id in marks) {
      const m = marks[id];
      const col = intensityColor(m.intensity);
      const mat = new THREE.MeshStandardMaterial({ color: col, emissive: col.clone().multiplyScalar(0.3) });
      const sph = new THREE.Mesh(geo, mat);
      sph.position.set(m.local[0], m.local[1], m.local[2]);
      g.add(sph);
    }
  }, [marks]);

  const setView = (which) => outerGroupRef.current?.userData.setView?.(which);

  const exportEntry = {
    logged_at: new Date().toISOString(),
    note: note.trim(),
    regions: Object.values(marks).map((m) => ({
      region_id: m.regionId, label: m.label, side: m.side, group: m.group,
      intensity: m.intensity, pain_type: m.type,
    })),
  };
  const markIds = Object.keys(marks);

  const stepBtn = "w-6 h-6 shrink-0 flex items-center justify-center rounded border text-sm leading-none hover:bg-slate-100";
  const pill = "rounded-lg border bg-white/90 px-3 py-1.5 text-xs font-semibold hover:bg-white shadow-sm";

  return (
    <div className="h-full flex flex-col" style={{ background: CREAM, color: NAVY }}>
      <div className="flex items-start justify-between gap-4 px-4 sm:px-6 pt-5 pb-3">
        <div>
          <h1 className="text-3xl font-extrabold" style={{ color: NAVY }}>Log your pain</h1>
          <p className="text-sm text-slate-500">Drag to rotate. Tap the body where it hurts to drop a marker.</p>
        </div>
        <button onClick={() => setShowScale(true)} style={{ borderColor: BORDER, color: NAVY }}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border-2 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-slate-50">
          <span aria-hidden style={{ background: NAVY }} className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white text-xs font-bold">?</span>
          Pain scale
        </button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 px-4 sm:px-6 pb-5">
        {/* viewport */}
        <div className="relative lg:flex-[3] min-h-[45vh] lg:min-h-0 rounded-3xl border overflow-hidden"
          style={{ borderColor: BORDER, background: "linear-gradient(180deg,#ffffff,#eef2f7)" }}>
          <div ref={mountRef} className="absolute inset-0" />
          {status !== "ready" && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
              {status === "loading" ? "Loading model…" : "Couldn't load /bodymodel.glb — is it in public/?"}
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <button onClick={() => setView("front")} style={{ borderColor: BORDER, color: NAVY }} className={pill + " border"}>Front</button>
            <button onClick={() => setView("back")} style={{ borderColor: BORDER, color: NAVY }} className={pill + " border"}>Back</button>
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border bg-white/90 px-3 py-1.5 shadow-sm" style={{ borderColor: BORDER }}>
            <span className="text-xs text-slate-500">Default intensity</span>
            <button onClick={() => setDefaultIntensity((v) => Math.max(1, v - 1))} aria-label="Decrease default intensity" style={{ borderColor: BORDER, color: NAVY }} className={stepBtn}>−</button>
            <input type="range" min={1} max={10} value={defaultIntensity} onChange={(e) => setDefaultIntensity(Number(e.target.value))} className="w-20" />
            <button onClick={() => setDefaultIntensity((v) => Math.min(10, v + 1))} aria-label="Increase default intensity" style={{ borderColor: BORDER, color: NAVY }} className={stepBtn}>+</button>
            <span className="text-xs font-semibold w-4 text-center" style={{ color: NAVY }}>{defaultIntensity}</span>
          </div>
        </div>

        {/* panel */}
        <aside className="lg:flex-[2] rounded-3xl border bg-white flex flex-col min-h-0" style={{ borderColor: BORDER }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: BORDER }}>
            <span className="font-bold" style={{ color: NAVY }}>Markers {markIds.length > 0 && <span className="text-slate-400">({markIds.length})</span>}</span>
            {markIds.length > 0 && <button onClick={clearAll} className="text-xs text-slate-500 hover:text-red-600">Clear all</button>}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 px-5 py-3 space-y-3">
            {markIds.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Tap the body to add a pain marker.</p>
            ) : markIds.map((id) => {
              const m = marks[id];
              return (
                <div key={id} className="rounded-xl border p-3" style={{ borderColor: BORDER }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: NAVY }}>
                      {m.label}{m.side !== "center" && <span className="ml-1.5 text-xs text-slate-400 capitalize">{m.side}</span>}
                    </span>
                    <button onClick={() => removeMark(id)} className="text-slate-400 hover:text-red-600 text-sm leading-none">✕</button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-14">Intensity</span>
                    <button onClick={() => updateMark(id, { intensity: Math.max(1, m.intensity - 1) })} aria-label="Decrease intensity" style={{ borderColor: BORDER, color: NAVY }} className={stepBtn}>−</button>
                    <input type="range" min={1} max={10} value={m.intensity} onChange={(e) => updateMark(id, { intensity: Number(e.target.value) })} className="flex-1" />
                    <button onClick={() => updateMark(id, { intensity: Math.min(10, m.intensity + 1) })} aria-label="Increase intensity" style={{ borderColor: BORDER, color: NAVY }} className={stepBtn}>+</button>
                    <span className="text-sm font-semibold w-5 text-center" style={{ color: "#" + intensityColor(m.intensity).getHexString() }}>{m.intensity}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PAIN_TYPES.map((t) => (
                      <button key={t} onClick={() => updateMark(id, { type: t })}
                        style={m.type === t ? { background: NAVY, color: "white", borderColor: NAVY } : { borderColor: BORDER, color: NAVY }}
                        className="rounded-full border px-2 py-0.5 text-xs">{t}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t p-4" style={{ borderColor: BORDER }}>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Notes (optional)</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                placeholder="Add notes or describe your pain…"
                className="w-full rounded-xl border px-3 py-2 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
                style={{ borderColor: BORDER }} />
            </div>
            <details>
              <summary className="text-xs text-slate-500 cursor-pointer select-none">Log entry (what gets saved)</summary>
              <pre className="mt-2 text-[11px] leading-snug bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto max-h-48">{JSON.stringify(exportEntry, null, 2)}</pre>
            </details>
            <button disabled={markIds.length === 0} onClick={() => console.log("SAVE", exportEntry)}
              style={{ background: NAVY }}
              className="mt-3 w-full py-2 rounded-xl text-white text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed">
              Save entry
            </button>
          </div>
        </aside>
      </div>

      <PainScaleModal open={showScale} onClose={() => setShowScale(false)} />
    </div>
  );
}
