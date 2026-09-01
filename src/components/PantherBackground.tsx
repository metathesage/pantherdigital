"use client";
import { useEffect, useRef, useState } from "react";

// PantherBackground for PantherDigital (emergent-matrix)
// Shows your 8192 meshy image as base + panther.glb as 3D overlay.
// Works immediately with the 4KB procedural GLB; after you sculpt in Blender
// and re-export public/panther.glb, it auto-uses the high-poly version.

export default function PantherBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"loading" | "glb" | "image">("loading");

  useEffect(() => {
    let renderer: any;
    let anim = 0;
    let scene: any;

    async function init() {
      if (!mountRef.current) return;
      const THREE = await import("three");

      let hasGLB = false;
      try {
        const r = await fetch("/panther.glb", { method: "HEAD" });
        hasGLB = r.ok;
      } catch {
        hasGLB = false;
      }
      if (!hasGLB) {
        setMode("image");
        return;
      }

      const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
      scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        38,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        100
      );
      camera.position.set(2.9, 1.5, 4.2);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setClearColor(0x000000, 0);
      // @ts-ignore
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      const wrap = document.createElement("div");
      wrap.style.position = "absolute";
      wrap.style.inset = "0";
      wrap.style.pointerEvents = "none";
      wrap.appendChild(renderer.domElement);
      mountRef.current.appendChild(wrap);

      scene.add(new THREE.AmbientLight(0xffffff, 0.9));
      const dir = new THREE.DirectionalLight(0xffffff, 1.15);
      dir.position.set(4, 6, 3);
      scene.add(dir);
      const rim = new THREE.PointLight(0xc4b5fd, 12, 14);
      rim.position.set(-2.2, 2, -1.2);
      scene.add(rim);

      let panther: any = null;
      await new Promise<void>((resolve) => {
        const loader = new GLTFLoader();
        loader.load(
          "/panther.glb",
          (gltf: any) => {
            panther = gltf.scene;
            panther.scale.setScalar(0.95);
            panther.position.set(0.15, -0.42, 0);
            panther.traverse((o: any) => {
              if (o.isMesh && o.material) {
                o.material.transparent = true;
                o.material.opacity = 0.96;
              }
            });
            scene.add(panther);
            setMode("glb");
            resolve();
          },
          undefined,
          () => {
            setMode("image");
            resolve();
          }
        );
      });
      if (!panther) return;

      let t = 0;
      const loop = () => {
        anim = requestAnimationFrame(loop);
        t += 0.0032;
        panther.rotation.y = Math.sin(t) * 0.24;
        panther.position.y = -0.42 + Math.sin(t * 0.85) * 0.06;
        const s = 1 + Math.sin(t * 1.3) * 0.012;
        panther.scale.set(s * 0.95, s * 0.95, s * 0.95);
        camera.lookAt(0.15, 0.15, 0);
        renderer.render(scene, camera);
      };
      loop();

      const onResize = () => {
        if (!mountRef.current || !renderer) return;
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      };
      window.addEventListener("resize", onResize);
      (renderer as any)._onResize = onResize;
    }
    init().catch(() => setMode("image"));
    return () => {
      cancelAnimationFrame(anim);
      if (renderer) {
        try {
          window.removeEventListener("resize", (renderer as any)._onResize);
        } catch {}
        renderer.dispose();
      }
    };
  }, []);

  return (
    <div ref={mountRef} aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#050208]">
      {/* Base: your meshy 8192 image */}
      <img
        src="/panther-meshy-2048.jpg"
        // @ts-ignore
        srcSet="/panther-meshy-1024.jpg 1024w, /panther-meshy-2048.jpg 2048w, /panther-meshy-8192.jpg 8192w"
        sizes="100vw"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-60"
        loading="eager"
      />
      {/* Readability gradients */}
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
      {process.env.NODE_ENV !== "production" && (
        <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] leading-none text-white/70">
          {mode === "loading" ? "panther: loading…" : mode === "glb" ? "panther: meshy + GLB ✓" : "panther: meshy image"}
        </div>
      )}
    </div>
  );
}
