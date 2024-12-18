# Upcade.FGClicker.Score

Solidity smart contract for Fea&Greed: Pepenade Crush minigame, that allows players to store their high scores on the blockchain.
It uses `@openzeppelin`'s EIP-712 implementation to provide a safe way for users to store backend-validated data.
The contract is UUPS upgradeable.

### 🚧 WIP NOTICE 🚧 
Things still missing:
1. Abstract compilation and deployment ⚠️


### Tests
```bash
npx hardhat test
```

### Deployment and verification
1. Create and configure a `.env` file as shown in the `.env.example`
2. Execute the following command in your terminal, replacing `$NETWORK$` with one of the networks listed below:
    ```
    npx hardhat ignition deploy ignition/modules/Score.ts --network $NETWORK$ --verify
    ```

Configured networks:
- `alephZeroEvmTestnet`
- `zetachainTestnet`
- `alephZeroEvmMainnet`
- `zetachainMainnet `
- `abstractTestnet` - DOESN'T WORK YET