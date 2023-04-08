import { JsonRpcSigner } from '@ethersproject/providers/src.ts/json-rpc-provider'
import { address } from '../solidityTypes'
import { ethers, web3 } from 'hardhat'
import { SignatureBounty, SignatureBounty__factory } from '../../typechain'
import { ContractTransaction } from 'ethers'

class SignatureBountyUtils {
  private readonly numberOfLocks: number
  private readonly _publicKeys: address[]
  private _signatures: string[]
  private readonly _signers: JsonRpcSigner[]

  constructor (numberOfLocks: number = 3) {
    this.numberOfLocks = numberOfLocks
    this._publicKeys = []
    this._signatures = []
    this._signers = []
  }

  public async deploySignatureBounty (): Promise<SignatureBounty> {
    const ethersSigner = ethers.provider.getSigner()
    return await new SignatureBounty__factory(ethersSigner).deploy(await this.getPublicKeys())
  }

  public async getPublicKeys (): Promise<address[]> {
    if (this._publicKeys.length === 0) {
      for (const signer of this.signers) {
        this._publicKeys.push(await signer.getAddress())
      }
    }
    return this._publicKeys
  }

  public async solveBounty (bounty: SignatureBounty): Promise<ContractTransaction> {
    const arbitraryUser = ethers.provider.getSigner(1)
    const message = web3.utils.sha3('arbitrary') as string
    const signatures = await this.getSignatures(message)
    return await bounty.connect(arbitraryUser).widthdraw(message, signatures)
  }

  private async getSignatures (message: string): Promise<string[]> {
    if (this._signatures.length === 0) {
      this._signatures = await Promise.all(this.signers.map(async (signer) =>
        await web3.eth.sign(message, await signer.getAddress())))
    }
    return this._signatures
  }

  get signers (): JsonRpcSigner[] {
    if (this._signers.length === 0) {
      for (let i = 0; i < this.numberOfLocks; i++) {
        this._signers.push(ethers.provider.getSigner(i))
      }
    }
    return this._signers
  }
}

export default SignatureBountyUtils
