/**
 * Classifies transaction errors into user-friendly categories:
 * - User rejection (cancelled in wallet)
 * - Network errors (connectivity, timeout)
 * - Contract errors (logic errors, insufficient funds, etc.)
 */

interface ClassifiedError {
  title: string;
  description: string;
}

const USER_REJECTION_PATTERNS = [
  "user rejected",
  "user cancelled",
  "user denied",
  "rejected by user",
  "request rejected",
  "cancelled",
  "user canceled",
  "proposal expired",
  "session not approved",
];

const NETWORK_ERROR_PATTERNS = [
  "network",
  "timeout",
  "fetch",
  "econnrefused",
  "enotfound",
  "failed to fetch",
  "load failed",
  "net::err",
  "cors",
  "aborted",
];

const INSUFFICIENT_FUNDS_PATTERNS = [
  "overspend",
  "insufficient funds",
  "below min",
  "underflow",
  "balance",
];

const CONTRACT_LOGIC_PATTERNS = [
  "logic eval error",
  "app call rejected",
  "teal runtime error",
  "assert failed",
  "err opcode",
  "global state",
  "box not found",
];

export const classifyTransactionError = (error: any): ClassifiedError => {
  const message = (
    error?.message ||
    error?.toString() ||
    "Unknown error"
  ).toLowerCase();

  // 1. User rejection — not an error, just informational
  if (USER_REJECTION_PATTERNS.some((p) => message.includes(p))) {
    return {
      title: "Transaction Cancelled",
      description: "You cancelled the transaction in your wallet.",
    };
  }

  // 2. Insufficient funds
  if (INSUFFICIENT_FUNDS_PATTERNS.some((p) => message.includes(p))) {
    return {
      title: "Insufficient Funds",
      description:
        "Your wallet doesn't have enough VOI to cover this transaction plus fees.",
    };
  }

  // 3. Contract / logic errors
  if (CONTRACT_LOGIC_PATTERNS.some((p) => message.includes(p))) {
    // Try to extract a more specific reason
    if (message.includes("paused") || message.includes("market_paused")) {
      return {
        title: "Market Paused",
        description: "The prediction market is currently paused by the admin.",
      };
    }
    if (message.includes("resolved") || message.includes("is_resolved")) {
      return {
        title: "Market Closed",
        description:
          "This market has already been resolved. No more bets can be placed.",
      };
    }
    if (message.includes("max_bet")) {
      return {
        title: "Bet Too Large",
        description:
          "Your bet exceeds the maximum allowed amount. Try a smaller amount.",
      };
    }
    return {
      title: "Contract Error",
      description:
        "The smart contract rejected this transaction. The market rules may have changed.",
    };
  }

  // 4. Network errors
  if (NETWORK_ERROR_PATTERNS.some((p) => message.includes(p))) {
    return {
      title: "Network Error",
      description:
        "Could not reach the Voi network. Check your internet connection and try again.",
    };
  }

  // 5. WalletConnect session issues
  if (
    message.includes("session") &&
    (message.includes("not active") || message.includes("expired") || message.includes("disconnect"))
  ) {
    return {
      title: "Wallet Disconnected",
      description:
        "Your wallet session has expired. Please reconnect your wallet and try again.",
    };
  }

  // 6. Fallback
  return {
    title: "Transaction Failed",
    description: error?.message || "Something went wrong. Please try again.",
  };
};
