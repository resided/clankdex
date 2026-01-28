import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Generate unique token symbol from creature name
function generateTokenSymbol(name: string, address: string): string {
  // Take first 4 chars of name + last 2 chars of address
  const prefix = name.slice(0, 4).toUpperCase();
  const suffix = address.slice(-2).toUpperCase();
  return `${prefix}${suffix}`;
}

// Generate token metadata URI
function generateMetadataURI(creature: any): string {
  // In production, this would upload to IPFS or similar
  // For now, return a data URI with metadata
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
    const { creature, creatorAddress, simulate = false } = body;
    
    if (!creature || !creatorAddress) {
      return NextResponse.json(
        { error: 'Missing creature or creatorAddress' },
        { status: 400 }
      );
    }
    
    // Generate unique token symbol
    const symbol = generateTokenSymbol(creature.name, creatorAddress);
    
    // Generate deterministic token address
    const hash = crypto.createHash('sha256')
      .update(`${creature.dna}${creatorAddress}${Date.now()}`)
      .digest('hex');
    const tokenAddress = `0x${hash.slice(0, 40)}`;
    
    // Generate metadata URI
    const metadataURI = generateMetadataURI(creature);
    
    // In production, this would call the actual Clanker contract
    // For now, return a simulated success response
    const result = {
      success: true,
      tokenAddress,
      symbol,
      metadataURI,
      config: {
        name: creature.name,
        symbol,
        marketCap: '0.5', // ETH
        creator: creatorAddress,
      },
      simulated: true,
    };
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Deploy API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to deploy token', details: (error as Error).message },
      { status: 500 }
    );
  }
}
