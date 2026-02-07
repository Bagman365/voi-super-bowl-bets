import { Loader2, FileCheck, Send, CheckCircle2, Pen } from "lucide-react";

export type TransactionPhase =
  | "building"
  | "signing"
  | "submitting"
  | "confirming"
  | null;

const PHASE_CONFIG: Record<
  NonNullable<TransactionPhase>,
  { icon: typeof Loader2; label: string; sublabel: string; step: number }
> = {
  building: {
    icon: FileCheck,
    label: "Preparing Transaction",
    sublabel: "Building transaction group…",
    step: 1,
  },
  signing: {
    icon: Pen,
    label: "Awaiting Signature",
    sublabel: "Please sign in your wallet",
    step: 2,
  },
  submitting: {
    icon: Send,
    label: "Submitting",
    sublabel: "Sending to Voi network…",
    step: 3,
  },
  confirming: {
    icon: CheckCircle2,
    label: "Confirming",
    sublabel: "Waiting for on-chain confirmation…",
    step: 4,
  },
};

const TOTAL_STEPS = 4;

interface TransactionStatusOverlayProps {
  phase: TransactionPhase;
}

export const TransactionStatusOverlay = ({
  phase,
}: TransactionStatusOverlayProps) => {
  if (!phase) return null;

  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;
  const progress = (config.step / TOTAL_STEPS) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center space-y-5">
        {/* Animated icon */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <Icon className="w-7 h-7 text-foreground animate-pulse" />
            </div>
            <Loader2 className="absolute -inset-2 w-20 h-20 text-seahawks/40 animate-spin" />
          </div>
        </div>

        {/* Labels */}
        <div>
          <h3 className="text-lg font-bold text-foreground">{config.label}</h3>
          <p className="text-sm text-muted-foreground mt-1">{config.sublabel}</p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: "var(--gradient-seahawks)",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Step {config.step} of {TOTAL_STEPS}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === config.step;
            const isComplete = stepNum < config.step;
            return (
              <div
                key={stepNum}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  isComplete
                    ? "bg-seahawks"
                    : isActive
                    ? "bg-seahawks animate-pulse scale-125"
                    : "bg-muted"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
