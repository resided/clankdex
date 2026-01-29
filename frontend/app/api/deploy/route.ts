import { NextRequest, NextResponse } from 'next/server';
import { Clanker } from 'clanker-sdk/v4';
import { createPublicClient, createWalletClient, http, PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// ============================================
// REAL CLANKER SDK V4 DEPLOYMENT
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creature, creatorAddress, imageUrl } = body;
    
    if (!creature || !creatorAddress) {
      return NextResponse.json(
        { error: 'Missing creature or creatorAddress' },
        { status: 400 }
      );
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

    // Generate Pokemon-style token symbol (3-5 chars)
    const symbol = creature.name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
    const finalSymbol = symbol.length >= 2 ? symbol : 'CLNK';
    
    // Build metadata
    const metadata = {
      description: creature.description || `${creature.name} - A ${creature.element}-type creature`,
    };

    // Token config for v4
    const tokenConfig = {
      name: creature.name,
      symbol: finalSymbol,
      image: imageUrl || '',
      tokenAdmin: creatorAddress as `0x${string}`,
      metadata,
      context: {
        interface: 'ClankDex',
        platform: 'ClankDex',
      },
    };

    // Deploy the token with Base builder code
    const result = await clanker.deploy(tokenConfig, {
      dataSuffix: '0x62e349', // Base builder code
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
        name: creature.name,
        symbol: finalSymbol,
        marketCap: '0.5',
        creator: creatorAddress,
      },
      simulated: false,
    });
    
  } catch (error) {
    console.error('Clanker deploy error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to deploy token', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
