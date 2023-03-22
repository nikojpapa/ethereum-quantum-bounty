import { BigNumber, Signer, Wallet } from 'ethers'
import {
  BountyFallbackAccount,
  BountyFallbackAccount__factory,
  BountyFallbackAccountFactory,
  BountyFallbackAccountFactory__factory
} from '../../typechain'
import { WalletLamport } from './wallet-lamport'
import { createAccountOwner } from '../testutils'

// create non-random account, so gas calculations are deterministic
export function createAccountOwnerLamport (): WalletLamport {
  return new WalletLamport(createAccountOwner())
}

// Deploys an implementation and a proxy pointing to this implementation
export async function createAccountLamport (
  ethersSigner: Signer,
  accountOwner: string,
  lamportKey: number[][],
  entryPoint: string,
  _factory?: BountyFallbackAccountFactory
):
  Promise<{
    proxy: BountyFallbackAccount
    accountFactory: BountyFallbackAccountFactory
    implementation: string
  }> {
  const accountFactory = _factory ?? await new BountyFallbackAccountFactory__factory(ethersSigner).deploy(entryPoint)
  const implementation = await accountFactory.accountImplementation()
  await accountFactory.createAccount(accountOwner, 0, lamportKey)
  const accountAddress = await accountFactory.getAddress(accountOwner, 0, lamportKey)
  const proxy = BountyFallbackAccount__factory.connect(accountAddress, ethersSigner)
  return {
    implementation,
    accountFactory,
    proxy
  }
}
