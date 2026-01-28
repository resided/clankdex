// Clanker Service - Handles token deployment via Clanker SDK
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import dotenv from 'dotenv';

dotenv.config();

// Chain configuration
const chain = process.env.NETWORK === 'mainnet' ? base : baseSepolia;
const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';

class ClankerService {
  constructor() {
    this.clanker = null;
    this.publicClient = null;
    this.initialized = false;
    this.simulate = process.env.SIMULATE_DEPLOY === 'true';
  }

  async initialize() {
    if (this.initialized) return;

    if (this.simulate) {
      console.log('🔮 Simulation mode enabled - no real deployments');
      this.initialized = true;
      return;
    }

    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY not set');
    }

    try {
      const { Clanker } = await import('clanker-sdk');
      
      const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);

      this.publicClient = createPublicClient({
        chain,
        transport: http(RPC_URL),
      });

      const wallet = createWalletClient({
        account,
        chain,
        transport: http(RPC_URL),
      });

      this.clanker = new Clanker({
        wallet,
        publicClient: this.publicClient,
      });

      this.initialized = true;
      console.log('✅ Clanker SDK initialized');
    } catch (error) {
      console.warn('⚠️ Clanker SDK initialization failed, falling back to simulation:', error.message);
      this.simulate = true;
      this.initialized = true;
    }
  }

  /**
   * Deploy a creature token via Clanker
   */
  async deployCreatureToken(creature, creatorAddress) {
    await this.initialize();

    console.log(`🚀 Deploying ${creature.name} via Clanker...`);

    // Build token configuration
    const tokenConfig = {
      name: creature.name,
      symbol: this.generateSymbol(creature),
      image: creature.imageURI || 'ipfs://default',
      metadata: {
        description: creature.description,
        socialMediaUrls: [
          { platform: 'website', url: `https://claudex.io/creature/${creature.dna}` },
        ],
      },
      context: {
        interface: 'Claudex',
        platform: 'Claudex',
        messageId: `claudex-${creature.dna}`,
        id: creature.dna.toString().slice(0, 10),
      },
      pool: {
        quoteToken: '0x4200000000000000000000000000000000000006', // WETH
        initialMarketCap: this.calculateInitialMarketCap(creature),
      },
      vault: {
        percentage: 5,
        durationInDays: 30,
      },
      devBuy: {
        ethAmount: 0,
      },
      rewardsConfig: {
        creatorReward: 70,
        creatorAdmin: creatorAddress,
        creatorRewardRecipient: creatorAddress,
        interfaceAdmin: process.env.CLADEX_ADMIN || creatorAddress,
        interfaceRewardRecipient: process.env.CLADEX_RECIPIENT || creatorAddress,
      },
    };

    if (this.simulate) {
      return this.simulateDeploy(creature, creatorAddress, tokenConfig);
    }

    try {
      const tokenAddress = await this.clanker.deployToken(tokenConfig);
      console.log(`✅ Token deployed: ${tokenAddress}`);

      return {
        tokenAddress,
        config: tokenConfig,
      };
    } catch (error) {
      console.error('Clanker deployment error:', error);
      throw error;
    }
  }

  /**
   * Simulate deployment
   */
  async simulateDeploy(creature, creatorAddress, config) {
    console.log('🔮 Simulating Clanker deployment...');
    console.log('Config:', JSON.stringify(config, null, 2));

    // Generate mock address
    const mockAddress = '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');

    return {
      tokenAddress: mockAddress,
      config: {
        symbol: config.symbol,
        marketCap: config.pool.initialMarketCap,
      },
      simulated: true,
    };
  }

  generateSymbol(creature) {
    const elementPrefix = creature.element.slice(0, 2).toUpperCase();
    const speciesSuffix = creature.species.slice(0, 3).toUpperCase();
    return `${elementPrefix}${speciesSuffix}`;
  }

  calculateInitialMarketCap(creature) {
    let marketCap = 5;
    const totalStats = creature.hp + creature.attack + creature.defense + creature.speed + creature.special;
    const statBoost = (totalStats / 500) * 5;
    const rareElements = ['Dragon', 'Psychic', 'Ice'];
    const rarityBoost = rareElements.includes(creature.element) ? 2 : 0;

    return (marketCap + statBoost + rarityBoost).toFixed(2);
  }

  async getTokenInfo(tokenAddress) {
    if (!this.publicClient) return null;

    try {
      const [name, symbol, totalSupply] = await Promise.all([
        this.publicClient.readContract({
          address: tokenAddress,
          abi: [{ name: 'name', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' }],
          functionName: 'name',
        }),
        this.publicClient.readContract({
          address: tokenAddress,
          abi: [{ name: 'symbol', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' }],
          functionName: 'symbol',
        }),
        this.publicClient.readContract({
          address: tokenAddress,
          abi: [{ name: 'totalSupply', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }],
          functionName: 'totalSupply',
        }),
      ]);

      return { name, symbol, totalSupply: totalSupply.toString() };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }
}

export default new ClankerService();
