import { Wallet } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync";

import dotenv from "dotenv";
dotenv.config();

const deployerPk = process.env.PRIVATE_KEY!;
const backendSignerAddress = process.env.BACKEND_WALLET_ADDRESS!;

// An example of a deploy script that will deploy and call a simple contract.
export default async function (hre: HardhatRuntimeEnvironment) {
    console.log(`Running deploy script`);

    // const zkWallet = new Wallet(deployerPk);
    // const deployer = new Deployer(hre, zkWallet);
    // const contract = await deployer.loadArtifact("PepenadeCrush");
    // const proxy = await hre.zkUpgrades.deployProxy(deployer.zkWallet, contract, [backendSignerAddress], { initializer: "initialize" });
    // await proxy.waitForDeployment();

    // console.log(`Proxy deployed to: ${proxy.address}`);
    // console.log(`Implementation deployed to: ${await proxy.implementation()}`);

    // Initialize the wallet using your private key.
    const wallet = new Wallet(deployerPk);

    // Create deployer object and load the artifact of the contract we want to deploy.
    const deployer = new Deployer(hre, wallet);
    // Load contract
    const artifact = await deployer.loadArtifact("PepenadeCrush");

    // Deploy the implementation contract
    console.log("Deploying implementation contract...");
    const implementation = await deployer.deploy(artifact);
    const implementationAddress = await implementation.getAddress();
    console.log(`Implementation deployed to: ${implementationAddress}`);

    // Load ERC1967Proxy artifact
    const proxyArtifact = await deployer.loadArtifact("@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy");

    // Encode the initializer function call (e.g., "initialize()")
    const initializeData = implementation.interface.encodeFunctionData(
        "initialize", // Funkcja initializer w Twoim kontrakcie
        [backendSignerAddress] // Parametry funkcji initialize, jeśli są wymagane
    );

    // Deploy the proxy with the implementation and initializer data
    console.log("Deploying proxy contract...");
    const proxy = await deployer.deploy(proxyArtifact, [implementationAddress, initializeData]);
    const proxyAddress = await proxy.getAddress();
    console.log(`Proxy deployed to: ${proxyAddress}`);
}
