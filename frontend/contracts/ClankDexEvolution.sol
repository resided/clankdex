// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ClankDexEvolution
 * @dev Soulbound NFT that evolves with Clanker token market cap
 */
contract ClankDexEvolution is ERC721, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    Counters.Counter private _tokenIdCounter;

    // ============ Structs ============
    
    struct Evolution {
        uint8 currentTier;      // 0-6 (Egg to Legendary)
        uint256 lastEvolveTime;
        uint256 highestMarketCap; // In USD, 6 decimals
        address clankerToken;   // Associated Clanker token
        uint256 createdAt;
    }

    struct TierThreshold {
        uint256 minMarketCap;
        uint256 maxMarketCap;
        string name;
        string color;
    }

    // ============ State ============
    
    // Token ID => Evolution data
    mapping(uint256 => Evolution) public evolutions;
    
    // Clanker token => NFT token ID (1:1 mapping)
    mapping(address => uint256) public clankerToNFT;
    
    // Authorized minters (ClankDex contract)
    mapping(address => bool) public authorizedMinters;
    
    // Metadata base URI
    string public baseTokenURI;
    
    // Evolution thresholds
    TierThreshold[] public tiers;
    
    // Evolution cooldown (prevent gaming)
    uint256 public constant EVOLUTION_COOLDOWN = 1 hours;
    
    // Events
    event EvolutionMinted(
        uint256 indexed tokenId, 
        address indexed clankerToken, 
        address indexed creator,
        string creatureName
    );
    event Evolved(
        uint256 indexed tokenId, 
        uint8 newTier, 
        uint256 marketCap,
        uint256 timestamp
    );
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);

    // ============ Constructor ============
    
    constructor(string memory _baseURI) ERC721("ClankDex Evolution", "CLANK-EVO") {
        baseTokenURI = _baseURI;
        
        // Initialize tiers
        tiers.push(TierThreshold(0, 1_000_000, "Egg", "#9CA3AF"));           // $0 - $1K
        tiers.push(TierThreshold(1_000_000, 10_000_000, "Baby", "#4ADE80"));   // $1K - $10K
        tiers.push(TierThreshold(10_000_000, 50_000_000, "Basic", "#60A5FA")); // $10K - $50K
        tiers.push(TierThreshold(50_000_000, 100_000_000, "Stage 1", "#A78BFA")); // $50K - $100K
        tiers.push(TierThreshold(100_000_000, 500_000_000, "Stage 2", "#FACC15")); // $100K - $500K
        tiers.push(TierThreshold(500_000_000, 1_000_000_000, "Mega", "#FB923C")); // $500K - $1M
        tiers.push(TierThreshold(1_000_000_000, type(uint256).max, "Legendary", "#EF4444")); // $1M+
    }

    // ============ Modifiers ============
    
    modifier onlyMinter() {
        require(authorizedMinters[msg.sender], "ClankDexEvolution: unauthorized minter");
        _;
    }

    // ============ Minting ============
    
    /**
     * @dev Mint evolution NFT for a Clanker token
     * @param to Address to mint to (creator)
     * @param clankerToken Address of the Clanker token
     * @param creatureName Name of the creature (for metadata)
     * @return tokenId The ID of the minted NFT
     */
    function mint(
        address to, 
        address clankerToken,
        string calldata creatureName
    ) external onlyMinter returns (uint256) {
        require(clankerToken != address(0), "Invalid token address");
        require(clankerToNFT[clankerToken] == 0, "NFT already exists for this token");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        
        evolutions[tokenId] = Evolution({
            currentTier: 0, // Start as Egg
            lastEvolveTime: block.timestamp,
            highestMarketCap: 0,
            clankerToken: clankerToken,
            createdAt: block.timestamp
        });
        
        clankerToNFT[clankerToken] = tokenId;
        
        emit EvolutionMinted(tokenId, clankerToken, to, creatureName);
        
        return tokenId;
    }

    // ============ Evolution ============
    
    /**
     * @dev Check and evolve NFT based on current market cap
     * @param tokenId The NFT token ID
     * @param currentMarketCap Current market cap in USD (6 decimals)
     */
    function checkAndEvolve(uint256 tokenId, uint256 currentMarketCap) external {
        require(_exists(tokenId), "Token does not exist");
        
        Evolution storage evo = evolutions[tokenId];
        
        // Cooldown check (optional, can be removed for instant evolution)
        // require(
        //     block.timestamp >= evo.lastEvolveTime + EVOLUTION_COOLDOWN,
        //     "Evolution on cooldown"
        // );
        
        // Update highest MC
        if (currentMarketCap > evo.highestMarketCap) {
            evo.highestMarketCap = currentMarketCap;
        }
        
        // Determine new tier
        uint8 newTier = _getTierForMarketCap(currentMarketCap);
        
        // Only evolve if tier increased
        if (newTier > evo.currentTier) {
            uint8 oldTier = evo.currentTier;
            evo.currentTier = newTier;
            evo.lastEvolveTime = block.timestamp;
            
            emit Evolved(tokenId, newTier, currentMarketCap, block.timestamp);
        }
    }

    /**
     * @dev Get tier for a given market cap
     */
    function _getTierForMarketCap(uint256 marketCap) internal view returns (uint8) {
        for (uint8 i = 0; i < tiers.length; i++) {
            if (marketCap >= tiers[i].minMarketCap && marketCap < tiers[i].maxMarketCap) {
                return i;
            }
        }
        return 0;
    }

    /**
     * @dev Batch check and evolve multiple NFTs
     */
    function batchEvolve(
        uint256[] calldata tokenIds, 
        uint256[] calldata marketCaps
    ) external {
        require(tokenIds.length == marketCaps.length, "Array length mismatch");
        
        for (uint i = 0; i < tokenIds.length; i++) {
            // Skip non-existent tokens
            if (!_exists(tokenIds[i])) continue;
            
            Evolution storage evo = evolutions[tokenIds[i]];
            
            if (marketCaps[i] > evo.highestMarketCap) {
                evo.highestMarketCap = marketCaps[i];
            }
            
            uint8 newTier = _getTierForMarketCap(marketCaps[i]);
            
            if (newTier > evo.currentTier) {
                evo.currentTier = newTier;
                evo.lastEvolveTime = block.timestamp;
                emit Evolved(tokenIds[i], newTier, marketCaps[i], block.timestamp);
            }
        }
    }

    // ============ Soulbound (Non-transferable) ============
    
    /**
     * @dev Override transfer functions to make NFT soulbound
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        // Allow mint (from == 0) and burn (to == 0), block transfers
        if (from != address(0) && to != address(0)) {
            revert("ClankDexEvolution: soulbound NFTs are non-transferable");
        }
    }

    // ============ Views ============
    
    /**
     * @dev Get token URI with tier parameter for dynamic metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        
        Evolution memory evo = evolutions[tokenId];
        
        return string(abi.encodePacked(
            baseTokenURI,
            tokenId.toString(),
            "/",
            uint256(evo.currentTier).toString()
        ));
    }

    /**
     * @dev Get evolution data for a token
     */
    function getEvolutionData(uint256 tokenId) external view returns (Evolution memory) {
        require(_exists(tokenId), "Token does not exist");
        return evolutions[tokenId];
    }

    /**
     * @dev Get NFT ID for a Clanker token
     */
    function getNFTForClanker(address clankerToken) external view returns (uint256) {
        return clankerToNFT[clankerToken];
    }

    /**
     * @dev Get tier info
     */
    function getTierInfo(uint8 tier) external view returns (TierThreshold memory) {
        require(tier < tiers.length, "Invalid tier");
        return tiers[tier];
    }

    /**
     * @dev Get all tier info
     */
    function getAllTiers() external view returns (TierThreshold[] memory) {
        return tiers;
    }

    /**
     * @dev Get progress to next tier
     */
    function getProgressToNextTier(uint256 tokenId) external view returns (
        uint256 currentMC,
        uint256 nextTierMinMC,
        uint256 progressPercent
    ) {
        require(_exists(tokenId), "Token does not exist");
        
        Evolution memory evo = evolutions[tokenId];
        currentMC = evo.highestMarketCap;
        
        if (evo.currentTier >= tiers.length - 1) {
            // Already at max tier
            return (currentMC, 0, 100);
        }
        
        nextTierMinMC = tiers[evo.currentTier + 1].minMarketCap;
        uint256 currentTierMinMC = tiers[evo.currentTier].minMarketCap;
        
        if (nextTierMinMC <= currentTierMinMC) {
            return (currentMC, nextTierMinMC, 100);
        }
        
        progressPercent = ((currentMC - currentTierMinMC) * 100) / 
                          (nextTierMinMC - currentTierMinMC);
        
        if (progressPercent > 100) progressPercent = 100;
    }

    // ============ Admin ============
    
    function authorizeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }

    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseTokenURI = _baseURI;
    }

    // ============ Overrides ============
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
