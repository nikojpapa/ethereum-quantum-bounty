import { bytes } from '../../../solidityTypes'
import { ethers } from 'hardhat'
import { BigNumber, ContractTransaction } from 'ethers'
import BountyUtils from '../../bounty-utils'
import {
  BountyContract,
  PrimeFactoringPuzzleWithRsaUfo,
  PrimeFactoringPuzzleWithRsaUfo__factory
} from '../../../../typechain'
import { arrayify } from 'ethers/lib/utils'
import { Buffer } from 'buffer'

const BITS_PER_BYTE = 8

class PrimeFactoringBountyWithRsaUfoUtils extends BountyUtils {
  private readonly numberOfLocks = 2
  private readonly primeByteSize = 1

  public async deployBounty (): Promise<PrimeFactoringPuzzleWithRsaUfo> {
    const ethersSigner = ethers.provider.getSigner()
    return await new PrimeFactoringPuzzleWithRsaUfo__factory(ethersSigner).deploy(this.numberOfLocks, this.primeByteSize)
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
    const listOfPrimes = this._sieveOfEratosthenes(2 ** (3 * this.primeByteSize * BITS_PER_BYTE))
      .map(n => BigNumber.from(n))
    return (await this.getLocks(bounty)).map(lock => {
      let lockAsNumber = BigNumber.from(lock)

      const solution = []

      for (const prime of listOfPrimes) {
        const solutionAsBuffer = Buffer.from(arrayify(prime.toHexString()))
        while (lockAsNumber.mod(prime).eq(0)) {
          solution.push(solutionAsBuffer)
          lockAsNumber = lockAsNumber.div(prime)
        }
      }
      if (!lockAsNumber.eq(1)) throw new Error('No more primes found')

      return solution
    })
  }

  // From https://www.tutorialspoint.com/using-sieve-of-eratosthenes-to-find-primes-javascript
  private _sieveOfEratosthenes (n: number): number[] {
    const primes: boolean[] = new Array(n + 1).fill(true)
    primes[0] = false
    primes[1] = false
    for (let i = 2; i <= Math.sqrt(n); i++) {
      if (primes[i]) {
        for (let j = i * i; j <= n; j += i) {
          primes[j] = false
        }
      }
    }

    const result: number[] = []
    for (let i = 2; i <= n; i++) {
      if (primes[i]) {
        result.push(i)
      }
    }

    return result
  }
}

export default PrimeFactoringBountyWithRsaUfoUtils
