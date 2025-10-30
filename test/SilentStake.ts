import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { SilentStake, SilentStake__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("SilentStake")) as SilentStake__factory;
  const contract = (await factory.deploy()) as SilentStake;
  const address = await contract.getAddress();

  return { contract, address };
}

describe("SilentStake", function () {
  let signers: Signers;
  let contract: SilentStake;
  let contractAddress: string;

  before(async function () {
    const allSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: allSigners[0], alice: allSigners[1], bob: allSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This Hardhat test suite requires the FHEVM mock environment");
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  it("initial balances are uninitialized", async function () {
    expect(await contract.balanceOf(signers.alice.address)).to.eq(ethers.ZeroHash);
    expect(await contract.stakedBalanceOf(signers.alice.address)).to.eq(ethers.ZeroHash);
  });

  it("allows claiming 100 points", async function () {
    const tx = await contract.connect(signers.alice).claim();
    await tx.wait();

    const balanceHandle = await contract.balanceOf(signers.alice.address);
    expect(balanceHandle).to.not.eq(ethers.ZeroHash);

    const balance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      balanceHandle,
      contractAddress,
      signers.alice,
    );

    expect(balance).to.eq(100);
  });

  it("stakes encrypted points", async function () {
    await contract.connect(signers.alice).claim();

    const encryptedAmount = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add64(40)
      .encrypt();

    const tx = await contract
      .connect(signers.alice)
      .stake(encryptedAmount.handles[0], encryptedAmount.inputProof);
    await tx.wait();

    const balanceHandle = await contract.balanceOf(signers.alice.address);
    const stakedHandle = await contract.stakedBalanceOf(signers.alice.address);

    const balance = await fhevm.userDecryptEuint(FhevmType.euint64, balanceHandle, contractAddress, signers.alice);
    const staked = await fhevm.userDecryptEuint(FhevmType.euint64, stakedHandle, contractAddress, signers.alice);

    expect(balance).to.eq(60);
    expect(staked).to.eq(40);
  });

  it("withdraws from the staked balance", async function () {
    await contract.connect(signers.alice).claim();

    const encryptedAmount = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add64(70)
      .encrypt();
    await contract.connect(signers.alice).stake(encryptedAmount.handles[0], encryptedAmount.inputProof);

    const encryptedWithdraw = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add64(30)
      .encrypt();

    const tx = await contract
      .connect(signers.alice)
      .withdraw(encryptedWithdraw.handles[0], encryptedWithdraw.inputProof);
    await tx.wait();

    const balanceHandle = await contract.balanceOf(signers.alice.address);
    const stakedHandle = await contract.stakedBalanceOf(signers.alice.address);

    const balance = await fhevm.userDecryptEuint(FhevmType.euint64, balanceHandle, contractAddress, signers.alice);
    const staked = await fhevm.userDecryptEuint(FhevmType.euint64, stakedHandle, contractAddress, signers.alice);

    expect(balance).to.eq(60);
    expect(staked).to.eq(40);
  });
});
