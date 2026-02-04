'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

// Subtle floating particle
const Particle = memo(function Particle({
  x, y, delay, duration
}: {
  x: number; y: number; delay: number; duration: number
}) {
  return (
    <motion.div
      className="particle"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        y: [0, -30, 0],
        opacity: [0, 0.8, 0],
        scale: [0.5, 1, 0.5],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
});

// Generate particles
function useParticles() {
  return useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: `p-${i}`,
      x: 10 + Math.random() * 80,
      y: 40 + Math.random() * 50,
      delay: i * 1.5,
      duration: 8 + Math.random() * 4,
    }));
  }, []);
}

export const EnchantedForest = memo(function EnchantedForest() {
  const particles = useParticles();

  return (
    <div className="enchanted-forest">
      {/* Base gradient */}
      <div className="forest-gradient" />

      {/* Ambient glow */}
      <div className="forest-glow" />

      {/* Bokeh lights */}
      <div className="bokeh bokeh-1" />
      <div className="bokeh bokeh-2" />
      <div className="bokeh bokeh-3" />

      {/* Subtle particles */}
      {particles.map((p) => (
        <Particle key={p.id} x={p.x} y={p.y} delay={p.delay} duration={p.duration} />
      ))}

      {/* Noise texture */}
      <div className="forest-noise" />

      {/* Vignette */}
      <div className="forest-vignette" />
    </div>
  );
});

export default EnchantedForest;
