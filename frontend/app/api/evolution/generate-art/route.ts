import { NextRequest, NextResponse } from 'next/server';
import { generateEvolutionNFT } from '@/services/evolution-art-generator';

export async function POST(request: NextRequest) {
  try {
    const { creature, clankerToken } = await request.json();

    if (!creature || !clankerToken) {
      return NextResponse.json(
        { error: 'Missing creature or clankerToken' },
        { status: 400 }
      );
    }

    const result = await generateEvolutionNFT(creature, clankerToken, {
      onProgress: (step, progress) => {
        console.log(`[${progress}%] ${step}`);
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Art generation failed:', error);
    return NextResponse.json(
      { error: 'Art generation failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export const maxDuration = 300; // 5 minutes for 7 image generations
