import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

// Server-side Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Verify token exists on-chain
async function verifyTokenOnChain(tokenAddress: string): Promise<boolean> {
  try {
    const publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });
    
    const code = await publicClient.getBytecode({ address: tokenAddress as `0x${string}` });
    return code !== undefined && code !== '0x';
  } catch (error) {
    console.error('On-chain verification failed:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if service role key is configured
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      token_address,
      token_symbol,
      name,
      archetype,
      description,
      creator_address,
      farcaster_username,
      image_url,
      // Other fields
      referrer_address,
      is_merged,
      parent_tokens,
    } = body;

    // Validate required fields
    if (!token_address || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify token on-chain
    const isVerified = await verifyTokenOnChain(token_address);
    
    if (!isVerified) {
      return NextResponse.json(
        { error: 'Token not found on-chain' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get next entry number
    const { data: lastEntry, error: countError } = await supabase
      .from('creatures')
      .select('entry_number')
      .order('entry_number', { ascending: false })
      .limit(1)
      .single();

    if (countError && countError.code !== 'PGRST116') {
      console.error('Error getting last entry:', countError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    const entryNumber = lastEntry ? lastEntry.entry_number + 1 : 1;

    // Check if token already exists
    const { data: existing } = await supabase
      .from('creatures')
      .select('id')
      .eq('token_address', token_address.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Token already registered' },
        { status: 409 }
      );
    }

    // Insert creature record
    const { data, error } = await supabase
      .from('creatures')
      .insert({
        entry_number: entryNumber,
        token_address: token_address.toLowerCase(),
        token_symbol: token_symbol || name.slice(0, 6).toUpperCase(),
        name,
        archetype: archetype || 'BUILDER',
        description,
        creator_address: creator_address?.toLowerCase(),
        farcaster_username,
        image_url,
        verified: true,
        // Other fields
        referrer_address: referrer_address?.toLowerCase(),
        is_merged: is_merged || false,
        parent_tokens: parent_tokens || [],
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save creature' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      creature: data,
    });

  } catch (error) {
    console.error('Save creature error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
