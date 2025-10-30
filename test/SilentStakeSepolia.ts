import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { SilentStake } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("SilentStakeSepolia", function () {
  let signers: Signers;
  let contract: SilentStake;
  let contractAddress: string;
  let step = 0;
  let steps = 0;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn("This Hardhat test suite only runs on Sepolia");
      this.skip();
    }

    try {
      const deployment = await deployments.get("SilentStake");
      contractAddress = deployment.address;
      contract = await ethers.getContractAt("SilentStake", contractAddress);
    } catch (error) {
      (error as Error).message += ". Run 'npx hardhat deploy --network sepolia' first";
      throw error;
    }

    const signerList = await ethers.getSigners();
    signers = { alice: signerList[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("claims and stakes points", async function () {
    steps = 11;

    this.timeout(4 * 40000);

    progress("Calling claim()...");
    const claimTx = await contract.connect(signers.alice).claim();
    await claimTx.wait();

    await fhevm.initializeCLIApi();

    progress("Encrypting 20 points...");
    const encryptedStake = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add64(20)
      .encrypt();

    progress("Calling stake(20)...");
    const stakeTx = await contract
      .connect(signers.alice)
      .stake(encryptedStake.handles[0], encryptedStake.inputProof);
    await stakeTx.wait();

    progress("Fetching encrypted balances...");
    const balanceHandle = await contract.balanceOf(signers.alice.address);
    const stakedHandle = await contract.stakedBalanceOf(signers.alice.address);

    progress("Decrypting balance...");
    const balance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      balanceHandle,
      contractAddress,
      signers.alice,
    );
    progress(`Balance=${balance}`);

    progress("Decrypting staked balance...");
    const staked = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      stakedHandle,
      contractAddress,
      signers.alice,
    );
    progress(`Staked=${staked}`);

    expect(balance + staked).to.eq(100);
    expect(staked).to.eq(20);
  });
});
