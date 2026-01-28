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
        {/* Background gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, rgba(220, 10, 45, 0.15) 0%, transparent 70%)',
          }}
        />
        
        {/* Main Logo Container */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {/* Logo Row with Zap Icons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 24,
            }}
          >
            {/* Left Zap Icon */}
            <div style={{ display: 'flex' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="#FFDE00">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            
            {/* Logo Text */}
            <div
              style={{
                display: 'flex',
                fontSize: 96,
                fontWeight: 900,
                textShadow: '0 0 40px rgba(220, 10, 45, 0.5), 4px 4px 0px rgba(0,0,0,0.5)',
                letterSpacing: '-2px',
              }}
            >
              <span style={{ color: '#DC0A2D' }}>CLANK</span>
              <span style={{ color: '#FFDE00' }}>DEX</span>
            </div>
            
            {/* Right Zap Icon */}
            <div style={{ display: 'flex' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="#FFDE00">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
          </div>
          
          {/* Tagline */}
          <div
            style={{
              display: 'flex',
              fontSize: 32,
              color: '#D1D5DB',
              marginTop: 24,
              textAlign: 'center',
              textShadow: '2px 2px 0px rgba(0,0,0,0.5)',
            }}
          >
            <span>Clankdex powered by </span>
            <span style={{ color: '#FFDE00', fontWeight: 'bold' }}>Clanker</span>
          </div>
          
          {/* Feature badges */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              marginTop: 48,
            }}
          >
            <div
              style={{
                background: 'rgba(220, 10, 45, 0.3)',
                border: '3px solid #DC0A2D',
                borderRadius: 12,
                padding: '16px 28px',
                color: '#fff',
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontWeight: 'bold',
                textShadow: '1px 1px 0px rgba(0,0,0,0.5)',
              }}
            >
              <span>🎮</span>
              <span>Launch Tokens</span>
            </div>
            <div
              style={{
                background: 'rgba(255, 222, 0, 0.2)',
                border: '3px solid #FFDE00',
                borderRadius: 12,
                padding: '16px 28px',
                color: '#fff',
                fontSize: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontWeight: 'bold',
                textShadow: '1px 1px 0px rgba(0,0,0,0.5)',
              }}
            >
              <span>⚡</span>
              <span>Evolve Creatures</span>
            </div>
          </div>
        </div>
        
        {/* Corner accents */}
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: 24,
            width: 60,
            height: 60,
            borderLeft: '4px solid #DC0A2D',
            borderTop: '4px solid #DC0A2D',
            borderTopLeftRadius: 12,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            width: 60,
            height: 60,
            borderRight: '4px solid #DC0A2D',
            borderTop: '4px solid #DC0A2D',
            borderTopRightRadius: 12,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 24,
            width: 60,
            height: 60,
            borderLeft: '4px solid #DC0A2D',
            borderBottom: '4px solid #DC0A2D',
            borderBottomLeftRadius: 12,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 24,
            width: 60,
            height: 60,
            borderRight: '4px solid #DC0A2D',
            borderBottom: '4px solid #DC0A2D',
            borderBottomRightRadius: 12,
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
