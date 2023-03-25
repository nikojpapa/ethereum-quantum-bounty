import { ethers } from 'hardhat'
import { expect, use } from 'chai'
import {
  BountyFallbackAccount, BountyFallbackAccountFactory,
  BountyFallbackAccountFactory__factory,
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
import { fillUserOpDefaults, getUserOpHash, packUserOp, signUserOp } from '../UserOp'
import { parseEther } from 'ethers/lib/utils'
import { UserOperation } from '../UserOperation'
import {
  createAccountLamport,
  createAccountOwnerLamport
} from './testutils-lamport'
import { signUserOpLamport } from './UserOpLamport'
import { WalletLamport } from './wallet-lamport'
import { generateLamportKeys } from './lamport-utils'

describe('BountyFallbackAccount', function () {
  const entryPoint = '0x'.padEnd(42, '2')
  let accounts: string[]
  let testUtil: TestUtil
  let accountOwner: WalletLamport
  const ethersSigner = ethers.provider.getSigner()

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
    return await createAccountLamport(ethers.provider.getSigner(), accounts[0], keysLamport.publicKeys, entryPoint)
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
    let userOpHashLamport: string
    let userOpNoLamport: UserOperation
    let userOpHashNoLamport: string
    let preBalance: number
    let expectedPay: number

    const actualGasPrice = 1e9

    let nonceTracker = 0

    before(async () => {
      // that's the account of ethersSigner
      const entryPoint = accounts[2];
      ({ proxy: account } = await createAccountLamport(
        await ethers.getSigner(entryPoint),
        accountOwner.baseWallet.address,
        accountOwner.lamportKeys.publicKeys,
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
      userOpHashLamport = await getUserOpHash(userOpLamport, entryPoint, chainId)

      userOpNoLamport = signUserOp(fillUserOpDefaults({
        sender: account.address,
        callGasLimit,
        verificationGasLimit,
        maxFeePerGas
      }), accountOwner.baseWallet, entryPoint, chainId)
      userOpHashNoLamport = await getUserOpHash(userOpLamport, entryPoint, chainId)

      expectedPay = actualGasPrice * (callGasLimit + verificationGasLimit)

      preBalance = await getBalance(account.address)
    })

    describe.only('before bounty is solved', function () {
      describe('only ECDS signature sent', () => {
        before(async () => {
          const ret = await account.validateUserOp(userOpNoLamport, userOpHashNoLamport, expectedPay, { gasPrice: actualGasPrice })
          await ret.wait()
          ++nonceTracker;
        })

        it('should pay', async () => {
          const postBalance = await getBalance(account.address)
          expect(preBalance - postBalance).to.eql(expectedPay)
        })

        it('should increment nonce', async () => {
          expect(await account.nonce()).to.equal(1)
        })

        it('should reject same TX on nonce error', async () => {
          await expect(account.validateUserOp(userOpNoLamport, userOpHashNoLamport, 0)).to.revertedWith('invalid nonce')
        })

        it('should return NO_SIG_VALIDATION on wrong signature', async () => {
          const deadline = await account.callStatic.validateUserOp({ ...userOpNoLamport, nonce: nonceTracker++ }, HashZero, 0)
          expect(deadline).to.eq(1)
        })
      })

      describe('invalid lamport signature included', () => {
        before(async () => {
          const signatureWithInvalidLamport = userOpNoLamport.signature + HashZero.slice(2)
          const ret = await account.validateUserOp({ ...userOpNoLamport, signature: signatureWithInvalidLamport, nonce: nonceTracker++ }, userOpHashNoLamport, expectedPay, { gasPrice: actualGasPrice })
          await ret.wait()
        })

        it('should pay', async () => {
          const postBalance = await getBalance(account.address)
          expect(preBalance - postBalance).to.eql(expectedPay)
        })

        it('should return NO_SIG_VALIDATION on wrong signature', async () => {
          const userOpHash = HashZero
          const deadline = await account.callStatic.validateUserOp({ ...userOpNoLamport, nonce: nonceTracker++ }, userOpHash, 0)
          expect(deadline).to.eq(1)
        })
      })
    })

    describe('after bounty is solved', () => {
      before(async () => {
        const ret = await account.validateUserOp(userOpLamport, userOpHashLamport, expectedPay, { gasPrice: actualGasPrice })
        await ret.wait()
      })

      before(async () => {
        const ret = await account.validateUserOp(userOpLamport, userOpHashLamport, expectedPay, { gasPrice: actualGasPrice })
        await ret.wait()
      })

      it('should pay', async () => {
        const postBalance = await getBalance(account.address)
        expect(preBalance - postBalance).to.eql(expectedPay)
      })

      it('should increment nonce', async () => {
        expect(await account.nonce()).to.equal(1)
      })

      it('should reject same TX on nonce error', async () => {
        await expect(account.validateUserOp(userOpLamport, userOpHashLamport, 0)).to.revertedWith('invalid nonce')
      })

      it('should return NO_SIG_VALIDATION on wrong signature', async () => {
        const userOpHash = HashZero
        const deadline = await account.callStatic.validateUserOp({ ...userOpLamport, nonce: 1 }, userOpHash, 0)
        expect(deadline).to.eq(1)
      })

      it('should succeed on larger numtests than testsize', () => {
        createAccountOwnerLamport(4, 3)
        expect.fail('Using these params when creating an account for the "should pay" test fails')
      })
    })
  })
  context('BountyFallbackWalletFactory', () => {
    it('sanity: check deployer', async () => {
      const ownerAddr = createAddress()
      const lamportKeys = generateLamportKeys()
      const deployer = await new BountyFallbackAccountFactory__factory(ethersSigner).deploy(entryPoint)
      const target = await deployer.callStatic.createAccount(ownerAddr, 1234, lamportKeys.publicKeys)
      expect(await isDeployed(target)).to.eq(false)
      await deployer.createAccount(ownerAddr, 1234, lamportKeys.publicKeys)
      expect(await isDeployed(target)).to.eq(true)
    })
  })
})
