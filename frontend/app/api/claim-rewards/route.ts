import { NextRequest, NextResponse } from 'next/server';
import { Clanker } from 'clanker-sdk/v4';
import { createPublicClient, createWalletClient, http, PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

// ============================================
// CLAIM REWARDS - Anyone can trigger, rewards go to correct wallets
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

    // Check for private key (any wallet can trigger claim)
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

    // Claim rewards - anyone can trigger, but rewards go to:
    // - Creator rewards → Creator wallet
    // - Interface rewards → Interface/deployer wallet
    const result = await clanker.claimRewards({
      token: tokenAddress as `0x${string}`,
      rewardRecipient: rewardRecipient as `0x${string}`,
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    return NextResponse.json({
      success: true,
      txHash: result.txHash,
      message: 'Rewards claimed successfully!',
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

    // Initialize Clanker SDK (no wallet needed for view functions)
    const clanker = new Clanker({ publicClient });

    // Check available rewards
    const availableRewards = await clanker.availableRewards({
      token: tokenAddress as `0x${string}`,
      rewardRecipient: rewardRecipient as `0x${string}`,
    });
    
    return NextResponse.json({
      tokenAddress,
      rewardRecipient,
      availableRewards: availableRewards.toString(),
      availableRewardsEth: (Number(availableRewards) / 1e18).toFixed(6),
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
