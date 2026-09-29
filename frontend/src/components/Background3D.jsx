import { useEffect, useRef } from 'react';

/**
 * Violet plasma-orb background (canvas):
 *  - bright white-violet pulsing core with a wide soft bloom
 *  - glowing energy particles orbiting the core (no threads/lines)
 *  - faint drifting ambient orbs
 * Rendered additively ("lighter") on a fixed canvas behind the UI.
 * Dims itself when <html> has the `light` class; respects reduced motion.
 */
export default function Background3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let W = 0;
    let H = 0;
    let t = 0;

    // orbiting energy particles: radius factor, speed, phase, size, hue offset
    const PARTICLES = Array.from({ length: 26 }, (_, i) => ({
      rf: 0.55 + Math.random() * 1.5,      // orbit radius (× core radius)
      speed: 0.004 + Math.random() * 0.012, // angular speed
      phase: Math.random() * Math.PI * 2,
      tilt: 0.82 + Math.random() * 0.2,     // slight elliptical squash
      size: 1.2 + Math.random() * 2.4,
      hue: 262 + Math.random() * 26,
      drift: Math.random() * 0.5 + 0.75,    // radial breathing factor
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

    // position of the orb (floats gently around center)
    function orbCenter() {
      const cx = W * 0.5 + Math.sin(t * 0.004) * W * 0.03;
      const cy = H * 0.46 + Math.cos(t * 0.003) * H * 0.03;
      const R = Math.min(W, H) * (0.21 + Math.sin(t * 0.02) * 0.012); // breathing radius
      return { cx, cy, R };
    }

    function draw() {
      t += 1;
      const light = document.documentElement.classList.contains('light');
      const dim = light ? 0.35 : 1;

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter'; // additive glow

      // ---- ambient drifting orbs ----
      for (const o of orbs) {
        o.x += o.vx;
        o.y += o.vy;
        if (o.x < -0.2 || o.x > 1.2) o.vx *= -1;
        if (o.y < -0.2 || o.y > 1.2) o.vy *= -1;
        const g = ctx.createRadialGradient(o.x * W, o.y * H, 0, o.x * W, o.y * H, o.r);
        g.addColorStop(0, `hsla(${o.hue}, 90%, 65%, ${0.08 * dim})`);
        g.addColorStop(1, 'hsla(275, 90%, 65%, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x * W, o.y * H, o.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const { cx, cy, R } = orbCenter();

      // ---- core bloom (wide violet halo) ----
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 4.2);
      bloom.addColorStop(0, `hsla(270, 95%, 72%, ${0.2 * dim})`);
      bloom.addColorStop(0.35, `hsla(275, 90%, 62%, ${0.09 * dim})`);
      bloom.addColorStop(1, 'hsla(280, 90%, 60%, 0)');
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 4.2, 0, Math.PI * 2);
      ctx.fill();

      // ---- bright core ----
      const pulse = 1 + Math.sin(t * 0.05) * 0.06;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.5 * pulse);
      core.addColorStop(0, `rgba(255, 255, 255, ${0.9 * dim})`);
      core.addColorStop(0.35, `hsla(265, 100%, 88%, ${0.55 * dim})`);
      core.addColorStop(0.7, `hsla(270, 95%, 72%, ${0.3 * dim})`);
      core.addColorStop(1, 'hsla(272, 95%, 65%, 0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.5 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // ---- orbiting energy particles (glowing dots, no lines) ----
      for (const p of PARTICLES) {
        const a = p.phase + t * p.speed;
        const rr = R * p.rf * (1 + Math.sin(t * 0.01 + p.phase) * 0.06 * p.drift);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr * p.tilt;
        const size = p.size * (0.8 + 0.4 * Math.sin(t * 0.03 + p.phase));

        const g = ctx.createRadialGradient(x, y, 0, x, y, size * 6);
        g.addColorStop(0, `rgba(255, 255, 255, ${0.55 * dim})`);
        g.addColorStop(0.35, `hsla(${p.hue}, 100%, 82%, ${0.4 * dim})`);
        g.addColorStop(1, `hsla(${p.hue}, 100%, 75%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, size * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- crackling micro-sparks near the core ----
      const sparkCount = 9;
      for (let i = 0; i < sparkCount; i++) {
        const seed = i * 137.5;
        const a = (seed + t * (0.02 + (i % 3) * 0.01)) % (Math.PI * 2);
        const rr = R * (0.35 + ((Math.sin(t * 0.09 + seed) + 1) / 2) * 0.45);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr * 0.9;
        ctx.fillStyle = `rgba(240, 230, 255, ${0.4 * dim})`;
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
