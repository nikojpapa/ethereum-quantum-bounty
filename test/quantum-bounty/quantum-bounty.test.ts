import '../aa.init'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { QuantumBounty, QuantumBounty__factory } from '../../typechain'
import {address} from "../solidityTypes";

describe('QuantumBounty', () => {
  const ethersSigner = ethers.provider.getSigner()
  let bounty: QuantumBounty
  const locks: address[] = []

  beforeEach(async function () {
    for (let i = 0; i < 10; i++) {
      const wallet = ethers.provider.getSigner(i)
      locks.push(await wallet.getAddress())
    }
    bounty = await new QuantumBounty__factory(ethersSigner).deploy(locks)
  })

  describe('Lock generation', () => {
    it('should set locks', async () => {
      for (let i = 0; i < locks.length; i++) {
        const expectedLock = locks[i]
        const bountyLock = await bounty.locks(i)
        expect(bountyLock).to.equal(expectedLock)
      }
    })
  })

  describe('Add to bounty', () => {
    const amountToAdd = 100
    const otherUser = ethers.provider.getSigner(1)

    async function testAddToBounty (func: () => Promise<void>): Promise<void> {
      expect(await bounty.bounty()).to.equal(0)
      await func()
      expect(await bounty.bounty()).to.equal(amountToAdd)
    }

    it('should allow adding to the bounty', async () => {
      await testAddToBounty(async () => {
        await bounty.connect(otherUser).addToBounty({ value: amountToAdd })
      })
    })

    it('should allow adding to the bounty by sending funds to address using receive', async () => {
      await testAddToBounty(async () => {
        await otherUser.sendTransaction({ to: bounty.address, value: amountToAdd })
      })
    })

    it('should allow adding to the bounty by sending funds to address using fallback', async () => {
      await testAddToBounty(async () => {
        const arbitrary_data = '0x54'
        await otherUser.sendTransaction({ to: bounty.address, value: amountToAdd, data: arbitrary_data })
      })
    })

    // it('should fail to withdraw without unlock', async () => {
    //   const paymasterWithdraw = await paymaster.populateTransaction.withdrawTokensTo(token.address, AddressZero, 1).then(tx => tx.data!)
    //
    //   await expect(
    //     account.execute(paymaster.address, 0, paymasterWithdraw)
    //   ).to.revertedWith('DepositPaymaster: must unlockTokenDeposit')
    // })
  })

  // describe('#validatePaymasterUserOp', () => {
  //   let account: SimpleAccount
  //   const gasPrice = 1e9
  //
  //   before(async () => {
  //     ({ proxy: account } = await createAccount(ethersSigner, await ethersSigner.getAddress(), entryPoint.address))
  //   })
  //
  //   it('should fail if no token', async () => {
  //     const userOp = await fillAndSign({
  //       sender: account.address,
  //       paymasterAndData: paymaster.address
  //     }, ethersSigner, entryPoint)
  //     await expect(entryPoint.callStatic.simulateValidation(userOp)).to.be.revertedWith('paymasterAndData must specify token')
  //   })
  //
  //   it('should fail with wrong token', async () => {
  //     const userOp = await fillAndSign({
  //       sender: account.address,
  //       paymasterAndData: hexConcat([paymaster.address, hexZeroPad('0x1234', 20)])
  //     }, ethersSigner, entryPoint)
  //     await expect(entryPoint.callStatic.simulateValidation(userOp, { gasPrice })).to.be.revertedWith('DepositPaymaster: unsupported token')
  //   })
  //
  //   it('should reject if no deposit', async () => {
  //     const userOp = await fillAndSign({
  //       sender: account.address,
  //       paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)])
  //     }, ethersSigner, entryPoint)
  //     await expect(entryPoint.callStatic.simulateValidation(userOp, { gasPrice })).to.be.revertedWith('DepositPaymaster: deposit too low')
  //   })
  //
  //   it('should reject if deposit is not locked', async () => {
  //     await paymaster.addDepositFor(token.address, account.address, ONE_ETH)
  //
  //     const paymasterUnlock = await paymaster.populateTransaction.unlockTokenDeposit().then(tx => tx.data!)
  //     await account.execute(paymaster.address, 0, paymasterUnlock)
  //
  //     const userOp = await fillAndSign({
  //       sender: account.address,
  //       paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)])
  //     }, ethersSigner, entryPoint)
  //     await expect(entryPoint.callStatic.simulateValidation(userOp, { gasPrice })).to.be.revertedWith('not locked')
  //   })
  //
  //   it('succeed with valid deposit', async () => {
  //     // needed only if previous test did unlock.
  //     const paymasterLockTokenDeposit = await paymaster.populateTransaction.lockTokenDeposit().then(tx => tx.data!)
  //     await account.execute(paymaster.address, 0, paymasterLockTokenDeposit)
  //
  //     const userOp = await fillAndSign({
  //       sender: account.address,
  //       paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)])
  //     }, ethersSigner, entryPoint)
  //     await entryPoint.callStatic.simulateValidation(userOp).catch(simulationResultCatch)
  //   })
  // })
  // describe('#handleOps', () => {
  //   let account: SimpleAccount
  //   const accountOwner = createAccountOwner()
  //   let counter: TestCounter
  //   let callData: string
  //   before(async () => {
  //     ({ proxy: account } = await createAccount(ethersSigner, await accountOwner.getAddress(), entryPoint.address))
  //     counter = await new TestCounter__factory(ethersSigner).deploy()
  //     const counterJustEmit = await counter.populateTransaction.justemit().then(tx => tx.data!)
  //     callData = await account.populateTransaction.execute(counter.address, 0, counterJustEmit).then(tx => tx.data!)
  //
  //     await paymaster.addDepositFor(token.address, account.address, ONE_ETH)
  //   })
  //   it('should pay with deposit (and revert user\'s call) if user can\'t pay with tokens', async () => {
  //     const beneficiary = createAddress()
  //     const userOp = await fillAndSign({
  //       sender: account.address,
  //       paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)]),
  //       callData
  //     }, accountOwner, entryPoint)
  //
  //     await entryPoint.handleAggregatedOps(userOpsWithoutAgg([userOp]), beneficiary)
  //
  //     const [log] = await entryPoint.queryFilter(entryPoint.filters.UserOperationEvent())
  //     expect(log.args.success).to.eq(false)
  //     expect(await counter.queryFilter(counter.filters.CalledFrom())).to.eql([])
  //     expect(await ethers.provider.getBalance(beneficiary)).to.be.gt(0)
  //   })
  //
  //   it('should pay with tokens if available', async () => {
  //     const beneficiary = createAddress()
  //     const beneficiary1 = createAddress()
  //     const initialTokens = parseEther('1')
  //     await token.mint(account.address, initialTokens)
  //
  //     // need to "approve" the paymaster to use the tokens. we issue a UserOp for that (which uses the deposit to execute)
  //     const tokenApprovePaymaster = await token.populateTransaction.approve(paymaster.address, ethers.constants.MaxUint256).then(tx => tx.data!)
  //     const execApprove = await account.populateTransaction.execute(token.address, 0, tokenApprovePaymaster).then(tx => tx.data!)
  //     const userOp1 = await fillAndSign({
  //       sender: account.address,
  //       paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)]),
  //       callData: execApprove
  //     }, accountOwner, entryPoint)
  //     await entryPoint.handleAggregatedOps(userOpsWithoutAgg([userOp1]), beneficiary1)
  //
  //     const userOp = await fillAndSign({
  //       sender: account.address,
  //       paymasterAndData: hexConcat([paymaster.address, hexZeroPad(token.address, 20)]),
  //       callData
  //     }, accountOwner, entryPoint)
  //     await entryPoint.handleAggregatedOps(userOpsWithoutAgg([userOp]), beneficiary)
  //
  //     const [log] = await entryPoint.queryFilter(entryPoint.filters.UserOperationEvent(), await ethers.provider.getBlockNumber())
  //     expect(log.args.success).to.eq(true)
  //     const charge = log.args.actualGasCost
  //     expect(await ethers.provider.getBalance(beneficiary)).to.eq(charge)
  //
  //     const targetLogs = await counter.queryFilter(counter.filters.CalledFrom())
  //     expect(targetLogs.length).to.eq(1)
  //   })
  // })
})
