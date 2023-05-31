import { BigNumber, ContractTransaction } from 'ethers'
import { BountyContract } from '../../typechain'
import { bytes } from '../solidityTypes'
import { ethers } from 'hardhat'

abstract class BountyUtils {
  public async deployBounty (): Promise<BountyContract> {
    throw new Error('deploySignatureBounty() not implemented')
  }

  public async getLocks (puzzle: BountyContract): Promise<bytes[]> {
    throw new Error('getLocks() not implemented')
  }

  public async solveBounty (bounty: BountyContract): Promise<ContractTransaction> {
    throw new Error('solveBounty() not implemented')
  }

  public async solveBountyIncorrectly (bounty: BountyContract): Promise<ContractTransaction> {
    throw new Error('solveBountyIncorrectly() not implemented')
  }

  public async getLatestSolvedGasCost (): Promise<BigNumber> {
    throw new Error('getLatestSolvedGasCost() not implemented')
  }

  public async getLatestSolvedIncorrectlyGasCost (): Promise<BigNumber> {
    throw new Error('getLatestSolvedIncorrectlyGasCost() not implemented')
  }

  async getLastTransactionGasCost (numberOfTransactions: number): Promise<BigNumber> {
    // Thanks to https://ethereum.stackexchange.com/a/140971/120101
    const latestBlock = await ethers.provider.getBlock('latest')
    let latestTxHashes: string[] = []
    let i = 0
    while (latestTxHashes.length < numberOfTransactions && latestBlock.number - i > 0) {
      const block = await ethers.provider.getBlock(latestBlock.number - i++)
      const numberOfTransactions = block.transactions.length
      const remainingTransactions = numberOfTransactions - latestTxHashes.length
      const startIndex = Math.max(0, numberOfTransactions - 1 - remainingTransactions)
      const transactions = block.transactions.slice(startIndex, numberOfTransactions)
      latestTxHashes = latestTxHashes.concat(transactions)
    }
    const latestTxReceipts = await Promise.all(latestTxHashes.map(async hash =>
      await ethers.provider.getTransactionReceipt(hash)))
    const latestGasCosts = latestTxReceipts.map(receipt =>
      receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice))
    return latestGasCosts.reduce((total, amount) => total.add(amount))
  }
}

export default BountyUtils
