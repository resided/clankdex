import { NextRequest, NextResponse } from 'next/server';
import { voteForToken } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenAddress, entryNumber } = body;

    if (!tokenAddress || !entryNumber) {
      return NextResponse.json(
        { error: 'Missing tokenAddress or entryNumber' },
        { status: 400 }
      );
    }

    const success = await voteForToken(tokenAddress, entryNumber);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to record vote' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
