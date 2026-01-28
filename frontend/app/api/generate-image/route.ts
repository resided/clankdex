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
// POKEMON-INSPIRED CREATURE STYLE GUIDE
// ============================================
const STYLE_GUIDE = {
  // Core Pokemon design principles (original creatures)
  visualRules: [
    "Ken Sugimori Pokemon art style - official game artwork quality",
    "Creature should have a distinctive, recognizable silhouette",
    "Large expressive eyes with personality and emotion",
    "Clean, confident line art with smooth curves",
    "Bold, saturated colors appropriate to the element type",
    "Simple white background - no environment",
    "NO TEXT, NO WATERMARKS, NO SIGNATURES",
    "Front-facing or 3/4 view showing personality",
    "Cell-shaded rendering with soft gradients",
    "Cute but cool aesthetic - appealing to all ages",
    "Distinctive features that make it memorable",
  ],
  
  // Enhanced art style for DALL-E
  artStyle: "Pokemon official artwork by Ken Sugimori, creature design, clean vector-like illustration, cel-shaded, vibrant colors, game art, character design, appealing proportions, memorable silhouette",
  
  // Detailed element visual traits
  elementTraits: {
    Fire: "warm orange/red/yellow color scheme, flame patterns on body, smoke wisps, heat shimmer effect, passionate expression, ember particles",
    Water: "cool blue/cyan color scheme, fin-like appendages, bubble details, droplet patterns, fluid graceful pose, wave-like forms",
    Grass: "natural green/brown color scheme, leaf or petal accents, vine details, organic flowing shapes, gentle nature spirit vibe",
    Electric: "bright yellow/orange color scheme, lightning bolt patterns, spiky fur or feathers, energetic dynamic pose, spark effects",
    Ice: "icy blue/white color scheme, crystal formations, snowflake patterns, frosty breath, elegant crystalline features",
    Fighting: "warm red/brown color scheme, muscular or tough build, bandage or belt details, determined confident stance",
    Poison: "purple/green color scheme, toxic patterns, gas or bubble effects, mysterious slightly menacing look",
    Ground: "earthy brown/tan color scheme, rocky or sandy textures, sturdy grounded build, desert or mountain motifs",
    Flying: "sky blue/white color scheme, wing or feather details, cloud-like fluff, wind-swept features, airy lightweight build",
    Psychic: "magenta/purple color scheme, mystical gems or orbs, third eye or forehead gem, mysterious wise expression",
    Bug: "green/yellow color scheme, insectoid features, compound eyes, antennae, chitin shell patterns",
    Rock: "gray/brown color scheme, rocky armor or skin, crystal formations, sturdy heavy build, mineral patterns",
    Ghost: "purple/black color scheme, ethereal misty features, floating elements, mysterious translucent effects",
    Dragon: "deep jewel-tone color scheme, scale patterns, horn or wing features, majestic powerful presence",
    Dark: "dark purple/black color scheme, shadowy features, red eyes, mysterious sneaky appearance",
    Steel: "silver/gray color scheme, metallic armor or skin, gear or mechanical details, industrial robotic features",
    Fairy: "pink/white color scheme, sparkles and stars, wing or ribbon features, cute magical appearance",
  },
  
  // Body type based on stats
  bodyTypes: {
    tiny: "tiny cute creature, baby-like proportions, oversized head, fits in palm, chibi style",
    small: "small compact creature, youthful proportions, playful energetic look,便携 size",
    medium: "medium balanced creature, athletic proportions, adventure-ready appearance",
    large: "large impressive creature, powerful proportions, commanding presence, evolved form look",
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
    description,
    archetype,
    archetypeLore 
  } = creature;
  
  // Determine body type based on stats
  const avgStat = (hp + attack + defense + speed + special) / 5;
  let bodyType = 'small';
  if (avgStat < 60) bodyType = 'tiny';
  else if (avgStat < 85) bodyType = 'small';
  else if (avgStat < 110) bodyType = 'medium';
  else bodyType = 'large';
  
  // Get element-specific visual traits
  const elementVisuals = STYLE_GUIDE.elementTraits[element as keyof typeof STYLE_GUIDE.elementTraits] || '';
  const bodyTypeDesc = STYLE_GUIDE.bodyTypes[bodyType as keyof typeof STYLE_GUIDE.bodyTypes];
  
  // Build the enhanced prompt
  const prompt = `A Pokemon-style creature named "${name}" the ${element}-type ${species}.

CREATURE DESIGN:
- ${bodyTypeDesc}
- ${elementVisuals}
- Distinctive features that make it instantly recognizable
- Expressive eyes showing ${archetype.toLowerCase()} personality

ARCHETYPE INFLUENCE:
The creature embodies the ${archetype} archetype: ${archetypeLore}
This influences its pose, expression, and overall vibe.

BACKSTORY VISUALS:
${description}

ART STYLE (CRITICAL - MUST FOLLOW):
- Ken Sugimori Pokemon official artwork style
- Clean confident line art
- Bold saturated colors
- Cel-shaded with soft gradients
- Simple white background
- NO TEXT, NO WATERMARKS
- Memorable silhouette
- Cute but cool aesthetic
- Game-ready character design

Create an original creature that looks like it could be in a Pokemon game. Make it appealing, memorable, and true to its ${element} type.`;

  return prompt;
}

