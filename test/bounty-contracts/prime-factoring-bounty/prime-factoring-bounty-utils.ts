import BountyUtils from '../bounty-utils'
import { BountyContract, PrimeFactoringBounty__factory } from '../../../typechain'
import { address, bytes } from '../../solidityTypes'
import { ContractTransaction } from 'ethers'
import { ethers } from 'hardhat'

class PrimeFactoringBountyUtils extends BountyUtils {
  private readonly _locks: address[]

  public async deploySignatureBounty (): Promise<BountyContract> {
    const ethersSigner = ethers.provider.getSigner()
    return await new PrimeFactoringBounty__factory(ethersSigner).deploy(await this.getLocks())
  }

  public async getLocks (): Promise<bytes[]> {
    if (this._locks.length === 0) {

    }
    return this._locks
  }

  public async solveBounty (bounty: BountyContract): Promise<Promise<ContractTransaction>> {
    throw new Error('solveBounty() not implemented')
  }

  public async solveBountyIncorrectly (bounty: BountyContract): Promise<Promise<ContractTransaction>> {
    throw new Error('solveBountyIncorrectly() not implemented')
  }
}
