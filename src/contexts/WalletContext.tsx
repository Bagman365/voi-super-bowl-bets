import { useMemo } from "react";
import {
  WalletManager,
  WalletId,
  WalletProvider,
} from "@txnlab/use-wallet-react";
import { VOI_NETWORK } from "@/lib/voi";

const WC_PROJECT_ID = "01ac749bf63441041383f10bae35687c";

// Voi Network ID for use-wallet (derived from genesis hash)
const VOI_NETWORK_ID = "voimain";

export const WalletContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const walletManager = useMemo(() => {
    return new WalletManager({
      wallets: [
        WalletId.KIBISIS,
        {
          id: WalletId.LUTE,
          options: { siteName: "Flowbet" },
        },
        {
          id: WalletId.WALLETCONNECT,
          options: {
            projectId: WC_PROJECT_ID,
            metadata: {
              name: "Flowbet",
              description: "VOI-powered Super Bowl LX prediction market",
              url: window.location.origin,
              icons: [`${window.location.origin}/favicon.ico`],
            },
            themeMode: "dark" as const,
          },
        },
      ],
      defaultNetwork: VOI_NETWORK_ID,
      networks: {
        [VOI_NETWORK_ID]: {
          algod: {
            baseServer: VOI_NETWORK.algodUrl,
            port: VOI_NETWORK.algodPort,
            token: VOI_NETWORK.algodToken,
          },
        },
      },
    });
  }, []);

  return (
    <WalletProvider manager={walletManager}>{children}</WalletProvider>
  );
};
