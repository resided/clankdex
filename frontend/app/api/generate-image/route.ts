import { NextRequest, NextResponse } from 'next/server';

// Generate a Pokemon-style SVG image based on creature stats
function generateCreatureSVG(creature: any): string {
  const { name, element, hp, attack, defense, speed, special, colorPalette } = creature;
  
  // Create a deterministic pattern based on stats
  const primaryColor = colorPalette[0];
  const secondaryColor = colorPalette[1] || colorPalette[0];
  const accentColor = colorPalette[2] || '#FFFFFF';
  
  // Generate SVG with Pokemon-style card design
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
    <rect x="30" y="-10" width="${hp}" height="12" fill="#FF5722" rx="6"/>
    <text x="140" y="0" font-family="Arial, sans-serif" font-size="12" fill="#333">${hp}</text>
    
    <text x="200" y="0" font-family="Arial, sans-serif" font-size="12" fill="#666">ATK</text>
    <rect x="230" y="-10" width="100" height="12" fill="#E0E0E0" rx="6"/>
    <rect x="230" y="-10" width="${attack}" height="12" fill="#F44336" rx="6"/>
    <text x="340" y="0" font-family="Arial, sans-serif" font-size="12" fill="#333">${attack}</text>
  </g>
</svg>`;
  
  return svg;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creature } = body;
    
    if (!creature) {
      return NextResponse.json(
        { error: 'Missing creature data' },
        { status: 400 }
      );
    }
    
    // Generate SVG image
    const svg = generateCreatureSVG(creature);
    
    // Convert SVG to base64
    const base64 = Buffer.from(svg).toString('base64');
    const imageBase64 = `data:image/svg+xml;base64,${base64}`;
    
    // Also try to generate with AI if possible (Pollinations.ai is free)
    let aiImageUrl = null;
    try {
      const prompt = encodeURIComponent(
        `Pokemon-style creature named "${creature.name}", ${creature.element}-type, ${creature.species}, ` +
        `cute monster with stats HP:${creature.hp} ATK:${creature.attack} DEF:${creature.defense}, ` +
        `colors: ${creature.colorPalette.join(', ')}, white background, digital art style`
      );
      aiImageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=512&height=512&nologo=true&seed=${creature.dna.slice(0, 10)}`;
    } catch (e) {
      console.log('AI image generation not available, using SVG');
    }
    
    return NextResponse.json({
      imageUrl: aiImageUrl || imageBase64,
      imageBase64,
      metadata: {
        name: creature.name,
        description: creature.description,
        image: aiImageUrl || imageBase64,
      },
    });
  } catch (error) {
    console.error('Generate image API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
