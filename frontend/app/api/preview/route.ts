import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============================================
// POKEMON STYLE GUIDE - All characters must follow
// ============================================
const POKEMON_STYLE_GUIDE = {
  // Visual baseline for DALL-E prompts
  visualRules: [
    "Cute, chibi-style creature design",
    "Round, friendly eyes with expressive pupils",
    "Proportional body parts (large head, small body)",
    "Smooth, clean lines without excessive detail",
    "Vibrant, saturated colors matching the element type",
    "White or simple gradient background",
    "No text, no watermarks, no signatures",
    "Front-facing or 3/4 view pose",
    "Cell-shaded or soft-shaded rendering style",
    "Consistent lighting from upper left",
  ],
  
  // Art style modifiers
  artStyle: "digital art, Pokemon official artwork style, Ken Sugimori inspired, clean vector-like illustration, game asset",
  
  // Element visual traits
  elementTraits: {
    Fire: "flame accents on body, warm color palette (red/orange/yellow), smoke or ember particles",
    Water: "flowing fins, aquatic features, blue/cyan palette, droplet or bubble effects",
    Grass: "leaf or flower decorations, plant-like features, green/brown palette, pollen particles",
    Electric: "bolt patterns, spiky fur/scales, yellow/orange palette, spark/arc effects",
    Ice: "crystalline features, snow accents, blue/white palette, frost breath effect",
    Fighting: "muscular build, bandages or belts, red/brown palette, determined expression",
    Poison: "slime trails, gas clouds, purple/green palette, toxic bubble effects",
    Ground: "rocky armor, earth tones, brown/tan palette, dust particle effects",
    Flying: "wing features, cloud accents, sky blue/white palette, wind swirl effects",
    Psychic: "mystical aura, gem-like eyes, pink/purple palette, energy wave effects",
    Bug: "exoskeleton features, antennae, green/yellow palette, wing flutter effects",
    Rock: "stone skin, crystal growths, gray/brown palette, gravel particle effects",
    Ghost: "translucent body, ethereal wisps, purple/black palette, spirit flame effects",
    Dragon: "scale patterns, horn features, deep color palette, ancient energy aura",
    Dark: "shadow accents, red eyes, dark purple/black palette, darkness swirl effects",
    Steel: "metallic plating, gear or bolt details, silver/gray palette, shine reflections",
    Fairy: "sparkle effects, pastel colors, wing or ribbon features, heart/star motifs",
  }
};

// ============================================
// POKEMON-STYLE NAME GENERATION
// ============================================
const NAME_SYLLABLES = {
  // Pokemon-sounding prefixes (2-3 syllables)
  prefixes: [
    // Classic Pokemon vibes
    'Pika', 'Char', 'Bulba', 'Squi', 'Jiggly', 'Meow', 'Psy', 'Abra', 'Kada', 'Ala',
    'Ratta', 'Spear', 'Ekans', 'Arbok', 'Sand', 'Nido', 'Vulpix', 'Nineta', 'Zubat', 'Golbat',
    'Oddish', 'Gloom', 'Vile', 'Para', 'Venon', 'Dig', 'Meowth', 'Persian', 'Psyduck', 'Golduck',
    'Mankey', 'Prime', 'Growl', 'Arcan', 'Poliwag', 'Poly', 'Kadabra', 'Machop', 'Machoke', 'Bellsprout',
    // Blockchain themed
    'Block', 'Chain', 'Hash', 'Ether', 'Crypto', 'Token', 'Coin', 'Ledger', 'Node', 'Mine',
    'Stake', 'Yield', 'Swap', 'Mint', 'Vault', 'Asset', 'Trade', 'Pool', 'Gas', 'Nonce',
    // Cute extensions
    'Fluff', 'Spark', 'Bubb', 'Giggly', 'Snor', 'Lap', 'Eevee', 'Vapore', 'Jolt', 'Flareon',
    'Pory', 'Omany', 'Kaba', 'Aero', 'Snorl', 'Drati', 'Mew', 'Chiko', 'Cynda', 'Toto',
  ],
  
  // Pokemon-sounding suffixes
  suffixes: [
    // Classic suffixes
    'chu', 'mander', 'saur', 'rtle', 'puff', 'duck', 'der', 'bra', 'bok', 'shrew',
    'queen', 'king', 'dude', 'drill', 'pan', 'ape', 'pix', 'tales', 'bat', 'bone',
    'lash', 'trike', 'pod', 'bug', 'cruel', 'tung', 'duo', 'drio', 'dewgong', 'grimer',
    'muk', 'shell', 'cruel', 'gastly', 'haunter', 'gengar', 'onix', 'drowzee', 'hypno', 'krabby',
    'kingler', 'voltorb', 'electrode', 'exeggcute', 'cubone', 'marowak', 'hitmon', 'lickitung', 'koffing', 'weezing',
    'rhyhorn', 'chansey', 'tangela', 'kangas', 'horsea', 'seadra', 'goldeen', 'seaking', 'staryu', 'starmie',
    'mr-mime', 'scyther', 'jynx', 'electabuzz', 'magmar', 'pinsir', 'tauros', 'magikarp', 'gyarados', 'lapras',
    'ditto', 'eevee', 'porygon', 'omanyte', 'kabuto', 'aerodactyl', 'snorlax', 'articuno', 'zapdos', 'moltres',
    'dratini', 'dragonair', 'dragonite', 'mewtwo', 'mew',
    // Generic creature suffixes
    'mon', 'ling', 'oid', 'ite', 'eon', 'py', 'by', 'ny', 'saur', 'rex',
    'dactyl', 'nax', 'thyst', 'gon', 'nix', 'pix', 'lux', 'vex', 'max', 'jax',
  ]
};

