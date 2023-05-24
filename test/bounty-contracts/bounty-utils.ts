import { ContractTransaction } from 'ethers'
import { BountyContract } from '../../typechain'
import { bytes } from '../solidityTypes'

abstract class BountyUtils {
  public async deployBounty (): Promise<BountyContract> {
    throw new Error('deploySignatureBounty() not implemented')
  }

  public async getLocks (puzzle: BountyContract): Promise<bytes[]> {
    throw new Error('getLocks() not implemented')
  }

  public async solveBounty (bounty: BountyContract): Promise<Promise<ContractTransaction>> {
    throw new Error('solveBounty() not implemented')
  }

  public async solveBountyIncorrectly (bounty: BountyContract): Promise<Promise<ContractTransaction>> {
    throw new Error('solveBountyIncorrectly() not implemented')
  }
}

export default BountyUtils
