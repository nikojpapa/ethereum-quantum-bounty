import { UserOperation } from '../UserOperation'
import { getUserOpHash } from '../UserOp'
import { hashMessage } from './lamport-utils'
import { WalletLamport } from './wallet-lamport'

export function signUserOpLamport (op: UserOperation, signer: WalletLamport, entryPoint: string, chainId: number): UserOperation {
  const message = getUserOpHash(op, entryPoint, chainId)
  const sig = signer.signMessageLamport(hashMessage(message))
  return {
    ...op,
    signature: sig
  }
}
