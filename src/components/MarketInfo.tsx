 import { Info, CheckCircle, AlertCircle } from "lucide-react";
 
 export const MarketInfo = () => {
   return (
     <div className="mt-12 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
       <div className="bg-card rounded-xl border border-border p-6">
         <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
           <Info className="w-5 h-5 text-muted-foreground" />
           How It Works
         </h3>
         
         <div className="grid md:grid-cols-3 gap-4 mb-6">
           <div className="bg-background/50 rounded-lg p-4">
             <div className="w-8 h-8 rounded-full bg-seahawks/20 text-seahawks flex items-center justify-center font-bold mb-2">
               1
             </div>
             <h4 className="font-medium text-foreground mb-1">Buy Shares</h4>
             <p className="text-sm text-muted-foreground">
               Purchase shares in the team you think will win.
             </p>
           </div>
           <div className="bg-background/50 rounded-lg p-4">
             <div className="w-8 h-8 rounded-full bg-seahawks/20 text-seahawks flex items-center justify-center font-bold mb-2">
               2
             </div>
             <h4 className="font-medium text-foreground mb-1">Watch & Trade</h4>
             <p className="text-sm text-muted-foreground">
               Prices change based on market sentiment.
             </p>
           </div>
           <div className="bg-background/50 rounded-lg p-4">
             <div className="w-8 h-8 rounded-full bg-seahawks/20 text-seahawks flex items-center justify-center font-bold mb-2">
               3
             </div>
             <h4 className="font-medium text-foreground mb-1">Win or Lose</h4>
             <p className="text-sm text-muted-foreground">
               Winning shares pay out $1 each; losing shares expire worthless.
             </p>
           </div>
         </div>
 
         <div className="border-t border-border pt-4 space-y-3">
           <div className="flex items-start gap-3">
             <CheckCircle className="w-5 h-5 text-seahawks mt-0.5" />
             <div>
               <p className="text-sm text-foreground font-medium">Settlement Condition</p>
               <p className="text-sm text-muted-foreground">
                 Market settles when the official NFL result is announced at the end of Super Bowl 60.
               </p>
             </div>
           </div>
           <div className="flex items-start gap-3">
             <AlertCircle className="w-5 h-5 text-accent mt-0.5" />
             <div>
               <p className="text-sm text-foreground font-medium">Market Type</p>
               <p className="text-sm text-muted-foreground">
                 Binary outcome — one winner only. No spreads, props, or point totals.
               </p>
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 };