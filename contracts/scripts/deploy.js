const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying ClaudexTokenFactory with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy the factory
  const ClaudexTokenFactory = await hre.ethers.getContractFactory("ClaudexTokenFactory");
  const factory = await ClaudexTokenFactory.deploy();
  
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  
  console.log("ClaudexTokenFactory deployed to:", factoryAddress);
  console.log("Mint fee:", hre.ethers.formatEther(await factory.MINT_FEE()), "ETH");

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: hre.network.name,
    factoryAddress: factoryAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    `./deployments-${hre.network.name}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\nDeployment info saved to deployments-" + hre.network.name + ".json");
  
  // Verify on Etherscan if not on local network
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await factory.deploymentTransaction().wait(5);
    
    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [],
      });
      console.log("Contract verified!");
    } catch (error) {
      console.log("Verification error:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
