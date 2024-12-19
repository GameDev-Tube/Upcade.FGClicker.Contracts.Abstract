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

3. Verify deployed contracts, replacing `$DEPLOYED_PROXY_ADDRESS`:
    ```
    npx hardhat verify --network abstractTestnet $DEPLOYED_PROXY_ADDRESS
    ```

#### Other chains
1. Create and configure a `.env` file as shown in the `.env.example`
2. Execute the following command in your terminal, replacing `$NETWORK$` with one of the networks listed below:
    ```bash
    npx hardhat ignition deploy ignition/modules/PepenadeCrush.ts --network $NETWORK$ --verify
    ```

Configured networks:
- `alephZeroEvmTestnet`
- `zetachainTestnet`
- `alephZeroEvmMainnet`
- `zetachainMainnet `