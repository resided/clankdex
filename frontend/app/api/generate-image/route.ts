import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Backend request failed');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Generate image API error:', error);
    
    // Return mock data if backend is unavailable
    return NextResponse.json({
      imageUrl: 'https://placehold.co/256x256/DC0A2D/FFFFFF/png?text=Claudex',
      metadataUrl: 'https://claudex.io/metadata/mock.json',
      metadata: {
        name: 'Mock Creature',
        description: 'A placeholder creature',
        image: 'https://placehold.co/256x256',
      },
    });
  }
}
