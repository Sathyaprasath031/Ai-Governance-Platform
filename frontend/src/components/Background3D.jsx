import { useEffect, useRef } from 'react';

/**
 * Violet Plasma-Orb with Orbiting Energy Particles (3D Effect):
 * - Exactly the same cohesive orbital structure in both Dark and Light mode
 * - Particles orbit synchronously around the central core in a tight elliptical belt
 * - Crisp, glowing core and orbiting nodes calibrated for both themes
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

    // Orbiting energy particles: tight, cohesive orbit around core
    const PARTICLES = Array.from({ length: 26 }, () => ({
      rf: 0.55 + Math.random() * 1.45,       // orbit radius (tight around core)
      speed: 0.005 + Math.random() * 0.011, // unified revolving direction
      phase: Math.random() * Math.PI * 2,
      tilt: 0.82 + Math.random() * 0.18,    // tight orbital plane
      size: 1.5 + Math.random() * 2.2,
      hue: 262 + Math.random() * 26,        // violet-amethyst spectrum
      drift: Math.random() * 0.5 + 0.75,
    }));

    const orbs = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: 80 + Math.random() * 130,
      vx: (Math.random() - 0.5) * 0.0004,
      vy: (Math.random() - 0.5) * 0.0003,
      hue: [268, 285, 300][i % 3],
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
      const cx = W * 0.5 + Math.sin(t * 0.004) * W * 0.03;
      const cy = H * 0.46 + Math.cos(t * 0.003) * H * 0.03;
      const R = Math.min(W, H) * (0.21 + Math.sin(t * 0.02) * 0.012);
      return { cx, cy, R };
    }

    function draw() {
      t += 1;
      const isLight = document.documentElement.classList.contains('light');

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);

      // In Dark Mode: 'lighter' gives vibrant additive radiance
      // In Light Mode: 'source-over' gives rich color saturation against light bg
      ctx.globalCompositeOperation = isLight ? 'source-over' : 'lighter';

      const { cx, cy, R } = orbCenter();

      // 1. Ambient drifting background orbs (subtle & non-intrusive)
      for (const o of orbs) {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < -0.2 || o.x > 1.2) o.vx *= -1;
        if (o.y < -0.2 || o.y > 1.2) o.vy *= -1;
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

      // 2. Wide outer bloom (soft violet halo)
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 4.0);
      if (isLight) {
        bloom.addColorStop(0, 'hsla(270, 85%, 62%, 0.16)');
        bloom.addColorStop(0.35, 'hsla(275, 80%, 68%, 0.07)');
        bloom.addColorStop(1, 'hsla(280, 75%, 72%, 0)');
      } else {
        bloom.addColorStop(0, 'hsla(270, 95%, 72%, 0.2)');
        bloom.addColorStop(0.35, 'hsla(275, 90%, 62%, 0.09)');
        bloom.addColorStop(1, 'hsla(280, 90%, 60%, 0)');
      }
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 4.0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Central pulsing revolving core
      const pulse = 1 + Math.sin(t * 0.05) * 0.06;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.5 * pulse);

      if (isLight) {
        // High-contrast, clean luminous orb matching dark mode structure
        core.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        core.addColorStop(0.2, 'hsla(265, 90%, 75%, 0.65)');
        core.addColorStop(0.5, 'hsla(270, 85%, 55%, 0.45)');
        core.addColorStop(0.8, 'hsla(272, 80%, 60%, 0.2)');
        core.addColorStop(1, 'hsla(275, 75%, 65%, 0)');
      } else {
        core.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        core.addColorStop(0.35, 'hsla(265, 100%, 88%, 0.55)');
        core.addColorStop(0.7, 'hsla(270, 95%, 72%, 0.3)');
        core.addColorStop(1, 'hsla(272, 95%, 65%, 0)');
      }
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.5 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // 4. Orbiting energy particles revolving tightly around the core
      for (const p of PARTICLES) {
        const a = p.phase + t * p.speed;
        const rr = R * p.rf * (1 + Math.sin(t * 0.01 + p.phase) * 0.06 * p.drift);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr * p.tilt;
        const size = p.size * (0.8 + 0.4 * Math.sin(t * 0.03 + p.phase));

        const g = ctx.createRadialGradient(x, y, 0, x, y, size * 5.5);

        if (isLight) {
          // Sharp, saturated glowing violet-amethyst dots clearly orbiting the core
          g.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
          g.addColorStop(0.25, `hsla(${p.hue}, 90%, 55%, 0.75)`);
          g.addColorStop(0.6, `hsla(${p.hue}, 85%, 62%, 0.4)`);
          g.addColorStop(1, `hsla(${p.hue}, 80%, 70%, 0)`);
        } else {
          g.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
          g.addColorStop(0.35, `hsla(${p.hue}, 100%, 82%, 0.4)`);
          g.addColorStop(1, `hsla(${p.hue}, 100%, 75%, 0)`);
        }

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, size * 5.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Crackling micro-sparks near core
      const sparkCount = 9;
      for (let i = 0; i < sparkCount; i++) {
        const seed = i * 137.5;
        const a = (seed + t * (0.02 + (i % 3) * 0.01)) % (Math.PI * 2);
        const rr = R * (0.35 + ((Math.sin(t * 0.09 + seed) + 1) / 2) * 0.45);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr * 0.9;

        ctx.fillStyle = isLight
          ? 'hsla(270, 85%, 50%, 0.55)'
          : 'rgba(240, 230, 255, 0.4)';

        ctx.beginPath();
        ctx.arc(x, y, 1.1, 0, Math.PI * 2);
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
