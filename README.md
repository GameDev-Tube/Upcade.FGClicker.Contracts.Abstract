# Upcade.FGClicker.Score

Solidity smart contract for Fea&Greed: Pepenade Crush minigame, that allows players to store their high scores on the blockchain.
It uses `@openzeppelin`'s EIP-712 implementation to provide a safe way for users to store backend-validated data.
The contract is UUPS upgradeable.

### Tests
1. Execute the following command in your terminal:
    ```bash
    npx hardhat test
    ```
### Deployment and verification

#### Abstract Testnet
Zksync chains are not yet supported by ignition.
1. Create and configure a `.env` file as shown in the `.env.example`
2. Compile and deploy using `deploy/zksync.ts` script:
    ```bash
    npx hardhat deploy-zksync --script zksync.ts --network abstractTestnet
    ```

3. Verify deployed contracts, create and configure $PROXY_ADDRESS, $IMPLEMENTATION_ADDRESS and $CONTRACT_PATH in `.env` file
4. Verify using deploy/verify.ts
    ```
    npx hardhat deploy-zksync --script verify.ts --network abstractTestnet
    ```
