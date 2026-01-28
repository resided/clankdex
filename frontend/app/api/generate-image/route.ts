import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Lazy initialization of OpenAI client
let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// ============================================
// POKEMON STYLE GUIDE - Must be followed
// ============================================
const STYLE_GUIDE = {
  // Visual baseline for DALL-E prompts
  visualRules: [
    "Cute, chibi-style creature design",
    "Round, friendly eyes with expressive pupils",
    "Proportional body parts (large head, small body - classic Pokemon proportions)",
    "Smooth, clean lines without excessive detail",
    "Vibrant, saturated colors matching the element type",
    "Pure white background",
    "No text, no watermarks, no signatures, no borders",
    "Front-facing or 3/4 view pose",
    "Cell-shaded or soft-shaded rendering style",
    "Consistent soft lighting from upper left",
  ],
  
  // Art style modifiers
  artStyle: "digital art, Pokemon official artwork style, Ken Sugimori inspired, clean vector-like illustration, game asset, high quality render",
  
  // Element visual traits for prompts
  elementTraits: {
    Fire: "flame accents on body, warm color palette (red/orange/yellow), smoke or ember particles, heat waves",
    Water: "flowing fins, aquatic features, blue/cyan palette, droplet or bubble effects, smooth skin",
    Grass: "leaf or flower decorations, plant-like features, green/brown palette, pollen particles, bark texture",
    Electric: "bolt patterns, spiky fur or scales, yellow/orange palette, spark effects, crackling energy",
    Ice: "crystalline features, snow accents, blue/white palette, frost breath effect, icicle details",
    Fighting: "muscular build, bandages or belts, red/brown palette, determined expression, combat stance",
    Poison: "slime trails, gas clouds, purple/green palette, toxic bubble effects, dripping venom",
    Ground: "rocky armor, earth tones, brown/tan palette, dust particle effects, dirt textures",
    Flying: "wing features, cloud accents, sky blue/white palette, wind swirl effects, feather details",
    Psychic: "mystical aura, gem-like eyes, pink/purple palette, energy wave effects, floating objects",
    Bug: "exoskeleton features, antennae, green/yellow palette, wing flutter effects, compound eyes",
    Rock: "stone skin, crystal growths, gray/brown palette, gravel particle effects, mineral veins",
    Ghost: "translucent body, ethereal wisps, purple/black palette, spirit flame effects, floating",
    Dragon: "scale patterns, horn features, deep color palette, ancient energy aura, reptilian features",
    Dark: "shadow accents, red eyes, dark purple/black palette, darkness swirl effects, stealthy pose",
    Steel: "metallic plating, gear or bolt details, silver/gray palette, shine reflections, mechanical parts",
    Fairy: "sparkle effects, pastel colors, wing or ribbon features, heart/star motifs, magical aura",
  },
  
  // Size classifications for creature design
  sizeClasses: {
    tiny: "tiny size, fits in palm, baby-like proportions",
    small: "small size, compact body, cute proportions",
    medium: "medium size, balanced proportions",
    large: "large size, imposing presence, powerful build",
  }
};

// Build DALL-E prompt from creature traits
function buildDallePrompt(creature: any): string {
  const { 
    name, 
    element, 
    species, 
    hp, 
    attack, 
    defense, 
    speed, 
    special,
    visualTraits,
    description 
  } = creature;
  
  // Determine size class based on stats
  const avgStat = (hp + attack + defense + speed + special) / 5;
  let sizeClass = 'small';
  if (avgStat < 60) sizeClass = 'tiny';
  else if (avgStat < 80) sizeClass = 'small';
  else if (avgStat < 100) sizeClass = 'medium';
  else sizeClass = 'large';
  
  // Get element-specific visual traits
  const elementVisuals = STYLE_GUIDE.elementTraits[element as keyof typeof STYLE_GUIDE.elementTraits] || '';
  const sizeVisuals = STYLE_GUIDE.sizeClasses[sizeClass as keyof typeof STYLE_GUIDE.sizeClasses];
  
  // Build the prompt
  const prompt = `A Pokemon-style creature called "${name}" the ${species}, ${element}-type. 

Physical description:
- ${sizeVisuals}
- ${elementVisuals}
- ${visualTraits || elementVisuals}

Design rules (MUST FOLLOW):
- ${STYLE_GUIDE.visualRules.join('\n- ')}

Style: ${STYLE_GUIDE.artStyle}

The creature should look like an official Pokemon from the game series, with the playful, appealing aesthetic that Pokemon are known for. Name: ${name}, Element: ${element}.`;

  return prompt;
}

