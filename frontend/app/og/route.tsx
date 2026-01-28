import { ImageResponse } from 'next/og';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #1e3a5f 100%)',
          position: 'relative',
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 'bold',
            color: '#DC0A2D',
            textShadow: '0 0 40px rgba(220, 10, 45, 0.5)',
            marginBottom: 20,
            display: 'flex',
          }}
        >
          CLANK
          <span style={{ color: '#FFDE00', marginLeft: 10 }}>DEX</span>
        </div>
        
        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: '#ffffff',
            opacity: 0.9,
            marginBottom: 40,
          }}
        >
          Wallet Pokedex with Evolution Tracking
        </div>
        
        {/* Feature badges */}
        <div
          style={{
            display: 'flex',
            gap: 20,
          }}
        >
          <div
            style={{
              background: 'rgba(220, 10, 45, 0.3)',
              border: '2px solid #DC0A2D',
              borderRadius: 12,
              padding: '12px 24px',
              color: '#fff',
              fontSize: 24,
            }}
          >
            🎮 Launch Tokens
          </div>
          <div
            style={{
              background: 'rgba(255, 222, 0, 0.3)',
              border: '2px solid #FFDE00',
              borderRadius: 12,
              padding: '12px 24px',
              color: '#fff',
              fontSize: 24,
            }}
          >
            ⚡ Evolve Creatures
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}
