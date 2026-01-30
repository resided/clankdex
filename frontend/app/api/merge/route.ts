import { NextRequest, NextResponse } from 'next/server';
import { Clanker } from 'clanker-sdk/v4';

export const dynamic = 'force-dynamic';
import { createPublicClient, createWalletClient, http, PublicClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { Attribution } from 'ox/erc8021';
import { 
  getCreatureByAddress, 
  getNextEntryNumber, 
  recordMerge,
  updateCreatorStreak 
} from '@/lib/supabase';

const DATA_SUFFIX = Attribution.toDataSuffix({
  codes: ['bc_pung2696'],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      parent1Address, 
      parent2Address, 
      creatorAddress,
      newCreature,
      imageUrl 
    } = body;

    if (!parent1Address || !parent2Address || !creatorAddress || !newCreature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify both parent tokens exist and belong to creator
    const parent1 = await getCreatureByAddress(parent1Address);
    const parent2 = await getCreatureByAddress(parent2Address);

    if (!parent1 || !parent2) {
      return NextResponse.json(
        { error: 'One or both parent tokens not found' },
        { status: 404 }
      );
    }

    // Check if already merged
    if (parent1.is_merged || parent2.is_merged) {
      return NextResponse.json(
        { error: 'One or both tokens have already been merged' },
        { status: 400 }
      );
    }

    // Verify ownership
    if (
      parent1.creator_address?.toLowerCase() !== creatorAddress.toLowerCase() ||
      parent2.creator_address?.toLowerCase() !== creatorAddress.toLowerCase()
    ) {
      return NextResponse.json(
        { error: 'You can only merge tokens you created' },
        { status: 403 }
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

    // Generate symbol
    const symbol = newCreature.name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
    const finalSymbol = symbol.length >= 2 ? symbol : 'MRG';

    // Get next entry number
    const entryNumber = await getNextEntryNumber();

    // Build metadata with merge info
    const metadata = {
      description: `${newCreature.name} - A fusion of ${parent1.name} and ${parent2.name}`,
      parents: [parent1Address, parent2Address],
      merged: true,
    };

    // Token config
    const tokenConfig = {
      name: newCreature.name,
      symbol: finalSymbol,
      image: imageUrl || '',
      tokenAdmin: creatorAddress as `0x${string}`,
      metadata,
      context: {
        interface: 'ClankDex',
        platform: 'ClankDex',
      },
    };

    // Deploy merged token
    const result = await clanker.deploy(tokenConfig, {
      dataSuffix: DATA_SUFFIX,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    const deployResult = await result.waitForTransaction();

    if (deployResult.error) {
      throw new Error(deployResult.error.message);
    }

    // Record merge in database
    await recordMerge(
      deployResult.address!,
      parent1Address,
      parent2Address,
      creatorAddress,
      entryNumber
    );

    // Update streak
    await updateCreatorStreak(creatorAddress);

    return NextResponse.json({
      success: true,
      tokenAddress: deployResult.address,
      txHash: result.txHash,
      symbol: finalSymbol,
      entryNumber,
      parents: [parent1.name, parent2.name],
    });

  } catch (error) {
    console.error('Merge error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to merge tokens', 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}
