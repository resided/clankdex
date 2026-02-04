import { NextRequest, NextResponse } from 'next/server';
import { Clanker } from 'clanker-sdk/v4';
import { createPublicClient, createWalletClient, http, PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Attribution } from 'ox/erc8021';
import { updateCreatorStreak } from '@/lib/supabase';

// ============================================
// REAL CLANKER SDK V4 DEPLOYMENT
// ============================================

// Base Builder Code attribution suffix
const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ['bc_pung2696'],
});

// ClankDex Treasury - receives 5% of LP rewards from all deployed tokens
const CLANKDEX_TREASURY = process.env.CLANKDEX_TREASURY_ADDRESS as `0x${string}` || '0x0000000000000000000000000000000000000000';
const CREATOR_REWARD_PERCENTAGE = 95; // Creator gets 95%, ClankDex gets 5%

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creature, creatorAddress, imageUrl, referrerAddress } = body;
    
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

    // Warn if treasury not configured (still deploys, but no revenue)
    if (!process.env.CLANKDEX_TREASURY_ADDRESS) {
      console.warn('⚠️ CLANKDEX_TREASURY_ADDRESS not set - interface rewards will go to zero address!');
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
    
    // Build metadata with ClankDex branding
    const metadata = {
      description: creature.description || `${creature.name} - A ${creature.element}-type creature`,
      ...referrerAddress && { referrer: referrerAddress }, // Track referrer in metadata
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
      // Revenue split: 95% creator, 5% ClankDex treasury
      rewardsConfig: {
        creatorReward: CREATOR_REWARD_PERCENTAGE,
        creatorAdmin: creatorAddress as `0x${string}`,
        creatorRewardRecipient: creatorAddress as `0x${string}`,
        interfaceAdmin: CLANKDEX_TREASURY,
        interfaceRewardRecipient: CLANKDEX_TREASURY,
      },
    };

    // Deploy the token with Base builder attribution
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
    
    // Update creator streak (non-blocking)
    updateCreatorStreak(creatorAddress).catch(console.error);
    
    return NextResponse.json({
      success: true,
      tokenAddress: deployResult.address,
      txHash: result.txHash,
      symbol: finalSymbol,
      referrerAddress,
      config: {
        name: creature.name,
        symbol: finalSymbol,
        marketCap: '0.5',
        creator: creatorAddress,
      },
      rewards: {
        creatorPercentage: CREATOR_REWARD_PERCENTAGE,
        interfacePercentage: 100 - CREATOR_REWARD_PERCENTAGE,
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