const ELEMENTS = [
  'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting', 'Poison', 'Ground', 
  'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
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

// Generate Pokemon-style name
function generatePokemonName(address: string): string {
  const hash = hashString(address);
  
  // 70% chance of classic Pokemon name structure
  const useClassic = getHashValue(hash, 0, 100) < 70;
  
  if (useClassic) {
    // Prefix + Suffix structure
    const prefix = NAME_SYLLABLES.prefixes[getHashValue(hash, 1, NAME_SYLLABLES.prefixes.length)];
    const suffix = NAME_SYLLABLES.suffixes[getHashValue(hash, 2, NAME_SYLLABLES.suffixes.length)];
    
    // Sometimes add a middle syllable for longer names
    if (getHashValue(hash, 3, 100) < 30) {
      const middle = NAME_SYLLABLES.prefixes[getHashValue(hash, 4, NAME_SYLLABLES.prefixes.length)].slice(0, 3);
      return `${prefix}${middle}${suffix}`;
    }
    
    return `${prefix}${suffix}`;
  } else {
    // Creative compound name
    const part1 = NAME_SYLLABLES.prefixes[getHashValue(hash, 1, NAME_SYLLABLES.prefixes.length)];
    const part2 = NAME_SYLLABLES.prefixes[getHashValue(hash, 5, NAME_SYLLABLES.prefixes.length)];
    return `${part1}${part2.toLowerCase()}`;
  }
}

// Fetch wallet data from Neynar
async function fetchWalletData(address: string) {
  try {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      console.log('Neynar API key not configured, using hash-based generation');
      return null;
    }
    
    // Fetch user data by custody address
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/custody-address?custody_address=${address}`, {
      headers: {
        'accept': 'application/json',
        'api_key': apiKey,
      },
    });
    
    if (!response.ok) {
      console.log('Neynar fetch failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data.user || null;
  } catch (error) {
    console.error('Neynar API error:', error);
    return null;
  }
}

// Generate creature from wallet with Neynar data
async function generateCreatureFromWallet(address: string, neynarData: any | null) {
  const hash = hashString(address);
  
  // Generate Pokemon-style name
  const name = generatePokemonName(address);
  
  // Generate element
  const element = ELEMENTS[getHashValue(hash, 10, ELEMENTS.length)];
  
  // Generate species based on element
  const speciesTypes: Record<string, string[]> = {
    Fire: ['Flame Pokemon', 'Ember Pokemon', 'Blaze Pokemon'],
    Water: ['Aqua Pokemon', 'Torrent Pokemon', 'Bubble Pokemon'],
    Grass: ['Seed Pokemon', 'Leaf Pokemon', 'Bloom Pokemon'],
    Electric: ['Thunder Pokemon', 'Spark Pokemon', 'Volt Pokemon'],
    Ice: ['Frost Pokemon', 'Snow Pokemon', 'Glacier Pokemon'],
    Fighting: ['Fighting Pokemon', 'Combat Pokemon', 'Brawler Pokemon'],
    Poison: ['Toxic Pokemon', 'Venom Pokemon', 'Poison Pokemon'],
    Ground: ['Earth Pokemon', 'Terrain Pokemon', 'Burrow Pokemon'],
    Flying: ['Wing Pokemon', 'Sky Pokemon', 'Gale Pokemon'],
    Psychic: ['Psi Pokemon', 'Mind Pokemon', 'Mystic Pokemon'],
    Bug: ['Insect Pokemon', 'Cocoon Pokemon', 'Swarm Pokemon'],
    Rock: ['Stone Pokemon', 'Boulder Pokemon', 'Crag Pokemon'],
    Ghost: ['Specter Pokemon', 'Spirit Pokemon', 'Shadow Pokemon'],
    Dragon: ['Dragon Pokemon', 'Wyrm Pokemon', 'Drake Pokemon'],
    Dark: ['Darkness Pokemon', 'Night Pokemon', 'Shadow Pokemon'],
    Steel: ['Iron Pokemon', 'Metal Pokemon', 'Chrome Pokemon'],
    Fairy: ['Fairy Pokemon', 'Pixie Pokemon', 'Enchant Pokemon'],
  };
  
  const species = speciesTypes[element][getHashValue(hash, 11, 3)];
  
  // Generate stats influenced by Neynar data if available
  let statModifier = 0;
  if (neynarData) {
    // Boost stats based on social activity
    const followerCount = neynarData.follower_count || 0;
    const followingCount = neynarData.following_count || 0;
    statModifier = Math.min(30, Math.floor((followerCount + followingCount) / 100));
  }
  
  // Generate stats (50-150 range based on hash + Neynar modifier)
  const hp = 50 + getHashValue(hash, 12, 100) + statModifier;
  const attack = 50 + getHashValue(hash, 13, 100) + statModifier;
  const defense = 50 + getHashValue(hash, 14, 100) + statModifier;
  const speed = 50 + getHashValue(hash, 15, 100) + statModifier;
  const special = 50 + getHashValue(hash, 16, 100) + statModifier;
  
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
    `The ${element} ${species.toLowerCase()}. It stores energy in its body from blockchain transactions.`,
    `A ${element.toLowerCase()}-type creature discovered in the digital realm. Its power grows with wallet activity.`,
    `This ${species.toLowerCase()} draws strength from on-chain entropy. Trainers value its ${element.toLowerCase()} abilities.`,
    `Found deep within the blockchain. This ${element.toLowerCase()}-type ${name.toLowerCase()} evolves through transactions.`,
    `A mysterious ${species.toLowerCase()} with ${element.toLowerCase()} powers. Its stats reflect the wallet's journey.`,
  ];
  const description = descriptions[getHashValue(hash, 17, descriptions.length)];
  
  // Generate DNA from address
  const dna = BigInt('0x' + hash.slice(0, 16)).toString();
  
  // Build visual traits for DALL-E
  const visualTraits = POKEMON_STYLE_GUIDE.elementTraits[element as keyof typeof POKEMON_STYLE_GUIDE.elementTraits];
  
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
    visualTraits,
    neynarData: neynarData ? {
      username: neynarData.username,
      displayName: neynarData.display_name,
      followerCount: neynarData.follower_count,
      followingCount: neynarData.following_count,
    } : null,
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
    
    // Fetch Neynar data if we have an address
    let neynarData = null;
    if (address) {
      neynarData = await fetchWalletData(address);
    }
    
    // Generate creature from wallet/Farcaster identifier
    const creature = await generateCreatureFromWallet(seed, neynarData);
    
    // Generate image URL using our image generation API
    const imageResponse = await fetch(new URL('/api/generate-image', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creature, useDalle: true }),
    });
    
    let imageUrl = null;
    let imageBase64 = null;
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      imageUrl = imageData.imageUrl;
      imageBase64 = imageData.imageBase64;
    }
    
    return NextResponse.json({
      creature,
      imageUrl,
      imageBase64,
      styleGuide: POKEMON_STYLE_GUIDE,
      farcasterData: creature.neynarData || (identifier ? { username: identifier } : null),
    });
  } catch (error) {
    console.error('Preview API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate creature' },
      { status: 500 }
    );
  }
}
