 import { Clock, BarChart3, DollarSign } from "lucide-react";
 
 interface MarketHeaderProps {
   totalVolume: string;
   totalShares: string;
   endDate: string;
 }
 
 export const MarketHeader = ({ totalVolume, totalShares, endDate }: MarketHeaderProps) => {
   return (
     <div className="text-center mb-12 animate-slide-up">
       {/* Live Badge */}
       <div className="inline-flex items-center gap-2 bg-seahawks/10 border border-seahawks/30 rounded-full px-4 py-1.5 mb-6">
         <span className="w-2 h-2 rounded-full bg-seahawks animate-pulse-glow" />
         <span className="text-seahawks text-sm font-medium">Live Market</span>
       </div>
 
        {/* Brand + Title */}
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-medium mb-2">
          Flowbet
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          🏈 Super Bowl 60 Winner
        </h1>
       <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
         Which team will win Super Bowl 60: the Seattle Seahawks or the New England Patriots?
       </p>
 
       {/* Stats Bar */}
       <div className="flex flex-wrap justify-center gap-6 text-sm">
         <div className="flex items-center gap-2 text-muted-foreground">
           <DollarSign className="w-4 h-4" />
           <span>
             Volume: <span className="text-foreground font-semibold">{totalVolume}</span>
           </span>
         </div>
         <div className="flex items-center gap-2 text-muted-foreground">
           <BarChart3 className="w-4 h-4" />
           <span>
             Shares Sold: <span className="text-foreground font-semibold">{totalShares}</span>
           </span>
         </div>
         <div className="flex items-center gap-2 text-muted-foreground">
           <Clock className="w-4 h-4" />
           <span>
             Ends: <span className="text-foreground font-semibold">{endDate}</span>
           </span>
         </div>
       </div>
     </div>
   );
 };