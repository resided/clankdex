import { NextRequest, NextResponse } from 'next/server';

// Google AI Studio API key - MUST be set in environment variables
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// ============================================
// ENHANCED POKEMON-STYLE CREATURE GUIDE
// ============================================

// Optimized element visuals for AI image generation
const ELEMENT_VISUALS: Record<string, {
  colors: string,
  features: string,
  vibe: string,
}> = {
  Fire: {
    colors: 'vibrant orange, flame red, ember yellow, charcoal black accents',
    features: 'flame-tipped tail, fire mane, ember markings, warm glowing eyes, smoke wisps',
    vibe: 'fierce yet friendly, passionate, burning spirit'
  },
  Water: {
    colors: 'deep ocean blue, aqua teal, seafoam white, pearl iridescence',
    features: 'flowing fins, bubble patterns, sleek aquatic body, water droplet gems, gills',
    vibe: 'graceful, fluid, mysterious depths'
  },
  Grass: {
    colors: 'vibrant leaf green, flower pink, bark brown, sunny yellow',
    features: 'leaf ears/tail, flower blooms, vine patterns, seed pods, nature motifs',
    vibe: 'nurturing, growth-oriented, one with nature'
  },
  Electric: {
    colors: 'electric yellow, lightning white, storm black, spark orange',
    features: 'spiky fur, lightning bolt markings, glowing cheeks, static electricity effects',
    vibe: 'hyperactive, zippy, crackling with energy'
  },
  Ice: {
    colors: 'frost blue, snow white, crystal clear, aurora purple',
    features: 'ice crystal formations, frozen breath, snowflake patterns, icicle horns',
    vibe: 'elegant, serene, crystalline beauty'
  },
  Fighting: {
    colors: 'martial red, muscle tan, bandage white, determined brown',
    features: 'muscular build, fighting stance, focused eyes, battle-worn details',
    vibe: 'disciplined, honorable warrior, never gives up'
  },
  Poison: {
    colors: 'toxic purple, slime green, warning yellow, venom magenta',
    features: 'poison sacs, dripping toxins, skull markings, venomous fangs/barbs',
    vibe: 'dangerous allure, toxic beauty, mischievous'
  },
  Ground: {
    colors: 'earth brown, desert tan, clay orange, mineral gray',
    features: 'rocky hide, digging claws, cracked earth patterns, dust clouds',
    vibe: 'sturdy, grounded, ancient earth power'
  },
  Flying: {
    colors: 'sky blue, cloud white, feather cream, wind silver',
    features: 'majestic wings, aerodynamic body, feathered crest, tailfeathers',
    vibe: 'free-spirited, graceful, lord of the skies'
  },
  Psychic: {
    colors: 'mystic purple, mind pink, cosmic blue, third-eye gold',
    features: 'forehead gem, floating aura, closed-eye serenity, psychic waves',
    vibe: 'wise, otherworldly, transcendent mind'
  },
  Bug: {
    colors: 'chitin green, shell brown, warning yellow stripes, compound-eye red',
    features: 'antennae, compound eyes, exoskeleton, wing cases, mandibles',
    vibe: 'industrious, metamorphic, hive-minded'
  },
  Rock: {
    colors: 'granite gray, gemstone colors, mineral brown, crystal shine',
    features: 'rocky armor, crystal growths, ancient fossils, gem-encrusted body',
    vibe: 'ancient, unbreakable, living geology'
  },
  Ghost: {
    colors: 'spectral purple, ectoplasm cyan, shadow black, spirit white',
    features: 'translucent body, floating wisp tail, glowing eyes, ethereal flames',
    vibe: 'playfully spooky, mischievous spirit, between worlds'
  },
  Dragon: {
    colors: 'royal purple, scale blue, ancient gold, power red',
    features: 'dragon scales, horn crown, powerful wings, serpentine body, ancient runes',
    vibe: 'majestic, legendary, primal power incarnate'
  },
  Dark: {
    colors: 'midnight black, shadow purple, blood red eyes, moon silver',
    features: 'shadowy aura, sleek predator build, glowing eyes, crescent markings',
    vibe: 'mysterious, misunderstood, cool antihero'
  },
  Steel: {
    colors: 'chrome silver, iron gray, copper accents, metallic blue',
    features: 'metal plating, gear joints, rivets, polished armor, mechanical details',
    vibe: 'precise, unbreakable, technological marvel'
  },
  Fairy: {
    colors: 'pastel pink, sparkle white, cotton candy blue, stardust gold',
    features: 'ribbon feelers, tiny wings, star patterns, heart motifs, sparkle aura',
    vibe: 'whimsical, enchanting, deceptively powerful'
  },
  Normal: {
    colors: 'cream beige, soft brown, warm gray, natural tan',
    features: 'fluffy fur, round friendly body, expressive ears, cute paws',
    vibe: 'friendly, adaptable, reliable companion'
  }
};

