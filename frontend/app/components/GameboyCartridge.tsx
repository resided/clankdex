'use client';

import { motion } from 'framer-motion';

interface GameboyCartridgeProps {
  element?: 'Fire' | 'Water' | 'Grass' | 'Electric' | 'Ice' | 'Psychic' | 'Dragon' | 'Poison' | 'Fighting' | 'Ground' | 'Flying' | 'Bug';
  title?: string;
  slogan?: string;
  scale?: number;
  className?: string;
  animate?: boolean;
}

// Element-specific gradients and colors
const ELEMENT_THEMES: Record<string, { gradient: string; accent: string; title: string; slogan: string }> = {
  Fire: {
    gradient: 'linear-gradient(220deg, #ff6b35, #f7931e)',
    accent: '#ff4500',
    title: 'CLANKDEX',
    slogan: 'FIRE EDITION',
  },
  Water: {
    gradient: 'linear-gradient(220deg, #00b4d8, #0077b6)',
    accent: '#0096c7',
    title: 'CLANKDEX',
    slogan: 'WATER EDITION',
  },
  Grass: {
    gradient: 'linear-gradient(220deg, #95d5b2, #40916c)',
    accent: '#52b788',
    title: 'CLANKDEX',
    slogan: 'GRASS EDITION',
  },
  Electric: {
    gradient: 'linear-gradient(220deg, #ffea00, #ffc300)',
    accent: '#ffd60a',
    title: 'CLANKDEX',
    slogan: 'ELECTRIC EDITION',
  },
  Ice: {
    gradient: 'linear-gradient(220deg, #a2d2ff, #bde0fe)',
    accent: '#90e0ef',
    title: 'CLANKDEX',
    slogan: 'ICE EDITION',
  },
  Psychic: {
    gradient: 'linear-gradient(220deg, #e056fd, #be2edd)',
    accent: '#c77dff',
    title: 'CLANKDEX',
    slogan: 'PSYCHIC EDITION',
  },
  Dragon: {
    gradient: 'linear-gradient(220deg, #7400b8, #5e60ce)',
    accent: '#6930c3',
    title: 'CLANKDEX',
    slogan: 'DRAGON EDITION',
  },
  Poison: {
    gradient: 'linear-gradient(220deg, #9d4edd, #7b2cbf)',
    accent: '#9d4edd',
    title: 'CLANKDEX',
    slogan: 'POISON EDITION',
  },
  Fighting: {
    gradient: 'linear-gradient(220deg, #d62828, #9d0208)',
    accent: '#dc2f02',
    title: 'CLANKDEX',
    slogan: 'FIGHTING EDITION',
  },
  Ground: {
    gradient: 'linear-gradient(220deg, #bc6c25, #dda15e)',
    accent: '#bc6c25',
    title: 'CLANKDEX',
    slogan: 'GROUND EDITION',
  },
  Flying: {
    gradient: 'linear-gradient(220deg, #89c2d9, #a9d6e5)',
    accent: '#61a5c2',
    title: 'CLANKDEX',
    slogan: 'FLYING EDITION',
  },
  Bug: {
    gradient: 'linear-gradient(220deg, #80b918, #55a630)',
    accent: '#70e000',
    title: 'CLANKDEX',
    slogan: 'BUG EDITION',
  },
};

export default function GameboyCartridge({
  element = 'Fire',
  title,
  slogan,
  scale = 1,
  className = '',
  animate = true,
}: GameboyCartridgeProps) {
  const theme = ELEMENT_THEMES[element] || ELEMENT_THEMES.Fire;
  const displayTitle = title || theme.title;
  const displaySlogan = slogan || theme.slogan;

  const cartridgeContent = (
    <div
      className={`gameboy-cartridge ${className}`}
      style={{
        ['--cartridge-color' as string]: '#8c8c8c',
        ['--fancy-gradient' as string]: theme.gradient,
        ['--accent-color' as string]: theme.accent,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }}
    >
      {/* Cartridge Top Notch */}
      <div className="cartridge-top" />

      {/* Header with ClankDex Branding */}
      <div className="cartridge-header">
        <div className="cartridge-header-overlay">
          <div className="cartridge-brand">
            <div className="brand-text">
              <span className="model">CLANKDEX</span>
              <span className="sign">TM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cartridge Body */}
      <div className="cartridge-body">
        <div className="cartridge-end" />
        <div className="cartridge-label-container">
          <div className="cartridge-gap">
            {/* Label */}
            <div className="label">
              <div className="label-title">{displayTitle}</div>
              <div className="label-slogan">{displaySlogan}</div>

              {/* ClankDex Seal */}
              <div className="base-seal">
                <span>DEX</span>
                <span className="seal-subtitle">OFFICIAL</span>
              </div>

              {/* ClankDex Gold Seal */}
              <div className="clanker-seal">
                <div className="seal-inner">
                  <span>CLANK</span>
                  <span className="seal-subtitle">ORIGINAL</span>
                </div>
              </div>
            </div>
          </div>
          <div className="arrow-down" />
        </div>
        <div className="cartridge-end" />
      </div>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: scale * 1.05, rotate: 2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {cartridgeContent}
      </motion.div>
    );
  }

  return cartridgeContent;
}

// Floating cartridges background component
export function FloatingCartridges({ count = 12 }: { count?: number }) {
  const elements = ['Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Psychic', 'Dragon', 'Poison', 'Fighting', 'Ground', 'Flying', 'Bug'] as const;

  // Pre-generate positions for consistent rendering
  const cartridges = Array.from({ length: count }).map((_, i) => ({
    element: elements[i % elements.length],
    x: (i * 17 + 5) % 90 + 5, // Spread evenly 5-95%
    delay: i * 1.5,
    duration: 20 + (i % 5) * 3, // 20-32s
    scale: 0.5 + (i % 3) * 0.1, // 0.5-0.7
  }));

  return (
    <div className="floating-cartridges">
      {cartridges.map((cart, i) => (
        <motion.div
          key={i}
          className="floating-cartridge"
          style={{
            position: 'absolute',
            left: `${cart.x}%`,
            top: '-350px',
          }}
          animate={{
            y: ['0vh', '130vh'],
            rotate: [0, 10, -10, 5, 0],
            opacity: [0, 0.85, 0.85, 0.85, 0],
          }}
          transition={{
            duration: cart.duration,
            delay: cart.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <GameboyCartridge
            element={cart.element}
            scale={cart.scale}
            animate={false}
          />
        </motion.div>
      ))}
    </div>
  );
}
