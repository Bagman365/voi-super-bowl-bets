

## Increase Transaction Fees for Box Storage

The `buy_shares` and `claim_winnings` transactions fail on-chain because the app call fee doesn't cover the box storage MBR (Minimum Balance Requirement). The fix is to set the app call transaction fee to 0.002 VOI (2000 microVOI) instead of the default 0.001 VOI.

### What changes

**File: `src/hooks/useMarketContract.ts`**

1. **`buildBuySharesTxn`** -- After getting `suggestedParams`, create a copy for the app call with `flatFee: true` and `fee: 2000` (0.002 VOI). The payment transaction keeps the default fee.

2. **`buildClaimWinningsTxn`** -- Same adjustment: set the app call fee to 2000 microVOI with `flatFee: true` to cover box reads during the claim.

### Technical details

```text
Current:  suggestedParams.fee = ~1000 (0.001 VOI default)
Proposed: appCallParams.fee = 2000 (0.002 VOI), appCallParams.flatFee = true
```

The `flatFee` flag tells algosdk to use the exact fee value rather than computing it from the transaction size. This ensures the 0.002 VOI fee is sent regardless of transaction byte length.

Both transactions in the buy group (pay + app call) still use the same base `suggestedParams` for consensus fields (genesis, first/last round, etc.) -- only the fee on the app call is overridden.

