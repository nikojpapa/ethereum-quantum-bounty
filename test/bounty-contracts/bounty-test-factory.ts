import { BigNumber, ContractTransaction } from 'ethers'
import { JsonRpcSigner } from '@ethersproject/providers/src.ts/json-rpc-provider'
import { ethers, network } from 'hardhat'
import { expect } from 'chai'
import BountyUtils from './bounty-utils'
import { BountyContract } from '../../typechain'
import { arrayify } from 'ethers/lib/utils'
import { Buffer } from 'buffer'
import { bytes } from '../solidityTypes'

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

      async function getLastTransactionGasCost (numberOfTransactions: number): Promise<BigNumber> {
        // Thanks to https://ethereum.stackexchange.com/a/140971/120101
        const latestBlock = await ethers.provider.getBlock('latest')
        const latestGasUsages = await Promise.all(new Array(numberOfTransactions).fill(0)
          .map(async (_, i) => {
            const block = await ethers.provider.getBlock(latestBlock.number - i)
            const latestTxHash = block.transactions[block.transactions.length - 1]
            const latestTxReceipt = await ethers.provider.getTransactionReceipt(
              latestTxHash as string
            )
            const latestTxGasUsage = latestTxReceipt.gasUsed
            const latestTxGasPrice = latestTxReceipt.effectiveGasPrice
            return latestTxGasUsage.mul(latestTxGasPrice)
          }))
        return latestGasUsages.reduce((total, amount) => total.add(amount))
      }

      before(async () => {
        arbitraryUser = ethers.provider.getSigner(1)
      })

      beforeEach(async () => {
        previousBalance = await arbitraryUser.getBalance()
        await bounty.addToBounty({ value: arbitraryBountyAmount })
      })

      describe('Correct Signatures', () => {
        beforeEach(async () => {
          await bountyUtils.solveBounty(bounty)
        })

        it('should have a bounty of zero afterwards', async () => {
          expect(await bounty.bounty()).to.equal(0)
        })

        it('should send the bounty to the user', async () => {
          const gasUsed = await getLastTransactionGasCost(2)
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
          const latestTXGasCosts = await getLastTransactionGasCost(2)
          const newBalance = await arbitraryUser.getBalance()
          expect(newBalance).equal(previousBalance.sub(latestTXGasCosts))
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
      const arbitrarySolutionHash = '0x0000000000000000000000000000000000000000000000000000000000000001'
      const arbitrarySolutionHashBuffer = Buffer.from(arrayify(arbitrarySolutionHash))

      it('should be able to retrieve commit info', async () => {
        await bounty.commitSolution(arbitrarySolutionHashBuffer)
        const [hash, timestamp] = await bounty.callStatic.getMyCommit()
        expect(hash).to.be.eq(arbitrarySolutionHash)

        const blockNumBefore = await ethers.provider.getBlockNumber()
        const blockBefore = await ethers.provider.getBlock(blockNumBefore)
        const timestampBefore = blockBefore.number
        expect(timestamp).to.eq(timestampBefore)
      })

      it('should be able to override a commit', async () => {
        const arbitrarySolutionHash2 = '0x0000000000000000000000000000000000000000000000000000000000000002'
        await bounty.commitSolution(arbitrarySolutionHashBuffer)
        await bounty.commitSolution(Buffer.from(arrayify(arbitrarySolutionHash2)))
        const [hash] = await bounty.callStatic.getMyCommit()
        expect(hash).to.be.eq(arbitrarySolutionHash2)
      })

      it('should revert getting my commit if no commit was made', async () => {
        const tx = bounty.getMyCommit()
        await expect(tx).to.be.revertedWith('Not committed yet')
      })

      it('should not allow commits if already solved', async () => {
        await bountyUtils.solveBounty(bounty)
        const tx = bounty.commitSolution(arbitrarySolutionHashBuffer)
        await expect(tx).to.be.revertedWith('Already solved')
      })

      it('should not allow a reveal without a commit', async () => {
        const arbitrarySolutions: bytes[][] = []
        const tx = bounty.widthdraw(arbitrarySolutions)
        await expect(tx).to.be.revertedWith('Not committed yet')
      })

      it('should not allow a reveal in the same block as the commit', async () => {
        await network.provider.send('evm_setAutomine', [false])
        await network.provider.send('evm_setIntervalMining', [0])

        const arbitrarySolutions: bytes[][] = []
        await bounty.commitSolution(arbitrarySolutionHashBuffer)
        const txReveal = bounty.widthdraw(arbitrarySolutions)
        await expect(txReveal).to.be.revertedWith('Cannot reveal in the same block')
      })
    })
  }
}

export default getBountyTest
