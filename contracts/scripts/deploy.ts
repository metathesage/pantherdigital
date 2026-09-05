import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying PNTHR DGTL contracts with:", await deployer.getAddress());

  const CoinPanther = await ethers.getContractFactory("CoinPanther");
  const coin = await CoinPanther.deploy(deployer.address);
  await coin.waitForDeployment();
  console.log("CoinPanther ($PNTHR):", await coin.getAddress());

  const LucyID = await ethers.getContractFactory("LucyID");
  const lucy = await LucyID.deploy(deployer.address);
  await lucy.waitForDeployment();
  console.log("LucyID (SBT):", await lucy.getAddress());

  const PnthrPack = await ethers.getContractFactory("PnthrPack");
  const pack = await PnthrPack.deploy(deployer.address);
  await pack.waitForDeployment();
  console.log("PnthrPack (ERC1155):", await pack.getAddress());

  const WikiIndex = await ethers.getContractFactory("WikiIndex");
  const wiki = await WikiIndex.deploy(deployer.address);
  await wiki.waitForDeployment();
  console.log("WikiIndex:", await wiki.getAddress());

  console.log("\n=== Deployed (add these to the frontend chain config) ===");
  console.table({
    CoinPanther: await coin.getAddress(),
    LucyID: await lucy.getAddress(),
    PnthrPack: await pack.getAddress(),
    WikiIndex: await wiki.getAddress(),
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});