import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { toast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ConnectWallet = () => {
  const {
    accountAddress,
    isConnected,
    wallets,
    activeWallet,
    disconnect,
    shortenAddress,
  } = useWallet();

  const [connectingId, setConnectingId] = useState<string | null>(null);
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

  const handleConnect = async (wallet: (typeof wallets)[number]) => {
    setConnectingId(wallet.id);
    try {
      await wallet.connect();
    } catch {
      toast({
        title: "Connection Failed",
        description: `Could not connect to ${wallet.metadata.name}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setConnectingId(null);
    }
  };

  if (isConnected && accountAddress && activeWallet) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-2">
          {activeWallet.metadata.icon && (
            <img
              src={activeWallet.metadata.icon}
              alt={activeWallet.metadata.name}
              className="w-4 h-4"
            />
          )}
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-seahawks hover:bg-seahawks/90 text-primary-foreground font-semibold">
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {wallets.map((wallet) => (
          <DropdownMenuItem
            key={wallet.id}
            onClick={() => handleConnect(wallet)}
            disabled={connectingId === wallet.id}
            className="flex items-center gap-3 cursor-pointer py-3"
          >
            {wallet.metadata.icon && (
              <img
                src={wallet.metadata.icon}
                alt={wallet.metadata.name}
                className="w-5 h-5 flex-shrink-0"
              />
            )}
            <span className="font-medium">
              {connectingId === wallet.id
                ? "Connecting..."
                : wallet.metadata.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
