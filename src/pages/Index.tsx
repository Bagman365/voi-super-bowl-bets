import { useMemo, useState, useCallback } from "react";
import backgroundImage from "@/assets/background.png";
import { MarketHeader } from "@/components/MarketHeader";
import { TeamCard } from "@/components/TeamCard";
import { ClaimWinnings } from "@/components/ClaimWinnings";
import { CountdownTimer } from "@/components/CountdownTimer";
import { MarketInfo } from "@/components/MarketInfo";
import { ConnectWallet } from "@/components/ConnectWallet";
import { ConfirmTransactionModal, ConfirmBuyDetails } from "@/components/ConfirmTransactionModal";
import { TransactionStatusOverlay, TransactionPhase } from "@/components/TransactionStatusOverlay";
import { useWallet } from "@/hooks/useWallet";
import { useMarketContract } from "@/hooks/useMarketContract";
import { voiToMicroVoi, microVoiToVoi } from "@/lib/voi";
import { classifyTransactionError } from "@/lib/transactionErrors";
import { toast } from "sonner";

const Index = () => {
  // Super Bowl 60: Feb 9, 2026, 6:30 PM ET (23:30 UTC)
  const superBowlDate = useMemo(() => new Date("2026-02-09T23:30:00Z"), []);

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

  // Confirmation modal state
  const [confirmDetails, setConfirmDetails] = useState<ConfirmBuyDetails | null>(null);
  const [pendingBuy, setPendingBuy] = useState<{ team: "seahawks" | "patriots"; amountVoi: number } | null>(null);
  const [txPhase, setTxPhase] = useState<TransactionPhase>(null);

  // Compute on-chain derived stats
  const { totalVolumeFormatted, totalSharesFormatted, seaSkew, patSkew } = useMemo(() => {
    const seaSold = Number(marketState.totalSeaSold);
    const patSold = Number(marketState.totalPatSold);
    const totalShares = seaSold + patSold;

    const baseVoi = microVoiToVoi(marketState.basePrice);
    const totalVolumeVoi = totalShares * baseVoi;

    const formatVolume = (voi: number): string => {
      if (voi >= 1_000_000) return `${(voi / 1_000_000).toFixed(1)}M VOI`;
      if (voi >= 1_000) return `${(voi / 1_000).toFixed(1)}K VOI`;
      return `${voi.toFixed(0)} VOI`;
    };

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

    console.log("[handleClaim] Starting claim for address:", accountAddress);
    console.log("[handleClaim] Winner:", winnerTeam, "Winning shares:", winningShares.toString());

    setTxPhase("building");
    try {
      const unsignedTxns = await buildClaimWinningsTxn(accountAddress);
      console.log("[handleClaim] Built", unsignedTxns.length, "unsigned txn(s)");

      setTxPhase("signing");
      const signedTxns = await signTransactions(unsignedTxns);
      console.log("[handleClaim] Signed", signedTxns.length, "txn(s)");

      setTxPhase("submitting");
      const txnIds = await postTransactions(signedTxns);
      console.log("[handleClaim] Confirmed txn:", txnIds[0]);

      setTxPhase("confirming");

      await fetchMarketState();
      if (accountAddress) await fetchUserBalances(accountAddress);

      setTxPhase(null);
      toast.success("Winnings claimed successfully!", {
        description: `Transaction: ${txnIds[0]?.slice(0, 8)}...`,
      });
    } catch (error: any) {
      setTxPhase(null);
      console.error("[handleClaim] FAILED:", error?.message, error);
      const { title, description } = classifyTransactionError(error);
      toast.error(title, { description });
    }
  };

  // Track whether the pending purchase is a first-time buy for that team
  const [isFirstPurchase, setIsFirstPurchase] = useState(false);

  // Opens the confirmation modal instead of immediately buying
  const handleBuyRequest = useCallback(
    (team: "seahawks" | "patriots", amountVoi: number) => {
      if (!isConnected || !accountAddress) {
        toast.error("Please connect your wallet first.");
        return;
      }

      const wantSea = team === "seahawks";
      const teamName = wantSea ? "Seattle Seahawks" : "New England Patriots";
      const sharePriceMicroVoi = wantSea ? marketState.seaPrice : marketState.patPrice;
      const probability = wantSea ? seahawksProb : patriotsProb;

      // Determine if this is the user's first purchase for the selected team
      const firstPurchase = wantSea
        ? userBalances.seaShares === 0n
        : userBalances.patShares === 0n;
      setIsFirstPurchase(firstPurchase);

      setConfirmDetails({
        team,
        teamName,
        amountVoi,
        sharePriceMicroVoi,
        probability,
      });
      setPendingBuy({ team, amountVoi });
    },
    [isConnected, accountAddress, marketState, seahawksProb, patriotsProb, userBalances]
  );

  // Executes the actual buy after user confirms in the modal
  const executeBuy = useCallback(async () => {
    if (!pendingBuy || !accountAddress) return;

    const { team, amountVoi } = pendingBuy;
    const wantSea = team === "seahawks";
    const teamName = wantSea ? "Seattle Seahawks" : "New England Patriots";

    setTxPhase("building");
    try {
      const microVoi = voiToMicroVoi(amountVoi);
      const unsignedTxns = await buildBuySharesTxn(accountAddress, wantSea, microVoi);
      setTxPhase("signing");
      const signedTxns = await signTransactions(unsignedTxns);
      setTxPhase("submitting");
      const txnIds = await postTransactions(signedTxns);
      setTxPhase("confirming");

      await fetchMarketState();
      if (accountAddress) await fetchUserBalances(accountAddress);

      setTxPhase(null);
      toast.success(`Purchased ${amountVoi} VOI of ${teamName} shares!`, {
        description: `Transaction: ${txnIds[0]?.slice(0, 8)}...`,
      });
    } catch (error: any) {
      setTxPhase(null);
      console.error("Buy failed:", error);
      const { title, description } = classifyTransactionError(error);
      toast.error(title, { description });
    }
  }, [pendingBuy, accountAddress, buildBuySharesTxn, signTransactions, postTransactions, fetchMarketState, fetchUserBalances]);

  const closeConfirmModal = useCallback(() => {
    setConfirmDetails(null);
    setPendingBuy(null);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
      <div className="absolute inset-0 bg-background/80" />

      {/* Top Bar: Flowbet brand + Connect Wallet */}
      <div className="absolute top-4 left-4 z-20">
        <span className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-medium">
          Flowbet
        </span>
      </div>
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

        {/* Countdown Timer */}
        {!marketState.isResolved && <CountdownTimer targetDate={superBowlDate} />}

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
            isResolved={marketState.isResolved}
            isWinner={winnerTeam === "seahawks"}
            onBuy={(amount) => handleBuyRequest("seahawks", amount)}
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
            isResolved={marketState.isResolved}
            isWinner={winnerTeam === "patriots"}
            onBuy={(amount) => handleBuyRequest("patriots", amount)}
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
          <span className="text-foreground font-medium">Flowbet</span> Powered by <span className="text-foreground font-medium">Dork Labs</span>
        </footer>
      </div>

      {/* Transaction Status Overlay */}
      <TransactionStatusOverlay phase={txPhase} />

      {/* Confirmation Modal */}
      <ConfirmTransactionModal
        details={confirmDetails}
        open={!!confirmDetails}
        isFirstPurchase={isFirstPurchase}
        onClose={closeConfirmModal}
        onConfirm={executeBuy}
      />
    </div>
  );
};

export default Index;
