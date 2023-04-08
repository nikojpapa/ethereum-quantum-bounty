import '../aa.init'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import { SignatureBounty } from '../../typechain'
import { BigNumber } from 'ethers'
import { JsonRpcSigner } from '@ethersproject/providers/src.ts/json-rpc-provider'
import SignatureBountyUtils from '../bounty-fallback-account/signature-bounty-utils'

describe('SignatureBounty', () => {
  const signatureBountyUtils = new SignatureBountyUtils()
  let bounty: SignatureBounty

  beforeEach(async () => {
    bounty = await signatureBountyUtils.deploySignatureBounty()
  })

  describe('Withdraw', () => {
    const arbitraryBountyAmount = BigNumber.from(100)
    let arbitraryUser: JsonRpcSigner
    let previousBalance: BigNumber

    before(async () => {
      arbitraryUser = ethers.provider.getSigner(1)
    })

    beforeEach(async () => {
      previousBalance = await arbitraryUser.getBalance()
      await bounty.addToBounty({ value: arbitraryBountyAmount })
    })

    describe('Correct Signatures', () => {
      let gasUsed: BigNumber = BigNumber.from(0)

      beforeEach(async () => {
        const tx = await signatureBountyUtils.solveBounty(bounty)
        const receipt = await tx.wait()
        gasUsed = BigNumber.from(receipt.cumulativeGasUsed).mul(BigNumber.from(receipt.effectiveGasPrice))
      })

      it('should have a bounty of zero afterwards', async () => {
        expect(await bounty.bounty()).to.equal(0)
      })

      it('should send the bounty to the user', async () => {
        const newBalance = await arbitraryUser.getBalance()
        const expectedBalance = previousBalance.sub(gasUsed).add(arbitraryBountyAmount)
        expect(newBalance).to.equal(expectedBalance)
      })

      it('should set the bounty as solved', async () => {
        expect(await bounty.solved()).to.equal(true)
      })

      it('should revert deposits if already solved', async () => {
        const tx = bounty.addToBounty({ value: arbitraryBountyAmount })
        await expect(tx).to.be.revertedWith('Already solved')
      })

      it('should not allow further solve attempts if already solved', async () => {
        const tx = await signatureBountyUtils.solveBounty(bounty)
        await expect(tx).to.be.revertedWith('Already solved')
      })
    })

    describe('Incorrect Signatures', () => {
      beforeEach(async () => {
        const tx = await signatureBountyUtils.solveBounty(bounty)
        await expect(tx).to.be.revertedWith('Invalid signatures')
      })

      it('should have full bounty afterwards', async () => {
        expect(await bounty.bounty()).to.equal(arbitraryBountyAmount)
      })

      it('should not send the bounty to the user', async () => {
        const newBalance = await arbitraryUser.getBalance()
        expect(newBalance).to.equal(previousBalance)
      })

      it('should keep the bounty as unsolved', async () => {
        expect(await bounty.solved()).to.equal(false)
      })
    })
  })

  describe('Lock generation', () => {
    it('should set locks as publicly available', async () => {
      for (let i = 0; i < signatureBountyUtils.signers.length; i++) {
        const expectedPublicKey = (await signatureBountyUtils.getPublicKeys())[i]
        const bountyLock = await bounty.locks(i)
        expect(bountyLock).to.equal(expectedPublicKey)
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
  })
})