// Elite Pokemon-style creature prompt builder
function buildImagePrompt(creature: any): string {
  const { name, element, hp, attack, defense, speed, special, archetype } = creature;

  // Determine evolution stage based on total stats
  const totalStats = hp + attack + defense + speed + special;
  let evolutionStage = 'basic';
  let sizeDesc = '';
  if (totalStats < 300) {
    evolutionStage = 'baby';
    sizeDesc = 'tiny adorable baby creature, chibi proportions, oversized head, stubby limbs, maximum cuteness';
  } else if (totalStats < 400) {
    evolutionStage = 'basic';
    sizeDesc = 'small youthful creature, energetic stance, curious expression, ready to grow';
  } else if (totalStats < 500) {
    evolutionStage = 'stage1';
    sizeDesc = 'medium evolved creature, confident pose, developed features, showing power';
  } else {
    evolutionStage = 'final';
    sizeDesc = 'large fully-evolved creature, majestic presence, powerful build, commanding aura';
  }

  const elementData = ELEMENT_VISUALS[element] || ELEMENT_VISUALS.Fire;

  // Get top 2 stats for visual emphasis
  const stats = [
    { name: 'HP', value: hp, trait: 'round sturdy body with healthy glow' },
    { name: 'Attack', value: attack, trait: 'sharp claws and fierce determined eyes' },
    { name: 'Defense', value: defense, trait: 'armored plating or protective shell' },
    { name: 'Speed', value: speed, trait: 'sleek aerodynamic form with motion lines' },
    { name: 'Special', value: special, trait: 'glowing mystical markings and energy aura' }
  ];
  stats.sort((a, b) => b.value - a.value);

  // Build concise but powerful prompt
  return `Professional Pokemon character art, official Ken Sugimori illustration style.

CREATURE: "${name}" - ${element}-type ${evolutionStage} Pokemon
DESIGN: ${sizeDesc}
COLORS: ${elementData.colors}
FEATURES: ${elementData.features}
EXPRESSION: ${elementData.vibe}, ${archetype.toLowerCase()} personality
KEY TRAITS: ${stats[0].trait}, ${stats[1].trait}

ART STYLE:
- Clean vector-like linework with varying line weights
- Soft cel-shading with subtle gradients
- Large shiny expressive anime eyes with catchlights
- Distinctive memorable silhouette
- Game-ready character design
- ${evolutionStage === 'baby' || evolutionStage === 'basic' ? 'Cute kawaii appeal' : 'Cool powerful presence'}

COMPOSITION:
- Full body, 3/4 front view
- Dynamic idle pose showing personality
- Solid pure white background (#FFFFFF)
- Creature centered, filling 80% of frame
- Studio lighting, no shadows on background

ABSOLUTE REQUIREMENTS:
- Single creature only, no duplicates
- No text, letters, watermarks, signatures
- No human elements or clothing
- No realistic rendering - stylized 2D art only
- No busy backgrounds - pure white only
- Must look like official Nintendo Pokemon artwork`;
}

