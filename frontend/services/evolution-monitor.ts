/**
 * Evolution Monitor Service
 * Monitors Clanker token market caps and triggers NFT evolution
 */

import { ethers } from 'ethers';

interface EvolutionNFT {
  tokenId: string;
  clankerToken: string;
  currentTier: number;
  highestMarketCap: number;
}

interface PriceData {
  priceUsd: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
}

// Contract ABIs (minimal)
const EVOLUTION_ABI = [
  "function checkAndEvolve(uint256 tokenId, uint256 currentMarketCap)",
  "function batchEvolve(uint256[] calldata tokenIds, uint256[] calldata marketCaps)",
  "function getEvolutionData(uint256 tokenId) view returns (tuple(uint8 currentTier, uint256 lastEvolveTime, uint256 highestMarketCap, address clankerToken, uint256 createdAt))",
  "function totalSupply() view returns (uint256)",
  "function tokenByIndex(uint256 index) view returns (uint256)",
  "event Evolved(uint256 indexed tokenId, uint8 newTier, uint256 marketCap, uint256 timestamp)"
];

export class EvolutionMonitor {
  private provider: ethers.Provider;
  private signer: ethers.Signer;
  private evolutionContract: ethers.Contract;
  private isRunning: boolean = false;
  private checkInterval: number = 300000; // 5 minutes
  private timer: NodeJS.Timeout | null = null;

  constructor(
    rpcUrl: string,
    privateKey: string,
    evolutionContractAddress: string
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.evolutionContract = new ethers.Contract(
      evolutionContractAddress,
      EVOLUTION_ABI,
      this.signer
    );
  }