// Generate fallback SVG if DALL-E fails
function generateFallbackSVG(creature: any): string {
  const { name, element, hp, attack, defense, speed, special, colorPalette } = creature;
  
  const primaryColor = colorPalette[0];
  const secondaryColor = colorPalette[1] || colorPalette[0];
  const accentColor = colorPalette[2] || '#FFFFFF';
  
  const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:0.1" />
    </linearGradient>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor}" />
      <stop offset="100%" style="stop-color:${secondaryColor}" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" fill="url(#bgGrad)" rx="20"/>
  
  <!-- Card border -->
  <rect x="10" y="10" width="492" height="492" fill="none" stroke="${primaryColor}" stroke-width="4" rx="15"/>
  
  <!-- Element badge background -->
  <circle cx="256" cy="200" r="120" fill="url(#bodyGrad)" opacity="0.8"/>
  <circle cx="256" cy="200" r="100" fill="${accentColor}" opacity="0.3"/>
  
  <!-- Creature body (abstract representation based on stats) -->
  <g transform="translate(256, 200)">
    <!-- Body shape based on defense stat -->
    <ellipse cx="0" cy="20" rx="${60 + defense * 0.2}" ry="${50 + defense * 0.15}" fill="url(#bodyGrad)" filter="url(#glow)"/>
    
    <!-- Head based on HP -->
    <circle cx="0" cy="${-30 - hp * 0.1}" r="${40 + hp * 0.15}" fill="${primaryColor}" opacity="0.9"/>
    
    <!-- Eyes based on attack -->
    <ellipse cx="${-20 - attack * 0.05}" cy="${-35 - hp * 0.1}" rx="${8 + attack * 0.03}" ry="${12 + attack * 0.04}" fill="#FFF"/>
    <ellipse cx="${20 + attack * 0.05}" cy="${-35 - hp * 0.1}" rx="${8 + attack * 0.03}" ry="${12 + attack * 0.04}" fill="#FFF"/>
    <circle cx="${-20 - attack * 0.05}" cy="${-35 - hp * 0.1}" r="${4 + attack * 0.02}" fill="#000"/>
    <circle cx="${20 + attack * 0.05}" cy="${-35 - hp * 0.1}" r="${4 + attack * 0.02}" fill="#000"/>
    
    <!-- Special aura -->
    <circle cx="0" cy="0" r="${80 + special * 0.3}" fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.5" stroke-dasharray="10,5"/>
    
    <!-- Speed lines -->
    ${Array.from({ length: Math.floor(speed / 20) }, (_, i) => {
      const angle = (i * 360 / Math.floor(speed / 20)) * Math.PI / 180;
      const x1 = Math.cos(angle) * 90;
      const y1 = Math.sin(angle) * 90;
      const x2 = Math.cos(angle) * 110;
      const y2 = Math.sin(angle) * 110;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${accentColor}" stroke-width="3" opacity="0.6"/>`;
    }).join('')}
  </g>
  
  <!-- Name -->
  <text x="256" y="380" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#333" text-anchor="middle">${name}</text>
  
  <!-- Element badge -->
  <rect x="196" y="400" width="120" height="30" rx="15" fill="${primaryColor}"/>
  <text x="256" y="420" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#FFF" text-anchor="middle">${element} Type</text>
  
  <!-- Stats bars -->
  <g transform="translate(80, 450)">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="12" fill="#666">HP</text>
    <rect x="30" y="-10" width="100" height="12" fill="#E0E0E0" rx="6"/>
    <rect x="30" y="-10" width="${Math.min(hp, 100)}" height="12" fill="#FF5722" rx="6"/>
    <text x="140" y="0" font-family="Arial, sans-serif" font-size="12" fill="#333">${hp}</text>
    
    <text x="200" y="0" font-family="Arial, sans-serif" font-size="12" fill="#666">ATK</text>
    <rect x="230" y="-10" width="100" height="12" fill="#E0E0E0" rx="6"/>
    <rect x="230" y="-10" width="${Math.min(attack, 100)}" height="12" fill="#F44336" rx="6"/>
    <text x="340" y="0" font-family="Arial, sans-serif" font-size="12" fill="#333">${attack}</text>
  </g>
</svg>`;
  
  return svg;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creature, useDalle = true } = body;
    
    if (!creature) {
      return NextResponse.json(
        { error: 'Missing creature data' },
        { status: 400 }
      );
    }
    
    // Always generate fallback SVG first
    const svg = generateFallbackSVG(creature);
    const base64 = Buffer.from(svg).toString('base64');
    const fallbackImageBase64 = `data:image/svg+xml;base64,${base64}`;
    
    // Try DALL-E if enabled and API key is available
    let dalleImageUrl = null;
    
    const openaiClient = getOpenAI();
    if (useDalle && openaiClient) {
      try {
        const prompt = buildDallePrompt(creature);
        
        console.log('Generating DALL-E image with prompt:', prompt.slice(0, 200) + '...');
        
        const response = await openaiClient.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "vivid",
        });
        
        dalleImageUrl = response.data?.[0]?.url || null;
        
        console.log('DALL-E image generated successfully');
      } catch (dalleError) {
        console.error('DALL-E generation failed:', dalleError);
        // Fall back to SVG
      }
    }
    
    // Return both the DALL-E URL (if successful) and fallback SVG
    return NextResponse.json({
      imageUrl: dalleImageUrl || fallbackImageBase64,
      imageBase64: fallbackImageBase64,
      dallePrompt: useDalle ? buildDallePrompt(creature) : null,
      usedDalle: !!dalleImageUrl,
      metadata: {
        name: creature.name,
        description: creature.description,
        image: dalleImageUrl || fallbackImageBase64,
      },
    });
  } catch (error) {
    console.error('Generate image API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate image', details: (error as Error).message },
      { status: 500 }
    );
  }
}
