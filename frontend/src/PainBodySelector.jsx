import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// model bounds
const Z_MIN = -1.3443; // feet
const Z_MAX = 0.6630;  // top of head
const LEFT_IS_POSITIVE_X = true;
const FRONT_SIGN = -1;

const REGIONS = [
  { id: "head_front",  label: "Face / Head (front)", side: "center", group: "head" },
  { id: "head_back",   label: "Head (back)",         side: "center", group: "head" },
  { id: "neck",        label: "Neck",                side: "center", group: "neck" },
  { id: "chest",       label: "Chest",               side: "center", group: "torso" },
  { id: "upper_back",  label: "Upper back",          side: "center", group: "torso" },
  { id: "abdomen",     label: "Abdomen",             side: "center", group: "torso" },
  { id: "lower_back",  label: "Lower back",          side: "center", group: "torso" },
  { id: "shoulder_l",  label: "Shoulder",            side: "left",   group: "arm" },
  { id: "shoulder_r",  label: "Shoulder",            side: "right",  group: "arm" },
  { id: "upper_arm_l", label: "Upper arm",           side: "left",   group: "arm" },
  { id: "upper_arm_r", label: "Upper arm",           side: "right",  group: "arm" },
  { id: "forearm_l",   label: "Forearm",             side: "left",   group: "arm" },
  { id: "forearm_r",   label: "Forearm",             side: "right",  group: "arm" },
  { id: "hand_l",      label: "Hand",                side: "left",   group: "arm" },
  { id: "hand_r",      label: "Hand",                side: "right",  group: "arm" },
  { id: "hip_l",       label: "Hip",                 side: "left",   group: "leg" },
  { id: "hip_r",       label: "Hip",                 side: "right",  group: "leg" },
  { id: "thigh_l",     label: "Thigh",               side: "left",   group: "leg" },
  { id: "thigh_r",     label: "Thigh",               side: "right",  group: "leg" },
  { id: "knee_l",      label: "Knee",                side: "left",   group: "leg" },
  { id: "knee_r",      label: "Knee",                side: "right",  group: "leg" },
  { id: "calf_l",      label: "Lower leg",           side: "left",   group: "leg" },
  { id: "calf_r",      label: "Lower leg",           side: "right",  group: "leg" },
  { id: "foot_l",      label: "Foot",                side: "left",   group: "leg" },
  { id: "foot_r",      label: "Foot",                side: "right",  group: "leg" },
];
const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r]));
const PAIN_TYPES = ["Aching", "Burning", "Stabbing", "Throbbing", "Tingling"];