  /**
   * Fetch market cap from DexScreener
   */
  async fetchMarketCap(tokenAddress: string): Promise<PriceData | null> {
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
        { cache: 'no-store' }
      );
      
      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`);
      }
      
      const data = await response.json();
      const pair = data.pairs?.find((p: any) => p.chainId === 'base') || data.pairs?.[0];
      
      if (!pair) {
        return null;
      }

      return {
        priceUsd: parseFloat(pair.priceUsd) || 0,
        marketCap: pair.marketCap || pair.fdv || 0,
        volume24h: pair.volume?.h24 || 0,
        priceChange24h: pair.priceChange?.h24 || 0
      };
    } catch (error) {
      console.error(`Failed to fetch market cap for ${tokenAddress}:`, error);
      return null;
    }
  }

  /**
   * Fetch fallback from CoinGecko
   */
  async fetchMarketCapCoinGecko(tokenAddress: string): Promise<PriceData | null> {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/base?contract_addresses=${tokenAddress}&vs_currencies=usd&include_market_cap=true`,
        { cache: 'no-store' }
      );
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      const tokenData = data[tokenAddress.toLowerCase()];
      
      if (!tokenData) {
        return null;
      }

      return {
        priceUsd: tokenData.usd || 0,
        marketCap: tokenData.usd_market_cap || 0,
        volume24h: 0,
        priceChange24h: 0
      };
    } catch (error) {
      console.error(`CoinGecko fetch failed for ${tokenAddress}:`, error);
      return null;
    }
  }

  /**
   * Get all NFTs from contract
   */
  async getAllNFTs(): Promise<EvolutionNFT[]> {
    try {
      const totalSupply = await this.evolutionContract.totalSupply();
      const nfts: EvolutionNFT[] = [];

      for (let i = 0; i < totalSupply; i++) {
        try {
          const tokenId = await this.evolutionContract.tokenByIndex(i);
          const data = await this.evolutionContract.getEvolutionData(tokenId);
          
          nfts.push({
            tokenId: tokenId.toString(),
            clankerToken: data.clankerToken,
            currentTier: data.currentTier,
            highestMarketCap: Number(data.highestMarketCap)
          });
        } catch (error) {
          console.error(`Failed to get NFT at index ${i}:`, error);
        }
      }

      return nfts;
    } catch (error) {
      console.error('Failed to get all NFTs:', error);
      return [];
    }
  }

  /**
   * Check and evolve a single NFT
   */
  async checkAndEvolveNFT(nft: EvolutionNFT): Promise<boolean> {
    try {
      // Fetch current market cap
      let priceData = await this.fetchMarketCap(nft.clankerToken);
      
      // Fallback to CoinGecko
      if (!priceData) {
        priceData = await this.fetchMarketCapCoinGecko(nft.clankerToken);
      }

      if (!priceData || priceData.marketCap === 0) {
        console.log(`No price data for ${nft.clankerToken}`);
        return false;
      }

      const marketCapUsd6 = Math.floor(priceData.marketCap * 1_000_000); // Convert to 6 decimals

      // Check if MC is higher than before
      if (marketCapUsd6 <= nft.highestMarketCap) {
        console.log(`No MC increase for token ${nft.tokenId}`);
        return false;
      }

      // Call evolve
      const tx = await this.evolutionContract.checkAndEvolve(
        nft.tokenId,
        marketCapUsd6,
        { gasLimit: 200000 }
      );

      const receipt = await tx.wait();
      
      // Check if Evolved event was emitted
      const evolved = receipt?.logs?.some((log: any) => {
        try {
          const parsed = this.evolutionContract.interface.parseLog(log);
          return parsed?.name === 'Evolved' && parsed.args.tokenId.toString() === nft.tokenId;
        } catch {
          return false;
        }
      });

      if (evolved) {
        console.log(`✅ NFT ${nft.tokenId} evolved! New MC: $${priceData.marketCap.toLocaleString()}`);
      } else {
        console.log(`ℹ️ NFT ${nft.tokenId} checked, no evolution (MC: $${priceData.marketCap.toLocaleString()})`);
      }

      return evolved;
    } catch (error) {
      console.error(`Failed to evolve NFT ${nft.tokenId}:`, error);
      return false;
    }
  }

  /**
   * Batch check and evolve multiple NFTs
   */
  async batchEvolveNFTs(nfts: EvolutionNFT[]): Promise<{ evolved: number; checked: number }> {
    const tokenIds: string[] = [];
    const marketCaps: string[] = [];

    for (const nft of nfts) {
      try {
        let priceData = await this.fetchMarketCap(nft.clankerToken);
        
        if (!priceData) {
          priceData = await this.fetchMarketCapCoinGecko(nft.clankerToken);
        }

        if (priceData && priceData.marketCap > 0) {
          const marketCapUsd6 = Math.floor(priceData.marketCap * 1_000_000);
          
          if (marketCapUsd6 > nft.highestMarketCap) {
            tokenIds.push(nft.tokenId);
            marketCaps.push(marketCapUsd6.toString());
          }
        }
      } catch (error) {
        console.error(`Failed to fetch price for ${nft.clankerToken}:`, error);
      }
    }

    if (tokenIds.length === 0) {
      return { evolved: 0, checked: 0 };
    }

    try {
      // Batch size limit (avoid gas issues)
      const BATCH_SIZE = 50;
      let totalEvolved = 0;

      for (let i = 0; i < tokenIds.length; i += BATCH_SIZE) {
        const batchTokenIds = tokenIds.slice(i, i + BATCH_SIZE);
        const batchMarketCaps = marketCaps.slice(i, i + BATCH_SIZE);

        const tx = await this.evolutionContract.batchEvolve(
          batchTokenIds,
          batchMarketCaps,
          { gasLimit: 5000000 }
        );

        const receipt = await tx.wait();
        
        // Count evolved events
        const evolvedInBatch = receipt?.logs?.filter((log: any) => {
          try {
            const parsed = this.evolutionContract.interface.parseLog(log);
            return parsed?.name === 'Evolved';
          } catch {
            return false;
          }
        }).length || 0;

        totalEvolved += evolvedInBatch;
        console.log(`Batch ${i / BATCH_SIZE + 1}: ${evolvedInBatch} evolved`);
      }

      return { evolved: totalEvolved, checked: tokenIds.length };
    } catch (error) {
      console.error('Batch evolve failed:', error);
      return { evolved: 0, checked: tokenIds.length };
    }
  }

  /**
   * Run single check cycle
   */
  async runCheck(): Promise<{ evolved: number; checked: number }> {
    console.log(`\n🔍 Running evolution check at ${new Date().toISOString()}`);
    
    const nfts = await this.getAllNFTs();
    console.log(`Found ${nfts.length} NFTs to check`);

    if (nfts.length === 0) {
      return { evolved: 0, checked: 0 };
    }

    // Use batch for efficiency with many NFTs
    if (nfts.length > 10) {
      return this.batchEvolveNFTs(nfts);
    }

    // Individual checks for smaller sets
    let evolved = 0;
    for (const nft of nfts) {
      const didEvolve = await this.checkAndEvolveNFT(nft);
      if (didEvolve) evolved++;
      
      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return { evolved, checked: nfts.length };
  }

  /**
   * Start monitoring loop
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Monitor already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Evolution Monitor...');
    console.log(`Contract: ${await this.evolutionContract.getAddress()}`);
    console.log(`Check interval: ${this.checkInterval / 1000}s`);

    // Run immediately
    await this.runCheck();

    // Schedule next
    this.timer = setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this.runCheck();
      } catch (error) {
        console.error('Check cycle failed:', error);
      }
    }, this.checkInterval);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    console.log('🛑 Evolution Monitor stopped');
  }

  /**
   * Check if running
   */
  get isActive(): boolean {
    return this.isRunning;
  }
}

// CLI usage
if (require.main === module) {
  const rpcUrl = process.env.BASE_RPC_URL;
  const privateKey = process.env.MONITOR_PRIVATE_KEY;
  const contractAddress = process.env.EVOLUTION_CONTRACT_ADDRESS;

  if (!rpcUrl || !privateKey || !contractAddress) {
    console.error('Missing environment variables:');
    console.error('BASE_RPC_URL, MONITOR_PRIVATE_KEY, EVOLUTION_CONTRACT_ADDRESS');
    process.exit(1);
  }

  const monitor = new EvolutionMonitor(rpcUrl, privateKey, contractAddress);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down...');
    monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down...');
    monitor.stop();
    process.exit(0);
  });

  monitor.start().catch(error => {
    console.error('Monitor failed to start:', error);
    process.exit(1);
  });
}

export default EvolutionMonitor;
