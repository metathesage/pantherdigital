"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const PALETTE = ["#7cc4ff", "#00b4e6", "#ff9ec2", "#b39dff", "#ffffff"].map(
  (hex) => new THREE.Color(hex)
);

const COUNT = 340;

export default function HeroParticles() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      host.clientWidth / host.clientHeight,
      0.1,
      100
    );
    camera.position.z = 16;

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
      velocities[i] = 0.12 + Math.random() * 0.35;
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });

    const group = new THREE.Group();
    group.add(new THREE.Points(geometry, material));
    scene.add(group);

    const targetRot = { x: 0, y: 0 };

    function onMouse(event: MouseEvent) {
      const rect = host!.getBoundingClientRect();
      targetRot.y = ((event.clientX - rect.left) / rect.width - 0.5) * 0.18;
      targetRot.x = ((event.clientY - rect.top) / rect.height - 0.5) * 0.12;
    }

    function onResize() {
      camera.aspect = host!.clientWidth / host!.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host!.clientWidth, host!.clientHeight);
    }

    window.addEventListener("mousemove", onMouse);
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(host);

    function tick(delta: number, elapsed: number) {
      const posAttr = geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < COUNT; i++) {
        let y = posAttr.getY(i) + velocities[i] * delta;
        if (y > 8.5) y = -8.5;
        posAttr.setY(i, y);
        posAttr.setX(i, posAttr.getX(i) + Math.sin(elapsed * 0.4 + i) * 0.0012);
      }
      posAttr.needsUpdate = true;

      group.rotation.y += (targetRot.y - group.rotation.y) * 0.04;
      group.rotation.x += (targetRot.x - group.rotation.x) * 0.04;

      renderer.render(scene, camera);
    }

    const clock = new THREE.Clock();
    let frame = 0;
    const loop = () => {
      frame = requestAnimationFrame(loop);
      tick(clock.getDelta(), clock.getElapsedTime());
    };

    if (reducedMotion) {
      tick(0, 0);
    } else {
      loop();
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMouse);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="absolute inset-0 overflow-hidden [mask-image:radial-gradient(75%_75%_at_50%_45%,black,transparent)]"
    />
  );
}
