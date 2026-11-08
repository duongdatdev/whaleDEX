# BalanceManager contract for the web client

WHA-11 adds a Testnet-only adapter for account-owned DeepBookV3 `BalanceManager` objects.
DeepBook needs a `BalanceManager` for order, deposit, and withdraw flows; swaps are an
exception. See the [DeepBook contract documentation](https://docs.sui.io/onchain-finance/deepbook/deepbookv3/contract-information/balance-manager)
and the [TypeScript SDK guide](https://docs.sui.io/onchain-finance/deepbook/deepbookv3-sdk/balance-manager).

## Web client API

- `buildCreateBalanceManagerTransaction(client, owner)` returns a create-and-share
  transaction with `owner` as sender. The web wallet must sign and execute it. The helper
  never receives a signer or private key.
- After chain confirmation, call `extractCreatedBalanceManagerId(client, result)` with the
  wallet execution result. It verifies the Testnet package and finds only a newly created
  `BalanceManager` type in the transaction effects. Persist that ID and call
  `verifyBalanceManager(client, owner, id)` before using it.
- To make a manager discoverable through the DeepBook registry, build and have the wallet
  sign `buildRegisterBalanceManagerTransaction(client, owner, id)`. Then
  `findOwnedBalanceManagers(client, owner)` reads registry-listed IDs and verifies each
  deployment, type, shared state, and Move `owner()`.
- Before using an explicit manager ID, call `verifyBalanceManager(client, owner, id)`.
  A manager whose on-chain Move owner differs from the connected account is rejected, even
  if it has a valid DeepBook object type.
- If a future order flow uses a capability, call
  `verifyBalanceManagerCapability(client, owner, managerId, capabilityId, kind)`. The
  capability must have the expected Testnet package/type, belong to the connected address,
  and encode the selected manager ID.

## Required client behavior

1. Re-run discovery after account or network changes. The registry can omit a newly created
   manager until it is registered, so persist the ID from transaction effects as a fallback.
   Mainnet and a Testnet SDK package mismatch fail closed.
2. Do not trust a manager ID entered by the user, loaded from local storage, or supplied by
   an API without re-verifying its on-chain type and Move owner.
3. Keep signing in the connected Sui wallet. The API must not create, sign, or submit a
   transaction for the user.
4. Treat verification as a gate for order/deposit/withdraw UI. A verification error disables
   those actions and preserves the error for retry; it does not affect the existing direct
   wallet swap flow.

## Current evidence and limits

Automated tests use fixtures for Testnet package metadata, manager owner simulations, and
capability BCS. No manager has been created or verified on-chain with a real wallet in this
task. The web UI does not yet expose manager setup, deposits, withdrawals, or limit orders;
those remain separate slices. Keep WHA-11 In Progress until real Testnet evidence and peer
review are recorded.
