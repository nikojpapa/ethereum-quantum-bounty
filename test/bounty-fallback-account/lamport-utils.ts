import { randomBytes } from 'crypto'
import { arrayify, keccak256 } from 'ethers/lib/utils'
import { keccak256 as keccak256_buffer } from 'ethereumjs-util/dist/hash'
import { Buffer } from 'buffer'

// inspiration from https://zacharyratliff.org/Lamport-Signatures/

const BITS_PER_BYTE = 8

const numberOfTests = 4
const numberSizeBytes = 4

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
  const sig: Buffer[] = []

  const bits = []
  let i = 0
  while (bits.length < numberOfTests) {
    const byteInt = hashedMessage.readUInt8(hashedMessage.byteLength - i - 1)
    for (let j = 0; j < BITS_PER_BYTE; j++) {
      const b = (byteInt >> j) & 1
      bits.push(b)
    }
    ++i
  }

  for (const bit of bits.slice(0, numberOfTests)) {
    sig.push(secretKeys[bit][i])
  }

  // const hashedMessageInt = parseInt(hashedMessage.toString('hex'), 16)
  // for (let i = 0; i < numberOfTests; i++) {
  //   const b = (hashedMessageInt >> i) & 1
  //   sig.push(secretKeys[b][i])
  // }

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
