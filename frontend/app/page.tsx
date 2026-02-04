'use client';

import { useState, useEffect, useMemo } from 'react';
import type { EvolutionRecord, CreatureRecord, CreatorStreak, TokenOfTheDay } from '@/lib/supabase';
import { getAllCreatures, createEvolution, getMergeableTokens } from '@/lib/supabase';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useFarcaster } from './components/FarcasterProvider';
import { EnchantedForest } from './components/EnchantedForest';
import {
  Sparkles,
  Zap,
  Shield,
  Sword,
  Wind,
  Flame,
  Droplets,
  Leaf,
  Eye,
  Activity,
  Wallet,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Coins,
  ExternalLink,
  Rocket,
  Droplet,
  AtSign,
  User,
  ToggleLeft,
  ToggleRight,
  LogOut,
  Search,
  BookOpen,
  ScanLine,
  DollarSign,
  BarChart3,
  Crown,
  Star,
  Egg,
  Baby,
  Menu,
  X,
  RotateCcw,
  Filter,
  ArrowUpDown,
  Target,
  Crosshair,
  Hexagon,
  Triangle,
  Circle,
  Square,
  Pentagon,
  Octagon,
  Diamond,
  Trophy,
  GitMerge,
  Share2,
  Award
} from 'lucide-react';

// Contract ABI for Registry
const REGISTRY_ABI = [
  {
    inputs: [{ name: 'creator', type: 'address' }],
    name: 'creatorHasCreature',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'creator', type: 'address' }],
    name: 'getCreaturesByCreator',
    outputs: [{
      components: [
        { name: 'tokenAddress', type: 'address' },
        { name: 'name', type: 'string' },
        { name: 'element', type: 'string' },
        { name: 'level', type: 'uint8' },
        { name: 'hp', type: 'uint8' },
        { name: 'attack', type: 'uint8' },
        { name: 'defense', type: 'uint8' },
        { name: 'speed', type: 'uint8' },
        { name: 'special', type: 'uint8' },
      ],
      name: '',
      type: 'tuple[]'
    }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
const CLANKER_URL = 'https://clanker.world';

// Animation Components
const AnimatedButton = ({ children, onClick, className, disabled, variant = 'primary' }: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
}) => {
  const variants = {
    primary: 'bg-pokedex-red hover:bg-red-600',
    secondary: 'bg-gray-700 hover:bg-gray-600',
    danger: 'bg-red-700 hover:bg-red-600',
    success: 'bg-green-600 hover:bg-green-500',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.95, y: disabled ? 0 : 2 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
      disabled={disabled}
      className={`btn-press relative px-6 py-3 font-pixel text-xs uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${variants[variant]} ${className}`}
    >
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ x: '-100%', opacity: 0 }}
        whileHover={{ x: '100%', opacity: [0, 0.3, 0] }}
        transition={{ duration: 0.6 }}
      />
      {children}
    </motion.button>
  );
};

const PokeballLoader = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizes = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' };
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className={`${sizes[size]} relative`}
    >
      <div className="absolute inset-0 rounded-full border-4 border-white overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-red-500" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-white rounded-full border-4 border-black" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/6 h-1/6 bg-black rounded-full" />
      </div>
    </motion.div>
  );
};

const TypewriterText = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i <= text.length) {
          setDisplayText(text.slice(0, i));
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => setShowCursor(false), 500);
        }
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text, delay]);

  return (
    <span className={`font-pixel ${className} animate-cursor`}>
      {displayText}
      {showCursor && <span className="inline-block w-2 h-4 bg-current ml-0.5 animate-pulse" />}
    </span>
  );
};

const AnimatedStatBar = ({ value, max = 255, color = 'green', delay = 0 }: { value: number; max?: number; color?: string; delay?: number }) => {
  const percentage = Math.min((value / max) * 100, 100);
  const colors: Record<string, string> = {
    green: 'from-green-400 to-green-600',
    red: 'from-red-400 to-red-600',
    blue: 'from-blue-400 to-blue-600',
    yellow: 'from-yellow-400 to-yellow-600',
    purple: 'from-purple-400 to-purple-600',
  };

  return (
    <div className="h-3 rounded-full overflow-hidden bg-gray-700 border-2 border-gray-600">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, delay, ease: "easeOut" }}
        className={`h-full bg-gradient-to-r ${colors[color]} relative overflow-hidden`}
      >
        <motion.div
          className="absolute inset-0 bg-white/30"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
      </motion.div>
    </div>
  );
};

const FloatingElement = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <motion.div
    animate={{ y: [0, -8, 0], rotate: [0, 1, -1, 0] }}
    transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

const CardFlip = ({ children, isFlipped = false }: { children: React.ReactNode; isFlipped?: boolean }) => (
  <motion.div
    initial={false}
    animate={{ rotateY: isFlipped ? 180 : 0 }}
    transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
    style={{ transformStyle: "preserve-3d" }}
  >
    {children}
  </motion.div>
);

