import { randomBytes } from 'crypto'
import { arrayify } from 'ethers/lib/utils'
import { keccak256 as keccak256_buffer } from 'ethereumjs-util/dist/hash'
import { Buffer } from 'buffer'
import { getReversedBits } from './buffer-bit-utils'

// inspiration from https://zacharyratliff.org/Lamport-Signatures/

export function hashMessage (message: string): Buffer {
  const labeledMessage = Buffer.concat([
    Buffer.from('\x19Ethereum Signed Message:\n32', 'ascii'),
    Buffer.from(arrayify(message))
  ])

  return keccak256_buffer(labeledMessage)
}

export function keygen (numberOfTests: number, testSizeInBytes: number): Buffer[][][] {
  const secret_keys: Buffer[][] = [[], []]
  const public_keys: Buffer[][] = [[], []]

  for (let i = 0; i < numberOfTests; i++) {
    const secret_key_1 = randomBytes(testSizeInBytes)
    const secret_key_2 = randomBytes(testSizeInBytes)
    secret_keys[0].push(secret_key_1)
    secret_keys[1].push(secret_key_2)

    public_keys[0][i] = keccak256_buffer(secret_key_1).slice(0, testSizeInBytes)
    public_keys[1][i] = keccak256_buffer(secret_key_2).slice(0, testSizeInBytes)
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
