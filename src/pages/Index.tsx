 import { useState } from "react";
 import backgroundImage from "@/assets/background.png";
 import { MarketHeader } from "@/components/MarketHeader";
 import { TeamCard } from "@/components/TeamCard";
 import { MarketInfo } from "@/components/MarketInfo";
 import { ConnectWallet } from "@/components/ConnectWallet";
 import { toast } from "sonner";
 
 const Index = () => {
   const [seahawksProb, setSeahawksProb] = useState(52);
   const patriotsProb = 100 - seahawksProb;
 
   const handleBuy = (team: string, amount: number) => {
     toast.success(`Purchased $${amount} of ${team} shares!`, {
       description: "Your position has been updated.",
     });
     
     // Simulate market movement
     if (team === "Seattle Seahawks") {
       setSeahawksProb(prev => Math.min(95, prev + Math.random() * 2));
     } else {
       setSeahawksProb(prev => Math.max(5, prev - Math.random() * 2));
     }
   };
 
   return (
     <div className="min-h-screen bg-background relative overflow-hidden">
       {/* Background Image */}
       <div 
         className="absolute inset-0 bg-cover bg-center bg-no-repeat"
         style={{ backgroundImage: `url(${backgroundImage})` }}
       />
       <div className="absolute inset-0 bg-background/80" />
       
       {/* Connect Wallet Button - Top Right */}
       <div className="absolute top-4 right-4 z-20">
         <ConnectWallet />
       </div>
 
       {/* Background Glows */}
       <div className="hero-glow glow-seahawks" />
       <div className="hero-glow glow-patriots" />
 
       <div className="relative z-10 container mx-auto px-4 pt-20 pb-12 md:py-20">
         <MarketHeader
           totalVolume="$2.4M"
           traders={12847}
           endDate="Feb 9, 2026"
         />
 
         {/* Team Cards */}
         <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
           <TeamCard
             team="seahawks"
             name="Seattle Seahawks"
             probability={seahawksProb}
             sharePrice={seahawksProb / 100}
             volume="$1.2M"
             trend="up"
             trendAmount={3.2}
             onBuy={(amount) => handleBuy("Seattle Seahawks", amount)}
           />
           <TeamCard
             team="patriots"
             name="New England Patriots"
             probability={patriotsProb}
             sharePrice={patriotsProb / 100}
             volume="$1.2M"
             trend="down"
             trendAmount={3.2}
             onBuy={(amount) => handleBuy("New England Patriots", amount)}
           />
         </div>
 
         {/* Probability Bar Visual */}
         <div className="max-w-4xl mx-auto mt-8 animate-slide-up" style={{ animationDelay: "0.25s" }}>
           <div className="bg-card rounded-xl border border-border p-4">
             <div className="flex justify-between text-sm mb-2">
             <span className="text-seahawks font-semibold">Seahawks {Math.round(seahawksProb)}%</span>
             <span className="text-accent font-semibold">Patriots {Math.round(patriotsProb)}%</span>
             </div>
             <div className="h-4 rounded-full bg-muted overflow-hidden flex">
               <div
                 className="h-full transition-all duration-500"
                 style={{
                   width: `${seahawksProb}%`,
                   background: "var(--gradient-seahawks)",
                 }}
               />
               <div
                 className="h-full transition-all duration-500"
                 style={{
                   width: `${patriotsProb}%`,
                   background: "var(--gradient-patriots)",
                 }}
               />
             </div>
           </div>
         </div>
 
          <MarketInfo />

          {/* Footer */}
          <footer className="mt-16 text-center text-muted-foreground text-sm">
            Powered by <span className="text-foreground font-medium">Dork Labs</span>
          </footer>
        </div>
      </div>
   );
 };
 
 export default Index;
