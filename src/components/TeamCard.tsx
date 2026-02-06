import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Loader2 } from "lucide-react";
import seahawksHelmet from "@/assets/seahawks-helmet.png";
import patriotsHelmet from "@/assets/patriots-helmet.png";
import { microVoiToVoi } from "@/lib/voi";

interface TeamCardProps {
  team: "seahawks" | "patriots";
  name: string;
  probability: number;
  sharePriceMicroVoi: bigint;
  volume: string;
  trend: "up" | "down";
  trendAmount: number;
  isDeployed: boolean;
  isWalletConnected: boolean;
  onBuy: (amountVoi: number) => Promise<void>;
}

export const TeamCard = ({
  team,
  name,
  probability,
  sharePriceMicroVoi,
  volume,
  trend,
  trendAmount,
  isDeployed,
  isWalletConnected,
  onBuy,
}: TeamCardProps) => {
  const [buyAmount, setBuyAmount] = useState(10);
  const [isBuying, setIsBuying] = useState(false);
  const isSeahawks = team === "seahawks";

  const sharePrice = microVoiToVoi(sharePriceMicroVoi);

  const handleBuy = async () => {
    setIsBuying(true);
    try {
      await onBuy(buyAmount);
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div
      className={`rounded-xl p-6 ${
        isSeahawks ? "team-card-seahawks" : "team-card-patriots"
      }`}
      style={{ animationDelay: isSeahawks ? "0.1s" : "0.2s" }}
    >
      {/* Team Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img
            src={isSeahawks ? seahawksHelmet : patriotsHelmet}
            alt={isSeahawks ? "Seahawks" : "Patriots"}
            className="w-12 h-12 object-contain"
          />
          <div>
            <h3 className="text-xl font-bold text-foreground">{name}</h3>
            <div className="flex items-center gap-2 text-sm">
              {trend === "up" ? (
                <TrendingUp className="w-4 h-4 text-seahawks" />
              ) : (
                <TrendingDown className="w-4 h-4 text-accent" />
              )}
              <span
                className={trend === "up" ? "text-seahawks" : "text-accent"}
              >
                {trend === "up" ? "+" : "-"}
                {Math.round(trendAmount)}% today
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Probability Display */}
      <div className="mb-6">
        <div className="flex items-end justify-between mb-2">
          <span className="text-muted-foreground text-sm">Win Probability</span>
          <span
            className={`text-4xl font-bold ${
              isSeahawks ? "text-seahawks" : "text-accent"
            }`}
          >
            {Math.round(probability)}%
          </span>
        </div>
        <div className="probability-bar">
          <div
            className={
              isSeahawks
                ? "probability-fill-seahawks"
                : "probability-fill-patriots"
            }
            style={{ width: `${probability}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-background/50 rounded-lg p-3">
          <p className="text-muted-foreground text-xs mb-1">Share Price</p>
          <p className="text-foreground font-semibold text-lg">
            {sharePrice.toFixed(2)} VOI
          </p>
        </div>
        <div className="bg-background/50 rounded-lg p-3">
          <p className="text-muted-foreground text-xs mb-1">24h Volume</p>
          <p className="text-foreground font-semibold text-lg">{volume}</p>
        </div>
      </div>

      {/* Buy Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBuyAmount(Math.max(1, buyAmount - 5))}
            className="w-10 h-10 rounded-lg bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-colors"
            disabled={isBuying}
          >
            -
          </button>
          <div className="flex-1 bg-input rounded-lg px-4 py-2 flex items-center justify-center gap-1">
            <span className="text-foreground font-semibold">{buyAmount}</span>
            <span className="text-muted-foreground text-sm">VOI</span>
          </div>
          <button
            onClick={() => setBuyAmount(buyAmount + 5)}
            className="w-10 h-10 rounded-lg bg-secondary text-secondary-foreground font-bold hover:bg-secondary/80 transition-colors"
            disabled={isBuying}
          >
            +
          </button>
        </div>

        <Button
          onClick={handleBuy}
          disabled={isBuying || (!isDeployed && !isWalletConnected)}
          className={`w-full h-12 font-bold text-base ${
            isSeahawks
              ? "bg-seahawks hover:bg-seahawks/90 text-primary-foreground"
              : "bg-accent hover:bg-accent/90 text-accent-foreground"
          }`}
        >
          {isBuying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Confirming...
            </>
          ) : !isWalletConnected ? (
            "Connect Wallet to Buy"
          ) : !isDeployed ? (
            "Coming Soon"
          ) : (
            `Buy ${name} Shares`
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Potential return:{" "}
          <span className="text-foreground font-medium">
            {sharePrice > 0
              ? ((buyAmount / sharePrice) * 1).toFixed(2)
              : "0.00"}{" "}
            VOI
          </span>{" "}
          if {name} wins
        </p>
      </div>
    </div>
  );
};
