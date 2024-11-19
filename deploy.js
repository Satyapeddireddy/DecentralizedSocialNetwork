const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const SocialNetwork = await hre.ethers.getContractFactory("SocialNetwork");

  // Deploy the contract
  const socialnetwork = await SocialNetwork.deploy();

  // Wait for the contract deployment to finish
  await socialnetwork.deploymentTransaction().wait(); // Correct version for newer Hardhat
  
  // Log the address of the deployed contract
  console.log("SocialNetwork contract deployed to:", socialnetwork.target);
}

// Catch errors during deployment
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
