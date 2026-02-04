'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

// Firefly - Navi-style glowing fairy light
const Firefly = memo(function Firefly({ delay, x, y, duration }: { delay: number; x: number; y: number; duration: number }) {
  return (
    <motion.div
      className="firefly"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        opacity: [0, 1, 0.4, 1, 0],
        scale: [0.3, 1, 0.7, 1.1, 0.3],
        x: [0, 20, -15, 25, 0],
        y: [0, -15, 10, -8, 0],
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

// Larger fairy wisp - blue-tinted Zelda fairy
const Fairy = memo(function Fairy({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="fairy"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        opacity: [0, 0.9, 0.5, 0.9, 0],
        scale: [0.5, 1.2, 0.9, 1.1, 0.5],
        x: [0, 30, -20, 35, 0],
        y: [0, -25, 15, -10, 0],
      }}
      transition={{
        duration: 8 + Math.random() * 4,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
});

// Rising spore particle
const Spore = memo(function Spore({ delay, x }: { delay: number; x: number }) {
  return (
    <motion.div
      className="spore"
      style={{ left: `${x}%`, bottom: '5%' }}
      animate={{
        y: [0, -400, -600],
        x: [0, Math.random() * 40 - 20, Math.random() * 60 - 30],
        opacity: [0, 0.8, 0],
        scale: [0.5, 1, 0.3],
      }}
      transition={{
        duration: 12 + Math.random() * 8,
        delay,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    />
  );
});

// Sparkle burst
const Sparkle = memo(function Sparkle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="sparkle"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0.3, 1.2, 0.3],
        rotate: [0, 45, 90],
      }}
      transition={{
        duration: 2 + Math.random() * 1.5,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
});

// Glowing orb - Zelda collectible style
const Orb = memo(function Orb({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="orb"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{
        opacity: [0.3, 0.9, 0.5, 0.9, 0.3],
        scale: [0.8, 1.1, 0.9, 1.05, 0.8],
        y: [0, -8, 4, -6, 0],
      }}
      transition={{
        duration: 5 + Math.random() * 2,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
});

// Falling leaf
const Leaf = memo(function Leaf({ delay, x }: { delay: number; x: number }) {
  const rotation = Math.random() * 360;
  return (
    <motion.div
      className="leaf"
      style={{ left: `${x}%`, top: '-5%', rotate: rotation }}
      animate={{
        y: [0, 800],
        x: [0, Math.sin(x) * 100],
        rotate: [rotation, rotation + 360 * 2],
        opacity: [0, 0.6, 0.6, 0],
      }}
      transition={{
        duration: 15 + Math.random() * 10,
        delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
});

// Generate random positions with useMemo to avoid hydration issues
function useParticles() {
  return useMemo(() => {
    // Fireflies - scattered in lower 60% of screen
    const fireflies = Array.from({ length: 25 }).map((_, i) => ({
      id: `firefly-${i}`,
      x: Math.random() * 100,
      y: 35 + Math.random() * 60,
      delay: i * 0.5,
      duration: 6 + Math.random() * 4,
    }));

    // Fairies - fewer, more prominent
    const fairies = Array.from({ length: 6 }).map((_, i) => ({
      id: `fairy-${i}`,
      x: 10 + Math.random() * 80,
      y: 30 + Math.random() * 50,
      delay: i * 2,
    }));

    // Rising spores
    const spores = Array.from({ length: 15 }).map((_, i) => ({
      id: `spore-${i}`,
      x: Math.random() * 100,
      delay: i * 1.2,
    }));

    // Sparkles
    const sparkles = Array.from({ length: 20 }).map((_, i) => ({
      id: `sparkle-${i}`,
      x: Math.random() * 100,
      y: 20 + Math.random() * 70,
      delay: i * 0.7,
    }));

    // Glowing orbs - few, special
    const orbs = Array.from({ length: 4 }).map((_, i) => ({
      id: `orb-${i}`,
      x: 15 + (i * 25) + Math.random() * 10,
      y: 50 + Math.random() * 35,
      delay: i * 1.5,
    }));

    // Falling leaves
    const leaves = Array.from({ length: 8 }).map((_, i) => ({
      id: `leaf-${i}`,
      x: Math.random() * 100,
      delay: i * 3,
    }));

    return { fireflies, fairies, spores, sparkles, orbs, leaves };
  }, []);
}

export const EnchantedForest = memo(function EnchantedForest() {
  const { fireflies, fairies, spores, sparkles, orbs, leaves } = useParticles();

  return (
    <div className="enchanted-forest">
      {/* God rays from above */}
      <div className="forest-rays" />

      {/* Aurora glow */}
      <div className="forest-aurora" />

      {/* Ambient mist layers */}
      <div className="forest-mist" />
      <div className="forest-mist-2" />

      {/* Tree layers - back to front for parallax depth */}
      <div className="forest-trees-back" />
      <div className="forest-trees-mid" />
      <div className="forest-trees-front" />

      {/* Ground and grass */}
      <div className="forest-ground" />
      <div className="forest-grass" />

      {/* Falling leaves */}
      {leaves.map((l) => (
        <Leaf key={l.id} x={l.x} delay={l.delay} />
      ))}

      {/* Rising spores */}
      {spores.map((s) => (
        <Spore key={s.id} x={s.x} delay={s.delay} />
      ))}

      {/* Fireflies */}
      {fireflies.map((f) => (
        <Firefly key={f.id} x={f.x} y={f.y} delay={f.delay} duration={f.duration} />
      ))}

      {/* Fairies */}
      {fairies.map((f) => (
        <Fairy key={f.id} x={f.x} y={f.y} delay={f.delay} />
      ))}

      {/* Sparkles */}
      {sparkles.map((s) => (
        <Sparkle key={s.id} x={s.x} y={s.y} delay={s.delay} />
      ))}

      {/* Glowing orbs */}
      {orbs.map((o) => (
        <Orb key={o.id} x={o.x} y={o.y} delay={o.delay} />
      ))}

      {/* Ambient pulse */}
      <div className="forest-pulse" />

      {/* Vignette for cinematic depth */}
      <div className="forest-vignette" />
    </div>
  );
});

export default EnchantedForest;
