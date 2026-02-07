import { useCallback } from "react";
import { useWallet as useWalletLib } from "@txnlab/use-wallet-react";
import type { Wallet } from "@txnlab/use-wallet-react";

export type { Wallet };

export const useWallet = () => {
  const {
    wallets,
    activeWallet,
    activeAddress,
    signTransactions: libSignTransactions,
    isReady,
  } = useWalletLib();

  const signTransactions = useCallback(
    async (txns: Uint8Array[]): Promise<Uint8Array[]> => {
      const result = await libSignTransactions(txns);
      // Filter out nulls (unsigned txns) and return
      return result.filter((stxn): stxn is Uint8Array => stxn !== null);
    },
    [libSignTransactions]
  );

  const postTransactions = useCallback(
    async (stxns: Uint8Array[]): Promise<string[]> => {
      const { getAlgodClient } = await import("@/lib/voi");
      const algod = getAlgodClient();

      // Concatenate all signed transactions into a single Uint8Array
      // so grouped transactions are submitted atomically
      const totalLength = stxns.reduce((acc, stxn) => acc + stxn.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const stxn of stxns) {
        combined.set(stxn, offset);
        offset += stxn.length;
      }

      try {
        const response = await algod.sendRawTransaction(combined).do();
        const txId = (response as any).txid ?? (response as any).txId ?? "";
        return [txId];
      } catch (err: any) {
        const body = err?.response?.body ?? err?.body;
        const statusCode = err?.response?.statusCode ?? err?.status;
        console.error("[postTransactions] RAW CHAIN ERROR:", {
          message: err?.message,
          statusCode,
          body: body ? JSON.stringify(body) : undefined,
          fullError: String(err),
        });
        throw err;
      }
    },
    []
  );

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return {
    accountAddress: activeAddress,
    isConnected: !!activeAddress,
    isConnecting: false,
    isReady,
    wallets,
    activeWallet,
    connect: async () => {}, // Handled per-wallet via wallets[].connect()
    disconnect: async () => {
      if (activeWallet) await activeWallet.disconnect();
    },
    signTransactions,
    postTransactions,
    shortenAddress,
  };
};
