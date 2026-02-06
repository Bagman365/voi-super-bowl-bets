// ARC-0027 AVM Web Provider types for Kibisis wallet
interface AVMWebProviderAccount {
  address: string;
  name?: string;
}

interface AVMWebProviderEnableResult {
  accounts: AVMWebProviderAccount[];
  genesisHash?: string;
  genesisId?: string;
  providerId: string;
}

interface AVMWebProviderSignTxnsParams {
  txns: Array<{
    txn: string; // base64 encoded unsigned transaction
    signers?: string[]; // optional list of addresses that should sign
    message?: string;
  }>;
}

interface AVMWebProviderPostTxnsParams {
  stxns: string[]; // base64 encoded signed transactions
}

interface AVMWebProviderPostTxnsResult {
  txnIDs: string[];
}

interface AVMWebProvider {
  enable(providerId?: string): Promise<AVMWebProviderEnableResult>;
  signTxns(params: AVMWebProviderSignTxnsParams): Promise<(string | null)[]>;
  postTxns(params: AVMWebProviderPostTxnsParams): Promise<AVMWebProviderPostTxnsResult>;
  disable?(providerId?: string): Promise<void>;
}

interface Window {
  algorand?: AVMWebProvider;
}
