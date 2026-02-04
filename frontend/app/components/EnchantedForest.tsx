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
const particles = Array.from({ length: 20 }).map((_, i) => ({
  id: `particle-${i}`,
  x: Math.random() * 100,
  delay: i * 0.8,
  size: 4 + Math.random() * 6,
  duration: 15 + Math.random() * 10,
}));

// Pre-generate firefly positions
const fireflies = Array.from({ length: 30 }).map((_, i) => ({
  id: `firefly-${i}`,
  x: Math.random() * 100,
  y: 20 + Math.random() * 60,
  delay: i * 0.5,
}));

export const EnchantedForest = memo(function EnchantedForest() {
  return (
    <div className="enchanted-forest">
      {/* Sky gradient layer */}
      <div className="enchanted-sky" />

      {/* Stars/distant sparkles */}
      <div className="enchanted-stars" />

      {/* Background mountains/hills */}
      <div className="enchanted-mountains" />

      {/* Mid-ground forest silhouette */}
      <div className="enchanted-trees-back" />

      {/* Main forest layer */}
      <div className="enchanted-trees-mid" />

      {/* Foreground bushes/grass */}
      <div className="enchanted-foliage" />

      {/* Magical mist */}
      <div className="enchanted-mist" />

      {/* Floating particles */}
      {particles.map((p) => (
        <Particle key={p.id} x={p.x} delay={p.delay} size={p.size} duration={p.duration} />
      ))}

      {/* Fireflies */}
      {fireflies.map((f) => (
        <Firefly key={f.id} x={f.x} y={f.y} delay={f.delay} />
      ))}

      {/* Ambient glow overlay */}
      <div className="enchanted-glow" />
    </div>
  );
});

export default EnchantedForest;
