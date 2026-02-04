'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

// Magical floating particles
const Particle = memo(function Particle({ delay, x, size, duration }: { delay: number; x: number; size: number; duration: number }) {
  return (
    <motion.div
      className="enchanted-particle"
      style={{
        left: `${x}%`,
        width: size,
        height: size,
      }}
      animate={{
        y: ['100vh', '-10vh'],
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1, 1, 0.5],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
});

// Firefly/sparkle effect
const Firefly = memo(function Firefly({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="enchanted-firefly"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        opacity: [0, 1, 0.3, 1, 0],
        scale: [0.8, 1.2, 0.9, 1.1, 0.8],
        x: [0, 10, -5, 8, 0],
        y: [0, -8, 5, -3, 0],
      }}
      transition={{
        duration: 4 + Math.random() * 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
});

// Pre-generate particle positions
const particles = Array.from({ length: 25 }).map((_, i) => ({
  id: `particle-${i}`,
  x: Math.random() * 100,
  delay: i * 0.8,
  size: 3 + Math.random() * 5,
  duration: 15 + Math.random() * 10,
}));

// Pre-generate firefly positions
const fireflies = Array.from({ length: 40 }).map((_, i) => ({
  id: `firefly-${i}`,
  x: Math.random() * 100,
  y: 30 + Math.random() * 70, // Keep them mostly in lower/mid area
  delay: i * 0.5,
}));

export const EnchantedForest = memo(function EnchantedForest() {
  return (
    <div className="enchanted-forest">
      {/* Parallax Layer 1: Full Background */}
      <div className="parallax-layer layer-back" />

      {/* Parallax Layer 2: Midground (bottom overlay) */}
      <div className="parallax-layer layer-mid" />

      {/* Parallax Layer 3: Foreground (bottom overlay) */}
      <div className="parallax-layer layer-front" />

      {/* Dark overlay for depth */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Magical mist layers for depth */}
      <div className="enchanted-mist opacity-40 mix-blend-screen" />
      <div className="enchanted-mist opacity-30 animation-delay-2000 mix-blend-screen" style={{ animationDuration: '25s' }} />

      {/* Floating particles (spores/magic) */}
      {particles.map((p) => (
        <Particle key={p.id} x={p.x} delay={p.delay} size={p.size} duration={p.duration} />
      ))}

      {/* Fireflies */}
      {fireflies.map((f) => (
        <Firefly key={f.id} x={f.x} y={f.y} delay={f.delay} />
      ))}

      {/* Ambient glow overlay */}
      <div className="enchanted-glow mix-blend-soft-light" />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(10, 20, 30, 0.6) 100%)'
        }}
      />
    </div>
  );
});

export default EnchantedForest;
