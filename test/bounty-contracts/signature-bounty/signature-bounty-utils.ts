import { JsonRpcSigner } from '@ethersproject/providers/src.ts/json-rpc-provider'
import { address } from '../../solidityTypes'
import { ethers, web3 } from 'hardhat'
import { SignatureBounty, SignatureBounty__factory } from '../../../typechain'
import { ContractTransaction } from 'ethers'
import BountyUtils from '../bounty-utils'

class SignatureBountyUtils extends BountyUtils {
  private readonly numberOfLocks: number
  private readonly _publicKeys: address[]
  private _signatures: string[]
  private readonly _signers: JsonRpcSigner[]

  constructor (numberOfLocks: number = 3) {
    super()
    this.numberOfLocks = numberOfLocks
    this._publicKeys = []
    this._signatures = []
    this._signers = []
  }

  public async deploySignatureBounty (): Promise<SignatureBounty> {
    const ethersSigner = ethers.provider.getSigner()
    return await new SignatureBounty__factory(ethersSigner).deploy(await this.getLocks())
  }

  public async getLocks (): Promise<address[]> {
    if (this._publicKeys.length === 0) {
      for (const signer of this.signers) {
        this._publicKeys.push(await signer.getAddress())
      }
    }
    return this._publicKeys
  }

  public async solveBounty (bounty: SignatureBounty): Promise<Promise<ContractTransaction>> {
    const message = this.arbitraryMessage()
    const signatures = await this.getSignatures(message)
    return this._attemptBountySolve(bounty, message, signatures)
  }

  public async solveBountyIncorrectly (bounty: SignatureBounty): Promise<Promise<ContractTransaction>> {
    const message = this.arbitraryMessage()
    const signatures = await this.getSignatures(message)
    const incorrectSignatures = signatures.map(_ => signatures[0])
    return this._attemptBountySolve(bounty, message, incorrectSignatures)
  }

  private async _attemptBountySolve (bounty: SignatureBounty, message: string, signatures: string[]): Promise<Promise<ContractTransaction>> {
    const arbitraryUser = ethers.provider.getSigner(1)
    return bounty.connect(arbitraryUser).widthdraw(message, signatures)
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
}

export default SignatureBountyUtils
