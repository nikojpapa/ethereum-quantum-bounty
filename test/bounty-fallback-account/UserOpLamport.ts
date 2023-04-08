import { UserOperation } from '../UserOperation'
import { getUserOpHash } from '../UserOp'
import { hashMessage } from './lamport-utils'
import { WalletLamport } from './wallet-lamport'
import { ecsign, toRpcSig } from 'ethereumjs-util'
import { arrayify } from 'ethers/lib/utils'

export function signUserOpLamport (op: UserOperation, signer: WalletLamport, entryPoint: string, chainId: number): UserOperation {
  const message = hashMessage(getUserOpHash(op, entryPoint, chainId))
  const signatureLamport = signer.signMessageLamport(message)

  const sig = ecsign(message, Buffer.from(arrayify(signer.baseWallet.privateKey)))
  const signatureEcdsa = toRpcSig(sig.v, sig.r, sig.s)

  return {
    ...op,
    signature: Buffer.concat([Buffer.from(arrayify(signatureEcdsa)), signatureLamport])
  }
}
