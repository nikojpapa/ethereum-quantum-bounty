import { ethers } from 'hardhat'
import { expect } from 'chai'
import {
  BountyFallbackAccount, BountyFallbackAccountFactory,
  BountyFallbackAccountFactory__factory, SignatureBounty,
  TestUtil,
  TestUtil__factory
} from '../../typechain'
import {
  createAddress,
  getBalance,
  isDeployed,
  ONE_ETH,
  HashZero
} from '../testutils'
import { fillUserOpDefaults, getUserOpHash, packUserOp } from '../UserOp'
import { arrayify, parseEther } from 'ethers/lib/utils'
import { UserOperation } from '../UserOperation'
import {
  createAccountLamport,
  createAccountOwnerLamport
} from './testutils-lamport'
import { signUserOpLamport } from './UserOpLamport'
import { WalletLamport } from './wallet-lamport'
import { generateLamportKeys } from './lamport-utils'
import SignatureBountyUtils from './signature-bounty-utils'

const EDCSA_LENGTH = 65

describe('BountyFallbackAccount', function () {
  const entryPoint = '0x'.padEnd(42, '2')
  let accounts: string[]
  let testUtil: TestUtil
  let accountOwner: WalletLamport
  const ethersSigner = ethers.provider.getSigner()

  const signatureBountyUtils = new SignatureBountyUtils()
  let bounty: SignatureBounty

  before(async function () {
    accounts = await ethers.provider.listAccounts()
    // ignore in geth.. this is just a sanity test. should be refactored to use a single-account mode..
    if (accounts.length < 2) this.skip()
    testUtil = await new TestUtil__factory(ethersSigner).deploy()
    accountOwner = createAccountOwnerLamport()
  })

  async function createFirstAccountLamport (): Promise<{
    proxy: BountyFallbackAccount
    accountFactory: BountyFallbackAccountFactory
    implementation: string
  }> {
    const keysLamport = generateLamportKeys()
    return await createAccountLamport(ethers.provider.getSigner(), accounts[0], keysLamport.publicKeys, bounty.address, entryPoint)
  }

  it('owner should be able to call transfer', async () => {
    const { proxy: account } = await createFirstAccountLamport()
    await ethersSigner.sendTransaction({ from: accounts[0], to: account.address, value: parseEther('2') })
    await account.execute(accounts[2], ONE_ETH, '0x')
  })

  it('other account should not be able to call transfer', async () => {
    const { proxy: account } = await createFirstAccountLamport()
    await expect(account.connect(ethers.provider.getSigner(1)).execute(accounts[2], ONE_ETH, '0x'))
      .to.be.revertedWith('account: not Owner or EntryPoint')
  })

  it('should pack in js the same as solidity', async () => {
    const op = await fillUserOpDefaults({ sender: accounts[0] })
    const packed = packUserOp(op)
    expect(await testUtil.packUserOp(op)).to.equal(packed)
  })

  describe('#validateUserOp', () => {
    let account: BountyFallbackAccount
    let userOpLamport: UserOperation
    let userOpHash: string
    let userOpNoLamport: UserOperation
    let preBalance: number
    let expectedPay: number

    const actualGasPrice = 1e9

    let nonceTracker = 0

    let bounty: SignatureBounty

    before(async () => {
      bounty = await signatureBountyUtils.deploySignatureBounty()

      // that's the account of ethersSigner
      const entryPoint = accounts[2];
      ({ proxy: account } = await createAccountLamport(
        await ethers.getSigner(entryPoint),
        accountOwner.baseWallet.address,
        accountOwner.lamportKeys.publicKeys,
        bounty.address,
        entryPoint))
      await ethersSigner.sendTransaction({ from: accounts[0], to: account.address, value: parseEther('0.2') })
      const callGasLimit = 200000
      const verificationGasLimit = 100000
      const maxFeePerGas = 3e9
      const chainId = await ethers.provider.getNetwork().then(net => net.chainId)

      userOpLamport = signUserOpLamport(fillUserOpDefaults({
        sender: account.address,
        callGasLimit,
        verificationGasLimit,
        maxFeePerGas
      }), accountOwner, entryPoint, chainId)
      userOpHash = await getUserOpHash(userOpLamport, entryPoint, chainId)

      userOpNoLamport = {
        ...userOpLamport,
        signature: Buffer.concat([
          Buffer.from(arrayify(userOpLamport.signature)).slice(0, EDCSA_LENGTH),
          Buffer.from(new Array(userOpLamport.signature.length - EDCSA_LENGTH).fill(0))
        ])
      }

      expectedPay = actualGasPrice * (callGasLimit + verificationGasLimit)
      preBalance = await getBalance(account.address)
    })

    describe('before bounty is solved', function () {
      before(async () => {
        const ret = await account.validateUserOp(userOpNoLamport, userOpHash, expectedPay, { gasPrice: actualGasPrice })
        await ret.wait()
        ++nonceTracker
      })

      it('should pay', async () => {
        const postBalance = await getBalance(account.address)
        expect(preBalance - postBalance).to.eql(expectedPay)
      })

      it('should increment nonce', async () => {
        expect(await account.nonce()).to.equal(1)
      })

      it('should reject same TX on nonce error', async () => {
        await expect(account.validateUserOp(userOpNoLamport, userOpHash, 0)).to.revertedWith('invalid nonce')
      })

      it('should return NO_SIG_VALIDATION on wrong ECDSA signature', async () => {
        const deadline = await account.callStatic.validateUserOp({ ...userOpNoLamport, nonce: nonceTracker }, HashZero, 0)
        expect(deadline).to.eq(1)
      })

      it('should return 0 on correct ECDSA signature', async () => {
        const deadline = await account.callStatic.validateUserOp({ ...userOpNoLamport, nonce: nonceTracker }, userOpHash, 0)
        expect(deadline).to.eq(0)
      })
    })

    describe('after bounty is solved', () => {
      before(async () => {
        const tx = await signatureBountyUtils.solveBounty(bounty)
        await tx.wait()

        const ret = await account.validateUserOp(userOpLamport, userOpHash, expectedPay, { gasPrice: actualGasPrice })
        await ret.wait()
        ++nonceTracker
      })

      it('should return NO_SIG_VALIDATION on wrong lamport signature', async () => {
        const deadline = await account.callStatic.validateUserOp({ ...userOpNoLamport, nonce: nonceTracker }, userOpHash, 0)
        expect(deadline).to.eq(1)
      })

      it.only('should return 0 on correct lamport signature', async () => {
        const deadline = await account.callStatic.validateUserOp({ ...userOpLamport, nonce: nonceTracker }, userOpHash, 0)
        expect(deadline).to.eq(0)
      })

      it('should succeed on larger numtests than testsize', () => {
        createAccountOwnerLamport(4, 3)
        expect.fail('Using these params when creating an account for the "should pay" test fails')
      })
    })

    describe('lamport signature is updated', () => {
      before(async () => {
        bounty = await signatureBountyUtils.deploySignatureBounty()
      })

      it('should update the lamport key for the subsequent transaction', async () => {
        const oldLamportKey = account.lamportKey()
        const tx1 = await account.callStatic.validateUserOp({ ...userOpLamport, nonce: nonceTracker }, userOpHash, 0)
        expect(tx1).to.eq(0)
        expect(oldLamportKey).to.not.equal(account.lamportKey())
      })

      it('should be able to send two messages by using updated lamport signatures', async () => {
        const txUsingFirstSignature = await account.callStatic.validateUserOp({ ...userOpLamport, nonce: nonceTracker }, userOpHash, 0)
        expect(txUsingFirstSignature).to.eq(0)

        const tx = await signatureBountyUtils.solveBounty(bounty)
        await tx.wait()

        const txUsingFirstSignatureAgain = await account.callStatic.validateUserOp({ ...userOpLamport, nonce: nonceTracker }, userOpHash, 0)
        expect(txUsingFirstSignatureAgain).to.eq(1)

        const callGasLimit = 200000
        const verificationGasLimit = 100000
        const maxFeePerGas = 3e9
        const chainId = await ethers.provider.getNetwork().then(net => net.chainId)
        const newUserOpLamport = signUserOpLamport(fillUserOpDefaults({
          sender: account.address,
          callGasLimit,
          verificationGasLimit,
          maxFeePerGas
        }), accountOwner, entryPoint, chainId)

        const txUsingDifferentSignature = await account.callStatic.validateUserOp({ ...newUserOpLamport, nonce: nonceTracker }, userOpHash, 0)
        expect(txUsingDifferentSignature).to.eq(0)
        ++nonceTracker
      })
    })
  })

  context('BountyFallbackWalletFactory', () => {
    it('sanity: check deployer', async () => {
      const ownerAddr = createAddress()
      const lamportKeys = generateLamportKeys()
      const deployer = await new BountyFallbackAccountFactory__factory(ethersSigner).deploy(entryPoint)
      const target = await deployer.callStatic.createAccount(ownerAddr, 1234, lamportKeys.publicKeys, bounty.address)
      expect(await isDeployed(target)).to.eq(false)
      await deployer.createAccount(ownerAddr, 1234, lamportKeys.publicKeys, bounty.address)
      expect(await isDeployed(target)).to.eq(true)
    })
  })
})
