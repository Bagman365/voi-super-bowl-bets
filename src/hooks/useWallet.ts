import { useWalletConnectWallet } from "./useWalletConnectWallet";

export const useWallet = () => {
  const wallet = useWalletConnectWallet();

  return {
    accountAddress: wallet.accountAddress,
    isConnected: wallet.isConnected,
    isConnecting: wallet.isConnecting,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    signTransactions: wallet.signTransactions,
    postTransactions: wallet.postTransactions,
    shortenAddress: wallet.shortenAddress,
  };
};
