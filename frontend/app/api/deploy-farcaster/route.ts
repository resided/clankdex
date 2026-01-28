import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Generate unique token symbol from creature name
function generateTokenSymbol(name: string, identifier: string): string {
  // Take first 4 chars of name + first 2 chars of identifier
  const prefix = name.slice(0, 4).toUpperCase();
  const suffix = identifier.slice(0, 2).toUpperCase();
  return `${prefix}${suffix}`;
}

// Generate token metadata URI
function generateMetadataURI(creature: any): string {
  const metadata = {
    name: creature.name,
    description: creature.description,
    image: creature.imageURI || '',
    attributes: [
      { trait_type: 'Element', value: creature.element },
      { trait_type: 'Species', value: creature.species },
      { trait_type: 'Level', value: creature.level },
      { trait_type: 'HP', value: creature.hp },
      { trait_type: 'Attack', value: creature.attack },
      { trait_type: 'Defense', value: creature.defense },
      { trait_type: 'Speed', value: creature.speed },
      { trait_type: 'Special', value: creature.special },
    ],
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
    
    // Generate unique token symbol
    const symbol = generateTokenSymbol(creatureData.name, identifier);
    
    // Generate deterministic token address
    const hash = crypto.createHash('sha256')
      .update(`${creatureData.dna}${identifier}${Date.now()}`)
      .digest('hex');
    const tokenAddress = `0x${hash.slice(0, 40)}`;
    
    // Generate metadata URI
    const metadataURI = generateMetadataURI(creatureData);
    
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
