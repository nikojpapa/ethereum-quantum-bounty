import {
  OrderFindingBountyWithPredeterminedLocks
} from '../../../../typechain'
import { BigNumber } from 'ethers'
import { expect } from 'chai'
import { submitSolution } from '../../bounty-utils'
import { ethers } from 'hardhat'
import { randomBytes } from 'crypto'
import OrderFindingBountyWithPredeterminedLocksUtils
  from '../order-finding-bounty-with-predetermined-locks/order-finding-bounty-with-predetermined-locks-utils'


const HEX_PREFIX = '0x'


export function costOfSolvingOrderFactory (lock: string[]) {
  return () => {
    let bounty: OrderFindingBountyWithPredeterminedLocks
    let bountyUtils: OrderFindingBountyWithPredeterminedLocksUtils

    it('should find the gas cost to attempt a base of bit size one less than that modulus using various sized exponents', async () => {
      const gasCosts: BigNumber[] = []

      const byteSizeOfModulus = (lock[0].length - HEX_PREFIX.length) / 2
      const maxOrderByteSize = 2 * byteSizeOfModulus

      for (let i = 1; i <= maxOrderByteSize; i++) {
        const solution = randomBytes(i)
        solution[0] = solution[0] | (1 << 7)
        const solutionHex = `0x${solution.toString('hex')}`

        bountyUtils = new OrderFindingBountyWithPredeterminedLocksUtils([{lock, key: solutionHex}])
        bounty = await bountyUtils.deployBounty()

        const tx = submitSolution(0, bountyUtils.getSolutions()[0], bounty)
        await expect(tx, `Base ${lock[1]} worked with exponent ${solutionHex}`).to.be.reverted

        const latestBlock = await ethers.provider.getBlock('latest')
        const latestTransactionHash = latestBlock.transactions[latestBlock.transactions.length - 1]
        const latestReceipt = await ethers.provider.getTransactionReceipt(latestTransactionHash)

        const gasUsed = latestReceipt.gasUsed
        console.log(`Gas for ${i}-byte solution is ${gasUsed.toHexString()}`)
        gasCosts.push(gasUsed)
      }

      const maxGas = gasCosts.reduce((acc, curr) => curr.gt(acc) ? curr : acc)
      const minGas = gasCosts.reduce((acc, curr) => curr.lt(acc) ? curr : acc)
      const meanGas = gasCosts.reduce((acc, curr) => acc.add(curr)).div(gasCosts.length)

      const sortedGasCosts = gasCosts.sort((a, b) => a.lt(b) ? -1 : 1)
      const halfIndex = maxOrderByteSize / 2
      const medianGas = halfIndex % 1 === 0
          ? sortedGasCosts[halfIndex].add(sortedGasCosts[halfIndex + 1]).div(2)
          : sortedGasCosts[Math.ceil(halfIndex)]
      console.log(`Min gas: ${minGas.toHexString()}`)
      console.log(`Max gas: ${maxGas.toHexString()}`)
      console.log(`Mean gas: ${meanGas.toHexString()}`)
      console.log(`Median gas: ${medianGas.toHexString()}`)
    })
  }
}
