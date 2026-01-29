import { NextRequest, NextResponse } from 'next/server';

// Google AI Studio API key
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'REMOVED_API_KEY';

// ============================================
// ENHANCED POKEMON-STYLE CREATURE GUIDE
// ============================================

// Detailed element traits for consistent visual language
const ELEMENT_VISUALS: Record<string, {
  colors: string,
  features: string,
  vibe: string,
  examples: string
}> = {
  Fire: {
    colors: 'warm oranges, reds, yellows with black accents',
    features: 'flame-shaped ears or tail, ember patterns on fur/scales, smoke wisps, warm glowing eyes',
    vibe: 'passionate, energetic, fierce but friendly',
    examples: 'like Charmander flame tail, Arcanine majestic mane'
  },
  Water: {
    colors: 'ocean blues, teals, aqua with white foam accents',
    features: 'fin-like crests, bubble patterns, flowing aquatic shapes, fish-like or serpentine body',
    vibe: 'graceful, flowing, adaptable, mysterious depths',
    examples: 'like Vaporeon fins, Gyarados serpentine form'
  },
  Grass: {
    colors: 'forest greens, leaf yellows, wood browns, flower pinks',
    features: 'leaf collar or mane, vine tails, flower buds, bark-textured skin, pollen particles',
    vibe: 'natural, growth, gentle but resilient, living plant aspects',
    examples: 'like Bulbasaur bulb, Leafeon leaf details'
  },
  Electric: {
    colors: 'bright yellow, electric orange, black stripes, white sparks',
    features: 'spiky fur/feathers, lightning bolt patterns, cheek pouches, sparking tail tip',
    vibe: 'hyperactive, fast, crackling with energy, excitable',
    examples: 'like Pikachu cheek sparks, Jolteon spiky fur'
  },
  Ice: {
    colors: 'ice blue, snow white, crystal clear, pale cyan',
    features: 'crystalline formations, icicle horns, frost breath, snowflake patterns, sharp elegant edges',
    vibe: 'elegant, cold beauty, graceful, crystalline perfection',
    examples: 'like Glaceon crystal ears, Articuno elegant wings'
  },
  Fighting: {
    colors: 'reddish-brown, bandage white, determined eye colors',
    features: 'muscular definition, sweat band, wrapped fists, fighting stance, intense focused eyes',
    vibe: 'determined, disciplined, ready for battle, honorable warrior',
    examples: 'like Hitmonlee long legs, Machamp muscular build'
  },
  Poison: {
    colors: 'toxic purple, sickly green, warning yellow patterns',
    features: 'venomous features, gas clouds, warning color patterns, dripping glands, spiky toxic quills',
    vibe: 'mysterious, dangerous but alluring, toxic beauty',
    examples: 'like Nidoran spines, Grimer sludge body'
  },
  Ground: {
    colors: 'earth brown, sand tan, rock gray, clay orange',
    features: 'rocky armor plates, shovel claws, desert textures, sturdy厚重 build, mineral deposits',
    vibe: 'steady, immovable, grounded, ancient earth connection',
    examples: 'like Diglett drill nose, Marowak bone club'
  },
  Flying: {
    colors: 'sky blue, cloud white, feather silver, wind gray',
    features: 'large majestic wings, feathered crest, aerodynamic body, cloud-like fluff, wing patterns',
    vibe: 'free, soaring, graceful in air, above it all',
    examples: 'like Pidgeot crest, Charizard wing structure'
  },
  Psychic: {
    colors: 'mystical purple, pink, cosmic blue, gem tones',
    features: 'third eye gem, forehead crystal, mystical circles, spoon or pendulum, floating objects nearby',
    vibe: 'mysterious, wise, otherworldly, mystical aura',
    examples: 'like Alakazam spoons, Espeon gem forehead'
  },
  Bug: {
    colors: 'chitin green, yellow warning stripes, shell brown, compound eye shine',
    features: 'antennae, compound eyes, exoskeleton segments, wing cases, mandibles, segmented body',
    vibe: 'swarm intelligence, transformation, persistent, hive mind',
    examples: 'like Butterfree wings, Scyther blade arms'
  },
  Rock: {
    colors: 'granite gray, mineral veins, crystal clear, stone brown',
    features: 'rocky shell armor, crystal growths, mineral inclusions, sturdy厚重 build, gem encrusted',
    vibe: 'ancient, unyielding, mineral beauty, geological time',
    examples: 'like Onix rock snake, Geode crystal formations'
  },
  Ghost: {
    colors: 'shadow purple, ectoplasm pink, midnight black, spirit white',
    features: 'translucent body parts, ghostly tail instead of legs, floating, spirit flames, ethereal wisps',
    vibe: 'mysterious, spooky but cute, between worlds, playful trickster',
    examples: 'like Gastly gas body, Haunter floating hands'
  },
  Dragon: {
    colors: 'deep jewel tones, scale iridescence, ancient gold, powerful reds/blues',
    features: 'dragon scales, horn crests, powerful tail, wing membranes, ancient markings, reptilian features',
    vibe: 'ancient power, majestic, legendary aura, primal strength',
    examples: 'like Dragonite friendly dragon, Garchomp land shark'
  },
  Dark: {
    colors: 'midnight black, shadow purple, ominous red eyes, eclipse dark',
    features: 'shadowy aura, red glowing eyes, stealth features, jagged silhouette, darkness effects',
    vibe: 'mysterious, misunderstood, edgy but cool, shadowy',
    examples: 'like Umbreon ring patterns, Absol disaster sense'
  },
  Steel: {
    colors: 'metallic silver, iron gray, rust orange accents, polished chrome',
    features: 'metal plating, gear mechanisms, rivets, industrial design, metallic sheen, mechanical joints',
    vibe: 'industrial strength, precision, unbreakable, technological',
    examples: 'like Steelix metal snake, Scizor steel claws'
  },
  Fairy: {
    colors: 'pastel pink, cotton candy blue, sparkle white, rainbow pastels',
    features: 'ribbon-like feelers, wing shapes, star patterns, heart motifs, magical sparkles, ribbons',
    vibe: 'whimsical, magical, cute wonder, enchanting, playful magic',
    examples: 'like Clefairy moon motifs, Sylveon ribbon feelers'
  }
};

