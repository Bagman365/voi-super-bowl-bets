import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ConnectWallet = () => {
  const {
    accountAddress,
    isConnecting,
    isConnected,
    activeProvider,
    kibisisAvailable,
    connectKibisis,
    connectVoiWallet,
    disconnect,
    shortenAddress,
  } = useWallet();

  if (isConnected && accountAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className="bg-card border border-border rounded-lg px-4 py-2 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-seahawks" />
          <span className="text-foreground font-medium text-sm">
            {shortenAddress(accountAddress)}
          </span>
          {activeProvider && (
            <span className="text-muted-foreground text-xs">
              ({activeProvider === "kibisis" ? "Kibisis" : "Voi"})
            </span>
          )}
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
        <Button
          disabled={isConnecting}
          className="bg-seahawks hover:bg-seahawks/90 text-primary-foreground font-semibold"
        >
          <Wallet className="w-4 h-4 mr-2" />
          {isConnecting ? "Connecting..." : "Connect Wallet"}
          <ChevronDown className="w-4 h-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={connectKibisis}
          className="cursor-pointer flex items-center gap-3 py-3"
        >
          <div className="w-8 h-8 rounded-lg bg-seahawks/20 flex items-center justify-center">
            <span className="text-seahawks font-bold text-xs">K</span>
          </div>
          <div>
            <p className="font-medium text-sm">Kibisis</p>
            <p className="text-xs text-muted-foreground">
              {kibisisAvailable ? "Browser extension" : "Install extension"}
            </p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={connectVoiWallet}
          className="cursor-pointer flex items-center gap-3 py-3"
        >
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-accent font-bold text-xs">V</span>
          </div>
          <div>
            <p className="font-medium text-sm">Voi Wallet</p>
            <p className="text-xs text-muted-foreground">
              Mobile via WalletConnect
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
