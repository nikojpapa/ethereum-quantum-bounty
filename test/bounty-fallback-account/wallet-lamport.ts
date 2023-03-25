import { Wallet } from 'ethers'
import { generateLamportKeys, LamportKeys, signMessageLamport } from './lamport-utils'

export class WalletLamport {
  public readonly baseWallet: Wallet
  public lamportKeys: LamportKeys

  constructor (baseWallet: Wallet, numberOfTests: number, testSizeInBytes: number) {
    this.baseWallet = baseWallet
    this.lamportKeys = generateLamportKeys(numberOfTests, testSizeInBytes)
  }

  public signMessageLamport (message: Buffer): Buffer {
    return signMessageLamport(message, this.lamportKeys.secretKeys)
  }
}
