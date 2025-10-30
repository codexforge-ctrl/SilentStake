import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:address", "Prints the SilentStake contract address").setAction(async (_taskArguments: TaskArguments, hre) => {
  const { deployments } = hre;

  const deployment = await deployments.get("SilentStake");

  console.log(`SilentStake address: ${deployment.address}`);
});

task("task:claim", "Calls claim() on SilentStake")
  .addOptionalParam("address", "Optional SilentStake address")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { deployments, ethers } = hre;

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get("SilentStake");

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("SilentStake", deployment.address);

    const tx = await contract.connect(signer).claim();
    console.log(`Wait for tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Status: ${receipt?.status}`);
  });

task("task:stake", "Calls stake() with an encrypted value")
  .addParam("value", "Amount to stake (plaintext number)")
  .addOptionalParam("address", "Optional SilentStake address")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { deployments, ethers, fhevm } = hre;

    const amount = parseInt(taskArguments.value);
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error(`Invalid --value ${taskArguments.value}`);
    }

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get("SilentStake");
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("SilentStake", deployment.address);

    const encryptedInput = await fhevm
      .createEncryptedInput(deployment.address, signer.address)
      .add64(amount)
      .encrypt();

    const tx = await contract
      .connect(signer)
      .stake(encryptedInput.handles[0], encryptedInput.inputProof);

    console.log(`Wait for tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Status: ${receipt?.status}`);
  });

task("task:withdraw", "Calls withdraw() with an encrypted value")
  .addParam("value", "Amount to withdraw (plaintext number)")
  .addOptionalParam("address", "Optional SilentStake address")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { deployments, ethers, fhevm } = hre;

    const amount = parseInt(taskArguments.value);
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error(`Invalid --value ${taskArguments.value}`);
    }

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get("SilentStake");
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("SilentStake", deployment.address);

    const encryptedInput = await fhevm
      .createEncryptedInput(deployment.address, signer.address)
      .add64(amount)
      .encrypt();

    const tx = await contract
      .connect(signer)
      .withdraw(encryptedInput.handles[0], encryptedInput.inputProof);

    console.log(`Wait for tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Status: ${receipt?.status}`);
  });

task("task:decrypt-balances", "Decrypts balance and staked balance for signer")
  .addOptionalParam("address", "Optional SilentStake address")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { deployments, ethers, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address ? { address: taskArguments.address } : await deployments.get("SilentStake");
    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("SilentStake", deployment.address);

    const balance = await contract.balanceOf(signer.address);
    const stakedBalance = await contract.stakedBalanceOf(signer.address);

    if (balance === ethers.ZeroHash && stakedBalance === ethers.ZeroHash) {
      console.log("Balances are uninitialized. Claim first.");
      return;
    }

    if (balance !== ethers.ZeroHash) {
      const clearBalance = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        balance,
        deployment.address,
        signer,
      );
      console.log(`Decrypted balance: ${clearBalance}`);
    } else {
      console.log("Balance handle is uninitialized");
    }

    if (stakedBalance !== ethers.ZeroHash) {
      const clearStaked = await fhevm.userDecryptEuint(
        FhevmType.euint64,
        stakedBalance,
        deployment.address,
        signer,
      );
      console.log(`Decrypted staked balance: ${clearStaked}`);
    } else {
      console.log("Staked balance handle is uninitialized");
    }
  });