const StaggerContainer = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const StaggerItem = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20, scale: 0.9 },
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 24 }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const Badge = ({ children, color = 'blue', animate = true }: { children: React.ReactNode; color?: string; animate?: boolean }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/20 border-blue-500 text-blue-400',
    green: 'bg-green-500/20 border-green-500 text-green-400',
    red: 'bg-red-500/20 border-red-500 text-red-400',
    yellow: 'bg-yellow-500/20 border-yellow-500 text-yellow-400',
    purple: 'bg-purple-500/20 border-purple-500 text-purple-400',
    gray: 'bg-gray-500/20 border-gray-500 text-gray-400',
  };

  return (
    <motion.span
      initial={animate ? { scale: 0, rotate: -10 } : false}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
      whileHover={{ scale: 1.05, rotate: 2 }}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${colors[color]}`}
    >
      {children}
    </motion.span>
  );
};

const MenuSlide = ({ children, isOpen, from = 'bottom' }: { children: React.ReactNode; isOpen: boolean; from?: 'bottom' | 'right' | 'left' | 'top' }) => {
  const directions = {
    bottom: { hidden: { y: '100%', opacity: 0 }, visible: { y: 0, opacity: 1 } },
    top: { hidden: { y: '-100%', opacity: 0 }, visible: { y: 0, opacity: 1 } },
    left: { hidden: { x: '-100%', opacity: 0 }, visible: { x: 0, opacity: 1 } },
    right: { hidden: { x: '100%', opacity: 0 }, visible: { x: 0, opacity: 1 } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={directions[from].hidden}
          animate={directions[from].visible}
          exit={directions[from].hidden}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-50 bg-gray-900/95 backdrop-blur-lg border-t border-gray-700 rounded-t-3xl p-6 max-h-[80vh] overflow-auto"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1.05 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

type InputMode = 'wallet' | 'farcaster';

interface Creature {
  name: string;
  species: string;
  dna: string;
  element: string;
  level: number;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  special: number;
  description: string;
  colorPalette: string[];
  imageURI?: string;
}

interface DeployResult {
  tokenAddress: string;
  txHash?: string;
  simulated?: boolean;
  config?: {
    symbol: string;
    marketCap: string;
  };
}

interface FarcasterData {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  followerCount: number;
  followingCount: number;
  castCount: number;
  archetype: string;
  personality: {
    dominant: string;
    sentiment: string;
  };
}

// ==========================================
// ENHANCED ANIMATION COMPONENTS
// ==========================================

// DNA Helix Scanning Animation
const DNAScanningAnimation = ({ mode }: { mode: InputMode }) => {
  const steps = mode === 'wallet'
    ? ['SCANNING TRANSACTIONS...', 'ANALYZING HOLDINGS...', 'EXTRACTING DNA...', 'GENERATING CREATURE...']
    : ['SCANNING CASTS...', 'ANALYZING ENGAGEMENT...', 'MAPPING SOCIAL GRAPH...', 'GENERATING CREATURE...'];

  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentStep(s => (s + 1) % steps.length);
          return 0;
        }
        return prev + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center w-full max-w-xs">
      {/* DNA Helix Animation */}
      <div className="relative w-24 h-24 mx-auto mb-4">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${['#DC0A2D', '#FFDE00', '#3B4CCA'][i % 3]} 0%, ${['#FF5722', '#FFD700', '#5C6BC0'][i % 3]} 100%)`,
            }}
            animate={{
              x: [0, 40, 0, -40, 0],
              y: [i * 12, i * 12 + 5, i * 12, i * 12 - 5, i * 12],
              scale: [1, 1.2, 1, 1.2, 1],
              opacity: [0.5, 1, 0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
            initial={{ left: '50%', top: 0, x: '-50%' }}
          />
        ))}
        {/* Connecting lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
          <motion.path
            d="M 48 10 Q 70 30 48 50 Q 26 70 48 90"
            stroke="#DC0A2D"
            strokeWidth="2"
            fill="none"
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </svg>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
        <motion.div
          className="h-full bg-gradient-to-r from-pokedex-red via-pokedex-yellow to-pokedex-blue"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Step Text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="font-pixel text-xs text-pokedex-darkscreen"
        >
          {steps[currentStep]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

// Epic Launch Animation
const LaunchAnimation = ({ step }: { step: 'generating' | 'deploying' | 'success' }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
      <AnimatePresence mode="wait">
        {step === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="text-center"
          >
            {/* Energy swirling effect */}
            <div className="relative w-48 h-48">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-4 border-yellow-400"
                  animate={{
                    rotate: 360,
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "linear"
                  }}
                  style={{ borderStyle: 'dashed' }}
                />
              ))}
              <motion.div
                className="absolute inset-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <Sparkles className="w-16 h-16 text-white" />
              </motion.div>
            </div>
            <motion.p
              className="mt-6 text-yellow-400 font-bold text-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              GENERATING ART...
            </motion.p>
          </motion.div>
        )}

        {step === 'deploying' && (
          <motion.div
            key="deploying"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            {/* Rocket launch effect */}
            <div className="relative w-48 h-64">
              {/* Exhaust particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute left-1/2 bottom-0 w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: ['#FF5722', '#FF9800', '#FFC107', '#FFEB3B'][i % 4],
                    marginLeft: -8
                  }}
                  animate={{
                    y: [0, 100],
                    x: [0, (Math.random() - 0.5) * 60],
                    scale: [1, 0],
                    opacity: [1, 0]
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              ))}
              {/* Rocket */}
              <motion.div
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.3, repeat: Infinity }}
              >
                <Rocket className="w-24 h-24 text-white" />
              </motion.div>
              {/* Glow */}
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255,215,0,0.5) 0%, transparent 70%)'
                }}
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              />
            </div>
            <motion.p
              className="mt-4 text-white font-bold text-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              LAUNCHING TOKEN...
            </motion.p>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {/* Explosion of confetti */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#DC0A2D', '#FFDE00', '#3B4CCA', '#51AE5E', '#FF5722'][i % 5],
                  left: '50%',
                  top: '50%'
                }}
                animate={{
                  x: Math.cos(i * 18 * Math.PI / 180) * 150,
                  y: Math.sin(i * 18 * Math.PI / 180) * 150,
                  scale: [1, 0],
                  opacity: [1, 0]
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            ))}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, type: "spring" }}
              className="relative z-10"
            >
              <div className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-16 h-16 text-white" />
              </div>
            </motion.div>
            <motion.p
              className="mt-4 text-green-400 font-bold text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              TOKEN LAUNCHED!
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Creature Reveal Animation
const CreatureReveal = ({ creature, imageBase64 }: { creature: Creature | null; imageBase64: string | null }) => {
  const [phase, setPhase] = useState<'flash' | 'particles' | 'reveal'>('flash');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('particles'), 300);
    const timer2 = setTimeout(() => setPhase('reveal'), 800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      {/* Flash Effect */}
      <AnimatePresence>
        {phase === 'flash' && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white z-20"
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>

      {/* Particle Burst */}
      <AnimatePresence>
        {phase === 'particles' && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0 }}
                animate={{
                  scale: [0, 1.5, 0],
                  x: Math.cos(i * 30 * Math.PI / 180) * 80,
                  y: Math.sin(i * 30 * Math.PI / 180) * 80,
                  opacity: [1, 0]
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute w-4 h-4 rounded-full"
                style={{
                  background: ['#DC0A2D', '#FFDE00', '#3B4CCA', '#51AE5E'][i % 4],
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Creature Image */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
          delay: 0.5
        }}
        className="relative"
      >
        {imageBase64 ? (
          <motion.img
            src={imageBase64}
            alt={creature?.name}
            className="w-full h-full object-contain max-h-72 md:max-h-80"
            animate={{
              y: [0, -8, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ) : (
          <motion.div
            className="w-48 h-48 md:w-56 md:h-56 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: creature?.colorPalette[0] }}
            animate={{
              boxShadow: [
                '0 0 20px rgba(220, 10, 45, 0.3)',
                '0 0 40px rgba(220, 10, 45, 0.5)',
                '0 0 20px rgba(220, 10, 45, 0.3)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.span
              className="text-8xl"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {ELEMENT_ICONS[creature?.element || 'Fire']}
            </motion.span>
          </motion.div>
        )}

        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
          initial={{ x: '-200%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 1.5, delay: 1 }}
        />
      </motion.div>
    </div>
  );
};

interface PriceData {
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  source: string;
  lastUpdated: string;
}

// Filter and sort types
type FilterTier = 'all' | 'Egg' | 'Baby' | 'Basic' | 'Stage 1' | 'Stage 2' | 'Mega' | 'Legendary';
type FilterElement = 'all' | string;
type SortOption = 'newest' | 'oldest' | 'highestMc' | 'lowestMc' | 'highestPrice' | 'lowestPrice' | 'totalStats';

// Evolution tiers based on market cap
const EVOLUTION_TIERS = [
  { index: 0, name: 'Egg', minCap: 0, maxCap: 1000, color: 'text-gray-400', icon: Egg, hpMultiplier: 1 },
  { index: 1, name: 'Baby', minCap: 1000, maxCap: 10000, color: 'text-green-400', icon: Baby, hpMultiplier: 1.5 },
  { index: 2, name: 'Basic', minCap: 10000, maxCap: 50000, color: 'text-blue-400', icon: Star, hpMultiplier: 2 },
  { index: 3, name: 'Stage 1', minCap: 50000, maxCap: 100000, color: 'text-purple-400', icon: Sparkles, hpMultiplier: 3 },
  { index: 4, name: 'Stage 2', minCap: 100000, maxCap: 500000, color: 'text-yellow-400', icon: Zap, hpMultiplier: 5 },
  { index: 5, name: 'Mega', minCap: 500000, maxCap: 1000000, color: 'text-orange-400', icon: Flame, hpMultiplier: 10 },
  { index: 6, name: 'Legendary', minCap: 1000000, maxCap: Infinity, color: 'text-red-400', icon: Crown, hpMultiplier: 20 },
];

const getEvolutionTier = (marketCap: number) => {
  return EVOLUTION_TIERS.find(tier => marketCap >= tier.minCap && marketCap < tier.maxCap) || EVOLUTION_TIERS[0];
};

const formatMarketCap = (cap: number): string => {
  if (cap >= 1000000) return `$${(cap / 1000000).toFixed(2)}M`;
  if (cap >= 1000) return `$${(cap / 1000).toFixed(1)}K`;
  return `$${cap.toFixed(2)}`;
};

const formatPrice = (price: number): string => {
  if (price < 0.00001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
};

// Hook to fetch price data
const usePriceData = (tokenAddress: string | null) => {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenAddress) return;

    const fetchPrice = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/price?address=${tokenAddress}`);
        if (!response.ok) {
          throw new Error('Price not available');
        }
        const data = await response.json();
        setPriceData(data);
      } catch (err) {
        setError((err as Error).message);
        setPriceData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [tokenAddress]);

  return { priceData, loading, error };
};

type ScreenMode = 'menu' | 'scan' | 'creature' | 'collection' | 'faq' | 'how-it-works' | 'daily' | 'merge';

const formatEntryNumber = (num: number): string => {
  return `#${num.toString().padStart(3, '0')}`;
};

const ELEMENT_ICONS: Record<string, React.ReactNode> = {
  Fire: <Flame className="w-4 h-4" />,
  Water: <Droplets className="w-4 h-4" />,
  Grass: <Leaf className="w-4 h-4" />,
  Electric: <Zap className="w-4 h-4" />,
  Ice: <Wind className="w-4 h-4" />,
  Fighting: <Sword className="w-4 h-4" />,
  Poison: <Eye className="w-4 h-4" />,
  Ground: <Shield className="w-4 h-4" />,
  Flying: <Wind className="w-4 h-4" />,
  Psychic: <Eye className="w-4 h-4" />,
  Bug: <Leaf className="w-4 h-4" />,
  Dragon: <Flame className="w-4 h-4" />,
};

const ELEMENT_COLORS: Record<string, string> = {
  Fire: 'bg-red-500',
  Water: 'bg-blue-500',
  Grass: 'bg-green-500',
  Electric: 'bg-yellow-400',
  Ice: 'bg-cyan-400',
  Fighting: 'bg-amber-700',
  Poison: 'bg-purple-500',
  Ground: 'bg-amber-600',
  Flying: 'bg-sky-300',
  Psychic: 'bg-pink-500',
  Bug: 'bg-lime-500',
  Dragon: 'bg-violet-600',
};

// Pokédex-style gradient backgrounds for card headers
const ELEMENT_GRADIENTS: Record<string, string> = {
  Fire: 'from-orange-500 via-red-500 to-red-600',
  Water: 'from-blue-400 via-blue-500 to-blue-600',
  Grass: 'from-green-400 via-green-500 to-emerald-600',
  Electric: 'from-yellow-300 via-yellow-400 to-amber-500',
  Ice: 'from-cyan-300 via-cyan-400 to-blue-400',
  Fighting: 'from-amber-600 via-orange-700 to-red-800',
  Poison: 'from-purple-400 via-purple-500 to-violet-600',
  Ground: 'from-amber-500 via-orange-600 to-amber-700',
  Flying: 'from-sky-300 via-blue-300 to-indigo-400',
  Psychic: 'from-pink-400 via-pink-500 to-fuchsia-600',
  Bug: 'from-lime-400 via-green-500 to-emerald-500',
  Dragon: 'from-violet-500 via-purple-600 to-indigo-700',
};

// Hex colors for inline styles (matching Figma Pokédex)
const ELEMENT_HEX_COLORS: Record<string, string> = {
  Fire: '#FF5722',
  Water: '#2196F3',
  Grass: '#4CAF50',
  Electric: '#FFEB3B',
  Ice: '#00BCD4',
  Fighting: '#795548',
  Poison: '#9C27B0',
  Ground: '#8D6E63',
  Flying: '#90CAF9',
  Psychic: '#E91E63',
  Bug: '#8BC34A',
  Dragon: '#673AB7',
};

const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  legendary: 'text-yellow-400',
};

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { isFrameContext, user: frameUser, isReady: farcasterReady, composeCast } = useFarcaster();
  const [inputMode, setInputMode] = useState<InputMode>('wallet');
  const [farcasterInput, setFarcasterInput] = useState('');
  // In miniapp: always use signed-in user; never allow a different Farcaster username
  const effectiveFarcasterUsername = (isFrameContext && frameUser?.username)
    ? frameUser.username
    : farcasterInput.trim();
  const [creature, setCreature] = useState<Creature | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintStep, setMintStep] = useState<'idle' | 'generating' | 'deploying'>('idle');
  const [showCreature, setShowCreature] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [farcasterData, setFarcasterData] = useState<FarcasterData | null>(null);

  // Screen navigation state (emulator style)
  const [screenMode, setScreenMode] = useState<ScreenMode>('menu');
  const [menuIndex, setMenuIndex] = useState(0);
  const menuItems = ['scan', 'collection', 'daily', 'merge', 'faq', 'how-it-works'] as const;

  // New feature states
  const [creatorStreak, setCreatorStreak] = useState<CreatorStreak | null>(null);
  const [tokenOfTheDay, setTokenOfTheDay] = useState<TokenOfTheDay | null>(null);
  const [mergeableTokens, setMergeableTokens] = useState<CreatureRecord[]>([]);
  const [selectedParents, setSelectedParents] = useState<[string | null, string | null]>([null, null]);
  const [referralCode, setReferralCode] = useState<string>('');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<any>(null);

  // In-app feedback (replaces alert) — dismissible banner
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Boot screen state
  const [isBooting, setIsBooting] = useState(true);

  // Boot sequence timer
  useEffect(() => {
    const bootTimer = setTimeout(() => {
      setIsBooting(false);
    }, 2800); // 2.8s boot sequence
    return () => clearTimeout(bootTimer);
  }, []);


  // Rolodex state
  const [clankdexEntries, setClankdexEntries] = useState<CreatureRecord[]>([]);
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced filter state
  const [filterTier, setFilterTier] = useState<FilterTier>('all');
  const [filterElement, setFilterElement] = useState<FilterElement>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [priceDataCache, setPriceDataCache] = useState<Record<string, PriceData>>({});

  // Load entries from Supabase on mount
  useEffect(() => {
    const loadEntries = async () => {
      const entries = await getAllCreatures();
      setClankdexEntries(entries);
    };
    loadEntries();
  }, []);

  // Load creator streak when wallet connected
  useEffect(() => {
    if (!isConnected || !address) return;

    const loadStreak = async () => {
      try {
        const response = await fetch(`/api/streak?creator=${address}`);
        if (response.ok) {
          const data = await response.json();
          setCreatorStreak(data);
        }
      } catch (error) {
        console.error('Failed to load streak:', error);
      }
    };
    loadStreak();
  }, [isConnected, address]);

  // Load mergeable tokens when on merge screen
  useEffect(() => {
    if (screenMode !== 'merge' || !isConnected || !address) return;

    const loadMergeable = async () => {
      const tokens = await getMergeableTokens(address);
      setMergeableTokens(tokens);
    };
    loadMergeable();
  }, [screenMode, isConnected, address]);

  // Fetch price data for all entries when in collection mode
  useEffect(() => {
    if (screenMode !== 'collection' || clankdexEntries.length === 0) return;

    const fetchAllPrices = async () => {
      const addresses = clankdexEntries.map(e => e.token_address);
      try {
        const response = await fetch('/api/price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addresses }),
        });
        if (response.ok) {
          const data = await response.json();
          setPriceDataCache(data.prices);
        }
      } catch (error) {
        console.error('Failed to fetch batch prices:', error);
      }
    };

    fetchAllPrices();
    // Refresh every 60 seconds
    const interval = setInterval(fetchAllPrices, 60000);
    return () => clearInterval(interval);
  }, [screenMode, clankdexEntries]);

  // Filter and sort entries
  const filteredEntries = useMemo(() => {
    let entries = [...clankdexEntries];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(entry =>
        entry.name.toLowerCase().includes(query) ||
        entry.element.toLowerCase().includes(query) ||
        formatEntryNumber(entry.entry_number).toLowerCase().includes(query) ||
        entry.token_symbol.toLowerCase().includes(query)
      );
    }

    // Element filter
    if (filterElement !== 'all') {
      entries = entries.filter(entry => entry.element === filterElement);
    }

    // Tier filter (based on cached price data)
    if (filterTier !== 'all') {
      entries = entries.filter(entry => {
        const priceData = priceDataCache[entry.token_address.toLowerCase()];
        if (!priceData) return filterTier === 'Egg'; // Default to Egg if no price
        const tier = getEvolutionTier(priceData.marketCap);
        return tier.name === filterTier;
      });
    }

    // Sorting
    entries.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'highestMc': {
          const mcA = priceDataCache[a.token_address.toLowerCase()]?.marketCap || 0;
          const mcB = priceDataCache[b.token_address.toLowerCase()]?.marketCap || 0;
          return mcB - mcA;
        }
        case 'lowestMc': {
          const mcA = priceDataCache[a.token_address.toLowerCase()]?.marketCap || 0;
          const mcB = priceDataCache[b.token_address.toLowerCase()]?.marketCap || 0;
          return mcA - mcB;
        }
        case 'highestPrice': {
          const pA = priceDataCache[a.token_address.toLowerCase()]?.price || 0;
          const pB = priceDataCache[b.token_address.toLowerCase()]?.price || 0;
          return pB - pA;
        }
        case 'lowestPrice': {
          const pA = priceDataCache[a.token_address.toLowerCase()]?.price || 0;
          const pB = priceDataCache[b.token_address.toLowerCase()]?.price || 0;
          return pA - pB;
        }
        case 'totalStats': {
          const statsA = a.hp + a.attack + a.defense + a.speed + a.special;
          const statsB = b.hp + b.attack + b.defense + b.speed + b.special;
          return statsB - statsA;
        }
        default:
          return 0;
      }
    });

    return entries;
  }, [clankdexEntries, searchQuery, filterElement, filterTier, sortBy, priceDataCache]);

  // Keyboard navigation - Game Boy style controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Menu navigation
      if (screenMode === 'menu') {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMenuIndex(i => Math.max(0, i - 1));
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMenuIndex(i => Math.min(3, i + 1));
        } else if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'a') {
          e.preventDefault();
          setScreenMode(menuItems[menuIndex]);
        }
        return;
      }

      // B button / Escape - go back to menu from any screen
      if (e.key === 'Escape' || e.key.toLowerCase() === 'b') {
        setScreenMode('menu');
        return;
      }

      // Collection-specific navigation
      if (screenMode === 'collection') {
        if (e.key === 'ArrowLeft') {
          setCurrentEntryIndex(prev => Math.max(0, prev - 1));
        } else if (e.key === 'ArrowRight') {
          setCurrentEntryIndex(prev => Math.min(filteredEntries.length - 1, prev + 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screenMode, filteredEntries.length, menuIndex, menuItems]);

  // Reset index when search changes
  useEffect(() => {
    setCurrentEntryIndex(0);
  }, [searchQuery]);

  // Auto-detect Farcaster user when running in frame context
  useEffect(() => {
    if (farcasterReady && isFrameContext && frameUser?.username) {
      setInputMode('farcaster');
      setFarcasterInput(frameUser.username);
      // Auto-analyze the frame user
      setTimeout(() => {
        analyzeFarcaster(frameUser.username);
      }, 500);
    }
  }, [farcasterReady, isFrameContext, frameUser]);

  // Generate referral code from address
  useEffect(() => {
    if (address) {
      // Create short referral code from first 8 chars of address
      const code = `clank${address.slice(2, 8).toLowerCase()}`;
      setReferralCode(code);
    }
  }, [address]);

  // Analyze based on current mode
  const analyze = async () => {
    if (inputMode === 'wallet') {
      await analyzeWallet();
    } else {
      await analyzeFarcaster();
    }
  };

  // Analyze wallet
  const analyzeWallet = async () => {
    if (!address) return;

    setIsAnalyzing(true);
    setShowCreature(false);
    setDeployResult(null);
    setFarcasterData(null);

    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setCreature(data.creature);
      setImageBase64(data.imageBase64);

      setTimeout(() => setShowCreature(true), 500);
    } catch (error) {
      console.error('Analysis error:', error);
      const fallbackCreature = generateFallbackCreature(address);
      setCreature(fallbackCreature);
      setImageBase64(null);
      setShowCreature(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyze Farcaster user (in miniapp always uses signed-in user via effectiveFarcasterUsername)
  const analyzeFarcaster = async (usernameOverride?: string) => {
    const identifier = usernameOverride || effectiveFarcasterUsername;
    if (!identifier) {
      setFeedback({ type: 'error', message: 'Enter a Farcaster username (e.g. @username)' });
      return;
    }

    setFeedback(null);
    setIsAnalyzing(true);
    setShowCreature(false);
    setDeployResult(null);

    try {
      const response = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Farcaster analysis failed');
      }

      const data = await response.json();
      setCreature(data.creature);
      setImageBase64(data.imageBase64);
      setFarcasterData(data.farcasterData);

      setTimeout(() => setShowCreature(true), 500);
    } catch (error) {
      console.error('Farcaster analysis error:', error);
      setFeedback({ type: 'error', message: 'Failed to analyze: ' + (error as Error).message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Launch creature
  const launchCreature = async () => {
    if (!creature) return;

    setFeedback(null);
    setIsMinting(true);
    setMintStep('generating');

    try {
      // Step 1: Generate and upload image
      const generateResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creature }),
      });

      const imageData = await generateResponse.json().catch(() => ({}));
      if (!generateResponse.ok) {
        throw new Error(imageData.error || 'Image generation failed');
      }
      const imageUrl = imageData.imageUrl;
      if (!imageUrl) {
        throw new Error('No image URL returned. Please try again.');
      }
      creature.imageURI = imageUrl;

      setMintStep('deploying');

      // Step 2: Deploy Clanker token
      // Check for referrer in URL
      const urlParams = new URLSearchParams(window.location.search);
      const referrer = urlParams.get('ref');

      const endpoint = inputMode === 'wallet' ? '/api/deploy' : '/api/deploy-farcaster';
      const body = inputMode === 'wallet'
        ? { creature, creatorAddress: address, imageUrl, referrerAddress: referrer }
        : { identifier: effectiveFarcasterUsername, creature, imageUrl, referrerAddress: referrer };

      const deployResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await deployResponse.json();

      if (result.success) {
        setDeployResult(result);

        // Step 3: Save to Supabase via secure API (verifies on-chain)
        const urlParams = new URLSearchParams(window.location.search);
        const referrer = urlParams.get('ref');

        const saveResponse = await fetch('/api/save-creature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token_address: result.tokenAddress,
            token_symbol: result.config?.symbol || creature.name.slice(0, 6).toUpperCase(),
            name: creature.name,
            element: creature.element,
            level: creature.level,
            hp: creature.hp,
            attack: creature.attack,
            defense: creature.defense,
            speed: creature.speed,
            special: creature.special,
            description: creature.description,
            creator_address: address,
            farcaster_username: inputMode === 'farcaster' ? effectiveFarcasterUsername : undefined,
            image_url: imageUrl,
            referrer_address: referrer,
          }),
        });

        const saveData = await saveResponse.json();

        if (!saveResponse.ok) {
          console.error('Failed to save creature:', saveData.error);
          // Don't throw - deployment succeeded even if save failed
        } else {
          // Refresh entries from Supabase
          const updatedEntries = await getAllCreatures();
          setClankdexEntries(updatedEntries);

          // Step 4: Create evolution record
          await createEvolution(result.tokenAddress, saveData.creature.entry_number);
        }

        confetti({
          particleCount: 200,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#DC0A2D', '#FFDE00', '#3B4CCA', '#51AE5E', '#FF5722'],
        });

        // Redirect to Clanker after a short delay
        setTimeout(() => {
          window.open(`${CLANKER_URL}/token/${result.tokenAddress}`, '_blank');
        }, 2000);
      } else {
        throw new Error(result.error || 'Deployment failed');
      }
    } catch (error) {
      console.error('Launch error:', error);
      setFeedback({ type: 'error', message: 'Launch failed: ' + (error as Error).message });
    } finally {
      setIsMinting(false);
      setMintStep('idle');
    }
  };

  // Merge two tokens into one
  const mergeTokens = async () => {
    if (!selectedParents[0] || !selectedParents[1] || !address) return;

    setIsMerging(true);

    try {
      // Get parent token details
      const parent1 = mergeableTokens.find(t => t.token_address === selectedParents[0]);
      const parent2 = mergeableTokens.find(t => t.token_address === selectedParents[1]);

      if (!parent1 || !parent2) {
        throw new Error('Parent tokens not found');
      }

      // Generate merged creature name and stats
      const mergedName = `${parent1.name.slice(0, 4)}${parent2.name.slice(-4)}`;
      const mergedCreature = {
        name: mergedName,
        element: parent1.element === parent2.element ? parent1.element : 'Normal',
        level: Math.max(parent1.level, parent2.level) + 1,
        hp: Math.floor((parent1.hp + parent2.hp) / 2) + 10,
        attack: Math.floor((parent1.attack + parent2.attack) / 2) + 10,
        defense: Math.floor((parent1.defense + parent2.defense) / 2) + 10,
        speed: Math.floor((parent1.speed + parent2.speed) / 2) + 10,
        special: Math.floor((parent1.special + parent2.special) / 2) + 10,
        description: `A fusion of ${parent1.name} and ${parent2.name}`,
      };

      // Generate image for merged creature
      const generateResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creature: mergedCreature }),
      });

      const imageData = await generateResponse.json().catch(() => ({}));
      if (!generateResponse.ok) {
        throw new Error(imageData.error || 'Image generation failed');
      }
      const imageUrl = imageData.imageUrl;
      if (!imageUrl) {
        throw new Error('No image URL returned for merge. Please try again.');
      }

      // Call merge API
      const mergeResponse = await fetch('/api/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent1Address: selectedParents[0],
          parent2Address: selectedParents[1],
          creatorAddress: address,
          newCreature: mergedCreature,
          imageUrl,
        }),
      });

      const result = await mergeResponse.json();

      if (result.success) {
        setMergeResult(result);

        // Refresh entries and mergeable tokens
        const updatedEntries = await getAllCreatures();
        setClankdexEntries(updatedEntries);

        const updatedMergeable = await getMergeableTokens(address);
        setMergeableTokens(updatedMergeable);

        // Clear selection
        setSelectedParents([null, null]);

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#9C27B0', '#E91E63', '#FF5722', '#FFC107'],
        });

        // Redirect after delay
        setTimeout(() => {
          window.open(`${CLANKER_URL}/token/${result.tokenAddress}`, '_blank');
        }, 2000);
      } else {
        throw new Error(result.error || 'Merge failed');
      }
    } catch (error) {
      console.error('Merge error:', error);
      setFeedback({ type: 'error', message: 'Merge failed: ' + (error as Error).message });
    } finally {
      setIsMerging(false);
    }
  };

  const generateFallbackCreature = (addr: string): Creature => {
    const elements = Object.keys(ELEMENT_COLORS);
    const element = elements[parseInt(addr.slice(-2), 16) % elements.length];

    return {
      name: `Clankmon #${addr.slice(-4)}`,
      species: 'Blockchain Beast',
      dna: BigInt(addr).toString(),
      element,
      level: 1,
      hp: 50 + Math.floor(Math.random() * 50),
      attack: 50 + Math.floor(Math.random() * 50),
      defense: 50 + Math.floor(Math.random() * 50),
      speed: 50 + Math.floor(Math.random() * 50),
      special: 50 + Math.floor(Math.random() * 50),
      description: `A mysterious ${element.toLowerCase()}-type creature from the blockchain depths.`,
      colorPalette: ['#DC0A2D', '#FF5722', '#FFC107'],
    };
  };

  const getRarity = (element: string) => {
    const rarities: Record<string, string> = {
      Fire: 'common', Water: 'common', Grass: 'common', Fighting: 'common', Ground: 'common', Bug: 'common',
      Electric: 'uncommon', Poison: 'uncommon', Flying: 'uncommon',
      Ice: 'rare', Psychic: 'rare',
      Dragon: 'legendary'
    };
    return rarities[element] || 'common';
  };

  // Get current action button handler based on screen mode
  const handleAButton = () => {
    if (screenMode === 'menu') {
      setScreenMode(menuItems[menuIndex]);
    } else if (screenMode === 'scan') {
      if (!isAnalyzing && !isMinting) {
        if ((inputMode === 'wallet' && isConnected) || (inputMode === 'farcaster' && effectiveFarcasterUsername)) {
          analyze();
        }
      }
    }
  };

  const handleBButton = () => {
    if (screenMode !== 'menu') {
      setScreenMode('menu');
      setShowCreature(false);
      setCreature(null);
      setDeployResult(null);
      setMergeResult(null);
      setSelectedParents([null, null]);
    }
  };

  // Vote for token of the day
  const handleVote = async (tokenAddress: string, entryNumber: number) => {
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenAddress, entryNumber }),
      });

      if (response.ok) {
        setFeedback({ type: 'success', message: 'Vote recorded!' });
      }
    } catch (error) {
      console.error('Vote error:', error);
      setFeedback({ type: 'error', message: 'Could not record vote. Try again.' });
    }
  };

  // Load top voted tokens on daily screen mount
  useEffect(() => {
    if (screenMode !== 'daily') return;

    // In a real implementation, you'd fetch top voted tokens
    // For now, we'll just use the first few entries
    if (clankdexEntries.length > 0 && !tokenOfTheDay) {
      // Mock: use first entry as example
      setTokenOfTheDay({
        date: new Date().toISOString().split('T')[0],
        token_address: clankdexEntries[0]?.token_address,
        entry_number: clankdexEntries[0]?.entry_number,
        votes: 5,
        featured: true,
      });
    }
  }, [screenMode, clankdexEntries, tokenOfTheDay]);

  return (
    <>
      <EnchantedForest />
      <main className="min-h-screen bg-pokemon-world flex flex-col items-center justify-center p-4 relative overflow-hidden">

        {/* In-app feedback banner (replaces alert) */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] max-w-[90vw] sm:max-w-md"
            >
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 shadow-lg ${feedback.type === 'error'
                  ? 'bg-red-950/95 border-red-500 text-red-100'
                  : 'bg-green-950/95 border-green-500 text-green-100'
                  }`}
              >
                <span className="font-sans text-base flex-1 font-medium">{feedback.message}</span>
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* UNIFIED GAME BOY DEVICE - PREMIUM DESIGN */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="gameboy-device">
            {/* Battery indicator */}
            <div className="gameboy-battery">Bat.</div>

            {/* Power indicator */}
            <div className="gameboy-power">
              <div className="gameboy-power-led" />
              <span className="gameboy-power-text">Power</span>
            </div>

            {/* Screen bezel */}
            <div className="gameboy-bezel">
              {/* LCD Screen */}
              <div className="gameboy-lcd">
                <div className="gameboy-lcd-content">
                  <AnimatePresence mode="wait">
                    {/* BOOT SCREEN */}
                    {isBooting && (
                      <motion.div
                        key="boot"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="h-full flex flex-col items-center justify-center"
                        style={{ background: '#0f380f' }}
                      >
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
                          className="relative"
                        >
                          {/* Logo with glow effect */}
                          <motion.div
                            animate={{
                              boxShadow: [
                                '0 0 20px rgba(155, 188, 15, 0.3)',
                                '0 0 40px rgba(155, 188, 15, 0.6)',
                                '0 0 20px rgba(155, 188, 15, 0.3)',
                              ],
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="rounded-lg overflow-hidden"
                          >
                            <img
                              src="/clankdex-logo.png"
                              alt="ClankDex"
                              className="w-32 h-32 object-contain"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          </motion.div>
                        </motion.div>

                        {/* Loading text */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1, duration: 0.5 }}
                          className="mt-4 text-center"
                        >
                          <p className="text-xs font-pixel" style={{ color: '#9bbc0f' }}>
                            CLANKDEX
                          </p>
                          <motion.p
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="text-[10px] mt-2"
                            style={{ color: '#8bac0f' }}
                          >
                            LOADING...
                          </motion.p>
                        </motion.div>

                        {/* Boot progress bar */}
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '60%' }}
                          transition={{ delay: 0.8, duration: 1.8, ease: 'easeInOut' }}
                          className="h-1 mt-4 rounded"
                          style={{ background: '#9bbc0f' }}
                        />
                      </motion.div>
                    )}

                    {/* MENU SCREEN */}
                    {!isBooting && screenMode === 'menu' && (
                      <motion.div
                        key="menu"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="p-3 h-full flex flex-col"
                      >
                        <div className="text-center mb-3">
                          <p className="font-pixel text-xs" style={{ color: '#0f380f' }}>CLANKDEX</p>
                          <p className="text-xs" style={{ color: '#0f380f', opacity: 0.7 }}>v1.0</p>
                        </div>
                        <div className="flex-1 space-y-2">
                          {[
                            { mode: 'scan' as const, icon: ScanLine, label: 'NEW', desc: 'Create' },
                            { mode: 'collection' as const, icon: BookOpen, label: 'DEX', desc: `${clankdexEntries.length}` },
                            { mode: 'daily' as const, icon: Trophy, label: 'DAILY', desc: 'Vote' },
                            { mode: 'merge' as const, icon: GitMerge, label: 'MERGE', desc: 'Fuse' },
                            { mode: 'how-it-works' as const, icon: Sparkles, label: 'INFO', desc: 'How' },
                            { mode: 'faq' as const, icon: Activity, label: 'FAQ', desc: 'Help' },
                          ].map((item, idx) => (
                            <button
                              key={item.mode}
                              onClick={() => setScreenMode(item.mode)}
                              onMouseEnter={() => setMenuIndex(idx)}
                              className={`w-full flex items-center gap-2 p-2.5 rounded border-2 transition-all ${menuIndex === idx
                                ? 'bg-[#0f380f] text-[#9bbc0f] border-[#0f380f]'
                                : 'bg-[#8bac0f] text-[#0f380f] border-[#306230]'
                                }`}
                            >
                              <item.icon className="w-3 h-3" />
                              <span className="font-pixel text-xs">{item.label}</span>
                              <span className="text-xs opacity-60 ml-auto">{item.desc}</span>
                            </button>
                          ))}
                        </div>
                        <div className="text-center mt-2">
                          <p className="text-[11px]" style={{ color: '#0f380f' }}>▲▼ Move │ A Select</p>
                        </div>
                      </motion.div>
                    )}

                    {/* SCAN SCREEN */}
                    {!isBooting && screenMode === 'scan' && (
                      <motion.div
                        key="scan"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="p-3 h-full flex flex-col"
                      >
                        <div className="text-center mb-3">
                          <p className="font-pixel text-xs" style={{ color: '#0f380f' }}>NEW CREATURE</p>
                        </div>

                        {/* Content area */}
                        <div className="flex-1 flex flex-col items-center justify-center">
                          {isAnalyzing ? (
                            <div className="text-center">
                              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: '#0f380f' }} />
                              <p className="font-pixel text-[11px]" style={{ color: '#0f380f' }}>ANALYZING...</p>
                            </div>
                          ) : showCreature && creature ? (
                            <div className="text-center">
                              {imageBase64 && (
                                <img src={imageBase64} alt={creature.name} className="w-24 h-24 mx-auto mb-2 pixelated border-2 border-[#0f380f] rounded" />
                              )}
                              <p className="font-pixel text-xs" style={{ color: '#0f380f' }}>{creature.name}</p>
                              <p className="text-xs mb-2" style={{ color: '#0f380f' }}>{creature.element}</p>
                              <button
                                onClick={launchCreature}
                                disabled={isMinting}
                                className="px-4 py-1.5 bg-[#0f380f] text-[#9bbc0f] font-pixel text-xs rounded border-2 border-[#0f380f] disabled:opacity-50"
                              >
                                {isMinting ? '...' : 'DEPLOY'}
                              </button>
                            </div>
                          ) : (
                            <div className="text-center w-full px-4">
                              <Wallet className="w-10 h-10 mx-auto mb-3" style={{ color: '#0f380f' }} />
                              {isConnected ? (
                                <>
                                  <p className="font-pixel text-[11px] mb-2" style={{ color: '#0f380f' }}>
                                    {address?.slice(0, 6)}...{address?.slice(-4)}
                                  </p>
                                  <button
                                    onClick={analyze}
                                    disabled={isAnalyzing}
                                    className="px-4 py-1.5 bg-[#0f380f] text-[#9bbc0f] font-pixel text-xs rounded border-2 border-[#0f380f]"
                                  >
                                    GENERATE
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={async () => {
                                    const injectedConnector = connectors.find(c => c.id === 'injected');
                                    if (injectedConnector) {
                                      try {
                                        await connect({ connector: injectedConnector });
                                      } catch (e) {
                                        if (typeof window !== 'undefined' && window.ethereum) {
                                          await window.ethereum.request({ method: 'eth_requestAccounts' });
                                        }
                                      }
                                    } else if (connectors.length > 0) {
                                      connect({ connector: connectors[0] });
                                    }
                                  }}
                                  disabled={isConnecting}
                                  className="px-4 py-1.5 bg-[#0f380f] text-[#9bbc0f] font-pixel text-xs rounded border-2 border-[#0f380f] disabled:opacity-50"
                                >
                                  {isConnecting ? '...' : 'CONNECT'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-center mt-2">
                          <p className="text-[11px]" style={{ color: '#0f380f' }}>B Back │ A {showCreature ? 'Deploy' : 'Generate'}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* COLLECTION SCREEN */}
                    {!isBooting && screenMode === 'collection' && (
                      <motion.div
                        key="collection"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="p-3 h-full flex flex-col"
                      >
                        <div className="text-center mb-2">
                          <p className="font-pixel text-xs" style={{ color: '#0f380f' }}>ROLODEX</p>
                          <p className="text-[11px]" style={{ color: '#0f380f', opacity: 0.7 }}>{clankdexEntries.length} ENTRIES</p>
                        </div>

                        {clankdexEntries.length === 0 ? (
                          <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ color: '#0f380f' }} />
                              <p className="font-pixel text-[11px]" style={{ color: '#0f380f' }}>NO CREATURES</p>
                              <p className="text-[11px]" style={{ color: '#0f380f' }}>Scan to begin</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 overflow-y-auto space-y-1">
                              {filteredEntries.slice(0, 5).map((entry, idx) => (
                                <button
                                  key={entry.token_address}
                                  onClick={() => window.open(`${CLANKER_URL}/token/${entry.token_address}`, '_blank')}
                                  className={`w-full flex items-center gap-2 p-2 rounded border-2 text-left ${currentEntryIndex === idx ? 'bg-[#0f380f] text-[#9bbc0f] border-[#0f380f]' : 'bg-[#8bac0f] text-[#0f380f] border-[#306230]'}`}
                                >
                                  <span className="font-pixel text-[11px] w-6">#{entry.entry_number}</span>
                                  <span className="font-pixel text-xs flex-1 truncate">{entry.name}</span>
                                  <span className="text-[11px]">{entry.element}</span>
                                </button>
                              ))}
                            </div>
                            <div className="text-center mt-2">
                              <p className="text-[11px]" style={{ color: '#0f380f' }}>
                                ◄► Navigate │ A View
                              </p>
                            </div>
                          </>
                        )}

                        <div className="text-center mt-1">
                          <p className="text-[11px]" style={{ color: '#0f380f' }}>B Back</p>
                        </div>
                      </motion.div>
                    )}

                    {/* FAQ SCREEN */}
                    {!isBooting && screenMode === 'faq' && (
                      <motion.div
                        key="faq"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="p-3 h-full flex flex-col"
                      >
                        <div className="text-center mb-2">
                          <p className="font-pixel text-xs" style={{ color: '#0f380f' }}>FAQ</p>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1 text-[11px]" style={{ color: '#0f380f' }}>
                          <div className="bg-[#8bac0f]/50 p-2 rounded border border-[#306230]">
                            <p className="font-pixel text-xs mb-0.5">What is ClankDex?</p>
                            <p className="opacity-80">A Wallet Pokedex that generates creatures from your on-chain data.</p>
                          </div>
                          <div className="bg-[#8bac0f]/50 p-2 rounded border border-[#306230]">
                            <p className="font-pixel text-xs mb-0.5">How does it work?</p>
                            <p className="opacity-80">We analyze your wallet to create a unique creature, then launch it as a token.</p>
                          </div>
                          <div className="bg-[#8bac0f]/50 p-2 rounded border border-[#306230]">
                            <p className="font-pixel text-xs mb-0.5">What is Clanker?</p>
                            <p className="opacity-80">Token deployment platform on Base. You earn creator rewards.</p>
                          </div>
                          <div className="bg-[#8bac0f]/50 p-2 rounded border border-[#306230]">
                            <p className="font-pixel text-xs mb-0.5">How do evolutions work?</p>
                            <p className="opacity-80">Creatures evolve based on market cap: Egg → Legendary.</p>
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <p className="text-[11px]" style={{ color: '#0f380f' }}>B Back</p>
                        </div>
                      </motion.div>
                    )}

                    {/* HOW IT WORKS SCREEN */}
                    {!isBooting && screenMode === 'how-it-works' && (
                      <motion.div
                        key="how-it-works"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="p-3 h-full flex flex-col"
                      >
                        <div className="text-center mb-2">
                          <p className="font-pixel text-xs" style={{ color: '#0f380f' }}>INFO</p>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1 text-[11px]" style={{ color: '#0f380f' }}>
                          <div className="flex items-start gap-2 bg-[#8bac0f]/50 p-2 rounded border border-[#306230]">
                            <span className="font-pixel text-xs">1.</span>
                            <div>
                              <p className="font-pixel text-xs">CONNECT</p>
                              <p className="opacity-80">Link wallet or enter Farcaster</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 bg-[#8bac0f]/50 p-2 rounded border border-[#306230]">
                            <span className="font-pixel text-xs">2.</span>
                            <div>
                              <p className="font-pixel text-xs">ANALYZE</p>
                              <p className="opacity-80">We scan your on-chain DNA</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 bg-[#8bac0f]/50 p-2 rounded border border-[#306230]">
                            <span className="font-pixel text-xs">3.</span>
                            <div>
                              <p className="font-pixel text-xs">GENERATE</p>
                              <p className="opacity-80">AI creates unique creature</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 bg-[#8bac0f]/50 p-2 rounded border border-[#306230]">
                            <span className="font-pixel text-xs">4.</span>
                            <div>
                              <p className="font-pixel text-xs">LAUNCH</p>
                              <p className="opacity-80">Deploy as token on Base</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2 bg-[#8bac0f]/50 p-2 rounded border border-[#306230]">
                            <span className="font-pixel text-xs">5.</span>
                            <div>
                              <p className="font-pixel text-xs">EVOLVE</p>
                              <p className="opacity-80">Watch it grow with market cap</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-center mt-2">
                          <p className="text-[11px]" style={{ color: '#0f380f' }}>B Back</p>
                        </div>
                      </motion.div>
                    )}

                    {/* DAILY (Token of the Day) SCREEN */}
                    {!isBooting && screenMode === 'daily' && (
                      <motion.div
                        key="daily"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="p-3 h-full flex flex-col"
                      >
                        <div className="text-center mb-2">
                          <p className="font-pixel text-xs" style={{ color: '#0f380f' }}>TOKEN OF THE DAY</p>
                        </div>
                        <div className="flex-1 flex flex-col">
                          {/* Today's Winner */}
                          {tokenOfTheDay && (
                            <div className="text-center mb-3 p-2 bg-[#0f380f]/20 rounded border border-[#0f380f]">
                              <Trophy className="w-6 h-6 mx-auto mb-1" style={{ color: '#0f380f' }} />
                              <p className="font-pixel text-xs" style={{ color: '#0f380f' }}>TODAY'S WINNER</p>
                              <p className="font-pixel text-[11px]" style={{ color: '#0f380f' }}>#{tokenOfTheDay.entry_number}</p>
                              <button
                                onClick={() => window.open(`${CLANKER_URL}/token/${tokenOfTheDay.token_address}`, '_blank')}
                                className="mt-1 px-2 py-0.5 bg-[#0f380f] text-[#9bbc0f] font-pixel text-[11px] rounded"
                              >
                                VIEW
                              </button>
                            </div>
                          )}

                          {/* Vote List */}
                          <p className="text-xs text-center mb-1 font-pixel" style={{ color: '#0f380f' }}>VOTE</p>
                          <div className="flex-1 overflow-y-auto space-y-1">
                            {clankdexEntries.slice(0, 5).map((entry) => (
                              <div
                                key={entry.token_address}
                                className="flex items-center justify-between p-1.5 bg-[#8bac0f]/50 rounded border border-[#306230]"
                              >
                                <div className="flex items-center gap-1">
                                  <span className="font-pixel text-[11px]" style={{ color: '#0f380f' }}>#{entry.entry_number}</span>
                                  <span className="text-[11px] truncate max-w-[60px]" style={{ color: '#0f380f' }}>{entry.name}</span>
                                </div>
                                <button
                                  onClick={() => handleVote(entry.token_address, entry.entry_number)}
                                  className="px-2 py-0.5 bg-[#0f380f] text-[#9bbc0f] text-[11px] rounded font-pixel"
                                >
                                  ★
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Creator Streak */}
                        {creatorStreak && creatorStreak.current_streak > 0 && (
                          <div className="mt-2 p-2 bg-[#8bac0f]/50 rounded border border-[#306230]">
                            <div className="flex items-center gap-2">
                              <Flame className="w-4 h-4" style={{ color: '#0f380f' }} />
                              <div>
                                <p className="font-pixel text-xs" style={{ color: '#0f380f' }}>
                                  STREAK: {creatorStreak.current_streak} DAYS
                                </p>
                                <p className="text-[11px]" style={{ color: '#0f380f' }}>
                                  Tier: {creatorStreak.tier.toUpperCase()}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Referral Code */}
                        {isConnected && referralCode && (
                          <div className="mt-2 p-2 bg-[#8bac0f]/50 rounded border border-[#306230]">
                            <div className="flex items-center gap-2">
                              <Share2 className="w-4 h-4" style={{ color: '#0f380f' }} />
                              <div className="flex-1">
                                <p className="text-[11px]" style={{ color: '#0f380f' }}>REF CODE:</p>
                                <p className="font-pixel text-xs" style={{ color: '#0f380f' }}>{referralCode}</p>
                              </div>
                            </div>
                            <p className="text-[9px] mt-1" style={{ color: '#0f380f', opacity: 0.85 }}>
                              +0.1% fees when used
                            </p>
                          </div>
                        )}

                        <div className="text-center mt-2">
                          <p className="text-[11px]" style={{ color: '#0f380f' }}>B Back</p>
                        </div>
                      </motion.div>
                    )}

                    {/* MERGE SCREEN */}
                    {!isBooting && screenMode === 'merge' && (
                      <motion.div
                        key="merge"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        className="p-3 h-full flex flex-col"
                      >
                        <div className="text-center mb-2">
                          <p className="font-pixel text-xs" style={{ color: '#0f380f' }}>MERGE</p>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                          {!isConnected ? (
                            <div className="text-center py-4">
                              <Wallet className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ color: '#0f380f' }} />
                              <p className="text-[11px]" style={{ color: '#0f380f' }}>Connect to merge</p>
                            </div>
                          ) : mergeableTokens.length < 2 ? (
                            <div className="text-center py-4">
                              <GitMerge className="w-8 h-8 mx-auto mb-2 opacity-50" style={{ color: '#0f380f' }} />
                              <p className="text-[11px]" style={{ color: '#0f380f' }}>Need 2+ tokens</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-[11px] text-center mb-2" style={{ color: '#0f380f' }}>Select 2 tokens:</p>
                              {mergeableTokens.slice(0, 4).map((token) => (
                                <button
                                  key={token.token_address}
                                  onClick={() => {
                                    if (selectedParents[0] === token.token_address) {
                                      setSelectedParents([null, selectedParents[1]]);
                                    } else if (selectedParents[1] === token.token_address) {
                                      setSelectedParents([selectedParents[0], null]);
                                    } else if (!selectedParents[0]) {
                                      setSelectedParents([token.token_address, selectedParents[1]]);
                                    } else if (!selectedParents[1]) {
                                      setSelectedParents([selectedParents[0], token.token_address]);
                                    }
                                  }}
                                  className={`w-full flex items-center gap-2 p-2 rounded border-2 text-left ${selectedParents.includes(token.token_address)
                                    ? 'bg-[#0f380f] text-[#9bbc0f] border-[#0f380f]'
                                    : 'bg-[#8bac0f] text-[#0f380f] border-[#306230]'
                                    }`}
                                >
                                  <span className="font-pixel text-xs">#{token.entry_number}</span>
                                  <span className="font-pixel text-[11px] flex-1 truncate">{token.name}</span>
                                  {selectedParents.includes(token.token_address) && (
                                    <CheckCircle2 className="w-3 h-3" />
                                  )}
                                </button>
                              ))}
                              {selectedParents[0] && selectedParents[1] && (
                                <button
                                  onClick={mergeTokens}
                                  disabled={isMerging}
                                  className="w-full mt-2 px-3 py-1.5 bg-[#0f380f] text-[#9bbc0f] font-pixel text-xs rounded border-2 border-[#0f380f] disabled:opacity-50"
                                >
                                  {isMerging ? '...' : 'MERGE'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-center mt-2">
                          <p className="text-[11px]" style={{ color: '#0f380f' }}>B Back</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Controls section */}
            <div className="gameboy-controls flex justify-between items-center">
              {/* D-Pad */}
              <div className="d-pad">
                <div className="d-pad-base" />
                <div className="d-pad-cross" />
                <div className="d-pad-center" />
                {/* Invisible click areas for navigation */}
                <button
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-6 z-10"
                  onClick={() => {
                    if (screenMode === 'menu') setMenuIndex(i => Math.max(0, i - 1));
                    if (screenMode === 'collection') setCurrentEntryIndex(i => Math.max(0, i - 1));
                  }}
                />
                <button
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 z-10"
                  onClick={() => {
                    if (screenMode === 'menu') setMenuIndex(i => Math.min(menuItems.length - 1, i + 1));
                    if (screenMode === 'collection') setCurrentEntryIndex(i => Math.min(filteredEntries.length - 1, i + 1));
                  }}
                />
                <button
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 z-10"
                  onClick={() => {
                    if (screenMode === 'scan') setInputMode(inputMode === 'wallet' ? 'farcaster' : 'wallet');
                    if (screenMode === 'collection') setCurrentEntryIndex(i => Math.max(0, i - 1));
                  }}
                />
                <button
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 z-10"
                  onClick={() => {
                    if (screenMode === 'scan') setInputMode(inputMode === 'wallet' ? 'farcaster' : 'wallet');
                    if (screenMode === 'collection') setCurrentEntryIndex(i => Math.min(filteredEntries.length - 1, i + 1));
                  }}
                />
              </div>

              {/* A/B Buttons */}
              <div className="ab-buttons">
                <button onClick={handleBButton} className="ab-button">
                  <span className="ab-button-label">B</span>
                </button>
                <button onClick={handleAButton} className="ab-button">
                  <span className="ab-button-label">A</span>
                </button>
              </div>
            </div>

            {/* Start/Select */}
            <div className="menu-buttons">
              <button className="menu-button" onClick={() => setScreenMode('menu')}>
                <span className="menu-button-label">SELECT</span>
              </button>
              <button className="menu-button" onClick={() => setScreenMode('scan')}>
                <span className="menu-button-label">START</span>
              </button>
            </div>

            {/* Decorative stripes */}
            <div className="device-stripes">
              <div className="device-stripe" />
              <div className="device-stripe" />
              <div className="device-stripe" />
            </div>

            {/* Device branding */}
            <div className="device-branding">
              Clank<span>DEX</span>
            </div>

            {/* Speaker grill */}
            <div className="speaker-grill">
              {[...Array(24)].map((_, i) => <div key={i} className="speaker-hole" />)}
            </div>
          </div>

          {/* Control hint */}
          <div className="control-hint">
            ◄ ▲ ▼ ► Navigate │ A Select │ B Back
          </div>
        </motion.div>
      </main>
    </>
  );
}


// Stats Panel Component
function StatsPanel({
  creature,
  farcasterData,
  isMinting,
  mintStep,
  deployResult,
  onShare
}: {
  creature: Creature;
  farcasterData: FarcasterData | null;
  isMinting: boolean;
  mintStep: string;
  deployResult: DeployResult | null;
  onShare: (text: string, embeds?: string[]) => void;
}) {
  const getRarity = (element: string) => {
    const rarities: Record<string, string> = {
      Fire: 'common', Water: 'common', Grass: 'common', Fighting: 'common', Ground: 'common', Bug: 'common',
      Electric: 'uncommon', Poison: 'uncommon', Flying: 'uncommon',
      Ice: 'rare', Psychic: 'rare',
      Dragon: 'legendary'
    };
    return rarities[element] || 'common';
  };

  const elementGradient = ELEMENT_GRADIENTS[creature.element] || ELEMENT_GRADIENTS.Fire;
  const elementHex = ELEMENT_HEX_COLORS[creature.element] || ELEMENT_HEX_COLORS.Fire;

  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 50, opacity: 0 }}
      className="pokedex-card rounded-2xl overflow-hidden border border-gray-700 shadow-2xl"
    >
      {/* Pokédex-style Colored Header */}
      <div className={`relative bg-gradient-to-br ${elementGradient} p-6 pb-16`}>
        {/* Pokeball pattern background */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full border-[16px] border-white/50" />
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
        </div>

        {/* Header content */}
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <motion.h2
              className="font-pixel text-2xl text-white mb-1 drop-shadow-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {creature.name}
            </motion.h2>
            <motion.p
              className="text-white/80 text-sm font-sans"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {creature.species}
            </motion.p>
          </div>
          <motion.div
            className="flex flex-col items-end gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="font-pixel text-lg text-white/90 drop-shadow">#{creature.level.toString().padStart(3, '0')}</span>
            <div className="flex gap-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                style={{ backgroundColor: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}
              >
                {creature.element}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Farcaster Profile (if available) */}
        {farcasterData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 flex items-center gap-3 mt-4 p-3 bg-white/10 backdrop-blur-sm rounded-lg"
          >
            {farcasterData.pfpUrl && (
              <motion.img
                src={farcasterData.pfpUrl}
                alt={farcasterData.username}
                className="w-10 h-10 rounded-full border-2 border-white/50"
                whileHover={{ scale: 1.1 }}
              />
            )}
            <div className="text-white">
              <p className="font-bold text-sm">@{farcasterData.username}</p>
              <p className="text-white/70 text-xs">{farcasterData.archetype}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Card Body - White/Dark section */}
      <div className="bg-gray-900 p-6 -mt-8 rounded-t-3xl relative z-20">
        {/* Rarity Badge */}
        <div className="flex justify-center -mt-10 mb-4">
          <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase shadow-lg ${getRarity(creature.element) === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black' :
            getRarity(creature.element) === 'rare' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' :
              getRarity(creature.element) === 'uncommon' ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
                'bg-gray-600 text-white'
            }`}>
            {getRarity(creature.element)}
          </span>
        </div>

        {/* About Section - Pokédex style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">About</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-gray-200 mb-1">
                <Coins className="w-4 h-4" />
                <span className="font-pixel text-sm">{creature.level * 0.5}</span>
              </div>
              <p className="text-gray-500 text-xs">Est. MCap (ETH)</p>
            </div>
            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-gray-200 mb-1">
                <Droplet className="w-4 h-4" />
                <span className="font-pixel text-sm">{(creature.hp + creature.attack) / 20}</span>
              </div>
              <p className="text-gray-500 text-xs">Liquidity (ETH)</p>
            </div>
            <div className="text-center p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-gray-200 mb-1">
                <Activity className="w-4 h-4" />
                <span className="font-pixel text-sm">{creature.speed}%</span>
              </div>
              <p className="text-gray-500 text-xs">Volatility</p>
            </div>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div
          className="mb-6 p-4 rounded-xl"
          style={{ backgroundColor: `${elementHex}15`, borderLeft: `3px solid ${elementHex}` }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-gray-200 text-sm leading-relaxed font-sans">
            {creature.description}
          </p>
        </motion.div>

        {/* Evolution Preview */}
        {!deployResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-6 p-4 bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h4 className="text-sm font-bold text-purple-400">EVOLUTION PATH</h4>
            </div>

            {/* Evolution Stages Preview */}
            <div className="flex items-center justify-between">
              {EVOLUTION_TIERS.map((tier, idx) => (
                <motion.div
                  key={tier.name}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${idx === 0 ? 'bg-gray-600' : 'bg-gray-800 border border-gray-600'
                    }`}>
                    {(() => {
                      const IconComponent = tier.icon;
                      return <IconComponent className={`w-4 h-4 ${tier.color}`} />;
                    })()}
                  </div>
                  <span className="text-xs text-gray-200 mt-1 hidden sm:block font-sans">{tier.name}</span>
                </motion.div>
              ))}
            </div>

            <p className="text-sm text-gray-200 mt-3 text-center font-sans">
              Your creature will evolve as market cap grows!
            </p>
          </motion.div>
        )}

        {/* Base Stats - Pokédex style */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">Base Stats</h3>
          <div className="space-y-3">
            <PokedexStatBar label="HP" value={creature.hp} max={100} color={elementHex} />
            <PokedexStatBar label="ATK" value={creature.attack} max={100} color={elementHex} />
            <PokedexStatBar label="DEF" value={creature.defense} max={100} color={elementHex} />
            <PokedexStatBar label="SPD" value={creature.speed} max={100} color={elementHex} />
            <PokedexStatBar label="SPC" value={creature.special} max={100} color={elementHex} />
          </div>

          {/* Total Stats */}
          <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-between items-center">
            <span className="text-gray-400 text-sm font-sans">Total</span>
            <span
              className="font-pixel text-lg px-3 py-1 rounded-lg"
              style={{ backgroundColor: `${elementHex}20`, color: elementHex }}
            >
              {creature.hp + creature.attack + creature.defense + creature.speed + creature.special}
            </span>
          </div>
        </motion.div>

        {/* DNA & Token Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-4 bg-gray-800/50 rounded-xl grid grid-cols-2 gap-4"
        >
          <div>
            <p className="text-gray-500 text-xs mb-1">LEVEL</p>
            <p className="font-pixel text-lg text-white">{creature.level}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">DNA HASH</p>
            <p className="font-mono text-sm text-gray-300 truncate">
              0x{creature.dna.slice(-8)}
            </p>
          </div>
        </motion.div>

        {/* Success Message */}
        {deployResult && (
          <DeploySuccess deployResult={deployResult} creature={creature} onShare={onShare} />
        )}
      </div>

      {/* Launch Animation Overlay */}
      {isMinting && (
        <motion.div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LaunchAnimation step={mintStep as 'generating' | 'deploying' | 'success'} />
        </motion.div>
      )}
    </motion.div>
  );
}

// Deploy Success Component
function DeploySuccess({
  deployResult,
  creature,
  onShare
}: {
  deployResult: DeployResult;
  creature: Creature;
  onShare: (text: string, embeds?: string[]) => void;
}) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="mt-6 space-y-4"
    >
      <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle2 className="w-6 h-6 text-green-400" />
          <div>
            <p className="text-green-400 font-bold">Token Launched!</p>
            {deployResult.simulated && (
              <p className="text-xs text-green-300">(Simulation Mode)</p>
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm font-sans">
          <div className="flex justify-between">
            <span className="text-gray-200">Token:</span>
            <code className="text-white font-mono text-sm">
              {deployResult.tokenAddress.slice(0, 6)}...{deployResult.tokenAddress.slice(-4)}
            </code>
          </div>
          {deployResult.config && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-200">Symbol:</span>
                <span className="text-yellow-400 font-bold">{deployResult.config.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-200">Market Cap:</span>
                <span className="text-white">{deployResult.config.marketCap} ETH</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a
          href={`${CLANKER_URL}/token/${deployResult.tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors"
        >
          <Coins className="w-4 h-4" />
          View on Clanker
          <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href={`https://basescan.org/token/${deployResult.tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          BaseScan
        </a>
      </div>

      <button
        onClick={() => {
          const text = `I just summoned ${creature.name} on @clankdex! A ${creature.element}-type creature with ${creature.hp + creature.attack + creature.defense + creature.speed + creature.special} total stats.`;
          // Share the miniapp URL which will render the embed
          const miniappUrl = 'https://frontend-weld-mu-91.vercel.app';
          onShare(text, [miniappUrl]);
        }}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors"
      >
        <Sparkles className="w-4 h-4" />
        Share on Farcaster
      </button>
    </motion.div>
  );
}

// Stat Bar Component
function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-sans text-sm text-gray-200 w-12">{label}</span>
      <div className="flex-1 stat-bar">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`stat-bar-fill ${color}`}
        />
      </div>
      <span className="font-pixel text-xs text-white w-10 text-right">{value}</span>
    </div>
  );
}

// Pokédex-style Stat Bar Component
function PokedexStatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-400 text-xs font-medium w-10">{label}</span>
      <span className="font-pixel text-xs text-white w-8 text-right">{value}</span>
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// Info Card Component
function InfoCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gray-800/30 backdrop-blur rounded-xl p-6 border border-gray-700/50"
    >
      <div className="text-pokedex-red mb-3">{icon}</div>
      <h3 className="text-white font-bold mb-2">{title}</h3>
      <p className="text-gray-200 text-sm font-sans leading-relaxed">{description}</p>
    </motion.div>
  );
}

// FAQ Data
const FAQ_DATA = [
  {
    question: "What is ClankDex?",
    answer: "ClankDex is a Wallet Pokedex powered by Clanker. We analyze your wallet or Farcaster profile to generate a unique Pokemon-style creature based on your on-chain activity, then launch it as a tradeable token on Base."
  },
  {
    question: "How are creatures generated?",
    answer: "We scan your transaction history, token holdings, NFT collections, and social graph to create a unique 'DNA fingerprint'. This determines your creature's element type, stats, appearance, and personality. No two creatures are alike!"
  },
  {
    question: "What is Clanker?",
    answer: "Clanker is a token deployment platform on Base. When you launch your creature, it becomes a real ERC-20 token that can be traded. You receive creator rewards from trading activity on your token."
  },
  {
    question: "How do evolutions work?",
    answer: "Your creature evolves based on its token's market cap. There are 7 evolution tiers: Egg (0), Hatchling ($1K), Rookie ($10K), Champion ($100K), Ultra ($500K), Master ($1M), and Legendary ($10M+)."
  },
  {
    question: "Do I need a wallet to use ClankDex?",
    answer: "For wallet-based scanning, yes. But you can also scan any Farcaster username to generate a creature based on their on-chain personality. The token launch requires a connected wallet."
  },
  {
    question: "What determines my creature's stats?",
    answer: "Your on-chain archetype (Oracle, Influencer, Connector, Builder, Degen, Whale, etc.) influences your creature's stat distribution. Active traders get higher Speed, diamond hands get higher Defense, and so on."
  },
  {
    question: "Can I scan the same wallet twice?",
    answer: "Each wallet generates a deterministic creature based on its unique DNA fingerprint. Scanning the same wallet will always produce the same creature - it's uniquely yours!"
  },
  {
    question: "What blockchain is this on?",
    answer: "ClankDex runs on Base, Coinbase's L2 network. Tokens are deployed as ERC-20s on Base with liquidity provided through Clanker."
  }
];

// FAQ Accordion Item
function FAQItem({ question, answer, isOpen, onToggle }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden"
      initial={false}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-700/30 transition-colors"
      >
        <span className="font-bold text-white pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-5 h-5 text-gray-400 rotate-90" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 text-gray-200 text-sm font-sans leading-relaxed border-t border-gray-700/50 pt-3">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// FAQ Section Component
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="font-pixel text-3xl text-white mb-2">FAQ</h2>
        <p className="text-gray-200 font-sans">Everything you need to know about ClankDex</p>
      </div>

      <div className="space-y-3">
        {FAQ_DATA.map((item, index) => (
          <FAQItem
            key={index}
            question={item.question}
            answer={item.answer}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>

    </div>
  );
}

// How It Works Steps Data
const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: "Connect & Scan",
    description: "Connect your wallet or enter a Farcaster username. We analyze transaction patterns, token holdings, NFT collections, and social connections to build your unique on-chain DNA.",
    icon: ScanLine,
    color: "from-blue-500 to-cyan-500"
  },
  {
    step: 2,
    title: "DNA Analysis",
    description: "Our algorithm determines your archetype (Oracle, Influencer, Builder, Degen, etc.) based on your on-chain behavior. This influences your creature's element type and stat distribution.",
    icon: Activity,
    color: "from-purple-500 to-pink-500"
  },
  {
    step: 3,
    title: "Creature Generation",
    description: "AI generates a unique Pokemon-style creature with a custom name, species, and pixel art design. Every detail is algorithmically determined by your wallet's fingerprint.",
    icon: Sparkles,
    color: "from-yellow-500 to-orange-500"
  },
  {
    step: 4,
    title: "Token Launch",
    description: "Deploy your creature as an ERC-20 token on Base via Clanker. You become the creator and earn rewards from trading activity. Your creature joins the ClankDex permanently!",
    icon: Rocket,
    color: "from-red-500 to-pink-500"
  },
  {
    step: 5,
    title: "Evolution",
    description: "Watch your creature evolve as its token gains market cap. From Egg to Legendary, there are 7 evolution tiers to unlock. The strongest creatures become legends!",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500"
  }
];

// How It Works Section Component
function HowItWorksSection() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="font-pixel text-3xl text-white mb-2">HOW IT WORKS</h2>
        <p className="text-gray-200 font-sans">From wallet to creature in 5 simple steps</p>
      </div>

      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 hidden md:block" />

        <div className="space-y-6">
          {HOW_IT_WORKS_STEPS.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex gap-6 items-start">
                {/* Step Number */}
                <motion.div
                  className={`relative z-10 flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <item.icon className="w-8 h-8 text-white" />
                </motion.div>

                {/* Content */}
                <div className="flex-1 bg-gray-800/50 rounded-xl p-5 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-300 uppercase font-sans">Step {item.step}</span>
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-200 text-sm font-sans leading-relaxed">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        className="mt-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-gray-200 mb-4 font-sans">Ready to discover your creature?</p>
        <motion.button
          className="px-8 py-3 bg-pokedex-red hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          Start Scanning
        </motion.button>
      </motion.div>
    </div>
  );
}

// Not Connected State
function NotConnectedState({ inputMode }: { inputMode: InputMode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="pokedex max-w-md mx-auto p-8">
        <div className="pokedex-screen aspect-video flex items-center justify-center mb-6">
          <div className="text-center p-6">
            {inputMode === 'wallet' ? (
              <Wallet className="w-16 h-16 text-pokedex-darkscreen/50 mx-auto mb-4" />
            ) : (
              <AtSign className="w-16 h-16 text-pokedex-darkscreen/50 mx-auto mb-4" />
            )}
            <p className="font-pixel text-xs text-pokedex-darkscreen">
              {inputMode === 'wallet'
                ? 'CONNECT WALLET\nTO BEGIN'
                : 'ENTER USERNAME\nTO BEGIN'
              }
            </p>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <div className="led led-blue animate-pulse" />
          <div className="led led-red" />
          <div className="led led-yellow" />
          <div className="led led-green" />
        </div>
      </div>
    </motion.div>
  );
}

// Filter Chip Component
const FilterChip = ({
  label,
  active,
  onClick,
  color = 'blue',
  icon: Icon
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
  icon?: React.ElementType;
}) => {
  const colors: Record<string, string> = {
    blue: active ? 'bg-blue-500 text-white' : 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    green: active ? 'bg-green-500 text-white' : 'bg-green-500/20 text-green-400 border-green-500/30',
    purple: active ? 'bg-purple-500 text-white' : 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    yellow: active ? 'bg-yellow-500 text-black' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    red: active ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-400 border-red-500/30',
    orange: active ? 'bg-orange-500 text-white' : 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    gray: active ? 'bg-gray-500 text-white' : 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${colors[color]} flex items-center gap-1`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </motion.button>
  );
};

// Sort Option Button
const SortButton = ({
  label,
  active,
  onClick,
  icon: Icon
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${active
      ? 'bg-pokedex-yellow text-black'
      : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
      }`}
  >
    <Icon className="w-3 h-3" />
    {label}
  </motion.button>
);

// Active Filter Badge
const ActiveFilter = ({ label, onClear, color = 'blue' }: { label: string; onClear: () => void; color?: string }) => {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500',
    green: 'bg-green-500/20 text-green-400 border-green-500',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
    red: 'bg-red-500/20 text-red-400 border-red-500',
  };

  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      layout
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${colors[color]}`}
    >
      {label}
      <motion.button
        onClick={onClear}
        whileHover={{ scale: 1.2, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        className="ml-1 hover:text-white"
      >
        <X className="w-3 h-3" />
      </motion.button>
    </motion.span>
  );
};

// Rolodex Component with Advanced Filters
function Rolodex({
  entries,
  currentIndex,
  onPrev,
  onNext,
  searchQuery,
  onSearchChange,
  totalEntries,
  onScanNew,
  filterTier,
  onFilterTierChange,
  filterElement,
  onFilterElementChange,
  sortBy,
  onSortChange,
  showFilters,
  onToggleFilters,
  priceDataCache,
}: {
  entries: CreatureRecord[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalEntries: number;
  onScanNew: () => void;
  filterTier: FilterTier;
  onFilterTierChange: (tier: FilterTier) => void;
  filterElement: FilterElement;
  onFilterElementChange: (element: FilterElement) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  priceDataCache: Record<string, PriceData>;
}) {
  const currentEntry = entries[currentIndex];

  // Get unique elements from entries
  const availableElements = useMemo(() => {
    const elements = new Set(entries.map(e => e.element));
    return Array.from(elements).sort();
  }, [entries]);

  // Count active filters
  const activeFilterCount = (filterTier !== 'all' ? 1 : 0) + (filterElement !== 'all' ? 1 : 0);

  const clearAllFilters = () => {
    onFilterTierChange('all');
    onFilterElementChange('all');
    onSearchChange('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      {/* Search & Filter Header */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Search Bar with Filter Toggle */}
        <div className="flex gap-2 mb-4">
          <div className="relative group flex-1">
            <motion.div
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              animate={{ rotate: searchQuery ? [0, 360] : 0 }}
              transition={{ duration: 0.5 }}
            >
              <Search className="w-5 h-5" />
            </motion.div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search creatures..."
              className="rolodex-search w-full bg-gray-800 border-4 border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-pokedex-yellow font-pixel text-sm transition-all"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  onClick={() => onSearchChange('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Filter Toggle Button */}
          <motion.button
            onClick={onToggleFilters}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 border-4 transition-all ${showFilters || activeFilterCount > 0
              ? 'bg-pokedex-yellow text-black border-pokedex-yellow'
              : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
              }`}
          >
            <Filter className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-black text-white w-5 h-5 rounded-full text-xs flex items-center justify-center"
              >
                {activeFilterCount}
              </motion.span>
            )}
          </motion.button>
        </div>

        {/* Active Filters Display */}
        <AnimatePresence>
          {(activeFilterCount > 0 || searchQuery) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-4"
            >
              {searchQuery && (
                <ActiveFilter
                  label={`Search: "${searchQuery}"`}
                  onClear={() => onSearchChange('')}
                  color="purple"
                />
              )}
              {filterTier !== 'all' && (
                <ActiveFilter
                  label={`Tier: ${filterTier}`}
                  onClear={() => onFilterTierChange('all')}
                  color="yellow"
                />
              )}
              {filterElement !== 'all' && (
                <ActiveFilter
                  label={`Element: ${filterElement}`}
                  onClear={() => onFilterElementChange('all')}
                  color={filterElement.toLowerCase() === 'fire' ? 'red' : filterElement.toLowerCase() === 'water' ? 'blue' : filterElement.toLowerCase() === 'grass' ? 'green' : 'blue'}
                />
              )}
              <motion.button
                onClick={clearAllFilters}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-xs text-gray-300 hover:text-white underline ml-auto font-sans"
              >
                Clear all
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expandable Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="bg-gray-800/50 border-2 border-gray-700 rounded-xl p-4 mb-4 space-y-4">
                {/* Sort Options */}
                <div>
                  <h4 className="text-xs font-bold text-gray-300 uppercase mb-2 flex items-center gap-2 font-sans">
                    <ArrowUpDown className="w-3 h-3" />
                    Sort By
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <SortButton label="Newest" active={sortBy === 'newest'} onClick={() => onSortChange('newest')} icon={Sparkles} />
                    <SortButton label="Oldest" active={sortBy === 'oldest'} onClick={() => onSortChange('oldest')} icon={RotateCcw} />
                    <SortButton label="Highest MC" active={sortBy === 'highestMc'} onClick={() => onSortChange('highestMc')} icon={TrendingUp} />
                    <SortButton label="Lowest MC" active={sortBy === 'lowestMc'} onClick={() => onSortChange('lowestMc')} icon={TrendingDown} />
                    <SortButton label="Best Stats" active={sortBy === 'totalStats'} onClick={() => onSortChange('totalStats')} icon={Target} />
                  </div>
                </div>

                {/* Evolution Tier Filter */}
                <div>
                  <h4 className="text-xs font-bold text-gray-300 uppercase mb-2 flex items-center gap-2 font-sans">
                    <Crown className="w-3 h-3" />
                    Evolution Tier
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip label="All" active={filterTier === 'all'} onClick={() => onFilterTierChange('all')} color="gray" />
                    <FilterChip label="Egg" active={filterTier === 'Egg'} onClick={() => onFilterTierChange('Egg')} color="gray" icon={Egg} />
                    <FilterChip label="Baby" active={filterTier === 'Baby'} onClick={() => onFilterTierChange('Baby')} color="green" icon={Baby} />
                    <FilterChip label="Basic" active={filterTier === 'Basic'} onClick={() => onFilterTierChange('Basic')} color="blue" icon={Star} />
                    <FilterChip label="Stage 1" active={filterTier === 'Stage 1'} onClick={() => onFilterTierChange('Stage 1')} color="purple" icon={Sparkles} />
                    <FilterChip label="Stage 2" active={filterTier === 'Stage 2'} onClick={() => onFilterTierChange('Stage 2')} color="yellow" icon={Zap} />
                    <FilterChip label="Mega" active={filterTier === 'Mega'} onClick={() => onFilterTierChange('Mega')} color="orange" icon={Flame} />
                    <FilterChip label="Legendary" active={filterTier === 'Legendary'} onClick={() => onFilterTierChange('Legendary')} color="red" icon={Crown} />
                  </div>
                </div>

                {/* Element Filter */}
                {availableElements.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-300 uppercase mb-2 flex items-center gap-2 font-sans">
                      <Hexagon className="w-3 h-3" />
                      Element Type
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <FilterChip label="All" active={filterElement === 'all'} onClick={() => onFilterElementChange('all')} color="gray" />
                      {availableElements.map(element => {
                        const colorMap: Record<string, string> = {
                          Fire: 'red', Water: 'blue', Grass: 'green', Electric: 'yellow',
                          Ice: 'blue', Fighting: 'red', Poison: 'purple', Ground: 'orange',
                          Flying: 'blue', Psychic: 'purple', Bug: 'green', Rock: 'gray',
                          Ghost: 'purple', Dragon: 'red', Dark: 'gray', Steel: 'gray', Fairy: 'purple'
                        };
                        return (
                          <FilterChip
                            key={element}
                            label={element}
                            active={filterElement === element}
                            onClick={() => onFilterElementChange(element)}
                            color={colorMap[element] || 'blue'}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Results Summary */}
      {entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between mb-4 px-2"
        >
          <p className="text-sm text-gray-400">
            Showing <span className="text-white font-bold">{entries.length}</span> of <span className="text-gray-300">{totalEntries}</span> creatures
          </p>
          {currentEntry && priceDataCache[currentEntry.token_address.toLowerCase()] && (
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-pixel text-sm">
                {formatPrice(priceDataCache[currentEntry.token_address.toLowerCase()].price)}
              </span>
            </div>
          )}
        </motion.div>
      )}

      {entries.length === 0 ? (
        // Empty State with animation
        <motion.div
          className="rolodex-container p-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className="text-center py-12">
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <BookOpen className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            </motion.div>
            <motion.h3
              className="font-pixel text-xl text-white mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {totalEntries === 0 ? 'NO ENTRIES YET' : 'NO MATCHES FOUND'}
            </motion.h3>
            <motion.p
              className="text-gray-400 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {totalEntries === 0
                ? 'Scan your wallet or Farcaster account to create your first creature!'
                : 'Try adjusting your filters or search term'}
            </motion.p>
            {totalEntries === 0 ? (
              <motion.button
                onClick={onScanNew}
                className="pixel-btn text-white"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                START SCANNING
              </motion.button>
            ) : (
              <motion.button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Clear Filters
              </motion.button>
            )}
          </div>
        </motion.div>
      ) : (
        <>
          {/* Rolodex Card Browser */}
          <div className="flex items-center gap-4">
            {/* Prev Button with animation */}
            <motion.button
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="rolodex-nav flex-shrink-0 disabled:opacity-30"
              whileHover={currentIndex > 0 ? { scale: 1.1, x: -3 } : {}}
              whileTap={currentIndex > 0 ? { scale: 0.9 } : {}}
            >
              <ChevronLeft className="w-8 h-8" />
            </motion.button>

            {/* Main Card */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <RolodexCard key={currentEntry.entry_number} entry={currentEntry} />
              </AnimatePresence>
            </div>

            {/* Next Button with animation */}
            <motion.button
              onClick={onNext}
              disabled={currentIndex === entries.length - 1}
              className="rolodex-nav flex-shrink-0 disabled:opacity-30"
              whileHover={currentIndex < entries.length - 1 ? { scale: 1.1, x: 3 } : {}}
              whileTap={currentIndex < entries.length - 1 ? { scale: 0.9 } : {}}
            >
              <ChevronRight className="w-8 h-8" />
            </motion.button>
          </div>

          {/* Entry Counter with animation */}
          <motion.div
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.p
              className="text-gray-400 text-sm"
              key={currentEntry.entry_number}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              Showing <motion.span
                className="text-pokedex-yellow font-bold"
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {formatEntryNumber(currentEntry.entry_number)}
              </motion.span>
              {' '}&bull;{' '}
              <span className="text-white">{currentIndex + 1}</span> of <span className="text-white">{entries.length}</span>
              {searchQuery && ` (filtered from ${totalEntries})`}
            </motion.p>
            <motion.p
              className="text-gray-300 text-sm mt-2 font-sans"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Use ← → arrow keys to navigate
            </motion.p>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

// Claim Rewards Button Component
function ClaimRewardsButton({ tokenAddress, creatorAddress }: { tokenAddress: string; creatorAddress?: string }) {
  const [availableRewards, setAvailableRewards] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const { address } = useAccount();

  // Fetch available rewards
  useEffect(() => {
    const fetchRewards = async () => {
      if (!tokenAddress || !creatorAddress) return;

      try {
        const response = await fetch(`/api/claim-rewards?token=${tokenAddress}&recipient=${creatorAddress}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableRewards(data.availableRewardsEth || '0');
        }
      } catch (error) {
        console.error('Failed to fetch rewards:', error);
      }
    };

    fetchRewards();
    // Refresh every 30 seconds
    const interval = setInterval(fetchRewards, 30000);
    return () => clearInterval(interval);
  }, [tokenAddress, creatorAddress]);

  const handleClaim = async () => {
    if (!tokenAddress || !address) return;

    setIsClaiming(true);
    try {
      const response = await fetch('/api/claim-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress,
          rewardRecipient: creatorAddress || address,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback({ type: 'success', message: `Rewards claimed! TX: ${data.txHash?.slice(0, 10) ?? '...'}...` });
        setAvailableRewards('0');
      } else {
        const error = await response.json().catch(() => ({}));
        setFeedback({ type: 'error', message: 'Failed to claim: ' + (error.details ?? 'Unknown error') });
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Claim failed: ' + (error as Error).message });
    } finally {
      setIsClaiming(false);
    }
  };

  const hasRewards = parseFloat(availableRewards) > 0.001;

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        onClick={handleClaim}
        disabled={isClaiming || !hasRewards}
        className={`flex flex-col items-center justify-center gap-0 px-2 py-2 rounded-lg text-xs font-bold transition-colors ${hasRewards
          ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer'
          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        whileHover={hasRewards ? { scale: 1.05, y: -2 } : {}}
        whileTap={hasRewards ? { scale: 0.95, y: 0 } : {}}
      >
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {isClaiming ? '...' : 'Claim'}
        </span>
        {hasRewards && (
          <span className="text-xs opacity-80">
            {parseFloat(availableRewards).toFixed(4)} ETH
          </span>
        )}
      </motion.button>
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`flex items-center gap-2 px-2 py-1 rounded text-xs max-w-[140px] ${feedback.type === 'error' ? 'bg-red-900/90 text-red-100' : 'bg-green-900/90 text-green-100'
              }`}
          >
            <span className="truncate flex-1">{feedback.message}</span>
            <button type="button" onClick={() => setFeedback(null)} aria-label="Dismiss">
              <X className="w-3 h-3 flex-shrink-0" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Rolodex Card Component with Rich Animations
function RolodexCard({ entry }: { entry: CreatureRecord }) {
  const { name, element, entry_number, token_address, token_symbol, hp, attack, defense, speed, special, image_url, created_at, creator_address, farcaster_username } = entry;
  const totalStats = hp + attack + defense + speed + special;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Fetch live price data
  const { priceData, loading: priceLoading } = usePriceData(token_address);

  // Fetch evolution data from Supabase
  const [evolutionData, setEvolutionData] = useState<EvolutionRecord | null>(null);

  useEffect(() => {
    const fetchEvolution = async () => {
      const { getEvolutionData, updateEvolution } = await import('@/lib/supabase');

      // Get existing evolution data
      let data = await getEvolutionData(token_address);

      // If we have price data, check for evolution
      if (data && priceData) {
        const newTier = getEvolutionTier(priceData.marketCap);
        if (newTier.index > data.current_tier) {
          // Evolution happened! Update in database
          await updateEvolution(token_address, newTier.index, newTier.name, priceData.marketCap);
          // Re-fetch to get updated data
          data = await getEvolutionData(token_address);
        }
      }

      setEvolutionData(data);
    };

    fetchEvolution();

    // Re-check every 30 seconds
    const interval = setInterval(fetchEvolution, 30000);
    return () => clearInterval(interval);
  }, [token_address, priceData?.marketCap]);

  // Use evolution data from DB if available, otherwise fallback to price-based
  const currentTierIndex = evolutionData?.current_tier ?? (priceData ? getEvolutionTier(priceData.marketCap).index : 0);
  const evolutionTier = EVOLUTION_TIERS[currentTierIndex] || EVOLUTION_TIERS[0];

  // Calculate HP based on market cap (logarithmic scale for better visualization)
  const marketCapHP = priceData
    ? Math.min(100, Math.max(1, Math.log10(priceData.marketCap + 1) * 15))
    : 0;

  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 300);
    return () => clearTimeout(timer);
  }, [entry]);

  const getRarity = (element: string) => {
    const rarities: Record<string, string> = {
      Fire: 'common', Water: 'common', Grass: 'common', Fighting: 'common', Ground: 'common', Bug: 'common',
      Electric: 'uncommon', Poison: 'uncommon', Flying: 'uncommon',
      Ice: 'rare', Psychic: 'rare',
      Dragon: 'legendary'
    };
    return rarities[element] || 'common';
  };

  return (
    <motion.div
      initial={{ rotateY: -90, opacity: 0, scale: 0.8 }}
      animate={{ rotateY: 0, opacity: 1, scale: 1 }}
      exit={{ rotateY: 90, opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
      className={`rolodex-card hover-lift ${evolutionTier.name === 'Legendary' ? 'animate-legendary' : ''}`}
    >
      {/* Entry Number Badge with bounce */}
      <motion.div
        className="entry-number"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.2 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
      >
        {formatEntryNumber(entry_number)}
      </motion.div>

      {/* Evolution Tier Badge with pop animation */}
      <AnimatePresence>
        {priceData && (
          <motion.div
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.3 }}
            className={`absolute -top-3 -right-3 px-3 py-1.5 rounded-lg font-pixel text-xs font-bold ${evolutionTier.color} bg-gray-900 border-2 border-current z-10 flex items-center gap-1 shadow-lg`}
          >
            {(() => {
              const IconComponent = evolutionTier.icon;
              return <IconComponent className="w-3 h-3" />;
            })()}
            {evolutionTier.name}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Section with stagger */}
      <motion.div
        className="flex items-start justify-between mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div>
          <motion.h2
            className="font-pixel text-2xl text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {name}
          </motion.h2>
        </div>
        <motion.div
          className="flex flex-col items-end gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Badge color={element.toLowerCase() === 'fire' ? 'red' : element.toLowerCase() === 'water' ? 'blue' : element.toLowerCase() === 'grass' ? 'green' : 'blue'}>
            {ELEMENT_ICONS[element]}
            {element}
          </Badge>
          <motion.span
            className={`text-xs font-bold uppercase ${RARITY_COLORS[getRarity(element)]}`}
            whileHover={{ scale: 1.1 }}
          >
            {getRarity(element)}
          </motion.span>
        </motion.div>
      </motion.div>

      {/* Live Price Banner with slide-in */}
      <AnimatePresence>
        {priceData && (
          <motion.div
            initial={{ opacity: 0, x: -50, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, x: 50, height: 0 }}
            className="mb-4 p-3 rounded-lg bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-500/30 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <DollarSign className="w-4 h-4 text-green-400" />
                </motion.div>
                <span className="font-pixel text-lg text-green-400">
                  {formatPrice(priceData.price)}
                </span>
                {priceData.priceChange24h !== 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`flex items-center text-xs ${priceData.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {priceData.priceChange24h > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {priceData.priceChange24h > 0 ? '+' : ''}{priceData.priceChange24h.toFixed(2)}%
                  </motion.span>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-300 font-sans">via {priceData.source}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {priceLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700 flex items-center justify-center gap-2"
          >
            <PokeballLoader size="sm" />
            <span className="text-gray-400 text-sm">Fetching live price...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Creature Display with idle animation */}
      <motion.div
        className={`rolodex-screen mb-4 relative overflow-hidden ${evolutionTier.name === 'Legendary' ? 'ring-4 ring-yellow-400/50 animate-legendary' : ''}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.02 }}
      >
        {/* Shimmer effect for legendary */}
        {evolutionTier.name === 'Legendary' && (
          <div className="absolute inset-0 animate-rainbow pointer-events-none z-10" />
        )}

        {image_url ? (
          <motion.div className="relative w-full h-full">
            <motion.img
              src={image_url}
              alt={name}
              className="w-full h-full object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded ? 1 : 0 }}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <PokeballLoader />
              </div>
            )}
            {/* Idle floating animation */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        ) : (
          <motion.div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: ELEMENT_COLORS[element] || '#333' }}
          >
            <motion.span
              className="text-6xl"
              animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {ELEMENT_ICONS[element]}
            </motion.span>
          </motion.div>
        )}
      </motion.div>

      {/* Market Cap HP Bar with enhanced animation */}
      <AnimatePresence>
        {priceData && showStats && (
          <motion.div
            className="mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Crown className="w-3 h-3 text-yellow-400" />
                MARKET CAP HP
              </span>
              <motion.span
                className="font-pixel text-sm text-yellow-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {formatMarketCap(priceData.marketCap)}
              </motion.span>
            </div>
            <AnimatedStatBar
              value={marketCapHP}
              max={100}
              color={evolutionTier.name === 'Legendary' ? 'yellow' : evolutionTier.name === 'Mega' ? 'red' : 'green'}
              delay={0.3}
            />
            <div className="flex justify-between mt-1 text-xs text-gray-300 font-sans">
              <span>$0</span>
              <span>$1M+</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Volume 24h with slide */}
      <AnimatePresence>
        {priceData && priceData.volume24h > 0 && showStats && (
          <motion.div
            className="mb-4 flex items-center justify-between p-2 bg-gray-800/50 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(55, 65, 81, 0.8)' }}
          >
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              24h Volume
            </span>
            <span className="font-pixel text-sm text-white">
              {formatMarketCap(priceData.volume24h)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid with stagger animation */}
      <motion.div
        className="grid grid-cols-5 gap-2 mb-4"
        initial="hidden"
        animate={showStats ? "visible" : "hidden"}
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.3 }
          }
        }}
      >
        {[
          { label: 'HP', value: hp, color: 'text-green-400' },
          { label: 'ATK', value: attack, color: 'text-red-400' },
          { label: 'DEF', value: defense, color: 'text-blue-400' },
          { label: 'SPD', value: speed, color: 'text-yellow-400' },
          { label: 'SPC', value: special, color: 'text-purple-400' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            className="text-center"
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.5 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: { type: "spring", stiffness: 400, damping: 15 }
              }
            }}
            whileHover={{ scale: 1.15, y: -2 }}
          >
            <p className="text-gray-300 text-sm font-sans">{stat.label}</p>
            <motion.p
              className={`font-pixel ${stat.color}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {stat.value}
            </motion.p>
          </motion.div>
        ))}
      </motion.div>

      {/* Total & Token Info with slide-up */}
      <motion.div
        className="border-t border-gray-700 pt-4 grid grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <motion.div whileHover={{ scale: 1.05 }}>
          <p className="text-gray-300 text-sm mb-1 font-sans">TOTAL STATS</p>
          <motion.p
            className="font-pixel text-xl text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {totalStats}
          </motion.p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }}>
          <p className="text-gray-300 text-sm mb-1 font-sans">TOKEN</p>
          <motion.p
            className="font-pixel text-pokedex-yellow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            ${token_symbol}
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Footer with fade */}
      <motion.div
        className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <motion.span
          className="text-gray-300 font-sans"
          whileHover={{ color: '#fff' }}
        >
          {creator_address ? (
            <span className="flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              {creator_address.slice(0, 6)}...{creator_address.slice(-4)}
            </span>
          ) : farcaster_username ? (
            <span className="flex items-center gap-1">
              <AtSign className="w-3 h-3" />
              {farcaster_username}
            </span>
          ) : (
            <span>Unknown</span>
          )}
        </motion.span>
        <span className="text-gray-300 font-sans">
          {created_at ? new Date(created_at).toLocaleDateString() : 'Unknown'}
        </span>
      </motion.div>

      {/* Action Buttons with press effect */}
      <motion.div
        className="mt-4 grid grid-cols-3 gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <motion.a
          href={`${CLANKER_URL}/token/${token_address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 px-2 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-xs"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95, y: 0 }}
        >
          <Coins className="w-3 h-3" />
          Clanker
        </motion.a>
        <ClaimRewardsButton
          tokenAddress={token_address}
          creatorAddress={creator_address}
        />
        <motion.a
          href={`https://basescan.org/token/${token_address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 px-2 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95, y: 0 }}
        >
          <ExternalLink className="w-4 h-4" />
          BaseScan
        </motion.a>
      </motion.div>
    </motion.div>
  );
}
