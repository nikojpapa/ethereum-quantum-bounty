import { BigNumber, Wallet } from 'ethers'
import { hashMessage, keygen, signMessageLamport } from './lamport-utils'

export class WalletLamport {
  readonly baseWallet: Wallet
  readonly publicKeyLamport: number[][]
  readonly secretKeyLamport: number[][]

  constructor (baseWallet: Wallet) {
    this.baseWallet = baseWallet

    const [secretKeyLamport, publicKeyLamport] = keygen()
    this.publicKeyLamport = publicKeyLamport
    this.secretKeyLamport = secretKeyLamport
  }

  public signMessageLamport (message: Buffer): number[] {
    return signMessageLamport(message, this.secretKeyLamport)
  }
}
