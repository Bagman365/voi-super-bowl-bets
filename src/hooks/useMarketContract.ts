import { useState, useEffect, useCallback, useRef } from "react";
import algosdk from "algosdk";
import { getAlgodClient, APP_ID, isContractDeployed, MICRO_VOI } from "@/lib/voi";

// Fee & MBR constants (microVoi)
const BOX_MBR = 23_300;   // 2,500 + 400 * (44 + 8) — box creation deposit
const BUY_FEE = 2_000;    // app call fee, covers 2 txns in group
const CLAIM_FEE = 3_000;  // app call + inner payment + box deletion margin
import contractSpec from "@/contracts/VoiSuperBowlWhaleMarket.arc56.json";

export interface UserBalances {
  seaShares: bigint;
  patShares: bigint;
}

export interface MarketState {
  totalSeaSold: bigint;
  totalPatSold: bigint;
  isResolved: boolean;
  marketPaused: boolean;
  winner: number; // 0=none, 1=SEA, 2=PAT
  basePrice: bigint;
  seaPrice: bigint;
  patPrice: bigint;
  seahawksProb: number;
  patriotsProb: number;
}

const DEFAULT_MARKET_STATE: MarketState = {
  totalSeaSold: BigInt(0),
  totalPatSold: BigInt(0),
  isResolved: false,
  marketPaused: false,
  winner: 0,
  basePrice: BigInt(510_000), // 0.51 VOI
  seaPrice: BigInt(510_000),
  patPrice: BigInt(510_000),
  seahawksProb: 52,
  patriotsProb: 48,
};

// Build the ABI contract from the ARC56 spec
const getABIContract = () => {
  const methods = contractSpec.methods.map((m) => ({
    name: m.name,
    desc: m.desc,
    // Include ALL arg types (including transaction types like "pay")
    // so method selectors are computed correctly
    args: m.args.map((a) => ({ type: a.type, name: a.name })),
    returns: { type: m.returns.type },
  }));

  return new algosdk.ABIContract({
    name: contractSpec.name,
    methods,
  });
};

