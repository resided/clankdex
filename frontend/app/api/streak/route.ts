import { NextRequest, NextResponse } from 'next/server';
import { getCreatorStreak } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const creatorAddress = searchParams.get('creator');
    
    if (!creatorAddress) {
      return NextResponse.json(
        { error: 'Missing creator address' },
        { status: 400 }
      );
    }

    const streak = await getCreatorStreak(creatorAddress);

    if (!streak) {
      return NextResponse.json({
        creatorAddress,
        current_streak: 0,
        longest_streak: 0,
        total_launches: 0,
        tier: 'novice',
        isNew: true,
      });
    }

    // Calculate if streak is still active
    const lastLaunch = new Date(streak.last_launch_date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isActive = 
      lastLaunch.toISOString().split('T')[0] === today.toISOString().split('T')[0] ||
      lastLaunch.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0];

    return NextResponse.json({
      ...streak,
      isActive,
    });
  } catch (error) {
    console.error('Get streak error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
