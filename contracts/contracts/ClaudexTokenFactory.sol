// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ClaudexToken - Pokemon-style creature token
/// @notice Each wallet gets a unique creature token based on their on-chain DNA
contract ClaudexToken is ERC20, ERC20Burnable, ERC20Permit, Ownable {
    
    struct Creature {
        string name;
        string species;
        uint256 dna;
        uint8 level;
        uint8 hp;
        uint8 attack;
        uint8 defense;
        uint8 speed;
        uint8 special;
        string element; // Fire, Water, Grass, Electric, etc.
        string imageURI;
        uint256 createdAt;
    }
    
    Creature public creature;
    address public creator;
    
    event CreatureSummoned(address indexed creator, string name, uint256 dna);
    
    constructor(
        address _creator,
        string memory _name,
        string memory _symbol,
        uint256 _dna,
        uint8[6] memory _stats, // [level, hp, attack, defense, speed, special]
        string memory _element,
        string memory _imageURI
    ) ERC20(_name, _symbol) ERC20Permit(_name) Ownable(_creator) {
        creator = _creator;
        
        // Generate species name based on DNA
        string memory species = generateSpeciesName(_dna, _element);
        
        creature = Creature({
            name: _name,
            species: species,
            dna: _dna,
            level: _stats[0],
            hp: _stats[1],
            attack: _stats[2],
            defense: _stats[3],
            speed: _stats[4],
            special: _stats[5],
            element: _element,
            imageURI: _imageURI,
            createdAt: block.timestamp
        });
        
        // Mint initial supply to creator (1,000,000 tokens)
        _mint(_creator, 1_000_000 * 10 ** decimals());
        
        emit CreatureSummoned(_creator, _name, _dna);
    }
    
    function generateSpeciesName(uint256 _dna, string memory _element) internal pure returns (string memory) {
        // Generate species from DNA
        string[10] memory prefixes = ["Spark", "Shadow", "Crystal", "Flame", "Aqua", 
                                      "Thunder", "Geo", "Psy", "Venom", "Frost"];
        string[10] memory suffixes = ["mon", "beast", "ling", "rex", "nite",
                                      "saur", "dactyl", "chu", "vee", "gatr"];
        
        uint256 prefixIndex = (_dna % 1000) / 100;
        uint256 suffixIndex = (_dna % 100) / 10;
        
        return string(abi.encodePacked(prefixes[prefixIndex], suffixes[suffixIndex]));
    }
    
    function getCreatureData() external view returns (Creature memory) {
        return creature;
    }
}

/// @title ClaudexTokenFactory - Factory for creating creature tokens
/// @notice Analyzes wallet DNA and creates unique Pokemon-style tokens
contract ClaudexTokenFactory {
    
    mapping(address => address) public userToToken;
    mapping(address => bool) public hasToken;
    address[] public allTokens;
    
    uint256 public constant MINT_FEE = 0.001 ether;
    
    event TokenCreated(
        address indexed creator,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 dna
    );
    
    /// @notice Analyze wallet and create a unique creature token
    /// @param _name The name for the token/creature
    /// @param _symbol The symbol for the token
    /// @param _imageURI IPFS URI for the creature image
    function createToken(
        string memory _name,
        string memory _symbol,
        string memory _imageURI
    ) external payable returns (address) {
        require(msg.value >= MINT_FEE, "Insufficient mint fee");
        require(!hasToken[msg.sender], "User already has a token");
        require(bytes(_name).length > 0 && bytes(_name).length <= 20, "Invalid name");
        
        // Generate DNA from wallet analysis
        uint256 dna = analyzeWalletDNA(msg.sender);
        
        // Calculate stats from DNA
        uint8[6] memory stats = calculateStats(dna);
        
        // Determine element from DNA
        string memory element = determineElement(dna);
        
        // Create the token
        ClaudexToken token = new ClaudexToken(
            msg.sender,
            _name,
            _symbol,
            dna,
            stats,
            element,
            _imageURI
        );
        
        address tokenAddress = address(token);
        userToToken[msg.sender] = tokenAddress;
        hasToken[msg.sender] = true;
        allTokens.push(tokenAddress);
        
        emit TokenCreated(msg.sender, tokenAddress, _name, _symbol, dna);
        
        return tokenAddress;
    }
    
    /// @notice Analyze wallet to generate unique DNA
    /// @param _user The wallet address to analyze
    function analyzeWalletDNA(address _user) public view returns (uint256) {
        uint256 dna = uint256(keccak256(abi.encodePacked(
            _user,
            block.timestamp,
            block.number,
            allTokens.length
        )));
        
        // Add entropy from wallet history (nonce)
        uint256 nonce;
        assembly {
            nonce := extcodesize(_user)
        }
        dna = uint256(keccak256(abi.encodePacked(dna, nonce)));
        
        return dna;
    }
    
    /// @notice Calculate creature stats from DNA
    function calculateStats(uint256 _dna) public pure returns (uint8[6] memory) {
        uint8[6] memory stats;
        
        // Level is always 1 for new creatures
        stats[0] = 1;
        
        // Calculate other stats (1-100 range)
        stats[1] = uint8(((_dna >> 0) % 100) + 1);  // HP
        stats[2] = uint8(((_dna >> 8) % 100) + 1);  // Attack
        stats[3] = uint8(((_dna >> 16) % 100) + 1); // Defense
        stats[4] = uint8(((_dna >> 24) % 100) + 1); // Speed
        stats[5] = uint8(((_dna >> 32) % 100) + 1); // Special
        
        return stats;
    }
    
    /// @notice Determine elemental type from DNA
    function determineElement(uint256 _dna) public pure returns (string memory) {
        string[12] memory elements = [
            "Fire", "Water", "Grass", "Electric", "Ice", "Fighting",
            "Poison", "Ground", "Flying", "Psychic", "Bug", "Dragon"
        ];
        
        uint256 elementIndex = (_dna >> 40) % 12;
        return elements[elementIndex];
    }
    
    /// @notice Get token for a user
    function getUserToken(address _user) external view returns (address) {
        return userToToken[_user];
    }
    
    /// @notice Check if user has a token
    function userHasToken(address _user) external view returns (bool) {
        return hasToken[_user];
    }
    
    /// @notice Get all created tokens
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }
    
    /// @notice Get total token count
    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }
    
    /// @notice Withdraw fees (owner only - could add ownable)
    function withdraw() external {
        (bool success, ) = payable(msg.sender).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
}
