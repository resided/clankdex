import { NextRequest, NextResponse } from 'next/server';

interface PriceData {
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  source: string;
  lastUpdated: string;
}

// DexScreener API - Best for Base chain tokens
async function fetchFromDexScreener(tokenAddress: string): Promise<PriceData | null> {
  try {
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
      { next: { revalidate: 30 } } // Cache for 30 seconds
    );

    if (!response.ok) return null;

    const data = await response.json();
    const pair = data.pairs?.find((p: any) => p.chainId === 'base') || data.pairs?.[0];

    if (!pair) return null;

    return {
      price: parseFloat(pair.priceUsd) || 0,
      marketCap: pair.marketCap || pair.fdv || 0,
      volume24h: pair.volume?.h24 || 0,
      priceChange24h: pair.priceChange?.h24 || 0,
      source: 'dexscreener',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('DexScreener fetch error:', error);
    return null;
  }
}

// CoinGecko API - Good for established tokens
async function fetchFromCoinGecko(tokenAddress: string): Promise<PriceData | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/token_price/base?contract_addresses=${tokenAddress}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`,
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );

    if (!response.ok) return null;

    const data = await response.json();
    const tokenData = data[tokenAddress.toLowerCase()];

    if (!tokenData) return null;

    return {
      price: tokenData.usd || 0,
      marketCap: tokenData.usd_market_cap || 0,
      volume24h: tokenData.usd_24h_vol || 0,
      priceChange24h: tokenData.usd_24h_change || 0,
      source: 'coingecko',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('CoinGecko fetch error:', error);
    return null;
  }
}

// Clanker API - Direct from source
async function fetchFromClanker(tokenAddress: string): Promise<PriceData | null> {
  try {
    const response = await fetch(
      `https://www.clanker.world/api/tokens/${tokenAddress}`,
      { next: { revalidate: 30 } }
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (!data) return null;

    return {
      price: data.price || data.priceUsd || 0,
      marketCap: data.marketCap || data.market_cap || 0,
      volume24h: data.volume24h || data.volume || 0,
      priceChange24h: data.priceChange24h || 0,
      source: 'clanker',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Clanker fetch error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenAddress = searchParams.get('address');

  if (!tokenAddress) {
    return NextResponse.json({ error: 'Token address required' }, { status: 400 });
  }

  // Fetch from all sources in parallel
  const [dexScreener, coinGecko, clanker] = await Promise.all([
    fetchFromDexScreener(tokenAddress),
    fetchFromCoinGecko(tokenAddress),
    fetchFromClanker(tokenAddress),
  ]);

  // Priority: DexScreener > Clanker > CoinGecko (DexScreener is most reliable for Base)
  const priceData = dexScreener || clanker || coinGecko;

  if (!priceData) {
    return NextResponse.json({
      error: 'Price not found',
      sources: {
        dexscreener: !!dexScreener,
        clanker: !!clanker,
        coingecko: !!coinGecko,
      }
    }, { status: 404 });
  }

  // Return all available data for comparison
  return NextResponse.json({
    ...priceData,
    allSources: {
      dexscreener: dexScreener,
      clanker: clanker,
      coingecko: coinGecko,
    }
  });
}

// Batch endpoint for multiple tokens
export async function POST(request: NextRequest) {
  try {
    const { addresses } = await request.json();

    if (!addresses || !Array.isArray(addresses)) {
      return NextResponse.json({ error: 'Addresses array required' }, { status: 400 });
    }

    // Limit to 10 tokens per request
    const limitedAddresses = addresses.slice(0, 10);

    const results = await Promise.all(
      limitedAddresses.map(async (address: string) => {
        const [dexScreener, clanker] = await Promise.all([
          fetchFromDexScreener(address),
          fetchFromClanker(address),
        ]);

        return {
          address,
          data: dexScreener || clanker || null,
        };
      })
    );

    const priceMap: Record<string, PriceData | null> = {};
    results.forEach(({ address, data }) => {
      priceMap[address.toLowerCase()] = data;
    });

    return NextResponse.json({ prices: priceMap });
  } catch (error) {
    console.error('Batch price fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}
