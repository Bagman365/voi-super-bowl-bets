import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Loader2, Wallet, Trophy, XCircle, Lock } from "lucide-react";
import seahawksHelmet from "@/assets/seahawks-helmet.png";
import patriotsHelmet from "@/assets/patriots-helmet.png";
import { microVoiToVoi } from "@/lib/voi";

interface TeamCardProps {
  team: "seahawks" | "patriots";
  name: string;
  probability: number;
  sharePriceMicroVoi: bigint;
  totalSharesSold: bigint;
  skewDirection: "up" | "down" | "neutral";
  skewAmount: number;
  isWalletConnected: boolean;
  userShares: bigint;
  isResolved: boolean;
  isWinner: boolean;
  onBuy: (amountVoi: number) => Promise<void>;
}

export const TeamCard = ({
  team,
  name,
  probability,
  sharePriceMicroVoi,
  totalSharesSold,
  skewDirection,
  skewAmount,
  isWalletConnected,
  userShares,
  isResolved,
  isWinner,
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
      className={`rounded-xl p-6 relative overflow-hidden ${
        isSeahawks ? "team-card-seahawks" : "team-card-patriots"
      } ${isResolved && !isWinner ? "opacity-60" : ""}`}
      style={{ animationDelay: isSeahawks ? "0.1s" : "0.2s" }}
    >
      {/* Resolved Badge */}
      {isResolved && (
        <div className={`absolute top-4 right-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
          isWinner
            ? "bg-seahawks/20 text-seahawks border border-seahawks/30"
            : "bg-muted text-muted-foreground border border-border"
        }`}>
          {isWinner ? (
            <>
              <Trophy className="w-3 h-3" />
              Winner
            </>
          ) : (
            <>
              <XCircle className="w-3 h-3" />
              Lost
            </>
          )}
        </div>
      )}
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
            {skewDirection !== "neutral" && (
              <div className="flex items-center gap-2 text-sm">
                {skewDirection === "up" ? (
                  <TrendingUp className="w-4 h-4 text-seahawks" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-accent" />
                )}
                <span
                  className={skewDirection === "up" ? "text-seahawks" : "text-accent"}
                >
                  {skewDirection === "up" ? "+" : "-"}
                  {Math.round(skewAmount)}% from even
                </span>
              </div>
            )}
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
          <p className="text-muted-foreground text-xs mb-1">Shares Sold</p>
          <p className="text-foreground font-semibold text-lg">
            {Number(totalSharesSold).toLocaleString()}
          </p>
        </div>
      </div>

      {/* User Balance */}
      {isWalletConnected && userShares > 0n && (
        <div className={`flex items-center gap-2 mb-4 rounded-lg px-4 py-2.5 ${
          isSeahawks ? "bg-seahawks/10 border border-seahawks/20" : "bg-accent/10 border border-accent/20"
        }`}>
          <Wallet className={`w-4 h-4 ${isSeahawks ? "text-seahawks" : "text-accent"}`} />
          <span className="text-muted-foreground text-sm">Your Shares:</span>
          <span className={`font-bold text-sm ${isSeahawks ? "text-seahawks" : "text-accent"}`}>
            {Number(userShares).toLocaleString()}
          </span>
        </div>
      )}

      {/* Buy Section or Market Closed */}
      {isResolved ? (
        <div className="space-y-3">
          <div className={`flex items-center justify-center gap-2 rounded-lg px-4 py-4 ${
            isWinner
              ? (isSeahawks ? "bg-seahawks/10 border border-seahawks/20" : "bg-accent/10 border border-accent/20")
              : "bg-muted/50 border border-border"
          }`}>
            <Lock className={`w-4 h-4 ${isWinner ? (isSeahawks ? "text-seahawks" : "text-accent") : "text-muted-foreground"}`} />
            <span className={`font-semibold text-sm ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>
              Market Closed
            </span>
          </div>
          {isWinner && (
            <p className="text-center text-xs text-muted-foreground">
              Each winning share pays out <span className="text-foreground font-medium">1 VOI</span>
            </p>
          )}
        </div>
      ) : (
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
            disabled={isBuying || !isWalletConnected}
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
      )}
    </div>
  );
};
