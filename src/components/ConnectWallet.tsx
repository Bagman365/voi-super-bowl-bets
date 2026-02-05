 import { Button } from "@/components/ui/button";
 import { Wallet, LogOut } from "lucide-react";
 import { usePeraWallet } from "@/hooks/usePeraWallet";
 
 export const ConnectWallet = () => {
   const { accountAddress, isConnecting, isConnected, isReady, connect, disconnect, shortenAddress } = usePeraWallet();
 
   if (!isReady) {
     return (
       <Button disabled className="bg-secondary text-secondary-foreground font-semibold">
         <Wallet className="w-4 h-4 mr-2" />
         Loading...
       </Button>
     );
   }
 
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
       onClick={connect}
       disabled={isConnecting}
       className="bg-seahawks hover:bg-seahawks/90 text-primary-foreground font-semibold"
     >
       <Wallet className="w-4 h-4 mr-2" />
       {isConnecting ? "Connecting..." : "Connect Wallet"}
     </Button>
   );
 };