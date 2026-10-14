import { useEffect, useRef } from 'react';

/**
 * Violet 3D Revolving Plasma-Orb with Concentric Orbital Rings:
 * - Cohesive gyroscopic orbital belts that rotate smoothly in 3D perspective
 * - Clean elliptical orbital paths connecting all revolving nodes (never scattered)
 * - 3D depth scaling (foreground particles are larger/brighter, background dimmer)
 * - Calibrated for both Dark mode (additive luminous radiance) and Light mode (rich violet-amethyst vibrancy)
 */
export default function Background3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let W = 0;
    let H = 0;
    let t = 0;

    // 3 Cohesive 3D Orbital Belts around the central orb
    const BELTS = [
      {
        rFactor: 0.88,
        tilt: 0.42,
        rot: -0.32,
        speed: 0.009,
        trackWidth: 1.2,
        particles: Array.from({ length: 8 }, (_, i) => ({
          phase: (i / 8) * Math.PI * 2 + Math.random() * 0.2,
          size: 2.2 + Math.random() * 1.4,
          hue: 260 + Math.random() * 18, // deep violet
        })),
      },
      {
        rFactor: 1.34,
        tilt: 0.36,
        rot: 0.28,
        speed: 0.0062,
        trackWidth: 1.5,
        particles: Array.from({ length: 12 }, (_, i) => ({
          phase: (i / 12) * Math.PI * 2 + Math.random() * 0.2,
          size: 2.5 + Math.random() * 1.8,
          hue: 272 + Math.random() * 22, // violet-fuchsia
        })),
      },
      {
        rFactor: 1.82,
        tilt: 0.46,
        rot: -0.14,
        speed: 0.0042,
        trackWidth: 1.0,
        particles: Array.from({ length: 8 }, (_, i) => ({
          phase: (i / 8) * Math.PI * 2 + Math.random() * 0.2,
          size: 2.0 + Math.random() * 1.4,
          hue: 284 + Math.random() * 20, // amethyst
        })),
      },
    ];

    // Subtle drifting background ambient orbs
    const ambientOrbs = Array.from({ length: 4 }, (_, i) => ({
      x: 0.2 + (i % 2) * 0.6,
      y: 0.2 + Math.floor(i / 2) * 0.6,
      r: 90 + Math.random() * 110,
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.00025,
      hue: [265, 280, 295][i % 3],
    }));

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function orbCenter() {
      const cx = W * 0.5 + Math.sin(t * 0.003) * W * 0.02;
      const cy = H * 0.46 + Math.cos(t * 0.0025) * H * 0.02;
      const R = Math.min(W, H) * (0.21 + Math.sin(t * 0.015) * 0.01);
      return { cx, cy, R };
    }

    function draw() {
      t += 1;
      const isLight = document.documentElement.classList.contains('light');

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);

      const { cx, cy, R } = orbCenter();

      // 1. Subtle ambient drifting orbs in far background
      for (const o of ambientOrbs) {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < 0.05 || o.x > 0.95) o.vx *= -1;
        if (o.y < 0.05 || o.y > 0.95) o.vy *= -1;

        const g = ctx.createRadialGradient(o.x * W, o.y * H, 0, o.x * W, o.y * H, o.r);
        if (isLight) {
          g.addColorStop(0, `hsla(${o.hue}, 80%, 65%, 0.06)`);
          g.addColorStop(1, 'hsla(275, 80%, 65%, 0)');
        } else {
          g.addColorStop(0, `hsla(${o.hue}, 90%, 65%, 0.08)`);
          g.addColorStop(1, 'hsla(275, 90%, 65%, 0)');
        }
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x * W, o.y * H, o.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Wide soft aura bloom around center
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 3.8);
      if (isLight) {
        bloom.addColorStop(0, 'hsla(268, 80%, 65%, 0.14)');
        bloom.addColorStop(0.4, 'hsla(275, 75%, 70%, 0.06)');
        bloom.addColorStop(1, 'hsla(280, 70%, 75%, 0)');
      } else {
        bloom.addColorStop(0, 'hsla(270, 95%, 72%, 0.22)');
        bloom.addColorStop(0.4, 'hsla(275, 90%, 62%, 0.08)');
        bloom.addColorStop(1, 'hsla(280, 90%, 60%, 0)');
      }
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 3.8, 0, Math.PI * 2);
      ctx.fill();

      // 3. Central pulsing plasma orb
      const pulse = 1 + Math.sin(t * 0.04) * 0.05;
      const coreR = R * 0.48 * pulse;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      if (isLight) {
        core.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        core.addColorStop(0.25, 'hsla(265, 85%, 72%, 0.55)');
        core.addColorStop(0.6, 'hsla(270, 80%, 62%, 0.32)');
        core.addColorStop(0.88, 'hsla(275, 75%, 68%, 0.12)');
        core.addColorStop(1, 'hsla(280, 70%, 72%, 0)');
      } else {
        core.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        core.addColorStop(0.3, 'hsla(265, 100%, 88%, 0.6)');
        core.addColorStop(0.65, 'hsla(270, 95%, 72%, 0.35)');
        core.addColorStop(1, 'hsla(275, 90%, 65%, 0)');
      }
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      // 4. Concentric 3D Orbital Belts and revolving particles
      for (const belt of BELTS) {
        const r = R * belt.rFactor;
        const cosRot = Math.cos(belt.rot);
        const sinRot = Math.sin(belt.rot);

        // A. Draw the glowing orbital ellipse track (connects all nodes into a cohesive belt)
        ctx.save();
        ctx.beginPath();
        // Sample points along the rotated 3D ellipse for perfect rendering
        const segments = 64;
        for (let s = 0; s <= segments; s++) {
          const theta = (s / segments) * Math.PI * 2;
          const px = Math.cos(theta) * r;
          const py = Math.sin(theta) * r * belt.tilt;
          const rx = cx + px * cosRot - py * sinRot;
          const ry = cy + px * sinRot + py * cosRot;
          if (s === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.lineWidth = belt.trackWidth;
        ctx.strokeStyle = isLight
          ? 'hsla(268, 75%, 65%, 0.22)'
          : 'hsla(268, 85%, 75%, 0.15)';
        ctx.stroke();
        ctx.restore();

        // B. Draw revolving particles along this orbital track with 3D depth
        for (const p of belt.particles) {
          const a = p.phase + t * belt.speed;
          const sinA = Math.sin(a);
          const cosA = Math.cos(a);

          // 3D projected coordinates on the rotated orbital plane
          const px = cosA * r;
          const py = sinA * r * belt.tilt;
          const x = cx + px * cosRot - py * sinRot;
          const y = cy + px * sinRot + py * cosRot;

          // 3D Depth cue: foreground particles are larger, brighter; background are dimmer
          const depth = 0.72 + 0.5 * sinA;
          const nodeSize = p.size * depth;

          // Subtle tapered orbit tail behind revolving node
          ctx.beginPath();
          const tailSteps = 8;
          for (let step = 0; step <= tailSteps; step++) {
            const ta = a - (step / tailSteps) * 0.24;
            const tpx = Math.cos(ta) * r;
            const tpy = Math.sin(ta) * r * belt.tilt;
            const tx = cx + tpx * cosRot - tpy * sinRot;
            const ty = cy + tpx * sinRot + tpy * cosRot;
            if (step === 0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
          }
          ctx.lineWidth = nodeSize * 0.7;
          ctx.strokeStyle = isLight
            ? `hsla(${p.hue}, 80%, 65%, ${0.28 * depth})`
            : `hsla(${p.hue}, 90%, 75%, ${0.35 * depth})`;
          ctx.stroke();

          // Particle radiant halo
          const haloR = nodeSize * 4.2;
          const pg = ctx.createRadialGradient(x, y, 0, x, y, haloR);
          if (isLight) {
            pg.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            pg.addColorStop(0.25, `hsla(${p.hue}, 90%, 55%, ${0.85 * depth})`);
            pg.addColorStop(0.65, `hsla(${p.hue}, 85%, 65%, ${0.35 * depth})`);
            pg.addColorStop(1, `hsla(${p.hue}, 80%, 70%, 0)`);
          } else {
            pg.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            pg.addColorStop(0.3, `hsla(${p.hue}, 100%, 82%, ${0.65 * depth})`);
            pg.addColorStop(0.7, `hsla(${p.hue}, 100%, 72%, ${0.25 * depth})`);
            pg.addColorStop(1, `hsla(${p.hue}, 100%, 65%, 0)`);
          }

          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.arc(x, y, haloR, 0, Math.PI * 2);
          ctx.fill();

          // Core bead
          ctx.fillStyle = isLight ? `hsla(${p.hue}, 95%, 48%, ${0.9 * depth})` : '#ffffff';
          ctx.beginPath();
          ctx.arc(x, y, Math.max(1, nodeSize * 0.55), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Tiny luminous central micro-sparks
      const sparkCount = 8;
      for (let i = 0; i < sparkCount; i++) {
        const seed = i * 142.3;
        const sa = seed + t * 0.02;
        const sr = R * (0.28 + ((Math.sin(t * 0.08 + seed) + 1) / 2) * 0.35);
        const sx = cx + Math.cos(sa) * sr;
        const sy = cy + Math.sin(sa) * sr * 0.65;

        ctx.fillStyle = isLight
          ? 'hsla(270, 85%, 52%, 0.6)'
          : 'rgba(245, 235, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    if (reduced) {
      draw();
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }

    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduced) raf = requestAnimationFrame(draw);
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-0" />;
}
