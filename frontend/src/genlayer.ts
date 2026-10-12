import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import type { CalldataEncodable } from 'genlayer-js/types';

// Environment configuration
const env = ((import.meta as any).env || {}) as Record<string, string | undefined>;
export const CONTRACT_ADDRESS = (env.VITE_CONTRACT_ADDRESS || '0xE070F977429707e9c2dd2eb7E4B58404627f3363').trim();
export const isConfigured = /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS);

export const WYRM_WARD_CHAIN = {
  ...studioDevnet,
  id: 61997,
  name: 'GenLayer Studio Next',
  rpcUrls: {
    default: {
      http: ['https://studio-next.genlayer.com/api'],
    },
  },
};

// Global read-only client
const rpcReader = createClient({ chain: WYRM_WARD_CHAIN });

export async function connectWallet(): Promise<string> {
  const provider = (window as any).ethereum;
  if (!provider?.request) {
    throw new Error('Please install a compatible Web3 wallet (MetaMask, Rabby, etc.).');
  }

  const accounts = (await provider.request({ method: 'eth_requestAccounts' })) as string[];
  const account = accounts?.[0] || '';
  if (!/^0x[a-fA-F0-9]{40}$/.test(account)) {
    throw new Error('Wallet did not return a valid Ethereum address.');
  }

  const chainIdHex = (await provider.request({ method: 'eth_chainId' })) as string;
  if (BigInt(chainIdHex) !== 61997n) {
    throw new Error('Please switch your wallet network to GenLayer Studio Next (Chain ID 61997).');
  }

  return account;
}

export async function readContractState<T>(
  functionName: string,
  args: CalldataEncodable[] = []
): Promise<T> {
  if (!isConfigured) {
    throw new Error('Contract address is not configured. Set VITE_CONTRACT_ADDRESS.');
  }

  const result = await rpcReader.readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName,
    args,
    stateStatus: 'finalized',
    jsonSafeReturn: true,
  } as never);

  return result as T;
}

export async function executeContractTransaction(
  functionName: string,
  args: CalldataEncodable[],
  account: string
): Promise<string> {
  if (!isConfigured) {
    throw new Error('Contract address is not configured. Set VITE_CONTRACT_ADDRESS.');
  }

  const provider = (window as any).ethereum;
  if (!provider) {
    throw new Error('Injected wallet provider unavailable.');
  }

  const currentAccount = await connectWallet();
  if (currentAccount.toLowerCase() !== account.toLowerCase()) {
    throw new Error('Active wallet account changed. Please reconnect.');
  }

  const client = createClient({
    chain: WYRM_WARD_CHAIN,
    provider,
    account: account as `0x${string}`,
  });

  // Estimate transaction fee parameters
  const fees = await client.estimateTransactionFees({
    leaderTimeunitsAllocation: 300n,
    validatorTimeunitsAllocation: 600n,
  });

  const rawTx: any = await client.writeContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName,
    args,
    fees: {
      distribution: fees.distribution,
      feeValue: fees.feeValue,
    },
  } as never);

  const hash = typeof rawTx === 'string' ? rawTx : rawTx?.hash || rawTx?.txId || '';
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    throw new Error('Wallet returned an invalid transaction hash.');
  }

  // Await consensus finalization on GenLayer
  const receipt: any = await rpcReader.waitForTransactionReceipt({
    hash,
    waitUntil: 'finalized',
  });

  if (receipt && receipt.status_name && receipt.status_name !== 'FINALIZED') {
    throw new Error(`Transaction completed with status: ${receipt.status_name}`);
  }

  return hash;
}
