import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Loader2, PartyPopper } from "lucide-react";

interface ClaimWinningsProps {
  winnerTeam: "seahawks" | "patriots";
  winnerName: string;
  winningShares: bigint;
  onClaim: () => Promise<void>;
}

export const ClaimWinnings = ({
  winnerTeam,
  winnerName,
  winningShares,
  onClaim,
}: ClaimWinningsProps) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const isSeahawks = winnerTeam === "seahawks";

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      await onClaim();
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mb-6 animate-slide-up">
      <div
        className={`rounded-xl border-2 p-6 text-center ${
          isSeahawks
            ? "bg-seahawks/10 border-seahawks/40"
            : "bg-accent/10 border-accent/40"
        }`}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <PartyPopper className={`w-6 h-6 ${isSeahawks ? "text-seahawks" : "text-accent"}`} />
          <h3 className="text-xl font-bold text-foreground">
            Market Resolved — {winnerName} Wins!
          </h3>
          <PartyPopper className={`w-6 h-6 ${isSeahawks ? "text-seahawks" : "text-accent"}`} />
        </div>

        <p className="text-muted-foreground text-sm mb-4">
          You hold{" "}
          <span className={`font-bold ${isSeahawks ? "text-seahawks" : "text-accent"}`}>
            {Number(winningShares).toLocaleString()}
          </span>{" "}
          winning shares. Claim your payout of{" "}
          <span className="text-foreground font-semibold">
            1 VOI per share
          </span>
          .
        </p>

        <Button
          onClick={handleClaim}
          disabled={isClaiming}
          size="lg"
          className={`h-14 px-8 font-bold text-lg ${
            isSeahawks
              ? "bg-seahawks hover:bg-seahawks/90 text-primary-foreground"
              : "bg-accent hover:bg-accent/90 text-accent-foreground"
          }`}
        >
          {isClaiming ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Claiming...
            </>
          ) : (
            <>
              <Trophy className="w-5 h-5 mr-2" />
              Claim {Number(winningShares).toLocaleString()} VOI
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
