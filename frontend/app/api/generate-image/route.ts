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
// CREATURE STYLE GUIDE - Original Digital Entities
// ============================================
const STYLE_GUIDE = {
  // Visual baseline for DALL-E prompts
  visualRules: [
    "Original creature design, completely unique digital entity",
    "Glowing eyes that reflect the creature's essence",
    "Ethereal body with subtle particle effects",
    "Smooth, clean lines with soft glow effects",
    "Colors match the elemental affinity",
    "Pure white background",
    "No text, no watermarks, no signatures, no borders",
    "Front-facing or 3/4 view pose",
    "Digital art style with ethereal qualities",
    "Soft lighting with ambient glow",
  ],
  
  // Art style modifiers
  artStyle: "original creature design, ethereal digital entity, soft glowing effects, clean vector-like illustration, game asset quality, unique digital being",
  
  // Element visual traits for prompts
  elementTraits: {
    Fire: "ember particles, warm glowing aura, flame wisps, molten core visible through semi-transparent skin",
    Water: "flowing liquid form, bubble trails, deep ocean hues, bioluminescent spots, fluid body",
    Grass: "organic growth patterns, pollen dust, photosynthetic glow, root-like tendrils, living bark",
    Electric: "energy arcs, ionized air particles, conductivity patterns, plasma trails, sparking aura",
    Ice: "crystalline formations, frost breath, frozen aura, snowflake patterns, refractive ice body",
    Fighting: "tense posture, kinetic energy waves, muscular definition, battle-ready stance, force aura",
    Poison: "toxic aura, bubbling secretions, warning color patterns, spore clouds, venomous glow",
    Ground: "mineral deposits, tectonic plates, sediment layers, geological formations, earth connection",
    Flying: "air currents, cloud wisps, gravitational lightness, wind-swept features, sky affinity",
    Psychic: "third eye glow, telekinetic waves, ethereal mist, consciousness ripples, mental projection",
    Bug: "hive patterns, compound eye shine, chitin glow, swarm consciousness aura, segmented body",
    Rock: "mineral veins, crystal inclusions, petrified growths, sedimentary layers, stone core",
    Ghost: "phasing effect, spirit tether, ectoplasm trails, soul fragments, translucent body",
    Dragon: "primal markings, ancient runes, power scales, elemental convergence, majestic presence",
    Dark: "shadow tendrils, void pockets, darkness absorption, eclipse aura, mysterious silhouette",
    Steel: "forged plating, gear integrations, metallic sheen, industrial fusion, mechanical elegance",
    Fairy: "glamour dust, enchantment swirls, magical resonance, wonder essence, dream-like appearance",
  },
  
  // Size classifications for creature design
  sizeClasses: {
    tiny: "tiny ethereal entity, fits in palm, concentrated energy",
    small: "small digital being, compact form, focused essence",
    medium: "medium manifestation, balanced ethereal presence",
    large: "large entity, imposing ethereal presence, significant energy",
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
    description,
    archetype,
    archetypeLore 
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
  
  // Build the prompt with lore integration
  const prompt = `An original digital creature called "${name}" - a ${element} ${species}.

Archetype: ${archetype} - ${archetypeLore}

Physical description:
- ${sizeVisuals}
- ${elementVisuals}
- ${visualTraits || elementVisuals}
- Glowing eyes reflecting its ${element} essence

Creature backstory (visual influence):
${description}

Design rules (MUST FOLLOW):
- ${STYLE_GUIDE.visualRules.join('\n- ')}

Style: ${STYLE_GUIDE.artStyle}

Create a completely original creature design that embodies the ${archetype} archetype with ${element} elemental powers. The creature ${name} should look like a unique digital entity born from blockchain essence, not based on any existing character.`;

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
