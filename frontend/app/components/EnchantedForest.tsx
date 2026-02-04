'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

// Firefly component with random floating animation
const Firefly = memo(function Firefly({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="firefly"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        opacity: [0, 1, 0.3, 1, 0],
        scale: [0.5, 1.2, 0.8, 1.1, 0.5],
        x: [0, 15, -10, 12, 0],
        y: [0, -12, 8, -5, 0],
      }}
      transition={{
        duration: 5 + Math.random() * 3,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
});

// Sparkle component - smaller, faster
const Sparkle = memo(function Sparkle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="sparkle"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0.3, 1, 0.3],
      }}
      transition={{
        duration: 2 + Math.random() * 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
});

// Pre-generate firefly positions (mostly in lower half for forest feel)
const fireflies = Array.from({ length: 30 }).map((_, i) => ({
  id: `firefly-${i}`,
  x: Math.random() * 100,
  y: 40 + Math.random() * 55,
  delay: i * 0.4,
}));

// Pre-generate sparkle positions (scattered throughout)
const sparkles = Array.from({ length: 20 }).map((_, i) => ({
  id: `sparkle-${i}`,
  x: Math.random() * 100,
  y: 20 + Math.random() * 70,
  delay: i * 0.6,
}));

export const EnchantedForest = memo(function EnchantedForest() {
  return (
    <div className="enchanted-forest">
      {/* Ambient mist */}
      <div className="forest-mist" />

      {/* Tree layers - back to front for depth */}
      <div className="forest-trees-back" />
      <div className="forest-trees-mid" />
      <div className="forest-trees-front" />

      {/* Ground and grass */}
      <div className="forest-ground" />
      <div className="forest-grass" />

      {/* Fireflies */}
      {fireflies.map((f) => (
        <Firefly key={f.id} x={f.x} y={f.y} delay={f.delay} />
      ))}

      {/* Sparkles */}
      {sparkles.map((s) => (
        <Sparkle key={s.id} x={s.x} y={s.y} delay={s.delay} />
      ))}

      {/* Vignette for depth */}
      <div className="forest-vignette" />
    </div>
  );
});

export default EnchantedForest;
