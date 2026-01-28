import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/preview`, {
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
    console.error('Preview API error:', error);
    
    // Return mock data if backend is unavailable
    const { address } = await request.json().catch(() => ({ address: '0x0' }));
    
    return NextResponse.json({
      creature: {
        name: `Claudemon #${address.slice(-4)}`,
        species: 'Blockchain Beast',
        dna: '1234567890',
        element: 'Fire',
        level: 1,
        hp: 75,
        attack: 80,
        defense: 60,
        speed: 70,
        special: 65,
        description: 'A fiery creature born from blockchain transactions.',
        colorPalette: ['#FF5722', '#FF9800', '#FFC107'],
      },
      imageBase64: null,
    });
  }
}
