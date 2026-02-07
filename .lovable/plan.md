
# Go Live: Connect Frontend to Deployed Contract (App ID 48634015)

## Overview
Update the frontend to connect to the deployed smart contract on the Voi Network. This involves setting the App ID, fixing algosdk v3 API compatibility issues in the market contract hook, and removing the demo mode fallback.

## Changes

### 1. Set the deployed App ID
**File:** `src/lib/voi.ts`
- Change `APP_ID` from `0` to `48634015`
- This single change activates live contract reading (removes demo mode banner, enables real state polling)

### 2. Fix algosdk v3 API compatibility in useMarketContract
**File:** `src/hooks/useMarketContract.ts`

The current `fetchMarketState` function uses algosdk v2 conventions that are incompatible with the installed algosdk v3. The following fixes are needed:

- **Global state access:** Change `appInfo.params?.["global-state"]` to `appInfo.params?.globalState` (v3 uses typed objects with camelCase properties instead of raw JSON)
- **Key decoding:** Change `atob(kv.key)` to `new TextDecoder().decode(kv.key)` (v3 returns `Uint8Array` keys instead of base64 strings)
- **Value reading:** Change `kv.value.uint || 0` to `Number(kv.value.uint ?? 0n)` (v3 returns `bigint` values)

### 3. Remove demo mode UI elements
**File:** `src/pages/Index.tsx`
- Remove the mock state logic (`mockSeahawksProb`, `setMockSeahawksProb`) since the contract is now live
- Remove the demo purchase simulation in `handleBuy`
- Remove the "smart contract not yet deployed" banner
- Pass live contract data directly to TeamCard components

### 4. Update TeamCard buy button states
**File:** `src/components/TeamCard.tsx`
- Since `isDeployed` will now always be `true`, simplify the disabled state and button text logic
- Remove "Coming Soon" label — the button should say "Buy [Team] Shares" when wallet is connected

## Technical Details

### algosdk v3 Global State Structure
In algosdk v3, `getApplicationByID(id).do()` returns an `Application` object:
- `appInfo.params.globalState` is a `TealKeyValue[]`
- Each item has `.key` (Uint8Array) and `.value` with `.uint` (bigint) and `.bytes` (Uint8Array)

### Transaction Building
The existing `buildBuySharesTxn` and `buildClaimWinningsTxn` functions use `makePaymentTxnWithSuggestedParamsFromObject`, `makeApplicationCallTxnFromObject`, `assignGroupID`, and `encodeUnsignedTransaction` -- all of which still exist in algosdk v3 with compatible signatures. No changes needed for transaction building.

### Polling
The 15-second polling interval for `fetchMarketState` will activate automatically once `APP_ID > 0`.