// Generate enhanced fallback SVG
function generateFallbackSVG(creature: any): string {
  const { name, element, hp, attack, defense, speed, special, colorPalette } = creature;
  
  const primaryColor = colorPalette[0];
  const secondaryColor = colorPalette[1] || colorPalette[0];
  const accentColor = colorPalette[2] || '#FFFFFF';
  
  // Calculate size based on total stats
  const totalStats = hp + attack + defense + speed + special;
  const scale = 0.8 + (totalStats / 500);
  
  const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor}" />
      <stop offset="100%" style="stop-color:${secondaryColor}" />
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="50%">
      <stop offset="0%" style="stop-color:${accentColor};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${primaryColor};stop-opacity:0" />
    </radialGradient>
    <filter id="softGlow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Pure white background -->
  <rect width="512" height="512" fill="white"/>
  
  <!-- Creature centered -->
  <g transform="translate(256, 280) scale(${scale})">
    <!-- Glow aura -->
    <ellipse cx="0" cy="20" rx="${100 + special * 0.3}" ry="${90 + special * 0.25}" fill="url(#glowGrad)"/>
    
    <!-- Body -->
    <ellipse cx="0" cy="30" rx="${55 + defense * 0.25}" ry="${45 + defense * 0.2}" fill="url(#bodyGrad)" filter="url(#softGlow)"/>
    
    <!-- Head -->
    <circle cx="0" cy="${-35 - hp * 0.1}" r="${40 + hp * 0.15}" fill="${primaryColor}"/>
    
    <!-- Eyes - large and expressive -->
    <g transform="translate(0, ${-40 - hp * 0.1})">
      <!-- Left eye -->
      <ellipse cx="${-18}" cy="0" rx="${14}" ry="${18}" fill="white"/>
      <circle cx="${-16}" cy="2" r="${7}" fill="#1a1a1a"/>
      <circle cx="${-18}" cy="${-2}" r="${3}" fill="white" opacity="0.8"/>
      
      <!-- Right eye -->
      <ellipse cx="${18}" cy="0" rx="${14}" ry="${18}" fill="white"/>
      <circle cx="${16}" cy="2" r="${7}" fill="#1a1a1a"/>
      <circle cx="${18}" cy="${-2}" r="${3}" fill="white" opacity="0.8"/>
    </g>
    
    <!-- Element symbol on forehead -->
    <circle cx="0" cy="${-70 - hp * 0.1}" r="${10}" fill="${accentColor}" opacity="0.9"/>
    
    <!-- Special power aura rings -->
    <ellipse cx="0" cy="0" rx="${80 + special * 0.2}" ry="${70 + special * 0.15}" 
      fill="none" stroke="${accentColor}" stroke-width="2" opacity="0.4" stroke-dasharray="10,5"/>
    
    <!-- Speed lines -->
    ${speed > 70 ? Array.from({ length: 6 }, (_, i) => {
      const angle = i * 60;
      const rad = angle * Math.PI / 180;
      const r1 = 90;
      const r2 = 110 + speed * 0.2;
      const x1 = Math.cos(rad) * r1;
      const y1 = Math.sin(rad) * r1;
      const x2 = Math.cos(rad) * r2;
      const y2 = Math.sin(rad) * r2;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${accentColor}" stroke-width="3" opacity="0.5" stroke-linecap="round"/>`;
    }).join('') : ''}
    
    <!-- Attack features -->
    ${attack > 75 ? `
    <path d="M ${-50 - attack * 0.15} 20 L ${-70 - attack * 0.2} 50 L ${-40 - attack * 0.15} 40 Z" fill="${secondaryColor}"/>
    <path d="M ${50 + attack * 0.15} 20 L ${70 + attack * 0.2} 50 L ${40 + attack * 0.15} 40 Z" fill="${secondaryColor}"/>
    ` : ''}
  </g>
  
  <!-- Name -->
  <text x="256" y="450" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#333" text-anchor="middle">${name}</text>
  
  <!-- Type badge -->
  <rect x="206" y="470" width="100" height="28" rx="14" fill="${primaryColor}" stroke="${secondaryColor}" stroke-width="2"/>
  <text x="256" y="489" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">${element}</text>
</svg>`;
  
  return svg;
}

// Fetch image and convert to base64
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return { data: base64, mimeType: contentType };
  } catch (error) {
    console.error('Failed to fetch image:', error);
    return null;
  }
}

// Generate Pokemon from PFP using Gemini Vision
async function generateFromPFP(pfpUrl: string, creature: any): Promise<string | null> {
  try {
    // Fetch the PFP image
    const pfpImage = await fetchImageAsBase64(pfpUrl);
    if (!pfpImage) {
      console.log('Could not fetch PFP, falling back to text-only generation');
      return null;
    }

    const { name, element, archetype } = creature;
    const elementData = ELEMENT_VISUALS[element] || ELEMENT_VISUALS.Fire;

    const prompt = `You are a Pokemon character designer. Transform this profile picture into an original Pokemon-style creature.

