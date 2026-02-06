import algosdk from "algosdk";

// Voi Network Configuration
export const VOI_NETWORK = {
  algodUrl: "https://mainnet-api.voi.nodely.dev",
  indexerUrl: "https://mainnet-idx.voi.nodely.dev",
  algodPort: "",
  algodToken: "",
  genesisHash: "", // Will be populated when contract is deployed
} as const;

// App ID - Set this when the contract is deployed on Voi mainnet
// Set to 0 to indicate "not yet deployed"
export const APP_ID = 0;

// MicroVoi conversion (1 VOI = 1,000,000 MicroVoi)
export const MICRO_VOI = 1_000_000;

// Create algod client for reading chain state
export const getAlgodClient = () => {
  return new algosdk.Algodv2(
    VOI_NETWORK.algodToken,
    VOI_NETWORK.algodUrl,
    VOI_NETWORK.algodPort
  );
};

// Check if the contract is deployed
export const isContractDeployed = () => APP_ID > 0;

// Convert microVoi to VOI
export const microVoiToVoi = (microVoi: number | bigint): number => {
  return Number(microVoi) / MICRO_VOI;
};

// Convert VOI to microVoi
export const voiToMicroVoi = (voi: number): bigint => {
  return BigInt(Math.floor(voi * MICRO_VOI));
};
