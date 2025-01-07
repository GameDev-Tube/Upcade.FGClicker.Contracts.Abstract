import hre from "hardhat";

const proxyAddress = process.env.PROXY_ADDRESS!;
const implAddress = process.env.IMPLEMENTATION_ADDRESS!;
const contractFullyQualifedName = "contracts/PepenadeCrush.sol:PepenadeCrush";

export default async function verify() {
    const verificationId = await hre.run("verify:verify", {
        address: proxyAddress,
        contract: contractFullyQualifedName,
        constructorArguments: [],
    });

    console.log(`Verification id: ${verificationId}`);
}

