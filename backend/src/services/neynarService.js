// Neynar Service - Farcaster Data Analysis for Creature Generation
import dotenv from 'dotenv';

dotenv.config();

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2';

class NeynarService {
  constructor() {
    this.apiKey = NEYNAR_API_KEY;
    this.enabled = !!this.apiKey;
    if (this.enabled) {
      console.log('🔵 Neynar API enabled');
    } else {
      console.log('⚠️ Neynar API key not set - Farcaster features disabled');
    }
  }

  getHeaders() {
    return {
      'accept': 'application/json',
      'api_key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get user by FID (Farcaster ID)
   */
  async getUserByFid(fid) {
    if (!this.enabled) throw new Error('Neynar API not configured');

    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/user/bulk?fids=${fid}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    return data.users?.[0] || null;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username) {
    if (!this.enabled) throw new Error('Neynar API not configured');

    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/user/search?q=${encodeURIComponent(username)}&limit=1`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    const user = data.result?.users?.[0];
    
    if (!user) {
      throw new Error(`User @${username} not found`);
    }

    return user;
  }

  /**
   * Get user's casts (posts)
   */
  async getUserCasts(fid, limit = 100) {
    if (!this.enabled) throw new Error('Neynar API not configured');

    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/feed/user/${fid}?limit=${limit}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    return data.casts || [];
  }

  /**
   * Get user's followers and following
   */
  async getUserSocialGraph(fid) {
    if (!this.enabled) throw new Error('Neynar API not configured');

    const [followersRes, followingRes] = await Promise.all([
      fetch(`${NEYNAR_BASE_URL}/farcaster/followers?fid=${fid}&limit=100`, { headers: this.getHeaders() }),
      fetch(`${NEYNAR_BASE_URL}/farcaster/following?fid=${fid}&limit=100`, { headers: this.getHeaders() }),
    ]);

    if (!followersRes.ok || !followingRes.ok) {
      throw new Error('Neynar API error fetching social graph');
    }

    const [followersData, followingData] = await Promise.all([
      followersRes.json(),
      followingRes.json(),
    ]);

    return {
      followers: followersData.users || [],
      following: followingData.users || [],
      followersCount: followersData.users?.length || 0,
      followingCount: followingData.users?.length || 0,
    };
  }

  /**
   * Get user's reactions (likes, recasts)
   */
  async getUserReactions(fid, limit = 100) {
    if (!this.enabled) throw new Error('Neynar API not configured');

    const response = await fetch(
      `${NEYNAR_BASE_URL}/farcaster/reactions/user?fid=${fid}&limit=${limit}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    return data.reactions || [];
  }

  /**
   * Analyze user and generate wallet-like data for creature
   */
  async analyzeUser(identifier) {
    if (!this.enabled) {
      return this.getMockData(identifier);
    }

    console.log(`🔵 Analyzing Farcaster user: ${identifier}`);

    // Get user by FID or username
    let user;
    if (typeof identifier === 'number' || /^\d+$/.test(identifier)) {
      user = await this.getUserByFid(identifier);
    } else {
      // Remove @ if present
      const username = identifier.startsWith('@') ? identifier.slice(1) : identifier;
      user = await this.getUserByUsername(username);
    }

    if (!user) {
      throw new Error('User not found');
    }

    const fid = user.fid;

    // Fetch all user data in parallel
    const [casts, socialGraph, reactions] = await Promise.all([
      this.getUserCasts(fid, 100).catch(() => []),
      this.getUserSocialGraph(fid).catch(() => ({ followers: [], following: [], followersCount: 0, followingCount: 0 })),
      this.getUserReactions(fid, 100).catch(() => []),
    ]);

    // Analyze cast content for personality traits
    const personality = this.analyzePersonality(casts);
    
    // Calculate engagement metrics
    const engagement = this.calculateEngagement(casts, reactions, socialGraph);

    // Determine archetype based on activity
    const archetype = this.determineArchetype(user, casts, socialGraph, engagement);

    // Generate DNA from all the data
    const dna = this.generateDNA(user, casts, socialGraph);

    return {
      type: 'farcaster',
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile?.bio?.text || '',
      custodyAddress: user.custody_address,
      verifiedAddresses: user.verified_addresses?.eth_addresses || [],
      
      // Activity metrics
      followerCount: user.follower_count || socialGraph.followersCount,
      followingCount: user.following_count || socialGraph.followingCount,
      castCount: casts.length,
      reactionCount: reactions.length,
      
      // Analysis results
      personality,
      engagement,
      archetype,
      dna,
      
      // Raw data for creature generation
      casts: casts.slice(0, 10),
      topChannels: this.extractTopChannels(casts),
    };
  }

  /**
   * Analyze personality from cast content
   */
  analyzePersonality(casts) {
    const text = casts.map(c => c.text?.toLowerCase() || '').join(' ');
    
    const traits = {
      degen: ['degen', 'ape', 'moon', 'wagmi', 'gm', 'ser', 'based', 'clanker'],
      builder: ['build', 'ship', 'code', 'dev', 'product', 'launch', 'create'],
      artist: ['art', 'design', 'pixel', 'creative', 'nft', 'draw', 'create'],
      thinker: ['think', 'philosophy', 'idea', 'theory', 'insight', 'thread'],
      socialite: ['party', 'event', 'meet', 'friend', 'community', 'hang'],
      trader: ['trade', 'buy', 'sell', 'price', 'chart', 'pump', 'dump'],
    };

    const scores = {};
    for (const [trait, keywords] of Object.entries(traits)) {
      scores[trait] = keywords.reduce((count, keyword) => {
        const regex = new RegExp(keyword, 'g');
        return count + (text.match(regex) || []).length;
      }, 0);
    }

    // Get dominant trait
    const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    
    return {
      dominant: dominant?.[0] || 'adventurer',
      scores,
      sentiment: this.analyzeSentiment(text),
    };
  }

  /**
   * Simple sentiment analysis
   */
  analyzeSentiment(text) {
    const positive = ['gm', 'great', 'awesome', 'love', 'bullish', 'win', 'based', '🚀', '💯', '🔥'];
    const negative = ['ngmi', 'bearish', 'sad', 'bad', 'lose', 'scam', 'rug', '💀', '😢'];
    
    let score = 0;
    positive.forEach(word => {
      if (text.includes(word)) score++;
    });
    negative.forEach(word => {
      if (text.includes(word)) score--;
    });
    
    if (score > 5) return 'very-positive';
    if (score > 0) return 'positive';
    if (score < -5) return 'very-negative';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  /**
   * Calculate engagement metrics
   */
  calculateEngagement(casts, reactions, socialGraph) {
    const totalLikes = casts.reduce((sum, c) => sum + (c.reactions?.likes_count || 0), 0);
    const totalRecasts = casts.reduce((sum, c) => sum + (c.reactions?.recasts_count || 0), 0);
    const totalReplies = casts.reduce((sum, c) => sum + (c.replies?.count || 0), 0);
    
    const avgEngagement = casts.length > 0 
      ? (totalLikes + totalRecasts + totalReplies) / casts.length 
      : 0;

    return {
      totalLikes,
      totalRecasts,
      totalReplies,
      avgEngagement: Math.round(avgEngagement * 10) / 10,
      engagementRate: socialGraph.followersCount > 0 
        ? ((totalLikes + totalRecasts) / socialGraph.followersCount * 100).toFixed(2)
        : '0',
    };
  }

  /**
   * Determine archetype from Farcaster activity
   */
  determineArchetype(user, casts, socialGraph, engagement) {
    const { followersCount, followingCount } = socialGraph;
    const castCount = casts.length;
    const ratio = followingCount > 0 ? followersCount / followingCount : 0;

    if (followersCount > 10000) return 'Farcaster Legend';
    if (castCount > 500 && engagement.avgEngagement > 10) return 'Content Creator';
    if (ratio > 2 && followersCount > 1000) return 'Influencer';
    if (castCount > 1000) return 'Power User';
    if (castCount > 100) return 'Active Citizen';
    if (followersCount > followingCount) return 'Rising Star';
    if (castCount < 10) return 'Newcomer';
    return 'Farcaster Explorer';
  }

  /**
   * Extract top channels from casts
   */
  extractTopChannels(casts) {
    const channelCounts = {};
    casts.forEach(cast => {
      const channel = cast.channel?.id || 'none';
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });
    
    return Object.entries(channelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([channel, count]) => ({ channel, count }));
  }

  /**
   * Generate DNA hash from user data
   */
  generateDNA(user, casts, socialGraph) {
    const data = `${user.fid}-${user.username}-${casts.length}-${socialGraph.followersCount}-${Date.now()}`;
    return require('crypto').createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get mock data for testing without API
   */
  getMockData(identifier) {
    console.log('🔮 Using mock Neynar data for:', identifier);
    
    const username = typeof identifier === 'string' ? identifier.replace('@', '') : `user${identifier}`;
    
    return {
      type: 'farcaster',
      fid: 12345,
      username,
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
      pfpUrl: 'https://i.imgur.com/default.png',
      bio: 'Web3 enthusiast and creature collector',
      custodyAddress: '0x1234567890abcdef1234567890abcdef12345678',
      verifiedAddresses: ['0xabcdef1234567890abcdef1234567890abcdef12'],
      followerCount: 1337,
      followingCount: 420,
      castCount: 69,
      reactionCount: 420,
      personality: {
        dominant: 'degen',
        scores: { degen: 10, builder: 5, artist: 3, thinker: 2, socialite: 8, trader: 7 },
        sentiment: 'very-positive',
      },
      engagement: {
        totalLikes: 5000,
        totalRecasts: 500,
        totalReplies: 200,
        avgEngagement: 25.5,
        engagementRate: '15.50',
      },
      archetype: 'Degen Trader',
      dna: 'mock_dna_' + Date.now(),
      casts: [],
      topChannels: [
        { channel: 'clanker', count: 20 },
        { channel: 'base', count: 15 },
        { channel: 'farcaster', count: 10 },
      ],
    };
  }
}

export default new NeynarService();
