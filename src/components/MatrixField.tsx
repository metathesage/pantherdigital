"use client";
import { useEffect, useRef, useState } from "react";

export default function MatrixField() {
  const hostRef = useRef<HTMLDivElement>(null);
  const bootRef = useRef(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (bootRef.current) return;
    bootRef.current = true;
    const host = hostRef.current;
    if (!host) return;
    let renderer: any = null;
    let raf = 0;
    let resizeCleanup: (() => void) | null = null;

    (async () => {
      try {
        const THREE = await import("three");
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
        camera.position.z = 7;

        const group = new THREE.Group();
        const wire = new THREE.Mesh(
          new THREE.IcosahedronGeometry(2.1, 1),
          new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.16 })
        );
        group.add(wire);

        const COUNT = 420;
        const pos = new Float32Array(COUNT * 3);
        for (let i = 0; i < COUNT; i++) {
          pos[i * 3] = (Math.random() - 0.5) * 22;
          pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 22;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.55 }));
        group.add(pts);
        scene.add(group);

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
        const canvas = renderer.domElement;
        canvas.style.position = "absolute";
        canvas.style.inset = "0";
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.style.pointerEvents = "none";
        host.appendChild(canvas);

        const resize = () => {
          const w = host.clientWidth || window.innerWidth;
          const h = host.clientHeight || window.innerHeight;
          renderer.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        resize();
        window.addEventListener("resize", resize);
        resizeCleanup = () => window.removeEventListener("resize", resize);

        const clock = new THREE.Clock();
        const loop = () => {
          const t = clock.getElapsedTime();
          wire.rotation.x = t * 0.14;
          wire.rotation.y = t * 0.21;
          pts.rotation.y = t * 0.03;
          renderer.render(scene, camera);
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch {
        /* WebGL unavailable — render nothing, page works fine without it */
      }
    })();

    return () => {
      cancelAnimationFrame(raf);
      resizeCleanup?.();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ opacity: reduced ? 0 : undefined }} />;
}