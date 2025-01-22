import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "ethers";

import { ScoreMessage, signMessageWithEIP712 } from "./Utils";

import hre from "hardhat";

const backendPk = "0xcae3bbc4e392118a36d25189a5b11e76915b9a4f2e287762f47aebc69ff05c89";
const backendAddress = "0x9534a32aeA7588531b5F85C612089011e947cD0E";

import PepenadeCrushModule from "../ignition/modules/PepenadeCrush";

import UpgradeModule from "../ignition/modules/test/UpgradeTest";

describe("Proxy", function () {
    async function deploy() {

        const { instance, proxy } = await hre.ignition.deploy(PepenadeCrushModule, {
            parameters: {
                ProxyModule: {
                    _backendSigner: backendAddress
                }
            }
        });
        const [owner, otherAccount] = await hre.ethers.getSigners();
        return { instance, proxy, owner, otherAccount };
    }

    describe("Initialization", function () {
        it("Should initialize the contract with the backend signer", async function () {
            const { instance } = await loadFixture(deploy);
            const backendSigner = await instance.backendSigner();
            expect(backendSigner).to.equal(backendAddress);
        });
    });

    describe("Upgrade", function () {
        it("Should preserve highScore set before the upgrade", async function () {
            const { instance, proxy, owner, otherAccount } = await loadFixture(deploy);

            const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
            const player = otherAccount.address;
            const totalScore = 100_000;
            const highScore = 100_000;
            const crewScore = 100_000;

            const backendSigner = new ethers.Wallet(backendPk, hre.ethers.provider);
            const message = new ScoreMessage(player, totalScore, highScore, crewScore, nonce);
            const proxyAddress = await instance.getAddress();
            const signature = await signMessageWithEIP712(backendSigner, message, proxyAddress);
            await instance.updateScore(message, signature);
            expect(await instance.highScore(player)).to.equal(totalScore);

            const { upgradedProxy } = await hre.ignition.deploy(UpgradeModule,
                {
                    parameters: {
                        UpgradeTestModule: {
                            proxyAddress: proxyAddress
                        }
                    }
                }
            );

            const scoreAfterUpgrade = await upgradedProxy.highScore(player);
            expect(scoreAfterUpgrade).to.equal(totalScore);
        });
    });
});