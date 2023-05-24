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
    const primes = this._getPrimes()
    return this._attemptBountySolve(bounty, primes)
  }

  public async solveBountyIncorrectly (bounty: BountyContract): Promise<Promise<ContractTransaction>> {
    const primes = this._getPrimes()
    const incorrectPrimes = primes.map(_ => primes[0])
    return this._attemptBountySolve(bounty, incorrectPrimes)
  }

  private async _attemptBountySolve (bounty: BountyContract, primes: bytes[][]): Promise<Promise<ContractTransaction>> {
    const arbitraryUser = ethers.provider.getSigner(1)
    return bounty.connect(arbitraryUser).widthdraw(primes)
  }

  private _getPrimes (bounty: BountyContract): bytes[][] {
    const solutions = (await this.getLocks(bounty)).forEach(lock => {
      const listOfPrimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61]
      for (const prime of listOfPrimes) {
        BigNumber.from(lock).
      }
    })
  }
}

export default PrimeFactoringBountyWithRsaUfoUtils
