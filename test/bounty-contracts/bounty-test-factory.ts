import { BigNumber } from 'ethers'
import { JsonRpcSigner } from '@ethersproject/providers/src.ts/json-rpc-provider'
import { ethers } from 'hardhat'
import { expect } from 'chai'
import BountyUtils from './bounty-utils'
import { BountyContract } from '../../typechain'
import { arrayify } from 'ethers/lib/utils'
import { Buffer } from 'buffer'

function getBountyTest (bountyUtils: BountyUtils) {
  return () => {
    let bounty: BountyContract

    beforeEach(async () => {
      bounty = await bountyUtils.deployBounty()
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
          const tx = await bountyUtils.solveBounty(bounty)
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
          const tx = bountyUtils.solveBounty(bounty)
          await expect(tx).to.be.revertedWith('Already solved')
        })
      })

      describe('Incorrect Signatures', () => {
        beforeEach(async () => {
          const tx = bountyUtils.solveBountyIncorrectly(bounty)
          await expect(tx).to.be.revertedWith('Invalid solution')
        })

        it('should have full bounty afterwards', async () => {
          expect(await bounty.bounty()).equal(arbitraryBountyAmount)
        })

        it('should not send the bounty to the user', async () => {
          const newBalance = await arbitraryUser.getBalance()
          expect(newBalance).equal(previousBalance)
        })

        it('should keep the bounty as unsolved', async () => {
          expect(await bounty.solved()).equal(false)
        })
      })
    })

    describe('Lock generation', () => {
      it('should set locks as publicly available', async () => {
        const locks = await bountyUtils.getLocks(bounty)
        for (let i = 0; i < locks.length; i++) {
          const expectedPublicKey = locks[i]
          const bountyLock = Buffer.from(arrayify(await bounty.locks(i)))
          expect(bountyLock).deep.equal(expectedPublicKey)
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

    describe('Commit reveal', () => {
      it('should be able to retrieve commit info', async () => {
        const arbitraryValue = '0x0000000000000000000000000000000000000000000000000000000000000001'
        await bounty.commitSolution(Buffer.from(arrayify(arbitraryValue)))
        const [hash, timestamp] = await bounty.callStatic.getMyCommit()
        expect(hash).to.be.eq(arbitraryValue)

        const blockNumBefore = await ethers.provider.getBlockNumber()
        const blockBefore = await ethers.provider.getBlock(blockNumBefore)
        const timestampBefore = blockBefore.timestamp
        expect(timestamp).to.eq(timestampBefore)
      })
    })

    it('should be able to override a commit', async () => {
      const arbitraryValue1 = '0x0000000000000000000000000000000000000000000000000000000000000001'
      const arbitraryValue2 = '0x0000000000000000000000000000000000000000000000000000000000000002'
      await bounty.commitSolution(Buffer.from(arrayify(arbitraryValue1)))
      await bounty.commitSolution(Buffer.from(arrayify(arbitraryValue2)))
      const [hash] = await bounty.callStatic.getMyCommit()
      expect(hash).to.be.eq(arbitraryValue2)
    })
  }
}

export default getBountyTest
