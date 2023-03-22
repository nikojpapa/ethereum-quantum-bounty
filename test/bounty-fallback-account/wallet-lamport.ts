import { BigNumber, Wallet } from 'ethers'
import { hashMessage, keygen, signMessageLamport } from './lamport-utils'

export class WalletLamport {
  readonly baseWallet: Wallet
  readonly publicKeyLamport: Buffer[][]
  readonly secretKeyLamport: Buffer[][]

  constructor (baseWallet: Wallet) {
    this.baseWallet = baseWallet

    const [secretKeyLamport, publicKeyLamport] = keygen()
    this.publicKeyLamport = publicKeyLamport
    this.secretKeyLamport = secretKeyLamport
  }

  public signMessageLamport (message: Buffer): Buffer {
    return signMessageLamport(message, this.secretKeyLamport)
  }
}
