import { BigNumber, Signer, Wallet } from 'ethers'
import {
  BountyFallbackAccount,
  BountyFallbackAccount__factory,
  BountyFallbackAccountFactory,
  BountyFallbackAccountFactory__factory
} from '../../typechain'
import { WalletLamport } from './wallet-lamport'
import { createAccountOwner } from '../testutils'
import { DEFAULT_NUMBER_OF_TESTS_LAMPORT, DEFAULT_TEST_SIZE_IN_BYTES_LAMPORT } from './lamport-utils'

// create non-random account, so gas calculations are deterministic
export function createAccountOwnerLamport (numberOfTests: number = DEFAULT_NUMBER_OF_TESTS_LAMPORT, testSizeInBytes: number = DEFAULT_TEST_SIZE_IN_BYTES_LAMPORT): WalletLamport {
  return new WalletLamport(createAccountOwner(), numberOfTests, testSizeInBytes)
}

// Deploys an implementation and a proxy pointing to this implementation
export async function createAccountLamport (
  ethersSigner: Signer,
  accountOwner: string,
  lamportKey: Buffer[][],
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
