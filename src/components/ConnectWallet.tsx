import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "@/hooks/use-toast";

export const ConnectWallet = () => {
  const {
    accountAddress,
    isConnecting,
    isConnected,
    connect,
    disconnect,
    shortenAddress,
  } = useWallet();

  const wasConnected = useRef(isConnected);

  useEffect(() => {
    if (isConnected && !wasConnected.current && accountAddress) {
      toast({
        title: "Wallet Connected",
        description: `Connected as ${shortenAddress(accountAddress)}`,
      });
    }
    if (!isConnected && wasConnected.current) {
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected.",
      });
    }
    wasConnected.current = isConnected;
  }, [isConnected, accountAddress]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch {
      toast({
        title: "Connection Failed",
        description: "Could not connect to Voi Wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isConnected && accountAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-seahawks" />
          <span className="text-foreground font-medium text-sm">
            {shortenAddress(accountAddress)}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={disconnect}
          className="text-muted-foreground hover:text-accent"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      className="bg-seahawks hover:bg-seahawks/90 text-primary-foreground font-semibold"
    >
      <Wallet className="w-4 h-4 mr-2" />
      {isConnecting ? "Connecting..." : "Connect Voi Wallet"}
    </Button>
  );
};
