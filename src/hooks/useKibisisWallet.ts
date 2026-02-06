import { useState, useEffect, useCallback } from "react";

const WALLET_STORAGE_KEY = "kibisis_wallet_address";

// Browser-safe base64 helpers
const uint8ArrayToBase64 = (arr: Uint8Array): string => {
  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
};

export const useKibisisWallet = () => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    // Check for Kibisis availability
    const checkProvider = () => {
      setIsAvailable(!!window.algorand);
    };

    // Check immediately and on a short delay (extension may inject late)
    checkProvider();
    const timer = setTimeout(checkProvider, 1000);

    // Restore saved session
    const savedAddress = localStorage.getItem(WALLET_STORAGE_KEY);
    if (savedAddress) {
      setAccountAddress(savedAddress);
    }

    return () => clearTimeout(timer);
  }, []);

  const connect = useCallback(async () => {
    if (!window.algorand) {
      window.open(
        "https://chromewebstore.google.com/detail/kibisis/hcgejekffjilpgbommjoklpneekbkajb",
        "_blank"
      );
      return;
    }

    setIsConnecting(true);
    try {
      const result = await window.algorand.enable("kibisis");
      if (result.accounts && result.accounts.length > 0) {
        const address = result.accounts[0].address;
        setAccountAddress(address);
        localStorage.setItem(WALLET_STORAGE_KEY, address);
      }
    } catch (error) {
      console.error("Kibisis connection failed:", error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (window.algorand?.disable) {
        await window.algorand.disable("kibisis");
      }
    } catch (error) {
      console.error("Kibisis disconnect error:", error);
    }
    setAccountAddress(null);
    localStorage.removeItem(WALLET_STORAGE_KEY);
  }, []);

  const signTransactions = useCallback(
    async (txns: Uint8Array[]): Promise<Uint8Array[]> => {
      if (!window.algorand) {
        throw new Error("Kibisis wallet not available");
      }

      // Convert unsigned transactions to base64 (browser-safe)
      const txnObjects = txns.map((txn) => ({
        txn: uint8ArrayToBase64(txn),
      }));

      const signedTxns = await window.algorand.signTxns({ txns: txnObjects });

      // Convert signed transactions back to Uint8Array
      return signedTxns
        .filter((stxn): stxn is string => stxn !== null)
        .map((stxn) => base64ToUint8Array(stxn));
    },
    []
  );

  const postTransactions = useCallback(
    async (stxns: Uint8Array[]): Promise<string[]> => {
      if (!window.algorand) {
        throw new Error("Kibisis wallet not available");
      }

      const stxnStrings = stxns.map((stxn) => uint8ArrayToBase64(stxn));

      const result = await window.algorand.postTxns({ stxns: stxnStrings });
      return result.txnIDs;
    },
    []
  );

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return {
    accountAddress,
    isConnecting,
    isConnected: !!accountAddress,
    isAvailable,
    connect,
    disconnect,
    signTransactions,
    postTransactions,
    shortenAddress,
  };
};
