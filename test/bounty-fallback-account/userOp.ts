import { UserOperation } from '../UserOperation'
import { Wallet } from 'ethers'
import { arrayify, sha256 } from 'ethers/lib/utils'
import { ecsign, toRpcSig } from 'ethereumjs-util'
import { keccak256 as keccak256_buffer } from 'ethereumjs-util/dist/hash'
import { getUserOpHash } from '../UserOp'
import { randomBytes } from 'crypto'

export function signUserOp (op: UserOperation, signer: Wallet, entryPoint: string, chainId: number): UserOperation {
  const message = getUserOpHash(op, entryPoint, chainId)
  const msg1 = Buffer.concat([
    Buffer.from('\x19Ethereum Signed Message:\n32', 'ascii'),
    Buffer.from(arrayify(message))
  ])

  const sig = ecsign(keccak256_buffer(msg1), Buffer.from(arrayify(signer.privateKey)))
  // that's equivalent of:  await signer.signMessage(message);
  // (but without "async"
  const signedMessage1 = toRpcSig(sig.v, sig.r, sig.s)
  return {
    ...op,
    signature: signedMessage1
  }
}

function getLamportSignature (message: Buffer): number[] {
  const keypair = keygen()
  return sign(message, keypair[0])
}

function keygen (): number[][][] {
  const secret_keys = []
  for (let y = 0; y < 2; y++) {
    const secret_key = []
    for (let x = 0; x < 256; x++) {
      secret_key.push(0)
    }
    secret_keys.push(secret_key)
  }

  const public_keys = []
  for (let y = 0; y < 2; y++) {
    const public_key = []
    for (let x = 0; x < 256; x++) {
      public_key.push(0)
    }
    public_keys.push(public_key)
  }

  for (let i = 0; i < 256; i++) {
    const secret_key_1 = randomBytes(32).toString('hex')
    const secret_key_2 = randomBytes(32).toString('hex')
    secret_keys[0][i] = parseInt(secret_key_1, 16)
    secret_keys[1][i] = parseInt(secret_key_2, 16)

    public_keys[0][i] = parseInt(sha256(secret_key_1), 16)
    public_keys[1][i] = parseInt(sha256(secret_key_2), 16)
  }

  return [secret_keys, public_keys]
}

function sign (hashedMessage: Buffer, secretKeys: number[][]): number[] {
  const sig = []
  for (let x = 0; x < 256; x++) {
    sig.push(0)
  }

  const hashedMessageInt = parseInt(hashedMessage.toString('hex'), 16)
  for (let i = 0; i < 256; i++) {
    const b = (hashedMessageInt >> i) & 1
    sig[i] = secretKeys[b][i]
  }

  return sig
}

function verify (hashedMessage: Buffer, sig: number[], pk: number[][]): boolean {
  const hashedMessageInt = parseInt(hashedMessage.toString('hex'), 16)

  for (let i = 0; i < 256; i++) {
    const b = (hashedMessageInt >> i) & 1
    const check = parseInt(sha256(sig[i].toString(16)), 16)
    if (pk[b][i] !== check) {
      return false
    }
  }

  return true
}
