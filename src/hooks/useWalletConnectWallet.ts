import { useState, useEffect, useCallback, useRef } from "react";
import SignClient from "@walletconnect/sign-client";
import { WalletConnectModal } from "@walletconnect/modal";

const WALLET_STORAGE_KEY = "wc_wallet_address";
const WC_PROJECT_ID = "01ac749bf63441041383f10bae35687c";

// Voi Network chain ID derived from genesis hash
const VOI_CHAIN = "algorand:r20fSQI8gWe_kFZziNonSPCXLwcQmH_n";

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

let walletConnectModal: WalletConnectModal | null = null;

const getModal = () => {
  if (!walletConnectModal) {
    walletConnectModal = new WalletConnectModal({
      projectId: WC_PROJECT_ID,
      chains: [VOI_CHAIN],
      themeMode: "dark",
      themeVariables: {
        "--wcm-z-index": "1000",
      },
    });
  }
  return walletConnectModal;
};

export const useWalletConnectWallet = () => {
  const [accountAddress, setAccountAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [signClient, setSignClient] = useState<SignClient | null>(null);
  const [sessionTopic, setSessionTopic] = useState<string | null>(null);
  const initializingRef = useRef(false);

  // Initialize SignClient
  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    const init = async () => {
      try {
        const client = await SignClient.init({
          projectId: WC_PROJECT_ID,
          metadata: {
            name: "Super Bowl Prediction Market",
            description: "VOI-powered Super Bowl LX prediction market",
            url: window.location.origin,
            icons: [`${window.location.origin}/favicon.ico`],
          },
        });

        setSignClient(client);

        // Check for existing sessions
        const sessions = client.session.getAll();
        if (sessions.length > 0) {
          const lastSession = sessions[sessions.length - 1];
          const accounts = lastSession.namespaces?.algorand?.accounts || [];
          if (accounts.length > 0) {
            // Format is "algorand:mainnet-v1.0:ADDRESS"
            const address = accounts[0].split(":").pop() || "";
            setAccountAddress(address);
            setSessionTopic(lastSession.topic);
            localStorage.setItem(WALLET_STORAGE_KEY, address);
          }
        } else {
          // Check local storage for cached address
          const savedAddress = localStorage.getItem(WALLET_STORAGE_KEY);
          if (savedAddress) {
            // No active session but cached address — clear it
            localStorage.removeItem(WALLET_STORAGE_KEY);
          }
        }

        // Listen for session deletions
        client.on("session_delete", () => {
          setAccountAddress(null);
          setSessionTopic(null);
          localStorage.removeItem(WALLET_STORAGE_KEY);
        });
      } catch (error) {
        console.error("WalletConnect init failed:", error);
      }
    };

    init();
  }, []);

  const connect = useCallback(async () => {
    if (!signClient) {
      console.error("SignClient not initialized yet");
      return;
    }

    setIsConnecting(true);
    try {
      const { uri, approval } = await signClient.connect({
        optionalNamespaces: {
          algorand: {
            methods: ["algo_signTxn"],
            chains: [VOI_CHAIN],
            events: [],
          },
        },
      });

      if (uri) {
        const modal = getModal();
        await modal.openModal({ uri });

        const session = await approval();
        modal.closeModal();

        const accounts = session.namespaces?.algorand?.accounts || [];
        if (accounts.length > 0) {
          const address = accounts[0].split(":").pop() || "";
          setAccountAddress(address);
          setSessionTopic(session.topic);
          localStorage.setItem(WALLET_STORAGE_KEY, address);
        }
      }
    } catch (error: any) {
      console.error("WalletConnect connection failed:", error);
      const modal = getModal();
      modal.closeModal();
    } finally {
      setIsConnecting(false);
    }
  }, [signClient]);

  const disconnect = useCallback(async () => {
    if (signClient && sessionTopic) {
      try {
        await signClient.disconnect({
          topic: sessionTopic,
          reason: { code: 6000, message: "User disconnected" },
        });
      } catch (error) {
        console.error("WalletConnect disconnect error:", error);
      }
    }
    setAccountAddress(null);
    setSessionTopic(null);
    localStorage.removeItem(WALLET_STORAGE_KEY);
  }, [signClient, sessionTopic]);

  const signTransactions = useCallback(
    async (txns: Uint8Array[]): Promise<Uint8Array[]> => {
      if (!signClient || !sessionTopic) {
        throw new Error("WalletConnect session not active");
      }

      // Build the algo_signTxn request
      const txnObjects = txns.map((txn) => ({
        txn: uint8ArrayToBase64(txn),
      }));

      const result = await signClient.request<(string | null)[]>({
        topic: sessionTopic,
        chainId: VOI_CHAIN,
        request: {
          method: "algo_signTxn",
          params: [txnObjects],
        },
      });

      return result
        .filter((stxn): stxn is string => stxn !== null)
        .map((stxn) => base64ToUint8Array(stxn));
    },
    [signClient, sessionTopic]
  );

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const postTransactions = useCallback(
    async (stxns: Uint8Array[]): Promise<string[]> => {
      const { getAlgodClient } = await import("@/lib/voi");
      const algod = getAlgodClient();

      console.log("[postTransactions] Submitting", stxns.length, "signed txn(s), byte lengths:", stxns.map(s => s.length));

      // Concatenate all signed transactions into a single Uint8Array
      // so grouped transactions are submitted atomically
      const totalLength = stxns.reduce((acc, stxn) => acc + stxn.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const stxn of stxns) {
        combined.set(stxn, offset);
        offset += stxn.length;
      }

      console.log("[postTransactions] Combined payload size:", combined.length, "bytes");

      const response = await algod.sendRawTransaction(combined).do();
      console.log("[postTransactions] sendRawTransaction response:", JSON.stringify(response));

      const txId = (response as any).txid ?? (response as any).txId ?? "";
      console.log("[postTransactions] Extracted txId:", txId);

      return [txId];
    },
    []
  );

  return {
    accountAddress,
    isConnecting,
    isConnected: !!accountAddress,
    connect,
    disconnect,
    signTransactions,
    postTransactions,
    shortenAddress,
  };
};
