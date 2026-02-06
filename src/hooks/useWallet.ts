import { useState, useCallback, useEffect } from "react";
import { useKibisisWallet } from "./useKibisisWallet";
import { useWalletConnectWallet } from "./useWalletConnectWallet";
import algosdk from "algosdk";
import { getAlgodClient } from "@/lib/voi";

export type WalletProvider = "kibisis" | "voi-wallet" | null;

const ACTIVE_PROVIDER_KEY = "active_wallet_provider";

export const useWallet = () => {
  const kibisis = useKibisisWallet();
  const walletConnect = useWalletConnectWallet();

  const [activeProvider, setActiveProvider] = useState<WalletProvider>(() => {
    return (localStorage.getItem(ACTIVE_PROVIDER_KEY) as WalletProvider) || null;
  });

  // Derive state from active provider
  const activeWallet = activeProvider === "kibisis" ? kibisis : activeProvider === "voi-wallet" ? walletConnect : null;

  const accountAddress = activeWallet?.accountAddress || null;
  const isConnected = activeWallet?.isConnected || false;
  const isConnecting = kibisis.isConnecting || walletConnect.isConnecting;

  // Auto-detect if stored provider lost its session
  useEffect(() => {
    if (activeProvider && activeWallet && !activeWallet.isConnected) {
      // Provider was saved but session is gone — clear
      setActiveProvider(null);
      localStorage.removeItem(ACTIVE_PROVIDER_KEY);
    }
  }, [activeProvider, activeWallet?.isConnected]);

  const connectKibisis = useCallback(async () => {
    await kibisis.connect();
    setActiveProvider("kibisis");
    localStorage.setItem(ACTIVE_PROVIDER_KEY, "kibisis");
  }, [kibisis.connect]);

  const connectVoiWallet = useCallback(async () => {
    await walletConnect.connect();
    setActiveProvider("voi-wallet");
    localStorage.setItem(ACTIVE_PROVIDER_KEY, "voi-wallet");
  }, [walletConnect.connect]);

  const disconnect = useCallback(async () => {
    if (activeProvider === "kibisis") {
      await kibisis.disconnect();
    } else if (activeProvider === "voi-wallet") {
      await walletConnect.disconnect();
    }
    setActiveProvider(null);
    localStorage.removeItem(ACTIVE_PROVIDER_KEY);
  }, [activeProvider, kibisis.disconnect, walletConnect.disconnect]);

  const signTransactions = useCallback(
    async (txns: Uint8Array[]): Promise<Uint8Array[]> => {
      if (activeProvider === "kibisis") {
        return kibisis.signTransactions(txns);
      } else if (activeProvider === "voi-wallet") {
        return walletConnect.signTransactions(txns);
      }
      throw new Error("No wallet connected");
    },
    [activeProvider, kibisis.signTransactions, walletConnect.signTransactions]
  );

  const postTransactions = useCallback(
    async (stxns: Uint8Array[]): Promise<string[]> => {
      if (activeProvider === "kibisis" && kibisis.postTransactions) {
        return kibisis.postTransactions(stxns);
      }
      // For WalletConnect, we submit via algod directly
      const algod = getAlgodClient();
      const txIds: string[] = [];
      for (const stxn of stxns) {
        const response = await algod.sendRawTransaction(stxn).do();
        txIds.push(response.txid);
      }
      return txIds;
    },
    [activeProvider, kibisis.postTransactions]
  );

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return {
    accountAddress,
    isConnected,
    isConnecting,
    activeProvider,
    kibisisAvailable: kibisis.isAvailable,
    connectKibisis,
    connectVoiWallet,
    disconnect,
    signTransactions,
    postTransactions,
    shortenAddress,
  };
};
