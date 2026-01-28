import { createPublicClient, http, formatEther, getContract } from 'viem';
import { base, baseSepolia } from 'viem/chains';

// Chain configuration
const chain = process.env.NETWORK === 'mainnet' ? base : baseSepolia;
const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';

class WalletAnalyzer {
  constructor() {
    this.provider = createPublicClient({
      chain,
      transport: http(RPC_URL),
    });
  }

  async analyze(address) {
    console.log(`🔍 Analyzing wallet: ${address}`);
    
    const [balance, txCount] = await Promise.all([
      this.getBalance(address),
      this.getTransactionCount(address),
    ]);

    // Generate wallet DNA from on-chain data
    const dna = this.generateDNA(address, balance, txCount);
    
    // Calculate activity score
    const activityScore = this.calculateActivityScore(txCount, balance);
    
    // Determine wallet archetype
    const archetype = this.determineArchetype(balance, txCount);
    
    // Calculate risk profile
    const riskProfile = this.calculateRiskProfile(balance, txCount);

    return {
      address,
      balance: balance.toString(),
      transactionCount: txCount,
      activityScore,
      archetype,
      riskProfile,
      dna: dna.toString(),
    };
  }

  async getBalance(address) {
    try {
      const balance = await this.provider.getBalance({ address });
      return formatEther(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }

  async getTransactionCount(address) {
    try {
      return await this.provider.getTransactionCount({ address });
    } catch (error) {
      console.error('Error fetching tx count:', error);
      return 0;
    }
  }

  generateDNA(address, balance, txCount) {
    // Generate deterministic DNA from wallet characteristics
    const balanceWei = BigInt(Math.floor(parseFloat(balance) * 1e18));
    const txCountBig = BigInt(txCount);
    
    // Combine address, balance, and tx count
    const combined = BigInt(address) ^ balanceWei ^ txCountBig ^ BigInt(Date.now());
    
    // Hash it for better distribution
    return combined.toString(16).padStart(64, '0');
  }

  calculateActivityScore(txCount, balance) {
    const balNum = parseFloat(balance);
    const txScore = Math.min(txCount / 10, 40);
    const balanceScore = Math.min(balNum * 5, 30);
    
    return Math.min(Math.floor(txScore + balanceScore + 30), 100);
  }

  determineArchetype(balance, txCount) {
    const balNum = parseFloat(balance);
    
    if (balNum > 10 && txCount > 100) return 'Whale Collector';
    if (txCount > 1000) return 'Degen Trader';
    if (txCount > 100) return 'DeFi Farmer';
    if (balNum > 1) return 'Hodler';
    if (txCount < 10) return 'Newbie';
    return 'Adventurer';
  }

  calculateRiskProfile(balance, txCount) {
    if (txCount > 500) return 'High Activity';
    if (parseFloat(balance) > 5) return 'High Value';
    return 'Standard';
  }
}

export default new WalletAnalyzer();
