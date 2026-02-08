

## Fix: Shared Wallet State via React Context

### Problem
`useWalletConnectWallet()` uses local `useState` for `accountAddress`, `signClient`, etc. Every component that calls `useWallet()` gets its own independent copy of this state. When `ConnectWallet` connects and updates its local state, the `Index` page's separate state stays stale -- so the buy buttons still show "Connect Wallet to Buy."

### Solution
Wrap the wallet logic in a React Context provider so all components share one single source of truth for wallet state.

### Changes

**1. Create `src/contexts/WalletContext.tsx` (new file)**
- Move all the logic currently in `useWalletConnectWallet.ts` into a `WalletProvider` component
- Store `accountAddress`, `isConnecting`, `signClient`, `sessionTopic` in the provider's state
- Expose values and actions (`connect`, `disconnect`, `signTransactions`, `postTransactions`, `shortenAddress`) via React Context
- Export a `useWalletContext` hook that reads from the context

**2. Update `src/hooks/useWallet.ts`**
- Replace the current implementation (which calls `useWalletConnectWallet()`) with a thin wrapper that calls `useWalletContext()` from the new context
- The return shape stays identical, so no downstream changes are needed

**3. Update `src/main.tsx` (or `src/App.tsx`)**
- Wrap the app tree with `<WalletProvider>` so all components share the same wallet state

**4. `src/hooks/useWalletConnectWallet.ts` -- no changes needed**
- This file can remain as-is or be deprecated; the logic will live in the context provider instead

### Why This Works
With a single `WalletProvider` at the app root, every call to `useWallet()` reads from the same shared state. When the wallet connects inside `ConnectWallet`, the context updates, which triggers a re-render in `Index` (and any other consumer), immediately reflecting `isConnected = true` and updating the buy buttons.

### Technical Details

The context provider structure:

```text
+---------------------------+
|       WalletProvider      |
|  (single source of truth) |
|                           |
|  accountAddress           |
|  isConnecting             |
|  signClient               |
|  sessionTopic             |
|  connect / disconnect     |
|  signTransactions         |
|  postTransactions         |
+---------------------------+
       |              |
  ConnectWallet     Index
  (useWallet)     (useWallet)
       |              |
  Same state <-----> Same state
```

No changes needed to `ConnectWallet.tsx`, `Index.tsx`, `TeamCard.tsx`, or `useMarketContract.ts` -- they all consume `useWallet()` which will transparently switch to using the shared context.

