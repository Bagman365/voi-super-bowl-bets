import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Loader2, PartyPopper } from "lucide-react";

interface ConfettiPiece {
  id: number;
  left: string;
  delay: string;
  duration: string;
  color: string;
  size: string;
  shape: "circle" | "square" | "triangle";
}

const CONFETTI_COLORS_SEAHAWKS = [
  "hsl(var(--seahawks))",
  "hsl(150 60% 55%)",
  "hsl(200 80% 60%)",
  "hsl(45 100% 60%)",
  "hsl(0 0% 100%)",
];

const CONFETTI_COLORS_PATRIOTS = [
  "hsl(var(--accent))",
  "hsl(220 80% 55%)",
  "hsl(0 70% 55%)",
  "hsl(45 100% 60%)",
  "hsl(0 0% 100%)",
];

const ConfettiParticle = ({ piece }: { piece: ConfettiPiece }) => {
  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: piece.left,
    top: "-8px",
    width: piece.size,
    height: piece.size,
    backgroundColor: piece.shape !== "triangle" ? piece.color : "transparent",
    borderRadius: piece.shape === "circle" ? "50%" : "0",
    animation: `confetti-fall ${piece.duration} ease-in ${piece.delay} infinite`,
    pointerEvents: "none",
  };

  if (piece.shape === "triangle") {
    return (
      <div
        style={{
          ...baseStyle,
          width: 0,
          height: 0,
          backgroundColor: "transparent",
          borderLeft: `${parseInt(piece.size) / 2}px solid transparent`,
          borderRight: `${parseInt(piece.size) / 2}px solid transparent`,
          borderBottom: `${piece.size} solid ${piece.color}`,
        }}
      />
    );
  }

  return <div style={baseStyle} />;
};

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

  const confettiPieces = useMemo<ConfettiPiece[]>(() => {
    const colors = isSeahawks ? CONFETTI_COLORS_SEAHAWKS : CONFETTI_COLORS_PATRIOTS;
    const shapes: ConfettiPiece["shape"][] = ["circle", "square", "triangle"];
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: `${(i / 24) * 100 + Math.random() * 4 - 2}%`,
      delay: `${Math.random() * 3}s`,
      duration: `${2 + Math.random() * 2}s`,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: `${6 + Math.random() * 6}px`,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));
  }, [isSeahawks]);

  const handleClaim = async () => {
    setIsClaiming(true);
    try {
      await onClaim();
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mb-6 animate-confetti-burst">
      <div
        className={`relative overflow-hidden rounded-xl border-2 p-6 text-center ${
          isSeahawks
            ? "bg-seahawks/10 border-seahawks/40"
            : "bg-accent/10 border-accent/40"
        }`}
      >
        {/* Confetti particles */}
        {confettiPieces.map((piece) => (
          <ConfettiParticle key={piece.id} piece={piece} />
        ))}

        <div className="relative z-10 flex items-center justify-center gap-2 mb-3">
          <PartyPopper className={`w-6 h-6 ${isSeahawks ? "text-seahawks" : "text-accent"}`} />
          <h3 className="text-xl font-bold text-foreground">
            Market Resolved — {winnerName} Wins!
          </h3>
          <PartyPopper className={`w-6 h-6 ${isSeahawks ? "text-seahawks" : "text-accent"}`} />
        </div>

        <p className="relative z-10 text-muted-foreground text-sm mb-4">
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
          className={`relative z-10 h-14 px-8 font-bold text-lg ${
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
