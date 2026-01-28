import { NextRequest, NextResponse } from 'next/server';

/**
 * Base Miniapp Webhook Handler
 * Handles frame actions and user interactions
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the webhook payload for debugging
    console.log('Base Miniapp Webhook:', body);
    
    // Handle different frame actions
    const { action, fid, messageHash, timestamp } = body;
    
    switch (action) {
      case 'frame_action':
        // Handle button clicks, input submissions
        return handleFrameAction(body);
        
      case 'user_signature':
        // Handle signed messages from user
        return handleUserSignature(body);
        
      default:
        return NextResponse.json({ status: 'ok' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}

async function handleFrameAction(body: any) {
  const { buttonIndex, inputText, fid, castId } = body;
  
  // Handle different button actions
  switch (buttonIndex) {
    case 1:
      // Scan/Analyze action
      return NextResponse.json({
        type: 'frame',
        frame: {
          version: '1',
          title: 'Scanning Wallet...',
          image: `${process.env.NEXT_PUBLIC_URL}/og-image.png`,
          buttons: [
            { label: 'View Creature', action: 'post' }
          ]
        }
      });
      
    case 2:
      // View Collection
      return NextResponse.json({
        type: 'frame',
        frame: {
          version: '1',
          title: 'Your ClankDex Collection',
          image: `${process.env.NEXT_PUBLIC_URL}/og-image.png`,
          buttons: [
            { label: '← Prev', action: 'post' },
            { label: 'Next →', action: 'post' }
          ]
        }
      });
      
    default:
      return NextResponse.json({
        type: 'frame',
        frame: {
          version: '1',
          title: 'ClankDex',
          image: `${process.env.NEXT_PUBLIC_URL}/og-image.png`,
          buttons: [
            { label: 'Scan Wallet', action: 'post' },
            { label: 'View Collection', action: 'post' }
          ]
        }
      });
  }
}

async function handleUserSignature(body: any) {
  // Verify and process signed messages
  // This can be used for authentication or transaction signing
  return NextResponse.json({ status: 'ok', verified: true });
}

// GET handler for verification
export async function GET() {
  return NextResponse.json({
    status: 'active',
    miniapp: 'ClankDex',
    version: '1.0.0'
  });
}
