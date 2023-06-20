import { BigNumber, ContractTransaction } from 'ethers'
import { BountyContract } from '../../typechain'
import { bytes } from '../solidityTypes'
import { ethers, web3 } from 'hardhat'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { keccak256 } from 'ethereumjs-util'
import { Buffer } from 'buffer'
import { arrayify } from 'ethers/lib/utils'

const MAX_GAS_LIMIT_OPTION = { gasLimit: BigNumber.from('0x1c9c380') }

export class SolveAttemptResult {
  public readonly userBalanceBeforeFinalTransaction

  constructor (userBalanceBeforeFinalTransaction: BigNumber) {
    this.userBalanceBeforeFinalTransaction = userBalanceBeforeFinalTransaction
  }
}

abstract class BountyUtils {
  public ONE_DAY_IN_SECONDS = 86400

  public async deployBounty (): Promise<BountyContract> {
    throw new Error('deploySignatureBounty() not implemented')
  }

  public async getLocks (puzzle: BountyContract): Promise<bytes[]> {
    throw new Error('getLocks() not implemented')
  }

  public async solveBounty (bounty: BountyContract, getUserBalance?: () => Promise<BigNumber>): Promise<SolveAttemptResult> {
    throw new Error('solveBounty() not implemented')
  }

  public async solveBountyPartially (bounty: BountyContract): Promise<void> {
    throw new Error('solveBountyPartially() not implemented')
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

  public async submitSolution (lockNumber: number, solution: bytes[], bounty: BountyContract): Promise<ContractTransaction> {
    const arbitraryUser = ethers.provider.getSigner(1)
    const solutionEncoding = web3.eth.abi.encodeParameters(
      [
        'address',
        'bytes[]'
      ], [
        await arbitraryUser.getAddress(),
        solution
      ]
    )
    const solutionHash = keccak256(Buffer.from(arrayify(solutionEncoding)))

    await bounty.connect(arbitraryUser).commitSolution(lockNumber, solutionHash, MAX_GAS_LIMIT_OPTION)
    await time.increase(this.ONE_DAY_IN_SECONDS)
    return bounty.connect(arbitraryUser).solve(lockNumber, solution, MAX_GAS_LIMIT_OPTION)
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
      receipt.gasUsed.mul(receipt.effectiveGasPrice))
    return latestGasCosts.reduce((total, amount) => total.add(amount))
  }
}

export default BountyUtils