// Generate fallback SVG if DALL-E fails
function generateFallbackSVG(creature: any): string {
  const { name, element, hp, attack, defense, speed, special, colorPalette } = creature;
  
  const primaryColor = colorPalette[0];
  const secondaryColor = colorPalette[1] || colorPalette[0];
  const accentColor = colorPalette[2] || '#FFFFFF';
  
  // Create a more interesting Pokemon-style abstract shape
  const seed = name.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0);
  
  const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:0.2" />
      <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:0.1" />
    </linearGradient>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor}" />
      <stop offset="100%" style="stop-color:${secondaryColor}" />
    </linearGradient>
    <radialGradient id="eyeGrad">
      <stop offset="0%" style="stop-color:#FFF" />
      <stop offset="100%" style="stop-color:${accentColor}" />
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="512" height="512" fill="white" rx="20"/>
  <rect width="512" height="512" fill="url(#bgGrad)" rx="20"/>
  
  <!-- Main creature body - abstract representation -->
  <g transform="translate(256, 280)">
    <!-- Aura/Glow -->
    <ellipse cx="0" cy="0" rx="${140 + special * 0.3}" ry="${120 + special * 0.25}" fill="${primaryColor}" opacity="0.1" filter="url(#glow)"/>
    
    <!-- Body shape based on defense stat -->
    <ellipse cx="0" cy="${20 + defense * 0.1}" rx="${60 + defense * 0.3}" ry="${50 + defense * 0.2}" fill="url(#bodyGrad)" filter="url(#glow)"/>
    
    <!-- Head based on HP -->
    <circle cx="0" cy="${-40 - hp * 0.15}" r="${45 + hp * 0.2}" fill="${primaryColor}" opacity="0.95"/>
    
    <!-- Eyes - large and expressive -->
    <ellipse cx="${-18}" cy="${-45 - hp * 0.15}" rx="${12}" ry="${16}" fill="url(#eyeGrad)"/>
    <ellipse cx="${18}" cy="${-45 - hp * 0.15}" rx="${12}" ry="${16}" fill="url(#eyeGrad)"/>
    <circle cx="${-16}" cy="${-48 - hp * 0.15}" r="${6}" fill="#000"/>
    <circle cx="${20}" cy="${-48 - hp * 0.15}" r="${6}" fill="#000"/>
    <circle cx="${-18}" cy="${-52 - hp * 0.15}" r="${3}" fill="#FFF" opacity="0.8"/>
    <circle cx="${18}" cy="${-52 - hp * 0.15}" r="${3}" fill="#FFF" opacity="0.8"/>
    
    <!-- Element symbol on forehead -->
    <circle cx="0" cy="${-65 - hp * 0.15}" r="${8}" fill="${accentColor}" opacity="0.9"/>
    
    <!-- Special power aura -->
    <ellipse cx="0" cy="0" rx="${90 + special * 0.25}" ry="${80 + special * 0.2}" fill="none" stroke="${accentColor}" stroke-width="3" opacity="0.4" stroke-dasharray="8,4"/>
    
    <!-- Speed lines/effects -->
    ${Array.from({ length: Math.min(8, Math.floor(speed / 15)) }, (_, i) => {
      const angle = (i * 45) * Math.PI / 180;
      const r1 = 100;
      const r2 = 120 + speed * 0.2;
      const x1 = Math.cos(angle) * r1;
      const y1 = Math.sin(angle) * r1;
      const x2 = Math.cos(angle) * r2;
      const y2 = Math.sin(angle) * r2;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${accentColor}" stroke-width="3" opacity="0.5" stroke-linecap="round"/>`;
    }).join('')}
    
    <!-- Attack claws/features -->
    ${attack > 70 ? `
    <path d="M ${-50 - attack * 0.2} ${30} L ${-70 - attack * 0.3} ${60} L ${-40 - attack * 0.2} ${50} Z" fill="${secondaryColor}" opacity="0.8"/>
    <path d="M ${50 + attack * 0.2} ${30} L ${70 + attack * 0.3} ${60} L ${40 + attack * 0.2} ${50} Z" fill="${secondaryColor}" opacity="0.8"/>
    ` : ''}
  </g>
  
  <!-- Name and info -->
  <text x="256" y="420" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#333" text-anchor="middle">${name}</text>
  
  <!-- Element badge -->
  <rect x="186" y="440" width="140" height="32" rx="16" fill="${primaryColor}" stroke="${secondaryColor}" stroke-width="2"/>
  <text x="256" y="462" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#FFF" text-anchor="middle">${element} Type</text>
  
  <!-- Stats -->
  <g transform="translate(100, 490)">
    <text x="0" y="0" font-family="Arial, sans-serif" font-size="12" fill="#666" font-weight="bold">HP</text>
    <rect x="25" y="-12" width="${hp}" height="12" fill="#4CAF50" rx="6"/>
    <text x="135" y="0" font-family="Arial, sans-serif" font-size="12" fill="#333">${hp}</text>
    
    <text x="180" y="0" font-family="Arial, sans-serif" font-size="12" fill="#666" font-weight="bold">ATK</text>
    <rect x="205" y="-12" width="${attack}" height="12" fill="#F44336" rx="6"/>
    <text x="315" y="0" font-family="Arial, sans-serif" font-size="12" fill="#333">${attack}</text>
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
        
        console.log('Generating DALL-E image for:', creature.name);
        
        const response = await openaiClient.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          style: "vivid",
        });
        
        dalleImageUrl = response.data?.[0]?.url || null;
        
        console.log('DALL-E image generated:', dalleImageUrl ? 'success' : 'failed');
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
