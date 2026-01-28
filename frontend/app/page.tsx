'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useFarcaster } from './components/FarcasterProvider';
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
  Baby
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

interface ClankdexEntry {
  entryNumber: number;
  creature: Creature;
  imageBase64: string | null;
  tokenAddress: string;
  tokenSymbol: string;
  launchedAt: string;
  inputMode: 'wallet' | 'farcaster';
  identifier: string;
}

interface PriceData {
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  source: string;
  lastUpdated: string;
}

// Evolution tiers based on market cap
const EVOLUTION_TIERS = [
  { name: 'Egg', minCap: 0, maxCap: 1000, color: 'text-gray-400', icon: Egg, hpMultiplier: 1 },
  { name: 'Baby', minCap: 1000, maxCap: 10000, color: 'text-green-400', icon: Baby, hpMultiplier: 1.5 },
  { name: 'Basic', minCap: 10000, maxCap: 50000, color: 'text-blue-400', icon: Star, hpMultiplier: 2 },
  { name: 'Stage 1', minCap: 50000, maxCap: 100000, color: 'text-purple-400', icon: Sparkles, hpMultiplier: 3 },
  { name: 'Stage 2', minCap: 100000, maxCap: 500000, color: 'text-yellow-400', icon: Zap, hpMultiplier: 5 },
  { name: 'Mega', minCap: 500000, maxCap: 1000000, color: 'text-orange-400', icon: Flame, hpMultiplier: 10 },
  { name: 'Legendary', minCap: 1000000, maxCap: Infinity, color: 'text-red-400', icon: Crown, hpMultiplier: 20 },
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

type ViewMode = 'scan' | 'collection';

const CLANKDEX_STORAGE_KEY = 'clankdex_entries';

// Storage utilities
const loadClankdexEntries = (): ClankdexEntry[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CLANKDEX_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveClankdexEntry = (entry: ClankdexEntry): ClankdexEntry[] => {
  const entries = loadClankdexEntries();
  entries.push(entry);
  localStorage.setItem(CLANKDEX_STORAGE_KEY, JSON.stringify(entries));
  return entries;
};

const getNextEntryNumber = (entries: ClankdexEntry[]): number => {
  if (entries.length === 0) return 1;
  return Math.max(...entries.map(e => e.entryNumber)) + 1;
};

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
  const [creature, setCreature] = useState<Creature | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintStep, setMintStep] = useState<'idle' | 'generating' | 'uploading' | 'deploying'>('idle');
  const [showCreature, setShowCreature] = useState(false);
  const [deployResult, setDeployResult] = useState<DeployResult | null>(null);
  const [farcasterData, setFarcasterData] = useState<FarcasterData | null>(null);

  // Rolodex state
  const [viewMode, setViewMode] = useState<ViewMode>('scan');
  const [clankdexEntries, setClankdexEntries] = useState<ClankdexEntry[]>([]);
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Load entries from localStorage on mount
  useEffect(() => {
    setClankdexEntries(loadClankdexEntries());
  }, []);

  // Filter entries based on search
  const filteredEntries = clankdexEntries.filter(entry => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.creature.name.toLowerCase().includes(query) ||
      entry.creature.element.toLowerCase().includes(query) ||
      formatEntryNumber(entry.entryNumber).toLowerCase().includes(query) ||
      entry.tokenSymbol.toLowerCase().includes(query)
    );
  });

  // Keyboard navigation for rolodex
  useEffect(() => {
    if (viewMode !== 'collection') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentEntryIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentEntryIndex(prev => Math.min(filteredEntries.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, filteredEntries.length]);

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

  // Analyze Farcaster user
  const analyzeFarcaster = async (usernameOverride?: string) => {
    const identifier = usernameOverride || farcasterInput.trim();
    if (!identifier) return;

    setIsAnalyzing(true);
    setShowCreature(false);
    setDeployResult(null);

    try {
      const response = await fetch('/api/preview-farcaster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Farcaster analysis failed');
      }
      
      const data = await response.json();
      setCreature(data.creature);
      setImageBase64(data.imageBase64);
      setFarcasterData(data.farcasterData);
      
      setTimeout(() => setShowCreature(true), 500);
    } catch (error) {
      console.error('Farcaster analysis error:', error);
      alert('Failed to analyze Farcaster user: ' + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Launch creature
  const launchCreature = async () => {
    if (!creature) return;
    
    setIsMinting(true);
    setMintStep('generating');
    
    try {
      // Generate and upload image
      const generateResponse = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creature }),
      });
      
      const { imageUrl } = await generateResponse.json();
      creature.imageURI = imageUrl;
      
      setMintStep('deploying');
      
      // Deploy based on mode
      const endpoint = inputMode === 'wallet' ? '/api/deploy' : '/api/deploy-farcaster';
      const body = inputMode === 'wallet' 
        ? { creature, creatorAddress: address, simulate: false }
        : { identifier: farcasterInput };
      
      const deployResponse = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const result = await deployResponse.json();
      
      if (result.success) {
        setDeployResult(result);

        // Save to Clankdex
        const newEntry: ClankdexEntry = {
          entryNumber: getNextEntryNumber(clankdexEntries),
          creature: { ...creature, imageURI: imageUrl },
          imageBase64: imageBase64,
          tokenAddress: result.tokenAddress,
          tokenSymbol: result.config?.symbol || creature.name.slice(0, 6).toUpperCase(),
          launchedAt: new Date().toISOString(),
          inputMode: inputMode,
          identifier: inputMode === 'wallet' ? (address || '') : farcasterInput,
        };
        const updatedEntries = saveClankdexEntry(newEntry);
        setClankdexEntries(updatedEntries);

        confetti({
          particleCount: 200,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#DC0A2D', '#FFDE00', '#3B4CCA', '#51AE5E', '#FF5722'],
        });
      } else {
        throw new Error(result.error || 'Deployment failed');
      }
    } catch (error) {
      console.error('Launch error:', error);
      alert('Launch failed: ' + (error as Error).message);
    } finally {
      setIsMinting(false);
      setMintStep('idle');
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

  return (
    <main className="min-h-screen bg-pokemon-world py-8 px-4 relative">
      {/* Animated Background Elements */}
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />
      <div className="gradient-orb gradient-orb-3" />
      <div className="particles">
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <header className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">⚡</span>
              <h1 className="font-pixel text-4xl md:text-6xl text-white drop-shadow-lg">
                <span className="text-pokedex-red">CLANK</span>
                <span className="text-pokedex-yellow">DEX</span>
              </h1>
              <span className="text-2xl">⚡</span>
            </div>
            <p className="text-gray-300 text-sm md:text-base">
              Wallet Pokedex powered by <span className="text-yellow-400 font-bold">Clanker</span>
            </p>
          </motion.div>
        </header>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-800/50 rounded-full p-1 flex gap-1">
            <button
              onClick={() => setViewMode('scan')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-wide transition-all ${
                viewMode === 'scan'
                  ? 'bg-pokedex-red text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              Scan
            </button>
            <button
              onClick={() => setViewMode('collection')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-wide transition-all ${
                viewMode === 'collection'
                  ? 'bg-pokedex-yellow text-black shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Collection
              {clankdexEntries.length > 0 && (
                <span className="ml-1 bg-black/20 px-2 py-0.5 rounded-full text-xs">
                  {clankdexEntries.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {viewMode === 'scan' && (
          <>
            {/* Input Mode Toggle */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-800/50 rounded-full p-1 flex gap-1">
                <button
                  onClick={() => setInputMode('wallet')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    inputMode === 'wallet'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Wallet
                </button>
                <button
                  onClick={() => setInputMode('farcaster')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    inputMode === 'farcaster'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <AtSign className="w-4 h-4" />
                  Farcaster
                </button>
              </div>
            </div>
          </>
        )}

        {/* Farcaster Input */}
        {viewMode === 'scan' && inputMode === 'farcaster' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mb-8"
          >
            <div className="flex gap-2">
              <div className="relative flex-1">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={farcasterInput}
                  onChange={(e) => setFarcasterInput(e.target.value)}
                  placeholder="username or FID"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-2 text-center">
              Enter Farcaster username (without @) or FID number
            </p>
          </motion.div>
        )}

        {/* Wallet Connect */}
        {viewMode === 'scan' && inputMode === 'wallet' && (
          <div className="flex justify-center mb-8">
            {isConnected ? (
              <div className="flex items-center gap-3 bg-gray-800/50 rounded-full px-4 py-2 border border-gray-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-white font-mono text-sm">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button
                  onClick={() => disconnect()}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector: connectors[0] })}
                disabled={isConnecting}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-3 rounded-full transition-colors disabled:opacity-50"
              >
                {isConnecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Wallet className="w-5 h-5" />
                )}
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        )}

        {/* Main Content */}
        {viewMode === 'scan' ? (
          // SCAN MODE
          (inputMode === 'wallet' && isConnected) || inputMode === 'farcaster' ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Pokedex Device */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="pokedex aspect-[3/4] max-w-sm mx-auto md:max-w-none"
              >
                {/* Top Section with LEDs */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="led led-blue animate-pulse" />
                  <div className="led led-red" />
                  <div className="led led-yellow" />
                  <div className="led led-green" />
                  <span className="text-white/50 text-xs font-pixel ml-auto">
                    {inputMode === 'wallet' ? 'WALLET' : 'FARCASTER'}
                  </span>
                </div>

                {/* Screen */}
                <div className="pokedex-screen aspect-square mb-4 scanlines">
                  <div className="crt-overlay" />

                  {!showCreature ? (
                    <div className="absolute inset-0 flex items-center justify-center p-6">
                      {isAnalyzing ? (
                        <div className="text-center">
                          <Loader2 className="w-12 h-12 text-pokedex-darkscreen animate-spin mx-auto mb-4" />
                          <p className="font-pixel text-xs text-pokedex-darkscreen animate-pulse">
                            {inputMode === 'wallet' ? 'ANALYZING DNA...' : 'SCANNING FARCASTER...'}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          {inputMode === 'farcaster' && farcasterData?.pfpUrl ? (
                            <img
                              src={farcasterData.pfpUrl}
                              alt="Profile"
                              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-pokedex-darkscreen/30"
                            />
                          ) : (
                            <Sparkles className="w-16 h-16 text-pokedex-darkscreen/50 mx-auto mb-4" />
                          )}
                          <p className="font-pixel text-xs text-pokedex-darkscreen text-center">
                            PRESS SCAN TO<br />
                            {inputMode === 'wallet' ? 'ANALYZE WALLET' : 'ANALYZE @' + (farcasterInput || 'USER')}<br />
                            & LAUNCH TOKEN
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center p-4"
                    >
                      {imageBase64 ? (
                        <img
                          src={imageBase64}
                          alt={creature?.name}
                          className="w-full h-full object-contain animate-float"
                        />
                      ) : (
                        <div
                          className="w-32 h-32 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: creature?.colorPalette[0] }}
                        >
                          <span className="text-6xl">
                            {ELEMENT_ICONS[creature?.element || 'Fire']}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Bottom Controls */}
                <div className="flex items-center justify-between">
                  <div className="dpad">
                    <div className="dpad-up" />
                    <div className="dpad-left" />
                    <div className="dpad-center" />
                    <div className="dpad-right" />
                    <div className="dpad-down" />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={analyze}
                      disabled={isAnalyzing || isMinting || (inputMode === 'farcaster' && !farcasterInput.trim())}
                      className="pixel-btn text-white disabled:opacity-50"
                    >
                      {isAnalyzing ? '...' : 'SCAN'}
                    </button>

                    {showCreature && !deployResult && (
                      <button
                        onClick={launchCreature}
                        disabled={isMinting || isAnalyzing}
                        className="pixel-btn text-white disabled:opacity-50"
                        style={{ backgroundColor: '#FFD700', borderColor: '#B8860B', color: '#000' }}
                      >
                        {isMinting ? '...' : '🚀 LAUNCH'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Stats Panel */}
              <AnimatePresence mode="wait">
                {showCreature && creature && (
                  <StatsPanel
                    creature={creature}
                    farcasterData={farcasterData}
                    isMinting={isMinting}
                    mintStep={mintStep}
                    deployResult={deployResult}
                    onShare={(text, embeds) => composeCast(text, embeds)}
                  />
                )}

                {!showCreature && !isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-center h-full min-h-[300px]"
                  >
                    <div className="text-center">
                      <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">
                        {inputMode === 'wallet'
                          ? 'Connect your wallet and scan to discover\nyour unique blockchain creature'
                          : 'Enter a Farcaster username to analyze\ntheir on-chain personality'
                        }
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-yellow-500">
                        <Rocket className="w-4 h-4" />
                        <span>Launches as Clanker token</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <NotConnectedState inputMode={inputMode} />
          )
        ) : (
          // COLLECTION MODE - Rolodex
          <Rolodex
            entries={filteredEntries}
            currentIndex={currentEntryIndex}
            onPrev={() => setCurrentEntryIndex(prev => Math.max(0, prev - 1))}
            onNext={() => setCurrentEntryIndex(prev => Math.min(filteredEntries.length - 1, prev + 1))}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalEntries={clankdexEntries.length}
            onScanNew={() => setViewMode('scan')}
          />
        )}

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          <InfoCard
            icon={<Eye className="w-6 h-6" />}
            title="Analyze"
            description="Your wallet history becomes DNA. We scan transaction patterns, token holdings, NFT collections, and on-chain activity to create a unique genetic fingerprint. The AI analyzes this data to determine your creature's element type, stats distribution, and personality traits."
          />
          <InfoCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Generate"
            description="Our AI takes your DNA fingerprint and conjures a one-of-a-kind pixel art creature. The name, species, and visual design are all algorithmically determined based on your on-chain identity - no two creatures are alike."
          />
          <InfoCard
            icon={<Rocket className="w-6 h-6" />}
            title="Clanker Launch"
            description="Deploy your creature as a tradeable ERC-20 token on Base via Clanker. You'll receive creator rewards from trading activity. Your creature joins the Clankdex permanently with a unique entry number."
          />
        </div>
      </div>
    </main>
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

  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 50, opacity: 0 }}
      className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700"
    >
      {/* Farcaster Profile */}
      {farcasterData && (
        <div className="flex items-center gap-4 mb-6 p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
          {farcasterData.pfpUrl && (
            <img 
              src={farcasterData.pfpUrl} 
              alt={farcasterData.username}
              className="w-16 h-16 rounded-full border-2 border-purple-500"
            />
          )}
          <div>
            <h3 className="font-bold text-white">@{farcasterData.username}</h3>
            <p className="text-gray-400 text-sm">{farcasterData.displayName}</p>
            <div className="flex gap-4 mt-2 text-xs">
              <span className="text-purple-400">{farcasterData.followerCount} followers</span>
              <span className="text-gray-500">{farcasterData.castCount} casts</span>
            </div>
          </div>
        </div>
      )}

      {/* Creature Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-pixel text-2xl text-white mb-1">
            {creature.name}
          </h2>
          <p className="text-gray-400 text-sm">
            {creature.species}
          </p>
          {farcasterData && (
            <p className="text-purple-400 text-xs mt-1">
              {farcasterData.archetype} • {farcasterData.personality?.dominant}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`element-badge ${ELEMENT_COLORS[creature.element]} text-white`}>
            {ELEMENT_ICONS[creature.element]}
            {creature.element}
          </span>
          <span className={`text-xs font-bold uppercase ${RARITY_COLORS[getRarity(creature.element)]}`}>
            {getRarity(creature.element)}
          </span>
        </div>
      </div>

      {/* Description */}
      <div className="bg-pokedex-screen/20 rounded-lg p-4 mb-6 border border-pokedex-screen/30">
        <p className="text-gray-300 text-sm leading-relaxed">
          {creature.description}
        </p>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <StatBar label="HP" value={creature.hp} max={100} color="bg-green-500" />
        <StatBar label="ATK" value={creature.attack} max={100} color="bg-red-500" />
        <StatBar label="DEF" value={creature.defense} max={100} color="bg-blue-500" />
        <StatBar label="SPD" value={creature.speed} max={100} color="bg-yellow-400" />
        <StatBar label="SPC" value={creature.special} max={100} color="bg-purple-500" />
      </div>

      {/* Total Stats */}
      <div className="mt-4 p-3 bg-gray-700/50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Total Stats</span>
          <span className="font-pixel text-lg text-white">
            {creature.hp + creature.attack + creature.defense + creature.speed + creature.special}
          </span>
        </div>
      </div>

      {/* DNA & Level */}
      <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-2 gap-4">
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">LEVEL</p>
          <p className="font-pixel text-xl text-white">{creature.level}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs mb-1">DNA</p>
          <p className="font-mono text-xs text-gray-400 truncate">
            0x{creature.dna.slice(-8)}
          </p>
        </div>
      </div>

      {/* Launch Progress */}
      {isMinting && (
        <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
            <span className="text-sm text-white">
              {mintStep === 'generating' && 'Generating pixel art...'}
              {mintStep === 'uploading' && 'Uploading to IPFS...'}
              {mintStep === 'deploying' && 'Launching on Clanker...'}
            </span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div 
              className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
              style={{ 
                width: mintStep === 'generating' ? '33%' : 
                       mintStep === 'uploading' ? '66%' : '90%' 
              }}
            />
          </div>
        </div>
      )}

      {/* Success Message */}
      {deployResult && (
        <DeploySuccess deployResult={deployResult} creature={creature} onShare={onShare} />
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
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Token:</span>
            <code className="text-white font-mono text-xs">
              {deployResult.tokenAddress.slice(0, 6)}...{deployResult.tokenAddress.slice(-4)}
            </code>
          </div>
          {deployResult.config && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">Symbol:</span>
                <span className="text-yellow-400 font-bold">{deployResult.config.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Market Cap:</span>
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
          const tokenUrl = `${CLANKER_URL}/token/${deployResult.tokenAddress}`;
          onShare(text, [tokenUrl]);
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
      <span className="font-pixel text-xs text-gray-400 w-12">{label}</span>
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

// Info Card Component
function InfoCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-gray-800/30 backdrop-blur rounded-xl p-6 border border-gray-700/50"
    >
      <div className="text-pokedex-red mb-3">{icon}</div>
      <h3 className="text-white font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </motion.div>
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

// Rolodex Component
function Rolodex({
  entries,
  currentIndex,
  onPrev,
  onNext,
  searchQuery,
  onSearchChange,
  totalEntries,
  onScanNew,
}: {
  entries: ClankdexEntry[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalEntries: number;
  onScanNew: () => void;
}) {
  const currentEntry = entries[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, element, or entry #..."
            className="rolodex-search w-full bg-gray-800 border-4 border-gray-700 rounded-lg pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pokedex-yellow font-pixel text-sm"
          />
        </div>
      </div>

      {entries.length === 0 ? (
        // Empty State
        <div className="rolodex-container p-8">
          <div className="text-center py-12">
            <BookOpen className="w-20 h-20 text-gray-600 mx-auto mb-6" />
            <h3 className="font-pixel text-xl text-white mb-3">
              {totalEntries === 0 ? 'NO ENTRIES YET' : 'NO MATCHES FOUND'}
            </h3>
            <p className="text-gray-400 mb-6">
              {totalEntries === 0
                ? 'Scan your wallet or Farcaster account to create your first creature!'
                : 'Try a different search term'}
            </p>
            {totalEntries === 0 && (
              <button
                onClick={onScanNew}
                className="pixel-btn text-white"
              >
                START SCANNING
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Rolodex Card Browser */}
          <div className="flex items-center gap-4">
            {/* Prev Button */}
            <button
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="rolodex-nav flex-shrink-0 disabled:opacity-30"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            {/* Main Card */}
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <RolodexCard key={currentEntry.entryNumber} entry={currentEntry} />
              </AnimatePresence>
            </div>

            {/* Next Button */}
            <button
              onClick={onNext}
              disabled={currentIndex === entries.length - 1}
              className="rolodex-nav flex-shrink-0 disabled:opacity-30"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Entry Counter */}
          <div className="text-center mt-6">
            <p className="text-gray-400 text-sm">
              Showing <span className="text-pokedex-yellow font-bold">{formatEntryNumber(currentEntry.entryNumber)}</span>
              {' '}&bull;{' '}
              <span className="text-white">{currentIndex + 1}</span> of <span className="text-white">{entries.length}</span>
              {searchQuery && ` (filtered from ${totalEntries})`}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Use arrow keys to navigate
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}

// Rolodex Card Component
function RolodexCard({ entry }: { entry: ClankdexEntry }) {
  const { creature, entryNumber, imageBase64, tokenAddress, tokenSymbol, launchedAt, inputMode, identifier } = entry;
  const totalStats = creature.hp + creature.attack + creature.defense + creature.speed + creature.special;

  // Fetch live price data
  const { priceData, loading: priceLoading } = usePriceData(tokenAddress);
  const evolutionTier = priceData ? getEvolutionTier(priceData.marketCap) : EVOLUTION_TIERS[0];

  // Calculate HP based on market cap (logarithmic scale for better visualization)
  const marketCapHP = priceData
    ? Math.min(100, Math.max(1, Math.log10(priceData.marketCap + 1) * 15))
    : 0;

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
      initial={{ rotateY: -90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      exit={{ rotateY: 90, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="rolodex-card"
    >
      {/* Entry Number Badge */}
      <div className="entry-number">
        {formatEntryNumber(entryNumber)}
      </div>

      {/* Evolution Tier Badge */}
      {priceData && (
        <div className={`absolute -top-3 -right-3 px-3 py-1.5 rounded-lg font-pixel text-xs font-bold ${evolutionTier.color} bg-gray-900 border-2 border-current z-10 flex items-center gap-1`}>
          {(() => {
            const IconComponent = evolutionTier.icon;
            return <IconComponent className="w-3 h-3" />;
          })()}
          {evolutionTier.name}
        </div>
      )}

      {/* Top Section */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-pixel text-2xl text-white">
            {creature.name}
          </h2>
          <p className="text-gray-400 text-sm">{creature.species}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`element-badge ${ELEMENT_COLORS[creature.element]} text-white`}>
            {ELEMENT_ICONS[creature.element]}
            {creature.element}
          </span>
          <span className={`text-xs font-bold uppercase ${RARITY_COLORS[getRarity(creature.element)]}`}>
            {getRarity(creature.element)}
          </span>
        </div>
      </div>

      {/* Live Price Banner */}
      {priceData && (
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-green-900/30 to-blue-900/30 border border-green-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="font-pixel text-lg text-green-400">
                {formatPrice(priceData.price)}
              </span>
              {priceData.priceChange24h !== 0 && (
                <span className={`flex items-center text-xs ${priceData.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {priceData.priceChange24h > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {priceData.priceChange24h > 0 ? '+' : ''}{priceData.priceChange24h.toFixed(2)}%
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">via {priceData.source}</p>
            </div>
          </div>
        </div>
      )}

      {priceLoading && (
        <div className="mb-4 p-3 rounded-lg bg-gray-800/50 border border-gray-700 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <span className="text-gray-400 text-sm">Fetching live price...</span>
        </div>
      )}

      {/* Creature Display */}
      <div className={`rolodex-screen mb-4 relative ${evolutionTier.name === 'Legendary' ? 'ring-4 ring-yellow-400/50 animate-pulse' : ''}`}>
        {imageBase64 ? (
          <img
            src={imageBase64}
            alt={creature.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: creature.colorPalette?.[0] || '#333' }}
          >
            <span className="text-6xl">
              {ELEMENT_ICONS[creature.element]}
            </span>
          </div>
        )}
      </div>

      {/* Market Cap HP Bar */}
      {priceData && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Crown className="w-3 h-3 text-yellow-400" />
              MARKET CAP HP
            </span>
            <span className="font-pixel text-sm text-yellow-400">
              {formatMarketCap(priceData.marketCap)}
            </span>
          </div>
          <div className="h-4 rounded-full overflow-hidden bg-gray-700 border-2 border-gray-600">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${marketCapHP}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full rounded-full ${
                evolutionTier.name === 'Legendary' ? 'bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 animate-pulse' :
                evolutionTier.name === 'Mega' ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                evolutionTier.name === 'Stage 2' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                evolutionTier.name === 'Stage 1' ? 'bg-gradient-to-r from-purple-400 to-pink-400' :
                evolutionTier.name === 'Basic' ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
                evolutionTier.name === 'Baby' ? 'bg-gradient-to-r from-green-400 to-emerald-400' :
                'bg-gray-500'
              }`}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>$0</span>
            <span>$1M+</span>
          </div>
        </div>
      )}

      {/* Volume 24h */}
      {priceData && priceData.volume24h > 0 && (
        <div className="mb-4 flex items-center justify-between p-2 bg-gray-800/50 rounded-lg">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <BarChart3 className="w-3 h-3" />
            24h Volume
          </span>
          <span className="font-pixel text-sm text-white">
            {formatMarketCap(priceData.volume24h)}
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <div className="text-center">
          <p className="text-gray-500 text-xs">HP</p>
          <p className="font-pixel text-green-400">{creature.hp}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs">ATK</p>
          <p className="font-pixel text-red-400">{creature.attack}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs">DEF</p>
          <p className="font-pixel text-blue-400">{creature.defense}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs">SPD</p>
          <p className="font-pixel text-yellow-400">{creature.speed}</p>
        </div>
        <div className="text-center">
          <p className="text-gray-500 text-xs">SPC</p>
          <p className="font-pixel text-purple-400">{creature.special}</p>
        </div>
      </div>

      {/* Total & Token Info */}
      <div className="border-t border-gray-700 pt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-500 text-xs mb-1">TOTAL STATS</p>
          <p className="font-pixel text-xl text-white">{totalStats}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">TOKEN</p>
          <p className="font-pixel text-pokedex-yellow">${tokenSymbol}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {inputMode === 'wallet' ? (
            <span className="flex items-center gap-1">
              <Wallet className="w-3 h-3" />
              {identifier.slice(0, 6)}...{identifier.slice(-4)}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <AtSign className="w-3 h-3" />
              {identifier}
            </span>
          )}
        </span>
        <span className="text-gray-500">
          {new Date(launchedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <a
          href={`${CLANKER_URL}/token/${tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-sm transition-colors"
        >
          <Coins className="w-4 h-4" />
          Clanker
        </a>
        <a
          href={`https://basescan.org/token/${tokenAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-sm transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          BaseScan
        </a>
      </div>
    </motion.div>
  );
}