export const useMarketContract = (userAddress?: string) => {
  const [marketState, setMarketState] = useState<MarketState>(DEFAULT_MARKET_STATE);
  const [userBalances, setUserBalances] = useState<UserBalances>({ seaShares: 0n, patShares: 0n });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevAddressRef = useRef<string | undefined>(undefined);

  // Calculate probability from share totals
  const calculateProbability = (seaSold: bigint, patSold: bigint) => {
    const total = Number(seaSold) + Number(patSold);
    if (total === 0) return { seahawksProb: 52, patriotsProb: 48 }; // Default
    const seahawksProb = Math.round((Number(seaSold) / total) * 100);
    return {
      seahawksProb: Math.max(1, Math.min(99, seahawksProb)),
      patriotsProb: Math.max(1, Math.min(99, 100 - seahawksProb)),
    };
  };

  // Fetch global state from the contract
  const fetchMarketState = useCallback(async () => {
    if (!isContractDeployed()) {
      // Use mock state when contract is not deployed
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const algod = getAlgodClient();
      const appInfo = await algod.getApplicationByID(APP_ID).do();
      const globalState = (appInfo as any).params?.globalState ?? (appInfo as any).params?.["global-state"] ?? [];

      const state: Partial<MarketState> = {};

      for (const kv of globalState) {
        const key = kv.key instanceof Uint8Array ? new TextDecoder().decode(kv.key) : atob(kv.key);
        const value = Number(kv.value.uint ?? 0n);

        switch (key) {
          case "total_sea_sold":
            state.totalSeaSold = BigInt(value);
            break;
          case "total_pat_sold":
            state.totalPatSold = BigInt(value);
            break;
          case "is_resolved":
            state.isResolved = value === 1;
            break;
          case "market_paused":
            state.marketPaused = value === 1;
            break;
          case "winner":
            state.winner = value;
            break;
          case "base_price":
            state.basePrice = BigInt(value);
            break;
        }
      }

      // Calculate dynamic prices using contract logic
      const seaSold = state.totalSeaSold ?? BigInt(0);
      const patSold = state.totalPatSold ?? BigInt(0);
      const basePrice = state.basePrice ?? BigInt(510_000);

      let seaPrice = basePrice;
      let patPrice = basePrice;

      if (seaSold > patSold) {
        const lead = seaSold - patSold;
        seaPrice = basePrice + (lead / BigInt(10_000)) * BigInt(10_000);
      } else if (patSold > seaSold) {
        const lead = patSold - seaSold;
        patPrice = basePrice + (lead / BigInt(10_000)) * BigInt(10_000);
      }

      const probs = calculateProbability(seaSold, patSold);

      setMarketState({
        ...DEFAULT_MARKET_STATE,
        ...state,
        seaPrice,
        patPrice,
        ...probs,
      });
    } catch (err) {
      console.error("Failed to fetch market state:", err);
      setError("Failed to load market data from chain");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check if a user's balance box exists (without throwing on 404)
  const boxExists = async (algod: algosdk.Algodv2, prefix: string, address: string): Promise<boolean> => {
    try {
      const publicKey = algosdk.decodeAddress(address).publicKey;
      const boxName = new Uint8Array([
        ...new TextEncoder().encode(prefix),
        ...publicKey,
      ]);
      await algod.getApplicationBoxByName(APP_ID, boxName).do();
      return true;
    } catch {
      return false;
    }
  };

  // Read a single box balance (returns 0 if box doesn't exist)
  const readBoxBalance = async (algod: algosdk.Algodv2, prefix: string, address: string): Promise<bigint> => {
    try {
      const publicKey = algosdk.decodeAddress(address).publicKey;
      const boxName = new Uint8Array([
        ...new TextEncoder().encode(prefix),
        ...publicKey,
      ]);
      const box = await algod.getApplicationBoxByName(APP_ID, boxName).do();
      const value = (box as any).value ?? (box as any).value;
      if (value instanceof Uint8Array && value.length === 8) {
        // Big-endian uint64
        return new DataView(value.buffer, value.byteOffset, value.byteLength).getBigUint64(0);
      }
      return 0n;
    } catch {
      // Box doesn't exist = user has no shares
      return 0n;
    }
  };

  // Fetch user balances from box storage
  const fetchUserBalances = useCallback(async (address: string) => {
    if (!isContractDeployed() || !address) return;
    try {
      const algod = getAlgodClient();
      const [seaShares, patShares] = await Promise.all([
        readBoxBalance(algod, "balances_sea", address),
        readBoxBalance(algod, "balances_pat", address),
      ]);
      setUserBalances({ seaShares, patShares });
    } catch (err) {
      console.error("Failed to fetch user balances:", err);
    }
  }, []);

  // Build buy_shares transaction group
  const buildBuySharesTxn = useCallback(
    async (
      senderAddress: string,
      wantSea: boolean,
      paymentAmountMicroVoi: bigint
    ): Promise<Uint8Array[]> => {
      if (!isContractDeployed()) {
        throw new Error("Contract not yet deployed. Please check back later.");
      }

      const algod = getAlgodClient();
      const suggestedParams = await algod.getTransactionParams().do();
      const contract = getABIContract();

      // App call params with fee to cover box storage MBR
      const appCallParams = { ...suggestedParams, flatFee: true, fee: BUY_FEE };

      // Check if user already has a box for this team; if not, pad payment with BOX_MBR
      const prefix = wantSea ? "balances_sea" : "balances_pat";
      const hasBox = await boxExists(algod, prefix, senderAddress);
      const totalPayment = hasBox
        ? paymentAmountMicroVoi
        : paymentAmountMicroVoi + BigInt(BOX_MBR);

      console.log("[buildBuySharesTxn] boxExists:", hasBox, "totalPayment:", totalPayment.toString());

      // 1. Payment transaction to the app address
      const appAddr = algosdk.getApplicationAddress(APP_ID);
      const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: senderAddress,
        receiver: appAddr,
        amount: totalPayment,
        suggestedParams,
      });

      // 2. App call with buy_shares method (0.002 VOI fee for box storage)
      const method = contract.getMethodByName("buy_shares");
      const selectorHex = Array.from(method.getSelector()).map(b => b.toString(16).padStart(2, '0')).join('');
      const encodedBool = algosdk.ABIType.from("bool").encode(wantSea);
      console.log("[buildBuySharesTxn] Method:", method.getSignature(), "Selector:", selectorHex, "Bool encoded:", Array.from(encodedBool));

      const boxName = new Uint8Array([
        ...new TextEncoder().encode(wantSea ? "balances_sea" : "balances_pat"),
        ...algosdk.decodeAddress(senderAddress).publicKey,
      ]);

      const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        sender: senderAddress,
        appIndex: APP_ID,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [
          method.getSelector(),
          encodedBool,
        ],
        suggestedParams: appCallParams,
        // Box references for user balance storage (appIndex 0 = current app)
        boxes: [
          {
            appIndex: 0,
            name: boxName,
          },
        ],
      });

      console.log("[buildBuySharesTxn] Pay amount:", paymentAmountMicroVoi.toString(), "App fee:", 2000, "Box name length:", boxName.length);

      // Assign group ID
      const txns = [payTxn, appCallTxn];
      algosdk.assignGroupID(txns);

      return txns.map((txn) => algosdk.encodeUnsignedTransaction(txn));
    },
    []
  );

  // Build claim_winnings transaction
  const buildClaimWinningsTxn = useCallback(
    async (senderAddress: string): Promise<Uint8Array[]> => {
      if (!isContractDeployed()) {
        throw new Error("Contract not yet deployed.");
      }

      const algod = getAlgodClient();
      const suggestedParams = await algod.getTransactionParams().do();
      const contract = getABIContract();
      const method = contract.getMethodByName("claim_winnings");

      // Increased fee to cover app call + inner payment + potential box deletion
      const appCallParams = { ...suggestedParams, flatFee: true, fee: CLAIM_FEE };

      const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        sender: senderAddress,
        appIndex: APP_ID,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [method.getSelector()],
        suggestedParams: appCallParams,
        boxes: [
          {
            appIndex: 0,
            name: new Uint8Array([
              ...new TextEncoder().encode("balances_sea"),
              ...algosdk.decodeAddress(senderAddress).publicKey,
            ]),
          },
          {
            appIndex: 0,
            name: new Uint8Array([
              ...new TextEncoder().encode("balances_pat"),
              ...algosdk.decodeAddress(senderAddress).publicKey,
            ]),
          },
        ],
      });

      return [algosdk.encodeUnsignedTransaction(appCallTxn)];
    },
    []
  );

  // Poll market state + user balances
  useEffect(() => {
    fetchMarketState();

    if (isContractDeployed()) {
      const interval = setInterval(() => {
        fetchMarketState();
        if (userAddress) fetchUserBalances(userAddress);
      }, 15_000);
      return () => clearInterval(interval);
    }
  }, [fetchMarketState, fetchUserBalances, userAddress]);

  // Fetch user balances when address changes
  useEffect(() => {
    if (userAddress && userAddress !== prevAddressRef.current) {
      fetchUserBalances(userAddress);
    }
    if (!userAddress) {
      setUserBalances({ seaShares: 0n, patShares: 0n });
    }
    prevAddressRef.current = userAddress;
  }, [userAddress, fetchUserBalances]);

  return {
    marketState,
    userBalances,
    isLoading,
    error,
    isDeployed: isContractDeployed(),
    fetchMarketState,
    fetchUserBalances,
    buildBuySharesTxn,
    buildClaimWinningsTxn,
  };
};
