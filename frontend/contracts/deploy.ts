/**
 * Deployment script for ClankDexEvolution NFT contract
 * Usage: npx tsx contracts/deploy.ts
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

// Contract bytecode (compile first with: npx hardhat compile)
const CONTRACT_ABI = [
  "constructor(string memory _baseURI)",
  "function authorizeMinter(address minter) external",
  "function setBaseURI(string memory _baseURI) external",
  "function mint(address to, address clankerToken, string calldata creatureName) external returns (uint256)",
  "function checkAndEvolve(uint256 tokenId, uint256 currentMarketCap)",
  "function getEvolutionData(uint256 tokenId) view returns (tuple(uint8 currentTier, uint256 lastEvolveTime, uint256 highestMarketCap, address clankerToken, uint256 createdAt))",
  "function tokenURI(uint256 tokenId) view returns (string memory)"
];

async function deploy() {
  // Load environment
  const RPC_URL = process.env.BASE_RPC_URL;
  const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
  const BASE_URI = process.env.NFT_BASE_URI || 'https://clankdex.io/api/metadata/';

  if (!RPC_URL || !PRIVATE_KEY) {
    console.error('Missing required env vars: BASE_RPC_URL, DEPLOYER_PRIVATE_KEY');
    process.exit(1);
  }

  console.log('🚀 Deploying ClankDexEvolution contract...\n');

  // Connect to network
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('Network:', await provider.getNetwork().then(n => n.name));
  console.log('Deployer:', wallet.address);
  console.log('Balance:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH\n');

  // Load compiled contract
  const artifactPath = path.join(__dirname, 'artifacts', 'ClankDexEvolution.json');
  
  if (!fs.existsSync(artifactPath)) {
    console.error('❌ Contract artifact not found!');
    console.log('Please compile first:');
    console.log('  npx hardhat compile');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const bytecode = artifact.bytecode;
  const abi = artifact.abi;

  // Create contract factory
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);

  // Deploy
  console.log('Deploying with baseURI:', BASE_URI);
  const contract = await factory.deploy(BASE_URI);
  
  console.log('Transaction hash:', contract.deploymentTransaction()?.hash);
  console.log('Waiting for confirmation...\n');

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  
  console.log('✅ Contract deployed!');
  console.log('Address:', address);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Verify contract on Basescan');
  console.log('  2. Authorize minters: npx tsx contracts/authorize-minter.ts', address);
  console.log('  3. Update .env.local with EVOLUTION_CONTRACT_ADDRESS=' + address);
  console.log('  4. Start evolution monitor: npm run monitor');
  
  // Save deployment info
  const deploymentInfo = {
    network: 'base',
    contractAddress: address,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    baseURI: BASE_URI
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'deployment.json'),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log('\nDeployment info saved to contracts/deployment.json');
}

deploy().catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
