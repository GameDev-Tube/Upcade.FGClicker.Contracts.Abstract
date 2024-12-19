import hre from "hardhat";

const proxyAddress = "0xC2bA45F54393B1a85bD770a665d5252B070582fd";
const implAddress = "0x4e085313f64a0535d9F8a20B72A3b2eb9f78E384"
const contractFullyQualifedName = "contracts/PepenadeCrush.sol:PepenadeCrush";

export default async function verify() {
    const verificationId = await hre.run("verify:verify", {
        address: proxyAddress,
        contract: contractFullyQualifedName,
        constructorArguments: [],
    });

    console.log(`Verification id: ${verificationId}`);
}

