import { Wallet } from 'ethers'
import { keygen, signMessageLamport } from './lamport-utils'

export class WalletLamport {
  readonly baseWallet: Wallet
  readonly publicKeyLamport: Buffer[][]
  readonly secretKeyLamport: Buffer[][]

  constructor (baseWallet: Wallet, numberOfTests: number = 3, testSizeInBytes: number = 3) {
    this.baseWallet = baseWallet

    const [secretKeyLamport, publicKeyLamport] = keygen(numberOfTests, testSizeInBytes)
    this.publicKeyLamport = publicKeyLamport
    this.secretKeyLamport = secretKeyLamport
  }

  public signMessageLamport (message: Buffer): Buffer {
    return signMessageLamport(message, this.secretKeyLamport)
  }
}
