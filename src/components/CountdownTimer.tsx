import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const calculateTimeLeft = (target: Date): TimeLeft | null => {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

export const CountdownTimer = ({ targetDate }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() =>
    calculateTimeLeft(targetDate)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="max-w-4xl mx-auto mb-6 animate-slide-up">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Market resolution period has begun
            </span>
          </div>
        </div>
      </div>
    );
  }

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div className="max-w-4xl mx-auto mb-6 animate-slide-up" style={{ animationDelay: "0.15s" }}>
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground text-sm font-medium">
            Time Until Resolution
          </span>
        </div>
        <div className="flex items-center justify-center gap-3">
          {units.map((unit, i) => (
            <div key={unit.label} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <span className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                  {String(unit.value).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {unit.label}
                </span>
              </div>
              {i < units.length - 1 && (
                <span className="text-2xl md:text-3xl font-bold text-muted-foreground/40 -mt-4">
                  :
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
