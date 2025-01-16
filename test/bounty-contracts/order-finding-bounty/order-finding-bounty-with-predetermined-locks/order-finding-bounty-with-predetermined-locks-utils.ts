import { bytes } from '../../../solidityTypes'
import { ethers } from 'hardhat'
import { BigNumber, ContractTransaction } from 'ethers'
import BountyUtils, {
  getLatestSolvedGasCost,
  SolveAttemptResult,
  solveBountyReturningUserBalanceBeforeFinalSolution,
  submitSolution
} from '../../bounty-utils'
import {
  BountyContract,
  OrderFindingBountyWithPredeterminedLocks,
  OrderFindingBountyWithPredeterminedLocks__factory
} from '../../../../typechain'
import { arrayify } from 'ethers/lib/utils'
import { Buffer } from 'buffer'

class OrderFindingBountyWithPredeterminedLocksUtils extends BountyUtils {
  private readonly locksAndKeys = [
    {
      lock: [BigNumber.from(15).toHexString(), BigNumber.from(7).toHexString()],
      key: BigNumber.from(4).toHexString()
    },
    {
      lock: [BigNumber.from(23).toHexString(), BigNumber.from(17).toHexString()],
      key: BigNumber.from(22).toHexString()
    }
  ]

  constructor (lockAndKeys?: Array<{lock: string[], key: string}>) {
    super()
    if (lockAndKeys != null) this.locksAndKeys = lockAndKeys
  }

  public async deployBounty (): Promise<OrderFindingBountyWithPredeterminedLocks> {
    const ethersSigner = ethers.provider.getSigner()
    const locks = await this.getLocks()
    const bounty = await new OrderFindingBountyWithPredeterminedLocks__factory(ethersSigner).deploy(locks.length)
    for (let i = 0; i < locks.length; i++) {
      await bounty.setLock(i, locks[i])
    }
    return bounty
  }

  public async getLocks (): Promise<bytes[][]> {
    return Promise.resolve(this.locksAndKeys.map(x => x.lock.map(y => Buffer.from(arrayify(y)))))
  }

  public async solveBounty (bounty: BountyContract, getUserBalance?: () => Promise<BigNumber>): Promise<SolveAttemptResult> {
    return solveBountyReturningUserBalanceBeforeFinalSolution(this.getSolutions(), bounty, getUserBalance)
  }

  public async solveBountyPartially (bounty: BountyContract): Promise<void> {
    const primes = this.getSolutions()
    await submitSolution(0, primes[0], bounty)
  }

  public async solveBountyIncorrectly (bounty: BountyContract): Promise<ContractTransaction> {
    const keys = this.getSolutions()
    return await submitSolution(1, keys[0], bounty)
  }

  public getSolutions (): bytes[] {
    return this.locksAndKeys.map(lockAndKeys => Buffer.from(arrayify(lockAndKeys.key)))
  }

  public async getLatestSolvedGasCost (): Promise<BigNumber> {
    return getLatestSolvedGasCost(this.locksAndKeys.length)
  }
}

export default OrderFindingBountyWithPredeterminedLocksUtils