CREATURE SPECS:
- Name: "${name}"
- Type: ${element}
- Archetype: ${archetype}

TRANSFORMATION RULES:
1. Extract the dominant colors from this image and use them as the creature's color palette
2. Capture the mood/vibe/energy of this image in the creature's expression
3. If there are any distinctive visual elements (patterns, shapes, accessories), subtly incorporate them into the creature design
4. The creature should feel like this image's "spirit Pokemon"

ELEMENT INFLUENCE:
- Colors to blend with: ${elementData.colors}
- Features to include: ${elementData.features}
- Personality: ${elementData.vibe}

ART STYLE (CRITICAL):
- Official Pokemon Ken Sugimori illustration style
- Clean vector linework with varying weights
- Soft cel-shading with subtle gradients
- Large expressive anime eyes with catchlights
- Full body, 3/4 front view
- Solid pure white background (#FFFFFF)
- Single creature, centered, filling 80% of frame

DO NOT:
- Copy the image directly - transform it into a creature
- Include any text, watermarks, or signatures
- Make it realistic - must be stylized 2D Pokemon art
- Include humans or human clothing

Create a single high-quality Pokemon that embodies this profile picture's essence.`;

    // Use Gemini with vision capabilities
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: pfpImage.mimeType,
                  data: pfpImage.data
                }
              },
              { text: prompt }
            ]
          }],
          generationConfig: {
            responseModalities: ['image', 'text'],
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini Vision API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();

    // Extract image from response
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        console.log('PFP transformation successful');
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    return null;
  } catch (error) {
    console.error('PFP transformation error:', error);
    return null;
  }
}

// Generate image using Google Imagen API
async function generateWithImagen(prompt: string): Promise<string | null> {
  try {
    // Use Imagen 3 via Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            safetyFilterLevel: 'block_few',
            personGeneration: 'dont_allow',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Imagen API error:', response.status, errorText);

      // Try alternative Gemini image generation
      return await generateWithGemini(prompt);
    }

    const data = await response.json();

    if (data.predictions?.[0]?.bytesBase64Encoded) {
      return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
    }

    return null;
  } catch (error) {
    console.error('Imagen generation error:', error);
    return await generateWithGemini(prompt);
  }
}

// Fallback to Gemini 2.0 Flash image generation
async function generateWithGemini(prompt: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate an image: ${prompt}`
            }]
          }],
          generationConfig: {
            responseModalities: ['image', 'text'],
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();

    // Check for inline image data in response
    const parts = data.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.mimeType?.startsWith('image/')) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    return null;
  } catch (error) {
    console.error('Gemini generation error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creature, useAI = true, pfpUrl } = body;

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

    // Try AI image generation
    let aiImageUrl = null;
    let usedPFP = false;

    if (useAI && GOOGLE_API_KEY) {
      try {
        console.log('Generating image for:', creature.name);

        // Priority 1: Try PFP transformation if available
        if (pfpUrl) {
          console.log('Attempting PFP transformation from:', pfpUrl);
          aiImageUrl = await generateFromPFP(pfpUrl, creature);
          if (aiImageUrl) {
            usedPFP = true;
            console.log('PFP transformation successful');
          }
        }

        // Priority 2: Fall back to text-only Imagen/Gemini
        if (!aiImageUrl) {
          const prompt = buildImagePrompt(creature);
          console.log('Falling back to text-only generation');
          aiImageUrl = await generateWithImagen(prompt);
        }

        console.log('AI image generated:', aiImageUrl ? 'success' : 'failed');
      } catch (aiError) {
        console.error('AI generation failed:', aiError);
        // Fall back to SVG
      }
    }

    return NextResponse.json({
      imageUrl: aiImageUrl || fallbackImageBase64,
      imageBase64: fallbackImageBase64,
      prompt: useAI ? buildImagePrompt(creature) : null,
      usedAI: !!aiImageUrl,
      usedPFP: usedPFP,
      metadata: {
        name: creature.name,
        description: creature.description,
        image: aiImageUrl || fallbackImageBase64,
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
