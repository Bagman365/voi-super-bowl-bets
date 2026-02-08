import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowRight, ShieldCheck, AlertTriangle } from "lucide-react";
import seahawksHelmet from "@/assets/seahawks-helmet.png";
import patriotsHelmet from "@/assets/patriots-helmet.png";
import { microVoiToVoi } from "@/lib/voi";

export interface ConfirmBuyDetails {
  team: "seahawks" | "patriots";
  teamName: string;
  amountVoi: number;
  sharePriceMicroVoi: bigint;
  probability: number;
}

interface ConfirmTransactionModalProps {
  details: ConfirmBuyDetails | null;
  open: boolean;
  isFirstPurchase?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export const ConfirmTransactionModal = ({
  details,
  open,
  isFirstPurchase = false,
  onClose,
  onConfirm,
}: ConfirmTransactionModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!details) return null;

  const isSeahawks = details.team === "seahawks";
  const sharePrice = microVoiToVoi(details.sharePriceMicroVoi);
  const estimatedShares = sharePrice > 0 ? details.amountVoi / sharePrice : 0;
  const potentialPayout = estimatedShares * 1; // 1 VOI per winning share
  const networkFee = 0.003; // ~0.001 per txn × 3 (pay + app call + margin)
  const boxMbrFee = 0.0233; // box storage deposit for first purchase

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <img
              src={isSeahawks ? seahawksHelmet : patriotsHelmet}
              alt={details.teamName}
              className="w-8 h-8 object-contain"
            />
            Confirm Purchase
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Review the details below before signing in your wallet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Team & Amount */}
          <div className="rounded-lg bg-secondary/50 border border-border p-4 space-y-3">
            <Row label="Team" value={details.teamName} />
            <Separator className="bg-border" />
            <Row label="Amount" value={`${details.amountVoi} VOI`} highlight />
            <Separator className="bg-border" />
            <Row
              label="Share Price"
              value={`${sharePrice.toFixed(4)} VOI`}
            />
            <Separator className="bg-border" />
            <Row
              label="Est. Shares"
              value={`~${estimatedShares.toFixed(2)}`}
            />
          </div>

          {/* Payout & Fees */}
          <div className="rounded-lg bg-secondary/50 border border-border p-4 space-y-3">
            <Row
              label="Potential Payout"
              value={`${potentialPayout.toFixed(2)} VOI`}
              highlight
              className={isSeahawks ? "text-seahawks" : "text-accent"}
            />
            <Separator className="bg-border" />
            <Row
              label="Win Probability"
              value={`${Math.round(details.probability)}%`}
            />
            <Separator className="bg-border" />
            <Row label="Network Fee" value={`~${networkFee} VOI`} />
            {isFirstPurchase && (
              <>
                <Separator className="bg-border" />
                <Row label="Storage Deposit" value={`+${boxMbrFee} VOI`} />
              </>
            )}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 border border-border p-3">
            <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Shares are non-refundable. Payout depends on the final game
              result. Price may change slightly before your transaction confirms.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`flex-1 font-bold ${
              isSeahawks
                ? "bg-seahawks hover:bg-seahawks/90 text-primary-foreground"
                : "bg-accent hover:bg-accent/90 text-accent-foreground"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Sign & Submit
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/** Small helper row for the detail cards */
const Row = ({
  label,
  value,
  highlight,
  className,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  className?: string;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground text-sm">{label}</span>
    <span
      className={`text-sm font-semibold ${
        className ?? (highlight ? "text-foreground" : "text-secondary-foreground")
      }`}
    >
      {value}
    </span>
  </div>
);