// Map a tapped point (original geometry coords) to a region id.
function classifyPoint(p) {
  const h = (p.z - Z_MIN) / (Z_MAX - Z_MIN);     // 0 = feet, 1 = head
  const isLeft = LEFT_IS_POSITIVE_X ? p.x > 0 : p.x < 0;
  const S = isLeft ? "l" : "r";
  const front = p.y * FRONT_SIGN >= 0;
  const ax = Math.abs(p.x);

  if (ax > 0.3) {                                 // out to the side -> arm
    if (h > 0.8)  return `shoulder_${S}`;
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

// different colours for intensity — tweak the RAMP array to change them
const RAMP = ["#facc15", "#fb923c", "#ef4444", "#b91c1c"];
function intensityColor(intensity) {
  const t = Math.min(1, Math.max(0, (intensity - 1) / 9));
  const seg = t * (RAMP.length - 1);
  const i = Math.min(RAMP.length - 2, Math.floor(seg));
  const a = new THREE.Color(RAMP[i]);
  const b = new THREE.Color(RAMP[i + 1]);
  return a.lerp(b, seg - i);
}

let MARK_SEQ = 0;

export default function PainBodySelector() {
  const mountRef = useRef(null);
  const outerGroupRef = useRef(null);  
  const markersGroupRef = useRef(null);
  const targetsRef = useRef([]);        // meshes to raycast against
  const marksRef = useRef({});

  const [marks, setMarks] = useState({}); // { markId: {regionId,label,side,group,local,intensity,type} }
  const [defaultIntensity, setDefaultIntensity] = useState(5);
  const [status, setStatus] = useState("loading"); 

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

  // model load (once) and interaction setup
  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.cssText = "display:block;position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab;";

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
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

        // Neutral material + collect click targets
        const targets = [];
        gltf.scene.traverse((o) => {
          if (o.isMesh) {
            o.material = new THREE.MeshStandardMaterial({ color: "#c4c9d2", roughness: 0.85, metalness: 0 });
            targets.push(o);
          }
        });
        targetsRef.current = targets;

        // Center at origin + scale to fit, measured AFTER the rotation above
        inner.updateMatrixWorld(true);
        box = new THREE.Box3().setFromObject(inner);
        const center = box.getCenter(new THREE.Vector3());
        const dims = box.getSize(new THREE.Vector3());
        inner.position.sub(center);
        outerGroup.add(inner);
        outerGroup.scale.setScalar(3.0 / Math.max(dims.x, dims.y, dims.z));

        setStatus("ready");
      },
      undefined,
      (err) => { console.error("GLB load failed:", err); setStatus("error"); }
    );

    // rotating and marking
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
          const original = mesh.worldToLocal(hits[0].point.clone()); // -> model geometry coords (z = height)
          const localInGroup = outerGroup.worldToLocal(hits[0].point.clone()); // for marker placement
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

  //Sync marker spheres whenever marks change 
  useEffect(() => {
    const g = markersGroupRef.current;
    if (!g) return;
    while (g.children.length) { const c = g.children.pop(); c.geometry?.dispose(); c.material?.dispose(); }
    const geo = new THREE.SphereGeometry(0.05, 16, 12);
    for (const id in marks) {
      const m = marks[id];
      const col = intensityColor(m.intensity);
      const mat = new THREE.MeshStandardMaterial({ color: col, emissive: col.clone().multiplyScalar(0.3) });
      const s = new THREE.Mesh(geo, mat);
      s.position.set(m.local[0], m.local[1], m.local[2]);
      g.add(s);
    }
  }, [marks]);

  const setView = (which) => outerGroupRef.current?.userData.setView?.(which);

  const exportEntry = {
    logged_at: new Date().toISOString(),
    regions: Object.values(marks).map((m) => ({
      region_id: m.regionId, label: m.label, side: m.side, group: m.group,
      intensity: m.intensity, pain_type: m.type,
    })),
  };
  const markIds = Object.keys(marks);

  return (
    <div className="w-full h-screen overflow-hidden bg-slate-50 text-slate-800 flex flex-col">
      <header className="px-6 py-4 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-semibold tracking-tight">Log your pain</h1>
        <p className="text-sm text-slate-500">Drag to rotate. Tap the body where it hurts to drop a marker.</p>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        <div className="relative lg:flex-[3] min-h-[60vh] lg:min-h-0 bg-gradient-to-b from-slate-100 to-slate-200">
          <div ref={mountRef} className="absolute inset-0" />
          {status !== "ready" && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
              {status === "loading" ? "Loading model…" : "Couldn't load /bodymodel.glb — is it in public/?"}
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <button onClick={() => setView("front")} className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/90 border border-slate-300 hover:bg-white shadow-sm">Front</button>
            <button onClick={() => setView("back")} className="px-3 py-1.5 text-xs font-medium rounded-md bg-white/90 border border-slate-300 hover:bg-white shadow-sm">Back</button>
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/90 border border-slate-300 rounded-md px-3 py-1.5 shadow-sm">
            <span className="text-xs text-slate-500">Default intensity</span>
            <button type="button" aria-label="Decrease default intensity"
              onClick={() => setDefaultIntensity((v) => Math.max(1, v - 1))}
              className="w-6 h-6 flex items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100 leading-none">−</button>
            <input type="range" min={1} max={10} value={defaultIntensity} onChange={(e) => setDefaultIntensity(Number(e.target.value))} className="w-24" />
            <button type="button" aria-label="Increase default intensity"
              onClick={() => setDefaultIntensity((v) => Math.min(10, v + 1))}
              className="w-6 h-6 flex items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100 leading-none">+</button>
            <span className="text-xs font-semibold w-4 text-center">{defaultIntensity}</span>
          </div>
        </div>

        <aside className="lg:flex-[2] border-t lg:border-t-0 lg:border-l border-slate-200 bg-white flex flex-col min-h-0">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <span className="font-medium">Markers {markIds.length > 0 && <span className="ml-1 text-slate-400">({markIds.length})</span>}</span>
            {markIds.length > 0 && <button onClick={clearAll} className="text-xs text-slate-500 hover:text-red-600">Clear all</button>}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 px-5 py-3 space-y-3">
            {markIds.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Tap the body to add a pain marker.</p>
            ) : markIds.map((id) => {
              const m = marks[id];
              return (
                <div key={id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {m.label}{m.side !== "center" && <span className="ml-1.5 text-xs text-slate-400 capitalize">{m.side}</span>}
                    </span>
                    <button onClick={() => removeMark(id)} className="text-slate-400 hover:text-red-600 text-sm leading-none">✕</button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-14">Intensity</span>
                    <button type="button" aria-label="Decrease intensity"
                      onClick={() => updateMark(id, { intensity: Math.max(1, m.intensity - 1) })}
                      className="w-6 h-6 shrink-0 flex items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100 leading-none">−</button>
                    <input type="range" min={1} max={10} value={m.intensity} onChange={(e) => updateMark(id, { intensity: Number(e.target.value) })} className="flex-1" />
                    <button type="button" aria-label="Increase intensity"
                      onClick={() => updateMark(id, { intensity: Math.min(10, m.intensity + 1) })}
                      className="w-6 h-6 shrink-0 flex items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100 leading-none">+</button>
                    <span className="text-sm font-semibold w-5 text-center" style={{ color: "#" + intensityColor(m.intensity).getHexString() }}>{m.intensity}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {PAIN_TYPES.map((t) => (
                      <button key={t} onClick={() => updateMark(id, { type: t })}
                        className={"px-2 py-0.5 text-xs rounded-full border " + (m.type === t ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-300 hover:border-slate-400")}>{t}</button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-200 p-4">
            <details>
              <summary className="text-xs text-slate-500 cursor-pointer select-none">Log entry (what gets saved)</summary>
              <pre className="mt-2 text-[11px] leading-snug bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto max-h-48">{JSON.stringify(exportEntry, null, 2)}</pre>
            </details>
            <button disabled={markIds.length === 0} onClick={() => console.log("SAVE", exportEntry)}
              className="mt-3 w-full py-2 rounded-md bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed">Save entry</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
