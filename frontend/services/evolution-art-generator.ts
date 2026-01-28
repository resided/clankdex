/**
 * Evolution Art Generator Service
 * Generates 7-tier progressive art for each creature
 */

// Evolution Art Generator Service

interface Creature {
  name: string;
  species: string;
  element: string;
  description: string;
  colorPalette: string[];
}

interface ArtConfig {
  tier: number;
  width: number;
  height: number;
  style: string;
  effects: string[];
}

// Art configuration for each evolution tier
const TIER_CONFIG: ArtConfig[] = [
  {
    tier: 0, // Egg
    width: 256,
    height: 256,
    style: "8-bit pixel art, cracked egg with glowing center, simple, cute",
    effects: ["subtle glow", "cracked shell"]
  },
  {
    tier: 1, // Baby
    width: 512,
    height: 512,
    style: "16-bit pixel art, chibi style, cute baby creature, emerging from egg",
    effects: ["sparkle particles", "innocent expression"]
  },
  {
    tier: 2, // Basic
    width: 512,
    height: 512,
    style: "16-bit pixel art, full body creature, confident pose, detailed",
    effects: ["elemental aura", "dynamic pose"]
  },
  {
    tier: 3, // Stage 1
    width: 1024,
    height: 1024,
    style: "HD pixel art, evolved form, accessories, enhanced features",
    effects: ["element particles", "accessories", "more detailed"]
  },
  {
    tier: 4, // Stage 2
    width: 1024,
    height: 1024,
    style: "HD pixel art, majestic form, wings or horns, epic pose",
    effects: ["animated background", "particle effects", "royal appearance"]
  },
  {
    tier: 5, // Mega
    width: 1024,
    height: 1024,
    style: "Digital illustration, legendary form, intense colors, powerful",
    effects: ["rainbow aura", "epic proportions", "mythical elements"]
  },
  {
    tier: 6, // Legendary
    width: 1024,
    height: 1024,
    style: "Digital masterpiece, mythical god-like creature, maximum detail, animated quality",
    effects: ["gold border effect", "full particle system", "divine aura", "maximum epicness"]
  }
];

const TIER_NAMES = ['Egg', 'Baby', 'Basic', 'Stage 1', 'Stage 2', 'Mega', 'Legendary'];

const ELEMENT_KEYWORDS: Record<string, string> = {
  Fire: "flames, embers, red, orange, warm colors, intense",
  Water: "waves, bubbles, blue, turquoise, flowing, fluid",
  Grass: "leaves, vines, green, nature, organic, growing",
  Electric: "lightning, sparks, yellow, energetic, crackling",
  Ice: "frost, snowflakes, blue-white, crystalline, cold",
  Fighting: "muscles, dynamic pose, red, powerful, strong",
  Poison: "smoke, purple, toxic, mysterious, dripping",
  Ground: "earth, rocks, brown, stable, rugged",
  Flying: "clouds, wings, sky blue, graceful, airy",
  Psychic: "auras, purple, mystical, glowing eyes, mysterious",
  Bug: "insect wings, green, compound eyes, chittering",
  Rock: "boulders, gray, sturdy, rough texture, ancient",
  Ghost: "translucent, purple-black, ethereal, spooky, floating",
  Dragon: "scales, wings, powerful, ancient, dominant",
  Dark: "shadows, black, mysterious, sneaky, moonlight",
  Steel: "metal, chrome, silver, mechanical, shiny",
  Fairy: "sparkles, pink, magical, whimsical, cute"
};

/**
 * Generate art for a single tier
 */
export async function generateTierArt(
  creature: Creature,
  tier: number,
  apiKey?: string
): Promise<string> {
  const config = TIER_CONFIG[tier];
  const elementKeywords = ELEMENT_KEYWORDS[creature.element] || creature.element;
  
  const prompt = `
${config.style}

Creature: ${creature.name}
Species: ${creature.species}
Element: ${creature.element} (${elementKeywords})
Description: ${creature.description}

Tier: ${TIER_NAMES[tier]} (${tier}/6)
Style: ${config.style}
Effects: ${config.effects.join(', ')}
Colors: ${creature.colorPalette.join(', ')}

Requirements:
- Transparent background
- Centered composition
- Pokemon-inspired aesthetic
- Single creature, no text
- High quality, game asset ready
- Theme: ${creature.description}
`;

  try {
    // Use DALL-E 3 via OpenAI SDK
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey || process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        size: tier <= 2 ? "1024x1024" : "1024x1024",
        quality: tier >= 5 ? "hd" : "standard",
        n: 1,
        style: tier >= 4 ? "vivid" : "natural"
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error(`Failed to generate tier ${tier} art:`, error);
    throw error;
  }
}

/**
 * Generate all 7 tiers for a creature
 */
