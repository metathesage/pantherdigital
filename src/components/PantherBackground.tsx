"use client";
import { useEffect, useRef, useState } from "react";

// PantherBackground — now wired to your 62MB Hi3D sculpt
// - meshy image = instant paint (no wait)
// - 62MB GLB = lazy, progressive load in background with % indicator
// - fallback to image if load fails / slow 3G
export default function PantherBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"loading" | "glb" | "image">("loading");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let renderer: any;
    let anim = 0;
    let scene: any;
    let aborted = false;

    async function init() {
      if (!mountRef.current) return;
      const THREE = await import("three");

      // quick probe — don't fetch 62MB blind on slow connections?
      // we still load, but show progress; HEAD checks existence
      try {
        const r = await fetch("/panther.glb", { method: "HEAD" });
        if (!r.ok) { if (!aborted) setMode("image"); return; }
        const len = Number(r.headers.get("content-length") || 0);
        // >55MB => warn in console but continue
        if (len > 55_000_000) console.log(`[panther] large GLB ${(len/1e6).toFixed(1)}MB — progressive load`);
      } catch { if (!aborted) setMode("image"); return; }

      const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
      scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
      const el = mountRef.current!;
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.position.set(2.9, 1.5, 4.2);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(w, h);
      renderer.setClearColor(0x000000, 0);
      // @ts-ignore
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      const wrap = document.createElement("div");
      wrap.style.position = "absolute";
      wrap.style.inset = "0";
      wrap.style.pointerEvents = "none";
      wrap.appendChild(renderer.domElement);
      el.appendChild(wrap);

      scene.add(new THREE.AmbientLight(0xffffff, 0.92));
      const dir = new THREE.DirectionalLight(0xffffff, 1.25);
      dir.position.set(4, 6, 3);
      scene.add(dir);
      const rim = new THREE.PointLight(0xc4b5fd, 14, 16);
      rim.position.set(-2.2, 2.2, -1.2);
      scene.add(rim);
      const fill = new THREE.PointLight(0x60a5fa, 6, 10);
      fill.position.set(2, -1, 3);
      scene.add(fill);

      let panther: any = null;
      await new Promise<void>((resolve) => {
        const loader = new GLTFLoader();
        loader.load(
          "/panther.glb",
          (gltf: any) => {
            if (aborted) { resolve(); return; }
            panther = gltf.scene;
            // auto-center & scale — handles whatever pivot Hi3D exported
            const box = new THREE.Box3().setFromObject(panther);
            const center = box.getCenter(new THREE.Vector3());
            panther.position.sub(center);
            panther.position.y -= 0.45;
            panther.position.x += 0.1;
            const size = box.getSize(new THREE.Vector3()).length();
            const scale = 2.2 / (size || 2.2);
            panther.scale.setScalar(scale * 0.95);

            panther.traverse((o: any) => {
              if (o.isMesh) {
                o.frustumCulled = true;
                if (o.material) {
                  o.material.transparent = true;
                  o.material.opacity = 0.98;
                  o.material.needsUpdate = true;
                }
                // help 62MB: disable shadows for background
                o.castShadow = false;
                o.receiveShadow = false;
              }
            });
            scene.add(panther);
            setMode("glb");
            resolve();
          },
          (ev: any) => {
            if (ev.lengthComputable && ev.total) setProgress(Math.round((ev.loaded / ev.total) * 100));
          },
          () => {
            if (!aborted) setMode("image");
            resolve();
          }
        );
      });
      if (!panther || aborted) return;

      let t = 0;
      const loop = () => {
        if (aborted) return;
        anim = requestAnimationFrame(loop);
        t += 0.0032;
        panther.rotation.y = Math.sin(t) * 0.18;
        panther.position.y = -0.08 + Math.sin(t * 0.85) * 0.05;
        const s = 1 + Math.sin(t * 1.3) * 0.01;
        const base = 2.2 / (new THREE.Box3().setFromObject(panther).getSize(new THREE.Vector3()).length() || 2.2);
        panther.scale.set(s * base * 0.95, s * base * 0.95, s * base * 0.95);
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      };
      loop();

      const onResize = () => {
        if (!mountRef.current || !renderer || aborted) return;
        const nw = mountRef.current.clientWidth;
        const nh = mountRef.current.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener("resize", onResize);
      (renderer as any)._onResize = onResize;
      (renderer as any)._wrap = wrap;
    }
    init().catch(() => !aborted && setMode("image"));
    return () => {
      aborted = true;
      cancelAnimationFrame(anim);
      if (renderer) {
        try { window.removeEventListener("resize", (renderer as any)._onResize); } catch {}
        try { (renderer as any)._wrap?.remove(); } catch {}
        try { renderer.dispose(); } catch {}
      }
    };
  }, []);

  return (
    <div ref={mountRef} aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#050208]">
      {/* Base: meshy image — instant */}
      <img
        src="/panther-meshy-2048.jpg"
        // @ts-ignore
        srcSet="/panther-meshy-1024.jpg 1024w, /panther-meshy-2048.jpg 2048w, /panther-meshy-8192.jpg 8192w"
        sizes="100vw"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-60"
        loading="eager"
      />
      {/* Gradients for readability — works with or without GLB */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 92% 72% at 50% 38%, transparent 32%, rgba(5,2,8,0.58) 78%),
            linear-gradient(to bottom, rgba(5,2,8,0.18) 0%, rgba(5,2,8,0.78) 92%),
            radial-gradient(ellipse 55% 45% at 85% 52%, rgba(168,85,247,0.16), transparent 58%)
          `,
        }}
      />
      <div className="absolute inset-0 opacity-40" style={{ background: "radial-gradient(ellipse at center, transparent 56%, rgba(0,0,0,0.6) 100%)" }} />
      {/* Loading HUD — only while 62MB streams */}
      {mode === "loading" && (
        <div className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1.5 text-[10px] font-medium tracking-wide text-white/80 backdrop-blur">
          3D panther · {progress ? `${progress}%` : "loading…"} <span className="opacity-60">· 62MB</span>
        </div>
      )}
      {process.env.NODE_ENV !== "production" && mode !== "loading" && (
        <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] leading-none text-white/70">
          {mode === "glb" ? "panther: Hi3D sculpt ✓" : "panther: meshy image"}
        </div>
      )}
    </div>
  );
}
