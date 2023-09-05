import { bytes } from '../../solidityTypes'
import {
  OrderFindingBountyWithPredeterminedLocks,
  OrderFindingBountyWithPredeterminedLocks__factory
} from '../../../typechain'
import { ethers } from 'hardhat'
import { arrayify } from 'ethers/lib/utils'
import { submitSolution } from '../bounty-utils'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { randomBytes } from 'crypto'

describe.skip('Test the cost of solving the order finding bounty', () => {
  let bounty: OrderFindingBountyWithPredeterminedLocks
  const base = Buffer.from(arrayify('0xccda5ed8b7b0a45eb02d23b07e62f088fbe14781ce0baf896605957519c2e0cdf8206066d6d1f7acaddeea0a5edc97277998024a093ee70358aabcf322c0b748ea4ac0cd884344c55564ab5a9d6d6ac7f89e67f488e84a0e19d0ced4c89bc818a357'))

  async function deployBounty (locks: bytes[][]): Promise<OrderFindingBountyWithPredeterminedLocks> {
    const ethersSigner = ethers.provider.getSigner()
    const bounty = await new OrderFindingBountyWithPredeterminedLocks__factory(ethersSigner).deploy(locks.length)
    for (let i = 0; i < locks.length; i++) {
      await bounty.setLock(i, locks[i])
    }
    return bounty
  }

  beforeEach(async () => {
    const locks = [
      [
        '0xccda5ed8b7b0a45eb02d23b07e62f088fbe14781ce0baf896605957519c2e0cdf8206066d6d1f7acaddeea0a5edc97277998024a093ee70358aabcf322c0b748ea4ac0cd884344c55564ab5a9d6d6ac7f89e67f488e84a0e19d0ced4c89bc818a357',
        '0x7d2eee89c5556a6a37ed619a36178a1b6b8790c0ffdc6c0438eac646f533c6252e6e6766501ba0392adde287e0e1f83360e590c9caa155b1285c6cd4563ed0d7456d22919fe118090b9fd00c3714daebfa21f5216a76b1ee6b46f135b9670b5465b7'
      ]
    ]

    bounty = await deployBounty(locks)
  })

  it('should find the gas cost to attempt a 783-bit base with various sized exponents', async () => {
    let maxGas = BigNumber.from(0)
    let minGas = null
    for (let i = 1; i <= 196; i++) {
      const solution = randomBytes(i)
      solution[0] = solution[0] | (1 << 7)
      const tx = submitSolution(i, [solution], bounty)
      await expect(tx, `Base ${base.toString('hex')} worked with exponent ${solution.toString('hex')}`).to.be.reverted

      const latestBlock = await ethers.provider.getBlock('latest')
      const latestTransactionHash = latestBlock.transactions[latestBlock.transactions.length - 1]
      const latestReceipt = await ethers.provider.getTransactionReceipt(latestTransactionHash)

      const gasUsed = latestReceipt.gasUsed
      console.log(`Gas for solution ${solution.toString('hex')} is ${gasUsed.toHexString()}`)
      if (gasUsed.gt(maxGas)) maxGas = gasUsed
      if (minGas == null || gasUsed.lt(minGas)) minGas = gasUsed
    }
    console.log(`Min gas: ${minGas.toHexString()}`)
    console.log(`Max gas: ${maxGas.toHexString()}`)
  })
})
