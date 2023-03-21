import { Signer } from 'ethers'
import {
  BountyFallbackAccount,
  BountyFallbackAccount__factory,
  BountyFallbackAccountFactory,
  BountyFallbackAccountFactory__factory
} from '../../typechain'

// Deploys an implementation and a proxy pointing to this implementation
export async function createAccount (
  ethersSigner: Signer,
  accountOwner: string,
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
  await accountFactory.createAccount(accountOwner, 0)
  const accountAddress = await accountFactory.getAddress(accountOwner, 0)
  const proxy = BountyFallbackAccount__factory.connect(accountAddress, ethersSigner)
  return {
    implementation,
    accountFactory,
    proxy
  }
}
