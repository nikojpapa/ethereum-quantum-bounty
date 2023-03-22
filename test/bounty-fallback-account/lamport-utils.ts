import { randomBytes } from 'crypto'
import { arrayify, keccak256 } from 'ethers/lib/utils'
import { keccak256 as keccak256_buffer } from 'ethereumjs-util/dist/hash'
import { Buffer } from 'buffer'
import { getReversedBits } from './buffer-bit-utils'

// inspiration from https://zacharyratliff.org/Lamport-Signatures/

const numberOfTests = 2
const numberSizeBytes = 2

export function hashMessage (message: string): Buffer {
  const labeledMessage = Buffer.concat([
    Buffer.from('\x19Ethereum Signed Message:\n32', 'ascii'),
    Buffer.from(arrayify(message))
  ])

  return keccak256_buffer(labeledMessage)
}

export function keygen (): Buffer[][][] {
  const secret_keys: Buffer[][] = [[], []]
  const public_keys: Buffer[][] = [[], []]

  for (let i = 0; i < numberOfTests; i++) {
    const secret_key_1 = randomBytes(numberSizeBytes)
    const secret_key_2 = randomBytes(numberSizeBytes)
    secret_keys[0].push(secret_key_1)
    secret_keys[1].push(secret_key_2)

    public_keys[0][i] = keccak256_buffer(secret_key_1).slice(0, numberSizeBytes)
    public_keys[1][i] = keccak256_buffer(secret_key_2).slice(0, numberSizeBytes)
  }

  return [secret_keys, public_keys]
}

export function signMessageLamport (hashedMessage: Buffer, secretKeys: Buffer[][]): Buffer {
  const numberOfTests = secretKeys[0].length
  const bits = getReversedBits(hashedMessage, numberOfTests)

  const sig = []
  for (let i = 0; i < numberOfTests; i++) {
    sig[i] = secretKeys[bits[i]][i]
  }
  return Buffer.concat(sig)
}

function verify (hashedMessage: Buffer, sig: number[], pk: number[][]): boolean {
  const hashedMessageInt = parseInt(hashedMessage.toString('hex'), 16)

  for (let i = 0; i < numberOfTests; i++) {
    const b = (hashedMessageInt >> i) & 1
    const check = parseInt(keccak256(sig[i].toString(16)), 16)
    if (pk[b][i] !== check) {
      return false
    }
  }

  return true
}
