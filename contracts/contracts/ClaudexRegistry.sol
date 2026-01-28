// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IClankerToken - Interface for Clanker-deployed tokens
interface IClankerToken {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function totalSupply() external view returns (uint256);
}

/// @title ClaudexRegistry - Tracks creature tokens launched via Clanker
/// @notice This contract registers and tracks Pokemon-style creatures deployed through Clanker
contract ClaudexRegistry {
    
    struct Creature {
        address tokenAddress;
        address creator;
        string name;
        string species;
        uint256 dna;
        uint8 level;
        uint8 hp;
        uint8 attack;
        uint8 defense;
        uint8 speed;
        uint8 special;
        string element;
        string imageURI;
        uint256 createdAt;
        bool isClanker; // True if deployed via Clanker
    }
    
    // Mappings
    mapping(address => Creature) public creatures; // token => creature
    mapping(address => address[]) public creatorToTokens;
    mapping(address => bool) public hasCreature;
    
    // Arrays
    address[] public allCreatures;
    
    // Admin
    address public owner;
    mapping(address => bool) public authorizedMinters;
    
    // Events
    event CreatureRegistered(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string element,
        uint256 dna
    );
    
    event CreatureSummoned(
        address indexed creator,
        uint256 indexed dna,
        string element,
        uint8[6] stats
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedMinters[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        authorizedMinters[msg.sender] = true;
    }
    
    /// @notice Authorize a minter (like the backend service)
    function authorizeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
    }
    
    /// @notice Remove minter authorization
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
    }
    
    /// @notice Register a creature launched via Clanker
    /// @param tokenAddress The Clanker token address
    /// @param creator The wallet that created the creature
    /// @param name Creature name
    /// @param species Creature species
    /// @param dna Unique DNA fingerprint
    /// @param stats Array of [level, hp, attack, defense, speed, special]
    /// @param element Elemental type
    /// @param imageURI IPFS URI for creature image
    function registerCreature(
        address tokenAddress,
        address creator,
        string memory name,
        string memory species,
        uint256 dna,
        uint8[6] memory stats,
        string memory element,
        string memory imageURI
    ) public onlyAuthorized returns (bool) {
        require(tokenAddress != address(0), "Invalid token address");
        require(bytes(name).length > 0, "Invalid name");
        require(creatures[tokenAddress].tokenAddress == address(0), "Creature already registered");
        
        Creature memory creature = Creature({
            tokenAddress: tokenAddress,
            creator: creator,
            name: name,
            species: species,
            dna: dna,
            level: stats[0],
            hp: stats[1],
            attack: stats[2],
            defense: stats[3],
            speed: stats[4],
            special: stats[5],
            element: element,
            imageURI: imageURI,
            createdAt: block.timestamp,
            isClanker: true
        });
        
        creatures[tokenAddress] = creature;
        creatorToTokens[creator].push(tokenAddress);
        allCreatures.push(tokenAddress);
        hasCreature[creator] = true;
        
        emit CreatureRegistered(tokenAddress, creator, name, element, dna);
        
        return true;
    }
    
    /// @notice Batch register multiple creatures
    function batchRegisterCreatures(
        address[] calldata tokenAddresses,
        address[] calldata creators,
        string[] calldata names,
        string[] calldata specieses,
        uint256[] calldata dnas,
        uint8[6][] calldata statsArray,
        string[] calldata elements,
        string[] calldata imageURIs
    ) external onlyAuthorized {
        uint256 len = tokenAddresses.length;
        require(len == creators.length && len == names.length, "Array length mismatch");
        
        for (uint i = 0; i < len; i++) {
            this.registerCreature(
                tokenAddresses[i],
                creators[i],
                names[i],
                specieses[i],
                dnas[i],
                statsArray[i],
                elements[i],
                imageURIs[i]
            );
        }
    }
    
    /// @notice Get creature data by token address
    function getCreature(address tokenAddress) external view returns (Creature memory) {
        return creatures[tokenAddress];
    }
    
    /// @notice Get all creatures created by a wallet
    function getCreaturesByCreator(address creator) external view returns (Creature[] memory) {
        address[] memory tokens = creatorToTokens[creator];
        Creature[] memory result = new Creature[](tokens.length);
        
        for (uint i = 0; i < tokens.length; i++) {
            result[i] = creatures[tokens[i]];
        }
        
        return result;
    }
    
    /// @notice Get creature token addresses for a creator
    function getCreatorTokens(address creator) external view returns (address[] memory) {
        return creatorToTokens[creator];
    }
    
    /// @notice Check if creator has a creature
    function creatorHasCreature(address creator) external view returns (bool) {
        return hasCreature[creator];
    }
    
    /// @notice Get total creature count
    function getCreatureCount() external view returns (uint256) {
        return allCreatures.length;
    }
    
    /// @notice Get all creature addresses with pagination
    function getAllCreatures(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 end = offset + limit;
        if (end > allCreatures.length) {
            end = allCreatures.length;
        }
        
        address[] memory result = new address[](end - offset);
        for (uint i = offset; i < end; i++) {
            result[i - offset] = allCreatures[i];
        }
        
        return result;
    }
    
    /// @notice Get creatures by element
    function getCreaturesByElement(string memory element) external view returns (Creature[] memory) {
        uint256 count = 0;
        
        // First pass: count matching creatures
        for (uint i = 0; i < allCreatures.length; i++) {
            if (keccak256(bytes(creatures[allCreatures[i]].element)) == keccak256(bytes(element))) {
                count++;
            }
        }
        
        // Second pass: collect matching creatures
        Creature[] memory result = new Creature[](count);
        uint256 index = 0;
        
        for (uint i = 0; i < allCreatures.length; i++) {
            if (keccak256(bytes(creatures[allCreatures[i]].element)) == keccak256(bytes(element))) {
                result[index] = creatures[allCreatures[i]];
                index++;
            }
        }
        
        return result;
    }
    
    /// @notice Get leaderboards by stat
    function getLeaderboardByStat(string memory statType, uint256 limit) external view returns (Creature[] memory) {
        require(limit > 0 && limit <= 100, "Invalid limit");
        
        Creature[] memory all = new Creature[](allCreatures.length);
        for (uint i = 0; i < allCreatures.length; i++) {
            all[i] = creatures[allCreatures[i]];
        }
        
        // Simple bubble sort (for small datasets)
        for (uint i = 0; i < all.length; i++) {
            for (uint j = i + 1; j < all.length; j++) {
                uint256 statI = getStatValue(all[i], statType);
                uint256 statJ = getStatValue(all[j], statType);
                
                if (statJ > statI) {
                    Creature memory temp = all[i];
                    all[i] = all[j];
                    all[j] = temp;
                }
            }
        }
        
        // Return top N
        uint256 resultSize = limit < all.length ? limit : all.length;
        Creature[] memory result = new Creature[](resultSize);
        for (uint i = 0; i < resultSize; i++) {
            result[i] = all[i];
        }
        
        return result;
    }
    
    function getStatValue(Creature memory creature, string memory statType) internal pure returns (uint256) {
        if (keccak256(bytes(statType)) == keccak256(bytes("hp"))) return creature.hp;
        if (keccak256(bytes(statType)) == keccak256(bytes("attack"))) return creature.attack;
        if (keccak256(bytes(statType)) == keccak256(bytes("defense"))) return creature.defense;
        if (keccak256(bytes(statType)) == keccak256(bytes("speed"))) return creature.speed;
        if (keccak256(bytes(statType)) == keccak256(bytes("special"))) return creature.special;
        if (keccak256(bytes(statType)) == keccak256(bytes("total"))) {
            return creature.hp + creature.attack + creature.defense + creature.speed + creature.special;
        }
        return 0;
    }
    
    /// @notice Transfer ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
    
    /// @notice Emergency pause - prevent new registrations
    bool public paused;
    
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }
    
    function togglePause() external onlyOwner {
        paused = !paused;
    }
}
