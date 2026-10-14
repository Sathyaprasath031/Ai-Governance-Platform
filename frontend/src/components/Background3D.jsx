import { useEffect, useRef } from 'react';

/**
 * Revolving Violet Plasma-Orb with Orbiting Energy Particles (3D Effect):
 * - Fully optimized for both Dark Mode AND Light Mode
 * - Dark Mode: Additive luminous plasma glow with bright core and orbiting sparks
 * - Light Mode: Source-over saturated amethyst/violet 3D orbits clearly visible against white/light backgrounds
 * - Respects prefers-reduced-motion and window resizing
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

    // Revolving energy particles orbiting in 3D
    const PARTICLES = Array.from({ length: 34 }, (_, i) => ({
      rf: 0.52 + Math.random() * 1.65,       // orbit radius (relative to core)
      speed: (0.005 + Math.random() * 0.012) * (i % 2 === 0 ? 1 : -1), // bidirectional revolution
      phase: Math.random() * Math.PI * 2,
      tilt: 0.68 + Math.random() * 0.38,    // 3D inclination / elliptical tilt
      size: 1.8 + Math.random() * 2.8,
      hue: 258 + Math.random() * 32,        // purple, violet, indigo, orchid
      drift: Math.random() * 0.5 + 0.75,
    }));

    const orbs = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 120 + Math.random() * 180,
      vx: (Math.random() - 0.5) * 0.0004,
      vy: (Math.random() - 0.5) * 0.0003,
      hue: [265, 280, 295, 250][i % 4],
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

    // Position of the revolving core (floats gently around center)
    function orbCenter() {
      const cx = W * 0.5 + Math.sin(t * 0.004) * W * 0.04;
      const cy = H * 0.46 + Math.cos(t * 0.003) * H * 0.04;
      const R = Math.min(W, H) * (0.22 + Math.sin(t * 0.02) * 0.015);
      return { cx, cy, R };
    }

    function draw() {
      t += 1;
      const isLight = document.documentElement.classList.contains('light');

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);

      // In Dark Mode, 'lighter' additive blending gives neon radiance.
      // In Light Mode, 'source-over' prevents colors from washing out into pure white.
      ctx.globalCompositeOperation = isLight ? 'source-over' : 'lighter';

      const { cx, cy, R } = orbCenter();

      // 1. Ambient drifting background orbs
      for (const o of orbs) {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < -0.2 || o.x > 1.2) o.vx *= -1;
        if (o.y < -0.2 || o.y > 1.2) o.vy *= -1;
        const g = ctx.createRadialGradient(o.x * W, o.y * H, 0, o.x * W, o.y * H, o.r);

        if (isLight) {
          g.addColorStop(0, `hsla(${o.hue}, 85%, 60%, 0.12)`);
          g.addColorStop(0.6, `hsla(${o.hue}, 80%, 65%, 0.05)`);
          g.addColorStop(1, 'hsla(270, 80%, 65%, 0)');
        } else {
          g.addColorStop(0, `hsla(${o.hue}, 90%, 65%, 0.08)`);
          g.addColorStop(1, 'hsla(275, 90%, 65%, 0)');
        }

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x * W, o.y * H, o.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Wide outer bloom (soft atmosphere)
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 3.8);
      if (isLight) {
        bloom.addColorStop(0, 'hsla(268, 85%, 58%, 0.18)');
        bloom.addColorStop(0.4, 'hsla(275, 80%, 62%, 0.09)');
        bloom.addColorStop(1, 'hsla(280, 75%, 65%, 0)');
      } else {
        bloom.addColorStop(0, 'hsla(270, 95%, 72%, 0.22)');
        bloom.addColorStop(0.35, 'hsla(275, 90%, 62%, 0.1)');
        bloom.addColorStop(1, 'hsla(280, 90%, 60%, 0)');
      }
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 3.8, 0, Math.PI * 2);
      ctx.fill();

      // 3. Central pulsing revolving core
      const pulse = 1 + Math.sin(t * 0.05) * 0.06;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.48 * pulse);
      if (isLight) {
        // In light mode, use rich violet & lavender that stand out against light backgrounds
        core.addColorStop(0, 'hsla(265, 85%, 52%, 0.55)');
        core.addColorStop(0.35, 'hsla(270, 80%, 60%, 0.38)');
        core.addColorStop(0.7, 'hsla(275, 75%, 68%, 0.2)');
        core.addColorStop(1, 'hsla(278, 70%, 75%, 0)');
      } else {
        core.addColorStop(0, 'rgba(255, 255, 255, 0.75)');
        core.addColorStop(0.35, 'hsla(265, 100%, 88%, 0.45)');
        core.addColorStop(0.7, 'hsla(270, 95%, 72%, 0.25)');
        core.addColorStop(1, 'hsla(272, 95%, 65%, 0)');
      }
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.48 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // 4. Orbiting revolving energy particles (3D revolution)
      for (const p of PARTICLES) {
        const a = p.phase + t * p.speed;
        const rr = R * p.rf * (1 + Math.sin(t * 0.01 + p.phase) * 0.06 * p.drift);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr * p.tilt;
        const size = p.size * (0.8 + 0.4 * Math.sin(t * 0.03 + p.phase));

        // Depth perspective effect: scale alpha and size when in front vs behind
        const zDepth = Math.sin(a);
        const depthAlpha = isLight
          ? 0.65 + zDepth * 0.25  // Higher base contrast in light mode
          : 0.55 + zDepth * 0.3;

        const g = ctx.createRadialGradient(x, y, 0, x, y, size * 5.5);

        if (isLight) {
          // Saturated rich amethyst and deep violet for crisp visibility in light mode
          g.addColorStop(0, `hsla(${p.hue}, 95%, 45%, ${0.85 * depthAlpha})`);
          g.addColorStop(0.35, `hsla(${p.hue}, 90%, 55%, ${0.55 * depthAlpha})`);
          g.addColorStop(1, `hsla(${p.hue}, 85%, 65%, 0)`);
        } else {
          g.addColorStop(0, `rgba(255, 255, 255, ${0.65 * depthAlpha})`);
          g.addColorStop(0.35, `hsla(${p.hue}, 100%, 82%, ${0.45 * depthAlpha})`);
          g.addColorStop(1, `hsla(${p.hue}, 100%, 75%, 0)`);
        }

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, size * 5.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Crackling micro-sparks near core
      const sparkCount = 10;
      for (let i = 0; i < sparkCount; i++) {
        const seed = i * 137.5;
        const a = (seed + t * (0.02 + (i % 3) * 0.01)) % (Math.PI * 2);
        const rr = R * (0.35 + ((Math.sin(t * 0.09 + seed) + 1) / 2) * 0.45);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr * 0.9;

        ctx.fillStyle = isLight
          ? 'hsla(275, 90%, 45%, 0.6)'
          : 'rgba(240, 230, 255, 0.4)';

        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, Math.PI * 2);
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
