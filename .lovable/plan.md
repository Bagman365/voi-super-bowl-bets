

## Streamline Wallet to Voi Wallet Only

Since you don't need Kibisis support, this plan replaces the dual-wallet system with a single, focused Voi Wallet integration that works correctly.

### What's Wrong Now

The current WalletConnect setup uses `algorand:mainnet-v1.0` as the chain ID, which is wrong for the Voi Network. The Voi Wallet expects `algorand:r20fSQI8gWe_kFZziNonSPCXLwcQmH_n` (derived from the Voi genesis hash). This mismatch is why connecting fails with a "Project not found" or session rejection error. Additionally, the WalletConnect Project ID is invalid/unregistered.

### What Changes

1. **Remove Kibisis** -- Delete the Kibisis wallet hook and its type definitions since you don't need it.

2. **Fix the WalletConnect hook** -- Update `useWalletConnectWallet.ts` with:
   - Correct Voi chain ID: `algorand:r20fSQI8gWe_kFZziNonSPCXLwcQmH_n`
   - Correct WalletConnect methods matching what Voi Wallet expects: `algo_signTxn`
   - Account format matching: `algorand:r20fSQI8gWe_kFZziNonSPCXLwcQmH_n:ADDRESS`

3. **Simplify the wallet abstraction** -- Rewrite `useWallet.ts` to only wrap the WalletConnect wallet (no more provider switching logic). Keep the same external interface so nothing else breaks.

4. **Simplify the Connect button** -- Replace the dropdown menu in `ConnectWallet.tsx` with a single "Connect Voi Wallet" button (no provider selection needed).

5. **WalletConnect Project ID** -- You'll still need a valid Project ID from [cloud.walletconnect.com](https://cloud.walletconnect.com). The current one is invalid. Once you have it, I'll swap it in.

### What Stays the Same

- The `useMarketContract` hook, transaction building, and all market logic remain untouched
- The wallet interface (`signTransactions`, `postTransactions`, `shortenAddress`) keeps the same shape
- `Index.tsx` and all other pages/components require no changes

---

### Technical Details

**Files to delete:**
- `src/hooks/useKibisisWallet.ts`
- `src/hooks/usePeraWallet.ts` (unused legacy file)
- `src/types/kibisis.d.ts`

**Files to modify:**

`src/hooks/useWalletConnectWallet.ts`:
- Change `VOI_CHAIN` from `"algorand:mainnet-v1.0"` to `"algorand:r20fSQI8gWe_kFZziNonSPCXLwcQmH_n"`
- Update `requiredNamespaces` to include the correct chain and methods (`algo_signTxn`)
- Update address parsing to handle the new chain ID format in account strings
- Add `postTransactions` method (submit via algod, matching existing pattern)

`src/hooks/useWallet.ts`:
- Remove Kibisis imports and provider-switching logic
- Wrap only `useWalletConnectWallet` directly
- Keep the same return interface (`accountAddress`, `isConnected`, `signTransactions`, `postTransactions`, `shortenAddress`, etc.)

`src/components/ConnectWallet.tsx`:
- Remove dropdown menu and Kibisis option
- Single button: "Connect Voi Wallet" that calls `connect()` directly
- Remove `kibisisAvailable` and `activeProvider` references
- Keep the connected state display (address + disconnect)

