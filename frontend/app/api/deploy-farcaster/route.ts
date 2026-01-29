import { NextRequest, NextResponse } from 'next/server';
import { Clanker } from 'clanker-sdk/v4';
import { createPublicClient, createWalletClient, http, PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'wagmi/chains';
import { Attribution } from 'ox/erc8021';

// Base Builder Code attribution suffix
const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ['bc_pung2696'],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, creature, imageUrl } = body;
    
    if (!identifier) {
      return NextResponse.json(
        { error: 'Missing Farcaster identifier' },
        { status: 400 }
      );
    }
    
    // If creature not provided, generate it first
    let creatureData = creature;
    if (!creatureData) {
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

    // Check for private key
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Deployer private key not configured' },
        { status: 500 }
      );
    }
    
    // Setup wallet with private key
    const account = privateKeyToAccount(privateKey as `0x${string}`);
    
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    }) as PublicClient;

    const wallet = createWalletClient({
      account,
      chain: base,
      transport: http(),
    });

    // Initialize Clanker SDK
    const clanker = new Clanker({ wallet, publicClient });

    // Generate symbol
    const symbol = creatureData.name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
    const finalSymbol = symbol.length >= 2 ? symbol : 'CLNK';
    
    const tokenConfig = {
      name: creatureData.name,
      symbol: finalSymbol,
      image: imageUrl || '',
      tokenAdmin: account.address, // Use deployer as admin for Farcaster
      metadata: {
        description: creatureData.description || `${creatureData.name} - A ${creatureData.element}-type creature`,
      },
      context: {
        interface: 'ClankDex',
        platform: 'ClankDex-Farcaster',
      },
    };

    // Deploy with Base builder attribution
    const result = await clanker.deploy(tokenConfig, {
      dataSuffix: DATA_SUFFIX,
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    // Wait for transaction to get the token address
    const deployResult = await result.waitForTransaction();
    
    if (deployResult.error) {
      throw new Error(deployResult.error.message);
    }
    
    return NextResponse.json({
      success: true,
      tokenAddress: deployResult.address,
      txHash: result.txHash,
      symbol: finalSymbol,
      config: {
        name: creatureData.name,
        symbol: finalSymbol,
        marketCap: '0.5',
        creator: identifier,
      },
      simulated: false,
    });
    
  } catch (error) {
    console.error('Clanker Farcaster deploy error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to deploy token', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
