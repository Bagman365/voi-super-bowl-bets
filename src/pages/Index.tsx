import { useMemo } from "react";
import backgroundImage from "@/assets/background.png";
import { MarketHeader } from "@/components/MarketHeader";
import { TeamCard } from "@/components/TeamCard";
import { ClaimWinnings } from "@/components/ClaimWinnings";
import { MarketInfo } from "@/components/MarketInfo";
import { ConnectWallet } from "@/components/ConnectWallet";
import { useWallet } from "@/hooks/useWallet";
import { useMarketContract } from "@/hooks/useMarketContract";
import { voiToMicroVoi, microVoiToVoi } from "@/lib/voi";
import { toast } from "sonner";

const Index = () => {
  const {
    accountAddress,
    isConnected,
    signTransactions,
    postTransactions,
  } = useWallet();

  const {
    marketState,
    userBalances,
    buildBuySharesTxn,
    buildClaimWinningsTxn,
    fetchMarketState,
    fetchUserBalances,
  } = useMarketContract(accountAddress ?? undefined);

  const seahawksProb = marketState.seahawksProb;
  const patriotsProb = marketState.patriotsProb;

  // Compute on-chain derived stats
  const { totalVolumeFormatted, totalSharesFormatted, seaSkew, patSkew } = useMemo(() => {
    const seaSold = Number(marketState.totalSeaSold);
    const patSold = Number(marketState.totalPatSold);
    const totalShares = seaSold + patSold;

    // Approximate total volume: shares * base price (rough estimate)
    const baseVoi = microVoiToVoi(marketState.basePrice);
    const totalVolumeVoi = totalShares * baseVoi;

    const formatVolume = (voi: number): string => {
      if (voi >= 1_000_000) return `${(voi / 1_000_000).toFixed(1)}M VOI`;
      if (voi >= 1_000) return `${(voi / 1_000).toFixed(1)}K VOI`;
      return `${voi.toFixed(0)} VOI`;
    };

    // Skew: how far each team's probability deviates from 50%
    const seaDeviation = Math.abs(seahawksProb - 50);
    const patDeviation = Math.abs(patriotsProb - 50);

    return {
      totalVolumeFormatted: formatVolume(totalVolumeVoi),
      totalSharesFormatted: totalShares.toLocaleString(),
      seaSkew: {
        direction: (seahawksProb > 50 ? "up" : seahawksProb < 50 ? "down" : "neutral") as "up" | "down" | "neutral",
        amount: seaDeviation,
      },
      patSkew: {
        direction: (patriotsProb > 50 ? "up" : patriotsProb < 50 ? "down" : "neutral") as "up" | "down" | "neutral",
        amount: patDeviation,
      },
    };
  }, [marketState, seahawksProb, patriotsProb]);

  // Determine if user can claim winnings
  const winnerTeam = marketState.winner === 1 ? "seahawks" : marketState.winner === 2 ? "patriots" : null;
  const winningShares = winnerTeam === "seahawks" ? userBalances.seaShares : winnerTeam === "patriots" ? userBalances.patShares : 0n;
  const canClaim = marketState.isResolved && isConnected && winnerTeam !== null && winningShares > 0n;

  const handleClaim = async () => {
    if (!isConnected || !accountAddress) {
      toast.error("Please connect your wallet first.");
      return;
    }

    try {
      const unsignedTxns = await buildClaimWinningsTxn(accountAddress);
      const signedTxns = await signTransactions(unsignedTxns);
      const txnIds = await postTransactions(signedTxns);

      toast.success("Winnings claimed successfully!", {
        description: `Transaction: ${txnIds[0]?.slice(0, 8)}...`,
      });

      await fetchMarketState();
      if (accountAddress) await fetchUserBalances(accountAddress);
    } catch (error: any) {
      console.error("Claim failed:", error);
      toast.error("Claim failed", {
        description: error?.message || "Please try again.",
      });
    }
  };

  const handleBuy = async (team: "seahawks" | "patriots", amountVoi: number) => {
    const wantSea = team === "seahawks";
    const teamName = wantSea ? "Seattle Seahawks" : "New England Patriots";

    if (!isConnected || !accountAddress) {
      toast.error("Please connect your wallet first.");
      return;
    }

    try {
      const microVoi = voiToMicroVoi(amountVoi);
      const unsignedTxns = await buildBuySharesTxn(accountAddress, wantSea, microVoi);
      const signedTxns = await signTransactions(unsignedTxns);
      const txnIds = await postTransactions(signedTxns);

      toast.success(`Purchased ${amountVoi} VOI of ${teamName} shares!`, {
        description: `Transaction: ${txnIds[0]?.slice(0, 8)}...`,
      });

      // Refresh market state and user balances
      await fetchMarketState();
      if (accountAddress) await fetchUserBalances(accountAddress);
    } catch (error: any) {
      console.error("Buy failed:", error);
      toast.error("Transaction failed", {
        description: error?.message || "Please try again.",
      });
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
          totalVolume={totalVolumeFormatted}
          totalShares={totalSharesFormatted}
          endDate="Feb 9, 2026"
        />

        {/* Team Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <TeamCard
            team="seahawks"
            name="Seattle Seahawks"
            probability={seahawksProb}
            sharePriceMicroVoi={marketState.seaPrice}
            totalSharesSold={marketState.totalSeaSold}
            skewDirection={seaSkew.direction}
            skewAmount={seaSkew.amount}
            isWalletConnected={isConnected}
            userShares={userBalances.seaShares}
            onBuy={(amount) => handleBuy("seahawks", amount)}
          />
          <TeamCard
            team="patriots"
            name="New England Patriots"
            probability={patriotsProb}
            sharePriceMicroVoi={marketState.patPrice}
            totalSharesSold={marketState.totalPatSold}
            skewDirection={patSkew.direction}
            skewAmount={patSkew.amount}
            isWalletConnected={isConnected}
            userShares={userBalances.patShares}
            onBuy={(amount) => handleBuy("patriots", amount)}
          />
        </div>

        {/* Claim Winnings Banner */}
        {canClaim && winnerTeam && (
          <ClaimWinnings
            winnerTeam={winnerTeam}
            winnerName={winnerTeam === "seahawks" ? "Seattle Seahawks" : "New England Patriots"}
            winningShares={winningShares}
            onClaim={handleClaim}
          />
        )}

        {/* Probability Bar Visual */}
        <div className="max-w-4xl mx-auto mt-8 animate-slide-up" style={{ animationDelay: "0.25s" }}>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-seahawks font-semibold">
                Seahawks {Math.round(seahawksProb)}%
              </span>
              <span className="text-accent font-semibold">
                Patriots {Math.round(patriotsProb)}%
              </span>
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
