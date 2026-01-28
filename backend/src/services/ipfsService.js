import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class IPFSService {
  constructor() {
    this.usePinata = !!process.env.PINATA_JWT;
    if (this.usePinata) {
      import('pinata-web3').then(({ PinataSDK }) => {
        this.pinata = new PinataSDK({
          pinataJwt: process.env.PINATA_JWT,
          pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud',
        });
      });
    }
  }

  async uploadImage(imageBuffer, creatureName) {
    try {
      if (this.usePinata && this.pinata) {
        // Create temporary file
        const tempFile = path.join('/tmp', `${creatureName.replace(/\s+/g, '_')}.png`);
        fs.writeFileSync(tempFile, imageBuffer);

        // Upload to Pinata
        const file = new File([fs.readFileSync(tempFile)], `${creatureName}.png`, { type: 'image/png' });
        const upload = await this.pinata.upload.file(file);

        // Clean up temp file
        fs.unlinkSync(tempFile);

        console.log(`📤 Image uploaded to IPFS: ${upload.cid}`);
        return `ipfs://${upload.cid}`;
      }
      
      // Fallback: return data URI for demo/testing
      const base64 = imageBuffer.toString('base64');
      console.log('📤 Using data URI fallback (set PINATA_JWT for real IPFS)');
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error('IPFS upload error:', error);
      const base64 = imageBuffer.toString('base64');
      return `data:image/png;base64,${base64}`;
    }
  }

  async uploadMetadata(metadata, creatureName) {
    try {
      if (this.usePinata && this.pinata) {
        const upload = await this.pinata.upload.json(metadata);
        console.log(`📤 Metadata uploaded to IPFS: ${upload.cid}`);
        return `ipfs://${upload.cid}`;
      }
      
      // Fallback for testing
      console.log('📤 Using mock metadata URL (set PINATA_JWT for real IPFS)');
      return `https://claudex.io/metadata/${creatureName}.json`;
    } catch (error) {
      console.error('Metadata upload error:', error);
      return `https://claudex.io/metadata/${creatureName}.json`;
    }
  }
}

export default new IPFSService();
