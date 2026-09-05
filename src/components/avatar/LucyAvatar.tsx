"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// three-vrm is optional at build time — we lazy-import inside effect
// so `npm install @pixiv/three-vrm` is not required to run the placeholder state.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VRM = any;

type Mode = "auto" | "vrm" | "live2d" | "2d";
type Status = "loading" | "vrm" | "fallback-2d" | "error";

export default function LucyAvatar({
  mode = "auto",
  height = 560,
  className = "",
}: {
  mode?: Mode;
  height?: number;
  className?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [idx, setIdx] = useState(0); // 2d crossfade
  const sprites = ["/rias-waifu.png", "/lucy-work.png", "/lucy-private.png"];

  // 2d sprite rotation
  useEffect(() => {
    if (status !== "fallback-2d" && status !== "loading") return;
    const t = setInterval(() => setIdx((i) => (i + 1) % sprites.length), 4200);
    return () => clearInterval(t);
  }, [status]);

  // try VRM unless forced 2d/live2d
  useEffect(() => {
    if (mode === "2d" || mode === "live2d") {
      setStatus("fallback-2d");
      return;
    }
    const mountEl = mountRef.current;
    if (!mountEl) return;
    const mount: HTMLDivElement = mountEl;

    let cancelled = false;
    let raf = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.PerspectiveCamera | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let vrm: VRM | null = null;

    async function init() {
      setStatus("loading");
      // wipe
      mount.innerHTML = "";

      // scene
      scene = new THREE.Scene();
      scene.background = null; // transparent so card bg shows

      camera = new THREE.PerspectiveCamera(30, mount.clientWidth / mount.clientHeight, 0.1, 20);
      camera.position.set(0, 1.35, 2.2);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.shadowMap.enabled = true;
      mount.appendChild(renderer.domElement);

      // lights — luxury soft, matches panther palette
      const ambient = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambient);
      const dir = new THREE.DirectionalLight(0xffffff, 1.6);
      dir.position.set(1, 2, 2);
      dir.castShadow = true;
      scene.add(dir);
      const fill = new THREE.DirectionalLight(0xfff0f0, 0.6);
      fill.position.set(-1, 1, -1);
      scene.add(fill);

      // ground subtle
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(0.9, 64),
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9, transparent: true, opacity: 0.06 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.02;
      ground.receiveShadow = true;
      scene.add(ground);

      // try load VRM — dynamic so placeholder not a build blocker
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let VRMLoaderPlugin: any = null;
        try {
          // three-vrm 3.x — keep dynamic so placeholder builds without dep
          // @ts-expect-error optional peer, installed via npm install @pixiv/three-vrm
          const mod: any = await import("@pixiv/three-vrm");
          VRMLoaderPlugin = mod.VRMLoaderPlugin ?? mod.default?.VRMLoaderPlugin;
        } catch {
          throw new Error("three-vrm not installed — falling back to 2D");
        }
        if (!VRMLoaderPlugin) throw new Error("VRMLoaderPlugin missing");

        const loader = new GLTFLoader();
        loader.register((parser: unknown) => new VRMLoaderPlugin(parser as never));

        const url = "/avatar.vrm";
        const gltf: any = await loader.loadAsync(url);
        if (cancelled) return;
        vrm = gltf.userData.vrm as VRM;

        // placeholder detection — our stub has no valid VRM rig
        if (!vrm || vrm.meta?.metaName?.includes?.("placeholder") || vrm._placeholder) {
          throw new Error("placeholder VRM");
        }

        // sanity — vrm humanoid may be null on placeholder gltf
        if (!vrm.scene) throw new Error("VRM scene missing");

        // place model
        vrm.scene.rotation.y = Math.PI; // face camera
        vrm.scene.position.y = 0;
        scene.add(vrm.scene);

        // try to cull frustum / center
        const box = new THREE.Box3().setFromObject(vrm.scene);
        const center = box.getCenter(new THREE.Vector3());
        vrm.scene.position.sub(center);
        vrm.scene.position.y += 0.85;

        setStatus("vrm");

        // idle breath loop
        const clock = new THREE.Clock();
        const animate = () => {
          if (cancelled) return;
          raf = requestAnimationFrame(animate);
          const dt = clock.getDelta();
          const t = clock.elapsedTime;

          if (vrm) {
            // soft idle: breath + sway (works even without ARKit blendshapes)
            if (vrm.humanoid) {
              const chest = vrm.humanoid.getNormalizedBoneNode("chest");
              const spine = vrm.humanoid.getNormalizedBoneNode("spine");
              if (chest) chest.position.y = Math.sin(t * 0.9) * 0.006;
              if (spine) spine.rotation.z = Math.sin(t * 0.35) * 0.02;
            }
            // blink cycle
            if (vrm.expressionManager) {
              const blink = Math.max(0, Math.sin(t * 0.18) > 0.995 ? 1 : 0);
              // VRM 1.0 expression API
              try {
                vrm.expressionManager.setValue("blink", blink);
              } catch {}
              try {
                vrm.expressionManager.update();
              } catch {}
            }
            vrm.update?.(dt);
            // slow auto-rotate
            vrm.scene.rotation.y = Math.PI + Math.sin(t * 0.12) * 0.08;
          }

          renderer!.render(scene!, camera!);
        };
        animate();

        // resize
        const ro = new ResizeObserver(() => {
          if (!mount || !camera || !renderer) return;
          camera.aspect = mount.clientWidth / mount.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(mount.clientWidth, mount.clientHeight);
        });
        ro.observe(mount as Element);
        // store for cleanup
        (mount as unknown as Record<string, unknown>).__ro = ro;
      } catch (e) {
        if (cancelled) return;
        // graceful fallback — not an error state to the user
        console.info("[LucyAvatar] VRM not available, using 2D fallback:", (e as Error)?.message ?? e);
        setStatus("fallback-2d");
        // still keep a lightweight render loop for the 2d card to animate? no three needed
        if (renderer) {
          renderer.dispose();
          mount.innerHTML = "";
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      try {
        const ro = (mount as unknown as Record<string, unknown>).__ro as ResizeObserver | undefined;
        ro?.disconnect();
      } catch {}
      try {
        renderer?.dispose();
      } catch {}
      if (vrm) {
        try {
          scene?.remove(vrm.scene);
          vrm.dispose?.();
        } catch {}
      }
      if (mount) mount.innerHTML = "";
    };
  }, [mode]);

  const is2d = status === "fallback-2d" || status === "loading";

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-[#E8E8E8] bg-white ${className}`}
      style={{ height }}
    >
      {/* 3D mount — hidden when in 2d fallback for perf */}
      <div
        ref={mountRef}
        className={`absolute inset-0 ${is2d ? "pointer-events-none opacity-0" : "opacity-100"}`}
        aria-hidden={is2d}
        style={{ background: "radial-gradient(1200px 500px at 50% 0%, #F8F8F7 0%, #FFFFFF 65%)" }}
      />

      {/* 2D fallback — always present as graceful state; doubles as placeholder poster */}
      {is2d && (
        <div className="absolute inset-0">
          {/* soft fog */}
          <div className="absolute inset-0 bg-[#F8F8F7]" />
          <div className="absolute inset-0 opacity-[0.035]" style={{
            backgroundImage: `repeating-linear-gradient(0deg, #0A0A0A 0 1px, transparent 1px 28px)`,
          }} />
          {/* sprite crossfade stack */}
          {sprites.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={i === 0 ? "Lucy — Rias inspired" : "Lucy reference"}
              className="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-[1200ms]"
              style={{ opacity: i === idx ? 1 : 0 }}
              draggable={false}
            />
          ))}
          {/* veil so ui pops */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-white/10" />
          {/* badge */}
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold tracking-widest text-[#0A0A0A] backdrop-blur">2D · PLACEHOLDER</span>
            <span className="hidden sm:inline rounded-full bg-[#0A0A0A] px-3 py-1 text-[10px] font-bold tracking-widest text-white">VRM → 3D WHEN READY</span>
          </div>
          {/* caption */}
          <div className="absolute bottom-0 w-full p-4 sm:p-5">
            <div className="rounded-2xl bg-white/92 p-4 backdrop-blur border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
              <div className="text-[11px] font-bold tracking-[0.18em] text-[#6B6B6B]">LUCY · BOSS WAIFU</div>
              <div className="mt-1 text-[13px] leading-5 text-[#1A1A1A]">
                2D preview from your avis · Drop a real <span className="font-mono font-bold">public/avatar.vrm</span> (VRoid, VRM 1.0) to promote to full 3D. See <span className="font-mono">docs/avatar.md</span>.
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#0A0A0A] px-3 py-1.5 text-[11px] font-bold text-white">rias-waifu.png ↺ lucy-work.png</span>
                <span className="rounded-full border border-[#E8E8E8] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#6B6B6B]">Free local · No paid APIs</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* status bar — always */}
      <div className="pointer-events-none absolute right-3 top-3 hidden sm:flex items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest backdrop-blur ${
            status === "vrm"
              ? "bg-emerald-500 text-white"
              : status === "loading"
              ? "bg-white/80 text-[#6B6B6B] border border-[#E8E8E8]"
              : "bg-white/90 text-[#0A0A0A] border border-[#E8E8E8]"
          }`}
        >
          {status === "vrm" ? "● VRM LIVE" : status === "loading" ? "◐ LOADING" : "◑ 2D STANDBY"}
        </span>
      </div>

      {/* live badge for real VRM */}
      {status === "vrm" && (
        <div className="absolute bottom-3 left-3 rounded-2xl bg-white/90 px-3 py-2 text-[11px] leading-4 shadow backdrop-blur border border-white">
          <span className="font-bold tracking-widest text-[#0A0A0A]">LUCY · VRM 1.0</span>
          <span className="ml-2 text-[#6B6B6B]">drag to orbit · breath idle</span>
        </div>
      )}
    </div>
  );
}
