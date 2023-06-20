import { JsonRpcSigner } from '@ethersproject/providers/src.ts/json-rpc-provider'
import { bytes } from '../../solidityTypes'
import { ethers, web3 } from 'hardhat'
import { BountyContract, SignatureBounty, SignatureBounty__factory } from '../../../typechain'
import { BigNumber, ContractTransaction } from 'ethers'
import BountyUtils, { SolveAttemptResult } from '../bounty-utils'
import { arrayify } from 'ethers/lib/utils'
import { Buffer } from 'buffer'

class SignatureBountyUtils extends BountyUtils {
  private readonly numberOfLocks: number
  private readonly _publicKeys: bytes[]
  private _signatures: string[]
  private readonly _signers: JsonRpcSigner[]

  constructor (numberOfLocks: number = 3) {
    super()
    this.numberOfLocks = numberOfLocks
    this._publicKeys = []
    this._signatures = []
    this._signers = []
  }

  public async deployBounty (): Promise<BountyContract> {
    const ethersSigner = ethers.provider.getSigner()
    return await new SignatureBounty__factory(ethersSigner).deploy(await this.getLocks())
  }

  public async getLocks (): Promise<bytes[]> {
    if (this._publicKeys.length === 0) {
      for (const signer of this.signers) {
        this._publicKeys.push(Buffer.from(arrayify(await signer.getAddress())))
      }
    }
    return this._publicKeys
  }

  public async solveBounty (bounty: SignatureBounty, getUserBalance: () => Promise<BigNumber>): Promise<SolveAttemptResult> {
    let userBalanceBeforeFinalTransaction = BigNumber.from(0)
    const signaturesWithMessages = await this.getSignaturesWithMessages(bounty)
    for (let i = 0; i < signaturesWithMessages.length; i++) {
      if (getUserBalance != null && i === signaturesWithMessages.length - 1) userBalanceBeforeFinalTransaction = await getUserBalance()
      await this.submitSolution(i, signaturesWithMessages[i], bounty)
    }
    return new SolveAttemptResult(userBalanceBeforeFinalTransaction)
  }

  public async solveBountyPartially (bounty: SignatureBounty): Promise<void> {
    const signaturesWithMessages = await this.getSignaturesWithMessages(bounty)
    await this.submitSolution(0, signaturesWithMessages[0], bounty)
  }

  public async solveBountyIncorrectly (bounty: SignatureBounty): Promise<ContractTransaction> {
    const signaturesWithMessages = await this.getSignaturesWithMessages(bounty)
    return this.submitSolution(1, signaturesWithMessages[0], bounty)
  }

  private async getSignaturesWithMessages (bounty: SignatureBounty): Promise<string[][]> {
    const message = this.arbitraryMessage()
    const signatures = await this.getSignatures(message)
    return signatures.map(signature => [message, signature])
  }

  private async getSignatures (message: string): Promise<string[]> {
    if (this._signatures.length === 0) {
      this._signatures = await Promise.all(this.signers.map(async (signer) =>
        await web3.eth.sign(message, await signer.getAddress())))
    }
    return this._signatures
  }

  private arbitraryMessage (): string {
    return web3.utils.sha3('arbitrary') as string
  }

  private get signers (): JsonRpcSigner[] {
    if (this._signers.length === 0) {
      for (let i = 0; i < this.numberOfLocks; i++) {
        this._signers.push(ethers.provider.getSigner(i))
      }
    }
    return this._signers
  }

  public async getLatestSolvedGasCost (): Promise<BigNumber> {
    return await this.getLastTransactionGasCost(2)
  }

  public async getLatestSolvedIncorrectlyGasCost (): Promise<BigNumber> {
    return await this.getLastTransactionGasCost(1)
  }
}

export default SignatureBountyUtils