// Body type guidelines
const BODY_TYPES: Record<string, string> = {
  tiny: 'Tiny chibi creature (10-30cm), 2-3 heads tall, oversized head, stubby limbs, maximum cuteness, baby proportions, fits in palm',
  small: 'Small creature (30-60cm), 2.5-3 heads tall, youthful proportions, energetic compact body, portable size',
  medium: 'Medium creature (60-120cm), 3-4 heads tall, balanced proportions, athletic capable build, human child sized',
  large: 'Large creature (120cm+), 4-5 heads tall, powerful imposing build, majestic presence, fully evolved look'
};

// Build comprehensive image generation prompt (works with Imagen/DALL-E)
function buildImagePrompt(creature: any): string {
  const { name, element, hp, attack, defense, speed, special, archetype } = creature;
  
  // Determine body type
  const avgStat = (hp + attack + defense + speed + special) / 5;
  let bodyType = 'small';
  if (avgStat < 60) bodyType = 'tiny';
  else if (avgStat < 85) bodyType = 'small';
  else if (avgStat < 110) bodyType = 'medium';
  else bodyType = 'large';
  
  const elementData = ELEMENT_VISUALS[element] || ELEMENT_VISUALS.Fire;
  const bodyDesc = BODY_TYPES[bodyType];
  
  // Determine dominant stat for visual emphasis
  const stats = [
    { name: 'HP', value: hp, visual: 'bulky, healthy, rounded body, sturdy build' },
    { name: 'Attack', value: attack, visual: 'sharp claws, fierce stance, battle-ready pose, intimidating features' },
    { name: 'Defense', value: defense, visual: 'armor, shell, thick skin, protective features, sturdy stance' },
    { name: 'Speed', value: speed, visual: 'streamlined body, aerodynamic, agile pose, quick stance' },
    { name: 'Special', value: special, visual: 'mystical aura, glowing parts, magical features, energy emanating' }
  ];
  stats.sort((a, b) => b.value - a.value);
  const dominantStat = stats[0];

  return `Create an original Pokemon-style creature character named "${name}".

---

VISUAL DESIGN SPECIFICATIONS:

ELEMENT TYPE: ${element}
- Color palette: ${elementData.colors}
- Key features: ${elementData.features}
- Personality vibe: ${elementData.vibe}
- Reference style: ${elementData.examples}

BODY TYPE: ${bodyType}
- Description: ${bodyDesc}

STAT VISUAL EMPHASIS (Dominant: ${dominantStat.name} ${dominantStat.value}):
- Visual characteristics: ${dominantStat.visual}

ARCHETYPE: ${archetype}
- This influences expression and pose attitude

---

ART STYLE REQUIREMENTS:

✓ OFFICIAL POKEMON GAME ART STYLE (Ken Sugimori style)
✓ Clean black outlines with confident line weight variation
✓ Cel-shaded coloring with soft gradients for depth
✓ Vibrant saturated colors appropriate to type
✓ Large expressive eyes with personality
✓ Memorable distinctive silhouette
✓ Cute but cool aesthetic - appealing to all ages
✓ Front-facing or 3/4 view showing character clearly
✓ Simple pure white background (no environment)
✓ Professional game asset quality
✓ Creature fills most of frame, well-centered

---

COMPOSITION:
- Full body visible, standing pose
- Head at least 1/4 of image height
- Character centered with slight breathing room
- Dynamic but stable pose showing personality

---

CRITICAL NEGATIVE CONSTRAINTS:
✗ NO text, words, letters, or typography
✗ NO watermarks, signatures, or artist names
✗ NO backgrounds, scenery, or environments
✗ NOT photographic, 3D render, or realistic
✗ NO gradient backgrounds - pure white only
✗ NO multiple characters - single creature only
✗ NO complex patterns that distract from character
✗ NO human clothing or accessories (natural creature features only)
✗ NOT abstract or vague - must be clearly defined creature

---

Create a single, high-quality creature character that looks like official Pokemon artwork. Make it appealing, memorable, and immediately recognizable as a ${element}-type creature.`;
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
    const { creature, useAI = true } = body;

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

    // Try Google Imagen/Gemini if enabled
    let aiImageUrl = null;

    if (useAI && GOOGLE_API_KEY) {
      try {
        const prompt = buildImagePrompt(creature);

        console.log('Generating image for:', creature.name);

        aiImageUrl = await generateWithImagen(prompt);

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
