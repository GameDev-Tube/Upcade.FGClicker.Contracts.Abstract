import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "ethers";

import { ScoreMessage, signMessageWithEIP712 } from "./Utils";

import hre from "hardhat";

const backendPk = "0xcae3bbc4e392118a36d25189a5b11e76915b9a4f2e287762f47aebc69ff05c89";
const backendAddress = "0x9534a32aeA7588531b5F85C612089011e947cD0E";

import HighScoreModule from "../ignition/modules/Score";

import UpgradeModule from "../ignition/modules/test/UpgradeTest";

describe("Proxy", function () {
    async function deploy() {

        const { instance, proxy } = await hre.ignition.deploy(HighScoreModule, {
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
        it("Should preserve scores set before the upgrade", async function () {
            const { instance, proxy, owner, otherAccount } = await loadFixture(deploy);

            const nonce = "2d547b6b-a87d-4298-9358-a08990a4f878";
            const player = otherAccount.address;
            const score = 100_000;

            const backendSigner = new ethers.Wallet(backendPk, hre.ethers.provider);
            const message = new ScoreMessage(player, score, nonce);
            const proxyAddress = await instance.getAddress();
            const signature = await signMessageWithEIP712(backendSigner, message, proxyAddress);
            await instance.addScore(message, signature);
            expect(await instance.scores(player)).to.equal(score);

            const { upgradedProxy } = await hre.ignition.deploy(UpgradeModule,
                {
                    parameters: {
                        UpgradeTestModule: {
                            proxyAddress: proxyAddress
                        }
                    }
                }
            );

            const scoreAfterUpgrade = await upgradedProxy.scores(player);
            expect(scoreAfterUpgrade).to.equal(score);
        });
    });
});