export async function generateAllTiers(
  creature: Creature,
  onProgress?: (tier: number, total: number) => void
): Promise<{ tier: number; url: string; buffer: Buffer }[]> {
  const results: { tier: number; url: string; buffer: Buffer }[] = [];
  
  for (let i = 0; i < 7; i++) {
    try {
      // Generate art
      const url = await generateTierArt(creature, i);
      
      // Download image
      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());
      
      results.push({ tier: i, url, buffer });
      
      if (onProgress) {
        onProgress(i + 1, 7);
      }
      
      // Rate limit protection
      if (i < 6) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Failed to generate tier ${i}:`, error);
      throw error;
    }
  }
  
  return results;
}

/**
 * Upload to IPFS via Pinata
 */
export async function uploadToIPFS(
  buffers: { tier: number; buffer: Buffer }[],
  creatureName: string,
  pinataKey?: string,
  pinataSecret?: string
): Promise<{ tier: number; ipfsHash: string }[]> {
  const PINATA_API_KEY = pinataKey || process.env.PINATA_API_KEY;
  const PINATA_SECRET = pinataSecret || process.env.PINATA_SECRET;
  
  if (!PINATA_API_KEY || !PINATA_SECRET) {
    throw new Error('Pinata credentials not configured');
  }

  const results: { tier: number; ipfsHash: string }[] = [];
  
  for (const { tier, buffer } of buffers) {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([buffer]), `${creatureName}-tier-${tier}.png`);
      
      const metadata = JSON.stringify({
        name: `${creatureName} - Tier ${tier}`,
        keyvalues: {
          tier: tier.toString(),
          creature: creatureName
        }
      });
      formData.append('pinataMetadata', metadata);
      
      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Pinata upload failed: ${response.status}`);
      }
      
      const data = await response.json();
      results.push({ tier, ipfsHash: data.IpfsHash });
    } catch (error) {
      console.error(`Failed to upload tier ${tier}:`, error);
      throw error;
    }
  }
  
  return results;
}

/**
 * Generate metadata for all tiers
 */
export function generateMetadata(
  creature: Creature,
  ipfsHashes: { tier: number; ipfsHash: string }[],
  clankerToken: string
): { tier: number; metadata: object }[] {
  return ipfsHashes.map(({ tier, ipfsHash }) => ({
    tier,
    metadata: {
      name: `${creature.name} - ${TIER_NAMES[tier]}`,
      description: `${creature.description}\n\nEvolution Tier: ${TIER_NAMES[tier]} (${tier}/6)\nElement: ${creature.element}\nSpecies: ${creature.species}`,
      image: `ipfs://${ipfsHash}`,
      external_url: `https://clankdex.io/creature/${clankerToken}`,
      attributes: [
        { trait_type: "Name", value: creature.name },
        { trait_type: "Species", value: creature.species },
        { trait_type: "Element", value: creature.element },
        { trait_type: "Evolution Tier", value: TIER_NAMES[tier], display_type: "number", max_value: 6 },
        { trait_type: "Tier Number", value: tier },
        { trait_type: "Clanker Token", value: clankerToken }
      ],
      tier_data: {
        current_tier: tier,
        max_tier: 6,
        tier_name: TIER_NAMES[tier],
        next_tier: tier < 6 ? TIER_NAMES[tier + 1] : null
      }
    }
  }));
}

/**
 * Complete generation pipeline
 */
export async function generateEvolutionNFT(
  creature: Creature,
  clankerToken: string,
  options: {
    openaiKey?: string;
    pinataKey?: string;
    pinataSecret?: string;
    onProgress?: (step: string, progress: number) => void;
  } = {}
): Promise<{
  success: boolean;
  tierIPFS: { tier: number; ipfsHash: string }[];
  metadata: { tier: number; metadata: object }[];
}> {
  try {
    // Step 1: Generate art for all tiers
    options.onProgress?.('Generating art...', 0);
    const artBuffers = await generateAllTiers(creature, (current, total) => {
      options.onProgress?.('Generating art...', (current / total) * 50);
    });
    
    // Step 2: Upload to IPFS
    options.onProgress?.('Uploading to IPFS...', 50);
    const ipfsHashes = await uploadToIPFS(
      artBuffers.map(({ tier, buffer }) => ({ tier, buffer })),
      creature.name,
      options.pinataKey,
      options.pinataSecret
    );
    
    // Step 3: Generate metadata
    options.onProgress?.('Generating metadata...', 90);
    const metadata = generateMetadata(creature, ipfsHashes, clankerToken);
    
    options.onProgress?.('Complete!', 100);
    
    return {
      success: true,
      tierIPFS: ipfsHashes,
      metadata
    };
  } catch (error) {
    console.error('Evolution NFT generation failed:', error);
    throw error;
  }
}
