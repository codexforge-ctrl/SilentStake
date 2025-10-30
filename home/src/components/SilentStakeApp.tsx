import { useState, useMemo, useCallback } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { Contract } from 'ethers';
import { Header } from './Header';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { SILENT_STAKE_ABI } from '../config/abi';
import { SILENT_STAKE_ADDRESS } from '../config/contracts';
import '../styles/SilentStakeApp.css';

const ZERO_HANDLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
const CLAIM_POINTS = 100n;

function parseDecryptedValue(value: unknown): bigint {
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number') {
    return BigInt(value);
  }
  if (typeof value === 'string') {
    return BigInt(value);
  }

  throw new Error('Unsupported decrypted value');
}

export function SilentStakeApp() {
  const { address, isConnected } = useAccount();
  const { instance, isLoading: isInstanceLoading, error: instanceError } = useZamaInstance();
  const signer = useEthersSigner({ chainId: sepolia.id });

  const [contractAddress, setContractAddress] = useState<string>(SILENT_STAKE_ADDRESS);
  const contractReady = useMemo(
    () => true,
    [contractAddress],
  );

  const [claimStatus, setClaimStatus] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clearBalance, setClearBalance] = useState<bigint | null>(null);
  const [clearStakedBalance, setClearStakedBalance] = useState<bigint | null>(null);
  const [decryptStatus, setDecryptStatus] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const accountArg = useMemo<readonly [`0x${string}`] | undefined>(
    () => (address ? [address as `0x${string}`] as const : undefined),
    [address],
  );

  const {
    data: balanceHandle,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useReadContract({
    chainId: sepolia.id,
    abi: SILENT_STAKE_ABI,
    address: contractAddress as `0x${string}`,
    functionName: 'balanceOf',
    args: accountArg,
    query: {
      enabled: Boolean(address) && contractReady,
    },
  });

  const {
    data: stakedBalanceHandle,
    isLoading: isStakedLoading,
    refetch: refetchStaked,
  } = useReadContract({
    chainId: sepolia.id,
    abi: SILENT_STAKE_ABI,
    address: contractAddress as `0x${string}`,
    functionName: 'stakedBalanceOf',
    args: accountArg,
    query: {
      enabled: Boolean(address) && contractReady,
    },
  });

  const {
    data: hasClaimed,
    refetch: refetchClaimed,
  } = useReadContract({
    chainId: sepolia.id,
    abi: SILENT_STAKE_ABI,
    address: contractAddress as `0x${string}`,
    functionName: 'hasClaimedPoints',
    args: accountArg,
    query: {
      enabled: Boolean(address) && contractReady,
    },
  });

  const refetchAll = useCallback(async () => {
    if (!contractReady) {
      return;
    }

    await Promise.all([refetchBalance(), refetchStaked(), refetchClaimed()]);
  }, [contractReady, refetchBalance, refetchStaked, refetchClaimed]);

  const resetFormState = () => {
    setClaimStatus(null);
    setTxStatus(null);
    setFormError(null);
  };

  const getSigner = useCallback(async () => {
    const resolvedSigner = signer ? await signer : undefined;
    if (!resolvedSigner) {
      throw new Error('Connect a wallet to continue');
    }

    return resolvedSigner;
  }, [signer]);

  const encryptAmount = useCallback(
    async (value: bigint, signerAddress: string) => {
      if (!instance) {
        throw new Error('Encryption service not ready');
      }

      if (!contractReady) {
        throw new Error('Set the SilentStake contract address first');
      }

      const buffer = instance.createEncryptedInput(contractAddress, signerAddress);
      buffer.add64(value);
      const encrypted = await buffer.encrypt();
      return encrypted;
    },
    [contractAddress, contractReady, instance],
  );

  const handleClaim = useCallback(async () => {
    if (!isConnected) {
      setFormError('Connect a wallet first');
      return;
    }

    if (!contractReady) {
      setFormError('Set the SilentStake contract address first');
      return;
    }

    if (!contractReady) {
      setFormError('Set the SilentStake contract address first');
      return;
    }

    if (!contractReady) {
      setFormError('Set the SilentStake contract address first');
      return;
    }

    setIsProcessing(true);
    resetFormState();

    try {
      const resolvedSigner = await getSigner();
      const contract = new Contract(contractAddress, SILENT_STAKE_ABI, resolvedSigner);
      setClaimStatus('Submitting claim transaction...');
      const tx = await contract.claim();
      setTxStatus(`Tx submitted: ${tx.hash}`);
      await tx.wait();
      setClaimStatus('Claim confirmed');
      await refetchAll();
    } catch (error) {
      setFormError((error as Error).message ?? 'Claim failed');
    } finally {
      setIsProcessing(false);
    }
  }, [contractAddress, contractReady, getSigner, isConnected, refetchAll]);

  const handleStake = useCallback(async () => {
    if (!isConnected) {
      setFormError('Connect a wallet first');
      return;
    }

    const value = stakeAmount.trim();
    if (value === '') {
      setFormError('Enter an amount to stake');
      return;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      setFormError('Stake amount must be a positive number');
      return;
    }

    setIsProcessing(true);
    resetFormState();

    try {
      const resolvedSigner = await getSigner();
      const signerAddress = await resolvedSigner.getAddress();
      const encrypted = await encryptAmount(BigInt(Math.floor(numeric)), signerAddress);
      const contract = new Contract(contractAddress, SILENT_STAKE_ABI, resolvedSigner);

      setTxStatus('Submitting stake transaction...');
      const tx = await contract.stake(encrypted.handles[0], encrypted.inputProof);
      setTxStatus(`Tx submitted: ${tx.hash}`);
      await tx.wait();
      setTxStatus('Stake confirmed');
      setStakeAmount('');
      await refetchAll();
    } catch (error) {
      setFormError((error as Error).message ?? 'Stake failed');
    } finally {
      setIsProcessing(false);
    }
  }, [contractAddress, contractReady, encryptAmount, getSigner, isConnected, refetchAll, stakeAmount]);

  const handleWithdraw = useCallback(async () => {
    if (!isConnected) {
      setFormError('Connect a wallet first');
      return;
    }

    const value = withdrawAmount.trim();
    if (value === '') {
      setFormError('Enter an amount to withdraw');
      return;
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      setFormError('Withdraw amount must be a positive number');
      return;
    }

    setIsProcessing(true);
    resetFormState();

    try {
      const resolvedSigner = await getSigner();
      const signerAddress = await resolvedSigner.getAddress();
      const encrypted = await encryptAmount(BigInt(Math.floor(numeric)), signerAddress);
      const contract = new Contract(contractAddress, SILENT_STAKE_ABI, resolvedSigner);

      setTxStatus('Submitting withdraw transaction...');
      const tx = await contract.withdraw(encrypted.handles[0], encrypted.inputProof);
      setTxStatus(`Tx submitted: ${tx.hash}`);
      await tx.wait();
      setTxStatus('Withdraw confirmed');
      setWithdrawAmount('');
      await refetchAll();
    } catch (error) {
      setFormError((error as Error).message ?? 'Withdraw failed');
    } finally {
      setIsProcessing(false);
    }
  }, [contractAddress, contractReady, encryptAmount, getSigner, isConnected, refetchAll, withdrawAmount]);

  const decryptBalances = useCallback(async () => {
    if (!isConnected) {
      setFormError('Connect a wallet first');
      return;
    }

    if (!contractReady) {
      setFormError('Set the SilentStake contract address first');
      return;
    }

    resetFormState();

    if (!instance) {
      setFormError('Encryption service not ready');
      return;
    }

    const balanceHex = typeof balanceHandle === 'string' ? balanceHandle : undefined;
    const stakedHex = typeof stakedBalanceHandle === 'string' ? stakedBalanceHandle : undefined;

    if (!balanceHex && !stakedHex) {
      setClearBalance(null);
      setClearStakedBalance(null);
      return;
    }

    try {
      setDecryptStatus('Preparing decryption request...');
      const resolvedSigner = await getSigner();
      const signerAddress = await resolvedSigner.getAddress();

      const handles = [] as Array<{ handle: string; contractAddress: string }>;
      if (balanceHex && balanceHex !== ZERO_HANDLE) {
        handles.push({ handle: balanceHex, contractAddress });
      }
      if (stakedHex && stakedHex !== ZERO_HANDLE) {
        handles.push({ handle: stakedHex, contractAddress });
      }

      if (handles.length === 0) {
        setClearBalance(0n);
        setClearStakedBalance(0n);
        setDecryptStatus('Balances are zero');
        return;
      }

      const keypair = instance.generateKeypair();
      const contractAddresses = [contractAddress];
      const startTimestamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '1';
      const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimestamp, durationDays);

      setDecryptStatus('Awaiting signature for decryption request...');
      const signature = await resolvedSigner.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message,
      );

      setDecryptStatus('Requesting relayer decryption...');
      const result = await instance.userDecrypt(
        handles,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        signerAddress,
        startTimestamp,
        durationDays,
      );

      if (balanceHex && balanceHex !== ZERO_HANDLE) {
        setClearBalance(parseDecryptedValue(result[balanceHex]));
      } else {
        setClearBalance(0n);
      }

      if (stakedHex && stakedHex !== ZERO_HANDLE) {
        setClearStakedBalance(parseDecryptedValue(result[stakedHex]));
      } else {
        setClearStakedBalance(0n);
      }

      setDecryptStatus('Decryption completed');
    } catch (error) {
      setFormError((error as Error).message ?? 'Decryption failed');
      setDecryptStatus(null);
    }
  }, [balanceHandle, contractAddress, contractReady, getSigner, instance, isConnected, stakedBalanceHandle]);

  const renderConnectionState = () => {
    if (!isConnected) {
      return (
        <div className="info-card">
          <h2 className="info-title">Connect your wallet</h2>
          <p className="info-description">
            Link a wallet on Sepolia to claim points, stake, and withdraw privately.
          </p>
        </div>
      );
    }

    if (isInstanceLoading) {
      return (
        <div className="info-card">
          <h2 className="info-title">Initializing encryption</h2>
          <p className="info-description">Preparing Zama relayer SDK. This happens once per session.</p>
        </div>
      );
    }

    if (instanceError) {
      return (
        <div className="info-card error">
          <h2 className="info-title">Encryption unavailable</h2>
          <p className="info-description">{instanceError}</p>
        </div>
      );
    }

    if (!contractReady) {
      return (
        <div className="info-card">
          <h2 className="info-title">Set the contract address</h2>
          <p className="info-description">
            Paste the SilentStake contract deployed on Sepolia. You can find it in the Hardhat deployments after running the
            deploy scripts.
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="silent-stake-app">
      <Header />
      <main className="main-content">
        {renderConnectionState()}

        {isConnected && !isInstanceLoading && !instanceError && (
          <div className="grid">
            <section className="card span-two">
              <div className="card-header">
                <h2>Contract address</h2>
                <p>Provide the SilentStake deployment on Sepolia.</p>
              </div>
              <div className="form-group">
                <label htmlFor="contract-address">Address</label>
                <input
                  id="contract-address"
                  type="text"
                  value={contractAddress}
                  onChange={(event) => setContractAddress(event.target.value)}
                  placeholder="0x..."
                />
              </div>
              <p className={`status ${contractReady ? '' : 'muted'}`}>
                {contractReady ? 'Using this contract for encryption and reads.' : 'Enter a deployed contract address to unlock actions.'}
              </p>
            </section>

            <section className="card">
              <div className="card-header">
                <h2>Claim</h2>
                <p>Receive {Number(CLAIM_POINTS)} encrypted points once per account.</p>
              </div>
              <button className="primary" disabled={Boolean(hasClaimed) || isProcessing || !contractReady} onClick={handleClaim}>
                {Boolean(hasClaimed) ? 'Already claimed' : `Claim ${Number(CLAIM_POINTS)} points`}
              </button>
              {claimStatus && <p className="status">{claimStatus}</p>}
            </section>

            <section className="card">
              <div className="card-header">
                <h2>Stake</h2>
                <p>Encrypt an amount to move it into staking.</p>
              </div>
              <div className="form-group">
                <label htmlFor="stake-amount">Amount</label>
                <input
                  id="stake-amount"
                  type="number"
                  min="0"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={stakeAmount}
                  onChange={(event) => setStakeAmount(event.target.value)}
                  placeholder="Enter points"
                />
              </div>
              <button className="primary" disabled={isProcessing || !instance || !contractReady} onClick={handleStake}>
                Stake
              </button>
            </section>

            <section className="card">
              <div className="card-header">
                <h2>Withdraw</h2>
                <p>Bring staked points back to your balance.</p>
              </div>
              <div className="form-group">
                <label htmlFor="withdraw-amount">Amount</label>
                <input
                  id="withdraw-amount"
                  type="number"
                  min="0"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={withdrawAmount}
                  onChange={(event) => setWithdrawAmount(event.target.value)}
                  placeholder="Enter points"
                />
              </div>
              <button className="primary" disabled={isProcessing || !instance || !contractReady} onClick={handleWithdraw}>
                Withdraw
              </button>
            </section>

            <section className="card span-two">
              <div className="card-header">
                <h2>Balances</h2>
                <p>Handles update automatically after transactions. Decrypt them locally whenever you need the clear values.</p>
              </div>
              <div className="balances">
                <div>
                  <p className="balance-label">Encrypted balance</p>
                  <p className="balance-handle">{typeof balanceHandle === 'string' ? balanceHandle : '—'}</p>
                </div>
                <div>
                  <p className="balance-label">Encrypted staked balance</p>
                  <p className="balance-handle">{typeof stakedBalanceHandle === 'string' ? stakedBalanceHandle : '—'}</p>
                </div>
              </div>
              <button className="secondary" disabled={isProcessing || !instance || !contractReady} onClick={decryptBalances}>
                Decrypt balances
              </button>

              {decryptStatus && <p className="status">{decryptStatus}</p>}

              <div className="clear-balances">
                <div>
                  <p className="balance-label">Balance (clear)</p>
                  <p className="clear-value">
                    {clearBalance !== null
                      ? `${clearBalance.toString()} points`
                      : balanceHandle === ZERO_HANDLE
                        ? '0 points'
                        : 'Decrypt to reveal'}
                  </p>
                </div>
                <div>
                  <p className="balance-label">Staked (clear)</p>
                  <p className="clear-value">
                    {clearStakedBalance !== null
                      ? `${clearStakedBalance.toString()} points`
                      : stakedBalanceHandle === ZERO_HANDLE
                        ? '0 points'
                        : 'Decrypt to reveal'}
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {(txStatus || formError) && (
          <div className={`feedback ${formError ? 'error' : ''}`}>
            {formError ?? txStatus}
          </div>
        )}

        {(isBalanceLoading || isStakedLoading) && isConnected && (
          <p className="status muted">Refreshing encrypted balances...</p>
        )}
      </main>
    </div>
  );
}
