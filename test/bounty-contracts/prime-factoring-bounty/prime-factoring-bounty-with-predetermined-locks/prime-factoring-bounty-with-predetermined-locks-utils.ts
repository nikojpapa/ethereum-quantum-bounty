import { bytes } from '../../../solidityTypes'
import { ethers, web3 } from 'hardhat'
import { BigNumber, ContractTransaction } from 'ethers'
import BountyUtils from '../../bounty-utils'
import {
  BountyContract,
  PrimeFactoringBountyWithPredeterminedLocks,
  PrimeFactoringBountyWithPredeterminedLocks__factory
} from '../../../../typechain'
import { arrayify } from 'ethers/lib/utils'
import { Buffer } from 'buffer'

class PrimeFactoringBountyWithPredeterminedLocksUtils extends BountyUtils {
  private readonly locksAndKeys = [
    {
      lock: '0x79cf5b2576e8227d0687fc5fba1533966056e98ae5dc79a81aacf78cf1b8b7adca788784349ac4a911fe5ae53cb342437082911dc767fc6f455ce0feb991d7db',
      keys: [
        '0x98b506e93598a98579c9ce06a99d65d5a7694d9d739c270d5fa04abb4518af7b',
        '0xcc3422fbc329d582d216c4b4b879e4873a155864d9e95e6722136ac94c3fdb21'
      ]
    },
    {
      lock: '0x6df01a2f04a6364b150e5e628b856481c14973612d2e513b4eb082275f02a86176493753d0e1d2f6da721e6b90fb3c697068ecae9fe8f8a908a8bf01835581f9',
      keys: [
        '0x9deb56589d3dbc359f4d7ad556cd6114e6e0d5d380d45aff59fe564fe2d0c7e7',
        '0xb237e0a87baa96360e7faa432a40fd550cea247ad83198a08674b6af0c8aab1f'
      ]
    }
  ]

  public async deployBounty (): Promise<PrimeFactoringBountyWithPredeterminedLocks> {
    const ethersSigner = ethers.provider.getSigner()
    return await new PrimeFactoringBountyWithPredeterminedLocks__factory(ethersSigner).deploy(await this.getLocks())
  }

  public async getLocks (): Promise<bytes[]> {
    return Promise.resolve(this.locksAndKeys.map(x => Buffer.from(arrayify(x.lock))))
  }

  public async solveBounty (bounty: BountyContract): Promise<ContractTransaction> {
    const primes = this._getPrimes()
    return this.submitSolution(primes, bounty)
  }

  public async solveBountyIncorrectly (bounty: BountyContract): Promise<ContractTransaction> {
    const primes = this._getPrimes()
    const incorrectPrimes = primes.map(_ => primes[0])
    return this.submitSolution(incorrectPrimes, bounty)
  }

  private _getPrimes (): bytes[][] {
    const primes = this.locksAndKeys.map(lockAndKeys => lockAndKeys.keys)
    return primes.map(primesForLock =>
      primesForLock.map(prime =>
        Buffer.from(arrayify(prime))))
  }

  public async getLatestSolvedGasCost (): Promise<BigNumber> {
    return await this.getLastTransactionGasCost(2)
  }

  public async getLatestSolvedIncorrectlyGasCost (): Promise<BigNumber> {
    return await this.getLastTransactionGasCost(2)
  }
}

export default PrimeFactoringBountyWithPredeterminedLocksUtils
