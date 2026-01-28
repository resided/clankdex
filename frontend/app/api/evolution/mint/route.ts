import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const CONTRACT_ABI = [
  "function mint(address to, address clankerToken, string calldata creatureName) external returns (uint256)"
];

export async function POST(request: NextRequest) {
  try {
    const { to, clankerToken, creatureName, tierIPFS } = await request.json();

    if (!to || !clankerToken || !creatureName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const signer = new ethers.Wallet(process.env.MINTER_PRIVATE_KEY!, provider);
    
    const contract = new ethers.Contract(
      process.env.EVOLUTION_CONTRACT_ADDRESS!,
      CONTRACT_ABI,
      signer
    );

    const tx = await contract.mint(to, clankerToken, creatureName);
    const receipt = await tx.wait();

    return NextResponse.json({
      success: true,
      txHash: receipt.hash,
      tokenId: receipt.events?.[0]?.args?.tokenId?.toString()
    });
  } catch (error) {
    console.error('Mint failed:', error);
    return NextResponse.json(
      { error: 'Mint failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
