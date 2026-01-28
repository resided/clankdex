const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("🎮 Deploying ClaudexRegistry with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
  console.log("Network:", hre.network.name);

  // Deploy the registry
  const ClaudexRegistry = await hre.ethers.getContractFactory("ClaudexRegistry");
  const registry = await ClaudexRegistry.deploy();
  
  await registry.waitForDeployment();
  
  const registryAddress = await registry.getAddress();
  
  console.log("✅ ClaudexRegistry deployed to:", registryAddress);

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    registryAddress: registryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };
  
  const filename = `./deployments-${hre.network.name}.json`;
  fs.writeFileSync(filename, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n📝 Deployment info saved to", filename);
  
  // Verify on Etherscan if not on local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await registry.deploymentTransaction().wait(5);
    
    console.log("🔍 Verifying contract on Basescan...");
    try {
      await hre.run("verify:verify", {
        address: registryAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("⚠️ Verification error:", error.message);
    }
  }
  
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Deployment Summary:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Registry Address:", registryAddress);
  console.log("Network:", hre.network.name);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📝 Add this to your frontend .env.local:");
  console.log(`NEXT_PUBLIC_REGISTRY_ADDRESS=${registryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
