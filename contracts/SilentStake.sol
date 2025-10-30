// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, ebool, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SilentStake
/// @notice Private points program with encrypted balances, staking, and withdrawals.
contract SilentStake is SepoliaConfig {
    uint64 public constant CLAIM_POINTS = 100;

    mapping(address account => euint64) private balances;
    mapping(address account => euint64) private stakedBalances;
    mapping(address account => bool) private hasClaimed;

    event PointsClaimed(address indexed account, euint64 balance);
    event PointsStaked(address indexed account, euint64 balance, euint64 stakedBalance);
    event PointsWithdrawn(address indexed account, euint64 balance, euint64 stakedBalance);

    /// @notice Claim the initial allocation of encrypted points.
    function claim() external {
        require(!hasClaimed[msg.sender], "Already claimed");

        _ensureInitializedBalances(msg.sender);

        euint64 claimAmount = FHE.asEuint64(CLAIM_POINTS);
        euint64 newBalance = _addEncrypted(balances[msg.sender], claimAmount);

        balances[msg.sender] = newBalance;
        hasClaimed[msg.sender] = true;

        _shareWithAccount(newBalance, msg.sender);
        _shareWithAccount(stakedBalances[msg.sender], msg.sender);

        emit PointsClaimed(msg.sender, newBalance);
    }

    /// @notice Stake encrypted points.
    /// @param amountHandle Encrypted amount handle
    /// @param inputProof Proof validating the encrypted amount
    function stake(externalEuint64 amountHandle, bytes calldata inputProof) external {
        require(hasClaimed[msg.sender], "Claim first");

        _ensureInitializedBalances(msg.sender);

        euint64 amount = FHE.fromExternal(amountHandle, inputProof);

        euint64 balance = balances[msg.sender];
        euint64 staked = stakedBalances[msg.sender];

        ebool hasEnough = FHE.ge(balance, amount);
        euint64 decreasedBalance = _subEncrypted(balance, amount);
        euint64 increasedStake = _addEncrypted(staked, amount);

        euint64 newBalance = FHE.select(hasEnough, decreasedBalance, balance);
        euint64 newStaked = FHE.select(hasEnough, increasedStake, staked);

        balances[msg.sender] = newBalance;
        stakedBalances[msg.sender] = newStaked;

        _shareWithAccount(newBalance, msg.sender);
        _shareWithAccount(newStaked, msg.sender);

        emit PointsStaked(msg.sender, newBalance, newStaked);
    }

    /// @notice Withdraw staked encrypted points back to the main balance.
    /// @param amountHandle Encrypted amount handle
    /// @param inputProof Proof validating the encrypted amount
    function withdraw(externalEuint64 amountHandle, bytes calldata inputProof) external {
        require(hasClaimed[msg.sender], "Claim first");

        _ensureInitializedBalances(msg.sender);

        euint64 amount = FHE.fromExternal(amountHandle, inputProof);

        euint64 balance = balances[msg.sender];
        euint64 staked = stakedBalances[msg.sender];

        ebool hasEnough = FHE.ge(staked, amount);
        euint64 decreasedStake = _subEncrypted(staked, amount);
        euint64 increasedBalance = _addEncrypted(balance, amount);

        euint64 newStaked = FHE.select(hasEnough, decreasedStake, staked);
        euint64 newBalance = FHE.select(hasEnough, increasedBalance, balance);

        stakedBalances[msg.sender] = newStaked;
        balances[msg.sender] = newBalance;

        _shareWithAccount(newBalance, msg.sender);
        _shareWithAccount(newStaked, msg.sender);

        emit PointsWithdrawn(msg.sender, newBalance, newStaked);
    }

    /// @notice Get the encrypted balance for an account.
    /// @param account Address to query
    function balanceOf(address account) external view returns (euint64) {
        return balances[account];
    }

    /// @notice Get the encrypted staked balance for an account.
    /// @param account Address to query
    function stakedBalanceOf(address account) external view returns (euint64) {
        return stakedBalances[account];
    }

    /// @notice Check if an account already claimed the initial allocation.
    /// @param account Address to query
    function hasClaimedPoints(address account) external view returns (bool) {
        return hasClaimed[account];
    }

    function _addEncrypted(euint64 left, euint64 right) private pure returns (euint64) {
        return FHE.add(left, right);
    }

    function _subEncrypted(euint64 left, euint64 right) private pure returns (euint64) {
        return FHE.sub(left, right);
    }

    function _shareWithAccount(euint64 value, address account) private {
        if (!FHE.isInitialized(value)) {
            return;
        }

        FHE.allowThis(value);
        FHE.allow(value, account);
    }

    function _ensureInitializedBalances(address account) private {
        if (!FHE.isInitialized(balances[account])) {
            euint64 zero = FHE.asEuint64(0);
            balances[account] = zero;
            _shareWithAccount(zero, account);
        }

        if (!FHE.isInitialized(stakedBalances[account])) {
            euint64 zeroStaked = FHE.asEuint64(0);
            stakedBalances[account] = zeroStaked;
            _shareWithAccount(zeroStaked, account);
        }
    }
}
