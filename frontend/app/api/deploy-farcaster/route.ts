import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============================================
// POKEMON-STYLE TOKEN SYMBOL GENERATION
// ============================================

function generateTokenSymbol(creature: any): string {
  const { name, element } = creature;
  
  // Extract 2-4 letter prefix from creature name
  let prefix = name.slice(0, 4).toUpperCase();
  
  // If name is short, pad with element abbreviation
  if (prefix.length < 3) {
    const elementAbbr: Record<string, string> = {
      Fire: 'FR', Water: 'WT', Grass: 'GR', Electric: 'EL', Ice: 'IC',
      Fighting: 'FG', Poison: 'PS', Ground: 'GD', Flying: 'FL', Psychic: 'PS',
      Bug: 'BG', Rock: 'RK', Ghost: 'GH', Dragon: 'DG', Dark: 'DK', Steel: 'ST', Fairy: 'FY',
    };
    prefix = `${prefix}${elementAbbr[element] || 'MN'}`;
  }
  
  // Ensure 3-5 characters
  prefix = prefix.slice(0, 5);
  
  return prefix;
}

function generateMetadataURI(creature: any, identifier: string): string {
  const metadata = {
    name: creature.name,
    description: creature.description,
    image: creature.imageURI || '',
    external_url: `https://clankdex.io/creature/${creature.dna.slice(0, 16)}`,
    attributes: [
      { trait_type: 'Element', value: creature.element },
      { trait_type: 'Species', value: creature.species },
      { trait_type: 'Level', value: creature.level, display_type: 'number' },
      { trait_type: 'HP', value: creature.hp, display_type: 'number' },
      { trait_type: 'Attack', value: creature.attack, display_type: 'number' },
      { trait_type: 'Defense', value: creature.defense, display_type: 'number' },
      { trait_type: 'Speed', value: creature.speed, display_type: 'number' },
      { trait_type: 'Special', value: creature.special, display_type: 'number' },
      { trait_type: 'Total Stats', value: creature.hp + creature.attack + creature.defense + creature.speed + creature.special, display_type: 'number' },
      { trait_type: 'Origin', value: 'Farcaster' },
      { trait_type: 'Creator', value: identifier },
    ],
    properties: {
      category: 'Pokemon-style Creature',
      creators: [{ address: identifier, share: 100 }],
    }
  };
  
  const json = JSON.stringify(metadata);
  const base64 = Buffer.from(json).toString('base64');
  return `data:application/json;base64,${base64}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, creature } = body;
    
    if (!identifier) {
      return NextResponse.json(
        { error: 'Missing Farcaster identifier' },
        { status: 400 }
      );
    }
    
    // If creature not provided, we need to generate it first
    let creatureData = creature;
    if (!creatureData) {
      // Call the preview API to generate creature
      const previewResponse = await fetch(new URL('/api/preview', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      
      if (!previewResponse.ok) {
        throw new Error('Failed to generate creature from Farcaster identifier');
      }
      
      const previewData = await previewResponse.json();
      creatureData = previewData.creature;
    }
    
    // Generate Pokemon-style token symbol
    const symbol = generateTokenSymbol(creatureData);
    
    // Generate deterministic token address
    const hash = crypto.createHash('sha256')
      .update(`${creatureData.dna}${identifier}${Date.now()}`)
      .digest('hex');
    const tokenAddress = `0x${hash.slice(0, 40)}`;
    
    // Generate metadata URI
    const metadataURI = generateMetadataURI(creatureData, identifier);
    
    const result = {
      success: true,
      tokenAddress,
      symbol,
      metadataURI,
      config: {
        name: creatureData.name,
        symbol,
        marketCap: '0.5', // ETH
        creator: identifier,
      },
      simulated: true,
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Deploy Farcaster API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to deploy token', details: (error as Error).message },
      { status: 500 }
    );
  }
}
