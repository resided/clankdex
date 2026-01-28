import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { isAddress } from 'viem';

import walletAnalyzer from './services/walletAnalyzer.js';
import creatureGenerator from './services/creatureGenerator.js';
import ipfsService from './services/ipfsService.js';
import clankerService from './services/clankerService.js';
import neynarService from './services/neynarService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'clankdex-backend',
    version: '2.1.0-neynar',
    neynar: neynarService.enabled ? 'enabled' : 'disabled',
    clanker: 'enabled'
  });
});

// ============================================
// WALLET ENDPOINTS (Original)
// ============================================

// Analyze wallet and generate creature data
app.post('/api/analyze', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address || !isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    console.log(`🔍 Analyzing wallet: ${address}`);
    
    const walletData = await walletAnalyzer.analyze(address);
    const creature = creatureGenerator.generateCreature(address, walletData);
    
    res.json({
      address,
      walletData,
      creature,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// FARCASTER/NEYNAR ENDPOINTS (New)
// ============================================

// Analyze Farcaster user by username or FID
app.post('/api/analyze-farcaster', async (req, res) => {
  try {
    const { identifier } = req.body; // Can be username (@clanker) or FID (12345)
    
    if (!identifier) {
      return res.status(400).json({ error: 'Username or FID required' });
    }
    
    console.log(`🔵 Analyzing Farcaster user: ${identifier}`);
    
    // Get Farcaster data from Neynar
    const farcasterData = await neynarService.analyzeUser(identifier);
    
    // Convert Farcaster data to wallet-like format for creature generation
    const walletLikeData = convertFarcasterToWalletData(farcasterData);
    
    // Use custody address or first verified address for creature generation
    const address = farcasterData.verifiedAddresses[0] || farcasterData.custodyAddress;
    
    // Generate creature
    const creature = creatureGenerator.generateCreature(address, walletLikeData);
    
    // Customize creature based on Farcaster personality
    customizeCreatureForFarcaster(creature, farcasterData);
    
    res.json({
      type: 'farcaster',
      identifier,
      farcasterData,
      creature,
    });
  } catch (error) {
    console.error('Farcaster analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Farcaster preview (without IPFS upload)
app.post('/api/preview-farcaster', async (req, res) => {
  try {
    const { identifier } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ error: 'Username or FID required' });
    }
    
    console.log(`🔵 Previewing Farcaster user: ${identifier}`);
    
    const farcasterData = await neynarService.analyzeUser(identifier);
    const walletLikeData = convertFarcasterToWalletData(farcasterData);
    const address = farcasterData.verifiedAddresses[0] || farcasterData.custodyAddress;
    
    const creature = creatureGenerator.generateCreature(address, walletLikeData);
    customizeCreatureForFarcaster(creature, farcasterData);
    
    // Generate image
    const imageBuffer = await creatureGenerator.generatePixelArt(creature);
    const imageBase64 = imageBuffer.toString('base64');
    
    res.json({
      type: 'farcaster',
      identifier,
      farcasterData,
      creature,
      imageBase64: `data:image/png;base64,${imageBase64}`,
    });
  } catch (error) {
    console.error('Farcaster preview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Launch creature from Farcaster user
app.post('/api/deploy-farcaster', async (req, res) => {
  try {
    const { identifier, useVerifiedAddress = true } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ error: 'Username or FID required' });
    }
    
    console.log(`🚀 Deploying creature for Farcaster: ${identifier}`);
    
    // Get user data
    const farcasterData = await neynarService.analyzeUser(identifier);
    const address = useVerifiedAddress && farcasterData.verifiedAddresses[0] 
      ? farcasterData.verifiedAddresses[0]
      : farcasterData.custodyAddress;
    
    // Generate creature
    const walletLikeData = convertFarcasterToWalletData(farcasterData);
    const creature = creatureGenerator.generateCreature(address, walletLikeData);
    customizeCreatureForFarcaster(creature, farcasterData);
    
    // Generate image and upload
    const imageBuffer = await creatureGenerator.generatePixelArt(creature);
    const imageUrl = await ipfsService.uploadImage(imageBuffer, creature.name);
    creature.imageURI = imageUrl;
    
    // Deploy via Clanker
    const result = await clankerService.deployCreatureToken(creature, address);
    
    res.json({
      success: true,
      type: 'farcaster',
      identifier,
      farcasterData: {
        fid: farcasterData.fid,
        username: farcasterData.username,
        displayName: farcasterData.displayName,
      },
      tokenAddress: result.tokenAddress,
      creatorAddress: address,
      config: result.config,
      simulated: result.simulated || false,
      creature,
    });
  } catch (error) {
    console.error('Farcaster deploy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Combined endpoint: username → analyze → deploy
app.post('/api/summon-farcaster', async (req, res) => {
  try {
    const { identifier, useVerifiedAddress = true } = req.body;
    
    if (!identifier) {
      return res.status(400).json({ error: 'Username or FID required' });
    }
    
    console.log(`✨ Summoning Farcaster creature for: ${identifier}`);
    
    // Step 1: Analyze
    const farcasterData = await neynarService.analyzeUser(identifier);
    const address = useVerifiedAddress && farcasterData.verifiedAddresses[0]
      ? farcasterData.verifiedAddresses[0]
      : farcasterData.custodyAddress;
    
    // Step 2: Generate creature
    const walletLikeData = convertFarcasterToWalletData(farcasterData);
    const creature = creatureGenerator.generateCreature(address, walletLikeData);
    customizeCreatureForFarcaster(creature, farcasterData);
    
    // Step 3: Generate image
    const imageBuffer = await creatureGenerator.generatePixelArt(creature);
    const imageUrl = await ipfsService.uploadImage(imageBuffer, creature.name);
    creature.imageURI = imageUrl;
    
    // Step 4: Deploy via Clanker
    const deployResult = await clankerService.deployCreatureToken(creature, address);
    
    res.json({
      success: true,
      type: 'farcaster',
      identifier,
      farcasterData: {
        fid: farcasterData.fid,
        username: farcasterData.username,
        displayName: farcasterData.displayName,
        pfpUrl: farcasterData.pfpUrl,
      },
      tokenAddress: deployResult.tokenAddress,
      creatorAddress: address,
      config: deployResult.config,
      simulated: deployResult.simulated || false,
      creature,
    });
  } catch (error) {
    console.error('Summon error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper: Convert Farcaster data to wallet-like format
function convertFarcasterToWalletData(farcasterData) {
  return {
    address: farcasterData.custodyAddress,
    balance: '0', // We don't have their balance
    transactionCount: farcasterData.castCount || 0,
    activityScore: Math.min(
      (farcasterData.engagement?.avgEngagement || 0) * 5 + 
      (farcasterData.followerCount || 0) / 100,
      100
    ),
    archetype: farcasterData.archetype || 'Farcaster Explorer',
    riskProfile: 'Social',
    dna: farcasterData.dna,
    // Farcaster-specific data
    farcaster: {
      followerCount: farcasterData.followerCount,
      followingCount: farcasterData.followingCount,
      castCount: farcasterData.castCount,
      personality: farcasterData.personality?.dominant,
      engagement: farcasterData.engagement,
    }
  };
}

// Helper: Customize creature based on Farcaster data
function customizeCreatureForFarcaster(creature, farcasterData) {
  // Add username to creature name
  creature.name = `${creature.species} #${farcasterData.username}`;
  
  // Modify description to include Farcaster context
  creature.description = `${creature.description} Born from the casts of @${farcasterData.username}, a ${farcasterData.archetype.toLowerCase()} on Farcaster with ${farcasterData.followerCount} followers.`;
  
  // Boost stats based on Farcaster activity
  const boost = Math.min((farcasterData.followerCount || 0) / 100, 20);
  creature.hp = Math.min(creature.hp + Math.floor(boost), 100);
  creature.special = Math.min(creature.special + Math.floor(boost * 1.5), 100);
  
  // Personality-based element modification
  const personality = farcasterData.personality?.dominant;
  if (personality === 'degen' && creature.element !== 'Fire') {
    // Degen personality gets Fire element chance
    if (Math.random() > 0.5) creature.element = 'Fire';
  }
  if (personality === 'builder' && creature.element !== 'Electric') {
    // Builders get Electric
    if (Math.random() > 0.5) creature.element = 'Electric';
  }
  
  return creature;
}

// ============================================
// SHARED ENDPOINTS
// ============================================

// Generate creature image
app.post('/api/generate-image', async (req, res) => {
  try {
    const { creature } = req.body;
    
    if (!creature) {
      return res.status(400).json({ error: 'Creature data required' });
    }
    
    console.log(`🎨 Generating image for: ${creature.name}`);
    
    const imageBuffer = await creatureGenerator.generatePixelArt(creature);
    const imageUrl = await ipfsService.uploadImage(imageBuffer, creature.name);
    
    const metadata = {
      name: creature.name,
      description: creature.description,
      image: imageUrl,
      attributes: [
        { trait_type: 'Element', value: creature.element },
        { trait_type: 'Species', value: creature.species },
        { trait_type: 'Level', value: creature.level, display_type: 'number' },
        { trait_type: 'HP', value: creature.hp, display_type: 'number' },
        { trait_type: 'Attack', value: creature.attack, display_type: 'number' },
        { trait_type: 'Defense', value: creature.defense, display_type: 'number' },
        { trait_type: 'Speed', value: creature.speed, display_type: 'number' },
        { trait_type: 'Special', value: creature.special, display_type: 'number' },
        { trait_type: 'DNA', value: creature.dna.toString() },
      ],
    };
    
    const metadataUrl = await ipfsService.uploadMetadata(metadata, creature.name);
    
    res.json({
      imageUrl,
      metadataUrl,
      metadata,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deploy creature
app.post('/api/deploy', async (req, res) => {
  try {
    const { creature, creatorAddress, simulate } = req.body;
    
    if (!creature || !creatorAddress) {
      return res.status(400).json({ error: 'Creature and creatorAddress required' });
    }
    
    if (!isAddress(creatorAddress)) {
      return res.status(400).json({ error: 'Invalid creator address' });
    }
    
    console.log(`🚀 Deploying ${creature.name} for ${creatorAddress}`);
    
    if (!creature.imageURI) {
      const imageBuffer = await creatureGenerator.generatePixelArt(creature);
      const imageUrl = await ipfsService.uploadImage(imageBuffer, creature.name);
      creature.imageURI = imageUrl;
    }
    
    const result = await clankerService.deployCreatureToken(creature, creatorAddress);
    
    res.json({
      success: true,
      tokenAddress: result.tokenAddress,
      config: result.config,
      simulated: result.simulated || false,
      creature: {
        ...creature,
        tokenAddress: result.tokenAddress,
      },
    });
  } catch (error) {
    console.error('Deployment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get wallet preview
app.post('/api/preview', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address || !isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    const walletData = await walletAnalyzer.analyze(address);
    const creature = creatureGenerator.generateCreature(address, walletData);
    
    const imageBuffer = await creatureGenerator.generatePixelArt(creature);
    const imageBase64 = imageBuffer.toString('base64');
    
    res.json({
      creature,
      imageBase64: `data:image/png;base64,${imageBase64}`,
      walletData,
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Clanker token info
app.get('/api/token/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    const info = await clankerService.getTokenInfo(address);
    
    if (!info) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    res.json(info);
  } catch (error) {
    console.error('Token info error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get elements
app.get('/api/elements', (req, res) => {
  const elements = [
    { id: 'fire', name: 'Fire', color: '#FF5722', icon: '🔥', rarity: 'common' },
    { id: 'water', name: 'Water', color: '#2196F3', icon: '💧', rarity: 'common' },
    { id: 'grass', name: 'Grass', color: '#4CAF50', icon: '🌿', rarity: 'common' },
    { id: 'electric', name: 'Electric', color: '#FFEB3B', icon: '⚡', rarity: 'uncommon' },
    { id: 'ice', name: 'Ice', color: '#00BCD4', icon: '❄️', rarity: 'rare' },
    { id: 'fighting', name: 'Fighting', color: '#795548', icon: '👊', rarity: 'common' },
    { id: 'poison', name: 'Poison', color: '#9C27B0', icon: '☠️', rarity: 'uncommon' },
    { id: 'ground', name: 'Ground', color: '#8D6E63', icon: '🌍', rarity: 'common' },
    { id: 'flying', name: 'Flying', color: '#90CAF9', icon: '🦅', rarity: 'uncommon' },
    { id: 'psychic', name: 'Psychic', color: '#E91E63', icon: '🔮', rarity: 'rare' },
    { id: 'bug', name: 'Bug', color: '#8BC34A', icon: '🐛', rarity: 'common' },
    { id: 'dragon', name: 'Dragon', color: '#673AB7', icon: '🐲', rarity: 'legendary' },
  ];
  
  res.json({ elements });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎮 Clankdex Backend v2.1 running on port ${PORT}`);
  console.log(`🔗 Clanker integration: enabled`);
  console.log(`🔵 Neynar API: ${neynarService.enabled ? 'enabled' : 'disabled'}`);
  console.log(`🌐 Network: ${process.env.NETWORK || 'sepolia'}`);
});
