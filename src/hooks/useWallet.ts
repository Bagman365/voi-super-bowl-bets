import { useWalletContext } from "@/contexts/WalletContext";

export const useWallet = () => {
  return useWalletContext();
};
