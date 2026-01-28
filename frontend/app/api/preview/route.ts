import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Creature name components
const NAME_PREFIXES = [
  'Clank', 'Block', 'Chain', 'Ether', 'Crypto', 'Pixel', 'Data', 'Net', 'Cyber', 'Digi',
  'Neo', 'Quantum', 'Flux', 'Nova', 'Star', 'Cosmo', 'Astro', 'Meta', 'Hyper', 'Ultra',
  'Thunder', 'Storm', 'Fire', 'Ice', 'Shadow', 'Light', 'Dark', 'Solar', 'Lunar', 'Void'
];

const NAME_SUFFIXES = [
  'mon', 'beast', 'ling', 'oid', 'tron', 'bot', 'byte', 'bit', 'chip', 'node',
  'rex', 'gon', 'wing', 'tail', 'fang', 'claw', 'horn', 'scale', 'shell', 'fin',
  'puff', 'buzz', 'zip', 'spark', 'flash', 'bolt', 'volt', 'core', 'flux', 'wave'
];

const ELEMENTS = [
  'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting', 'Poison', 'Ground', 
  'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

const SPECIES_TYPES = [
  'Blockchain Beast', 'Hash Hound', 'Crypto Critter', 'Ether Entity', 'Token Titan',
  'Wallet Wyrm', 'DeFi Dragon', 'Smart Contract Slime', 'Ledger Leviathan', 'Gas Ghost',
  'Nonce Knight', 'Block Basilisk', 'Chain Chimera', 'Node Naga', 'Protocol Phoenix',
  'Consensus Chimera', 'Validator Viper', 'Stake Sphinx', 'Yield Yeti', 'Liquidity Lizard'
];

// Hash function for deterministic generation
function hashString(str: string): string {
  return crypto.createHash('sha256').update(str.toLowerCase()).digest('hex');
}

// Get random number from hash at position
function getHashValue(hash: string, position: number, max: number): number {
  const segment = hash.slice(position * 2, position * 2 + 4);
  return parseInt(segment, 16) % max;
}

// Generate unique creature from wallet address
function generateCreatureFromWallet(address: string) {
  const hash = hashString(address);
  
  // Generate name
  const prefix = NAME_PREFIXES[getHashValue(hash, 0, NAME_PREFIXES.length)];
  const suffix = NAME_SUFFIXES[getHashValue(hash, 1, NAME_SUFFIXES.length)];
  const name = `${prefix}${suffix}`;
  
  // Generate element
  const element = ELEMENTS[getHashValue(hash, 2, ELEMENTS.length)];
  
  // Generate species
  const species = SPECIES_TYPES[getHashValue(hash, 3, SPECIES_TYPES.length)];
  
  // Generate stats (50-150 range based on hash)
  const hp = 50 + getHashValue(hash, 4, 100);
  const attack = 50 + getHashValue(hash, 5, 100);
  const defense = 50 + getHashValue(hash, 6, 100);
  const speed = 50 + getHashValue(hash, 7, 100);
  const special = 50 + getHashValue(hash, 8, 100);
  
  // Generate color palette based on element
  const colorPalettes: Record<string, string[]> = {
    Fire: ['#FF5722', '#FF9800', '#FFC107', '#FFEB3B'],
    Water: ['#2196F3', '#03A9F4', '#00BCD4', '#009688'],
    Grass: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107'],
    Electric: ['#FFEB3B', '#FFC107', '#FF9800', '#FF5722'],
    Ice: ['#00BCD4', '#E0F7FA', '#B2EBF2', '#80DEEA'],
    Fighting: ['#795548', '#8D6E63', '#A1887F', '#BCAAA4'],
    Poison: ['#9C27B0', '#AB47BC', '#BA68C8', '#CE93D8'],
    Ground: ['#795548', '#8D6E63', '#A1887F', '#D7CCC8'],
    Flying: ['#87CEEB', '#B0E0E6', '#ADD8E6', '#E0F7FA'],
    Psychic: ['#E91E63', '#F06292', '#F48FB1', '#F8BBD9'],
    Bug: ['#8BC34A', '#AED581', '#C5E1A5', '#DCEDC8'],
    Rock: ['#757575', '#9E9E9E', '#BDBDBD', '#E0E0E0'],
    Ghost: ['#7B1FA2', '#9C27B0', '#AB47BC', '#BA68C8'],
    Dragon: ['#3F51B5', '#5C6BC0', '#7986CB', '#9FA8DA'],
    Dark: ['#424242', '#616161', '#757575', '#9E9E9E'],
    Steel: ['#607D8B', '#78909C', '#90A4AE', '#B0BEC5'],
    Fairy: ['#F48FB1', '#F8BBD9', '#FCE4EC', '#FFF0F5'],
  };
  
  const colorPalette = colorPalettes[element] || colorPalettes.Fire;
  
  // Generate description
  const descriptions = [
    `A fierce ${element.toLowerCase()}-type creature born from blockchain transactions.`,
    `This ${element.toLowerCase()}-type ${species.toLowerCase()} emerged from the depths of the chain.`,
    `A mystical ${element.toLowerCase()} creature with powers drawn from wallet entropy.`,
    `Born from the hash of countless transactions, this ${element.toLowerCase()}-type beast roams the blockchain.`,
    `A legendary ${element.toLowerCase()}-type creature with stats determined by on-chain activity.`,
  ];
  const description = descriptions[getHashValue(hash, 9, descriptions.length)];
  
  // Generate DNA from address
  const dna = BigInt('0x' + hash.slice(0, 16)).toString();
  
  return {
    name,
    species,
    dna,
    element,
    level: 1,
    hp,
    attack,
    defense,
    speed,
    special,
    description,
    colorPalette,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, identifier } = body;
    
    // Use address for wallet mode, identifier for Farcaster mode
    const seed = address || identifier;
    
    if (!seed) {
      return NextResponse.json(
        { error: 'Missing address or identifier' },
        { status: 400 }
      );
    }
    
    // Generate creature from wallet/Farcaster identifier
    const creature = generateCreatureFromWallet(seed);
    
    // Generate image URL using our image generation API
    const imageResponse = await fetch(new URL('/api/generate-image', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creature }),
    });
    
    let imageBase64 = null;
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      imageBase64 = imageData.imageBase64;
    }
    
    return NextResponse.json({
      creature,
      imageBase64,
      farcasterData: identifier ? { username: identifier } : null,
    });
  } catch (error) {
    console.error('Preview API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate creature' },
      { status: 500 }
    );
  }
}
