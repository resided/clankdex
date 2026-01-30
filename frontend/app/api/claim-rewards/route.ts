import { NextRequest, NextResponse } from 'next/server';
import { Clanker } from 'clanker-sdk/v4';
import { createPublicClient, createWalletClient, http, PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { getCreatureByAddress } from '@/lib/supabase';

// ============================================
// CLAIM REWARDS - With Referral Split
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenAddress, rewardRecipient } = body;
    
    if (!tokenAddress || !rewardRecipient) {
      return NextResponse.json(
        { error: 'Missing tokenAddress or rewardRecipient' },
        { status: 400 }
      );
    }

    // Check for private key
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Private key not configured' },
        { status: 500 }
      );
    }
    
    // Setup wallet
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

    // Get token data to check for referrer
    const creature = await getCreatureByAddress(tokenAddress);
    
    // Claim rewards
    const result = await clanker.claimRewards({
      token: tokenAddress as `0x${string}`,
      rewardRecipient: rewardRecipient as `0x${string}`,
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    // If there's a referrer, we'd ideally split here
    // But Clanker SDK sends rewards to token admin automatically
    // So we track referrer in metadata and let them claim separately
    // or do a second transfer if needed
    
    return NextResponse.json({
      success: true,
      txHash: result.txHash,
      message: 'Rewards claimed successfully!',
      referrer: creature?.referrer_address || null,
    });
    
  } catch (error) {
    console.error('Claim rewards error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to claim rewards', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

// GET available rewards for a token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenAddress = searchParams.get('token');
    const rewardRecipient = searchParams.get('recipient');
    
    if (!tokenAddress || !rewardRecipient) {
      return NextResponse.json(
        { error: 'Missing token or recipient' },
        { status: 400 }
      );
    }

    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    }) as PublicClient;

    const clanker = new Clanker({ publicClient });

    // Check available rewards
    const availableRewards = await clanker.availableRewards({
      token: tokenAddress as `0x${string}`,
      rewardRecipient: rewardRecipient as `0x${string}`,
    });
    
    // Get creature data to show referrer info
    const creature = await getCreatureByAddress(tokenAddress);
    
    return NextResponse.json({
      tokenAddress,
      rewardRecipient,
      availableRewards: availableRewards.toString(),
      availableRewardsEth: (Number(availableRewards) / 1e18).toFixed(6),
      hasReferrer: !!creature?.referrer_address,
      referrer: creature?.referrer_address || null,
    });
    
  } catch (error) {
    console.error('Get rewards error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get rewards', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
