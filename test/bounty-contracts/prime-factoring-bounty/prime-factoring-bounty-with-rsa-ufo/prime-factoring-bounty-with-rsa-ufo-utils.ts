import { bytes } from '../../../solidityTypes'
import { ethers } from 'hardhat'
import { BigNumber, ContractTransaction } from 'ethers'
import BountyUtils from '../../bounty-utils'
import {
  BountyContract,
  PrimeFactoringBountyWithPredeterminedLocks,
  PrimeFactoringBountyWithPredeterminedLocks__factory,
  PrimeFactoringPuzzleWithRsaUfo,
  PrimeFactoringPuzzleWithRsaUfo__factory
} from '../../../../typechain'
import { arrayify } from 'ethers/lib/utils'
import { Buffer } from 'buffer'

class PrimeFactoringBountyWithRsaUfoUtils extends BountyUtils {
  private readonly numberOfLocks = 2
  private readonly primeBitSize = 2

  public async deployBounty (): Promise<PrimeFactoringPuzzleWithRsaUfo> {
    const ethersSigner = ethers.provider.getSigner()
    return await new PrimeFactoringPuzzleWithRsaUfo__factory(ethersSigner).deploy(this.numberOfLocks, this.primeBitSize)
  }

  public async getLocks (puzzle: BountyContract): Promise<bytes[]> {
    const locks: bytes[] = []
    for (let i = 0; i < this.numberOfLocks; i++) {
      locks.push(await puzzle.locks(i))
    }
    return Promise.resolve(locks)
  }

  public async solveBounty (bounty: BountyContract): Promise<Promise<ContractTransaction>> {
    const primes = await this._getPrimes(bounty)
    return this._attemptBountySolve(bounty, primes)
  }

  public async solveBountyIncorrectly (bounty: BountyContract): Promise<Promise<ContractTransaction>> {
    const primes = await this._getPrimes(bounty)
    const incorrectPrimes = primes.map(_ => primes[0])
    return this._attemptBountySolve(bounty, incorrectPrimes)
  }

  private async _attemptBountySolve (bounty: BountyContract, primes: bytes[][]): Promise<Promise<ContractTransaction>> {
    const arbitraryUser = ethers.provider.getSigner(1)
    return bounty.connect(arbitraryUser).widthdraw(primes)
  }

  private async _getPrimes (bounty: BountyContract): Promise<bytes[][]> {
    const listOfPrimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61]
      .map(n => BigNumber.from(n))
    return (await this.getLocks(bounty)).map(lock => {
      let lockAsNumber = BigNumber.from(lock)

      const solution = []

      while (!lockAsNumber.eq(1)) {
        for (const prime of listOfPrimes) {
          if (!lockAsNumber.mod(prime).eq(0)) {
            solution.push(Buffer.from(prime.toHexString()))
            lockAsNumber = lockAsNumber.div(prime)
            break
          }
        }
      }

      return solution
    })
  }
}

export default PrimeFactoringBountyWithRsaUfoUtils
