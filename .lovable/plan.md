

## Fix Box MBR Cost and Claim Fee Pooling

### Problem 1: Box MBR Not Covered on First Purchase

When a user buys shares for the first time, the contract creates a new box to store their balance. This increases the application account's Minimum Balance Requirement (MBR). On Voi/Algorand, box MBR is calculated as:

```text
MBR = 2,500 + 400 * (key_length + value_length) microVoi
    = 2,500 + 400 * (44 + 8)
    = 23,300 microVoi  (~0.0233 VOI)
```

Currently, `buildBuySharesTxn` only sends the share price in the payment transaction. If it's the user's first purchase for that team, the contract needs extra balance to cover the new box's MBR. Without it, the contract will reject the transaction with a "below min balance" error.

### Problem 2: Insufficient Fee Pooling for `claim_winnings`

The `claim_winnings` contract method performs an inner payment transaction to send winnings back to the user. Inner transactions require fee coverage via "fee pooling" from the outer transaction. The current fee of 2,000 microVoi (2x minimum) covers:
- 1,000 for the app call itself
- 1,000 for one inner transaction

If the contract also deletes/clears boxes (to reclaim MBR), additional inner operations may need fee coverage. The fee should be increased to safely cover the app call plus all inner transactions.

---

### Changes

**1. `src/hooks/useMarketContract.ts` -- Add box existence check and MBR padding**

- Add a helper function `boxExists(algod, prefix, address)` that checks whether a user's balance box already exists (returns true/false instead of throwing on 404).
- In `buildBuySharesTxn`: before building the payment, check if the user's box for the chosen team already exists. If not, add 23,300 microVoi (the box MBR) to the payment amount so the contract has enough balance to create the box.
- In `buildClaimWinningsTxn`: increase the flat fee from 2,000 to 3,000 microVoi to safely cover the app call fee plus inner payment fee plus potential box deletion.

**2. `src/components/ConfirmTransactionModal.tsx` -- Reflect actual fees**

- Update the network fee display to account for the potential box MBR cost on first purchase. Show the fee breakdown more accurately:
  - Base network fee: ~0.003 VOI (two transactions in group)
  - First-purchase surcharge: +0.0233 VOI (box storage deposit, shown only when applicable)
- Accept a new optional prop `isFirstPurchase` to control whether the box MBR line is shown.

**3. `src/pages/Index.tsx` -- Pass first-purchase flag to modal**

- Before opening the confirmation modal in `handleBuyRequest`, determine if this is the user's first purchase for the selected team by checking `userBalances.seaShares === 0n` or `userBalances.patShares === 0n`.
- Pass this flag through to the confirmation modal so the fee display is accurate.

---

### Technical Details

Box existence check (new helper):

```typescript
const boxExists = async (
  algod: algosdk.Algodv2,
  prefix: string,
  address: string
): Promise<boolean> => {
  try {
    const publicKey = algosdk.decodeAddress(address).publicKey;
    const boxName = new Uint8Array([
      ...new TextEncoder().encode(prefix),
      ...publicKey,
    ]);
    await algod.getApplicationBoxByName(APP_ID, boxName).do();
    return true;
  } catch {
    return false;
  }
};
```

Updated payment calculation in `buildBuySharesTxn`:

```text
paymentAmount = shareCost + (boxExists ? 0 : BOX_MBR)
where BOX_MBR = 23_300 microVoi
```

Updated fee in `buildClaimWinningsTxn`:

```text
fee = 3_000  (was 2_000)
  - 1,000 for the app call
  - 1,000 for the inner payment to user
  - 1,000 for potential box deletion / safety margin
```

Fee constant definitions to add at top of file:

```text
BOX_MBR = 23_300 microVoi   (box creation deposit)
BUY_FEE = 2_000 microVoi    (app call fee, covers 2 txns)
CLAIM_FEE = 3_000 microVoi  (app call + inner payment + margin)
```
