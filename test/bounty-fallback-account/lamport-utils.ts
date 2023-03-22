import { randomBytes } from 'crypto'
import { arrayify, keccak256 } from 'ethers/lib/utils'
import { keccak256 as keccak256_buffer } from 'ethereumjs-util/dist/hash'

// inspiration from https://zacharyratliff.org/Lamport-Signatures/

const numberOfTests = 8
const numberSizeBytes = 4

export function hashMessage (message: string): Buffer {
  const labeledMessage = Buffer.concat([
    Buffer.from('\x19Ethereum Signed Message:\n32', 'ascii'),
    Buffer.from(arrayify(message))
  ])

  return keccak256_buffer(labeledMessage)
}

export function keygen (): number[][][] {
  const secret_keys = []
  for (let y = 0; y < 2; y++) {
    const secret_key = []
    for (let x = 0; x < numberOfTests; x++) {
      secret_key.push(0)
    }
    secret_keys.push(secret_key)
  }

  const public_keys = []
  for (let y = 0; y < 2; y++) {
    const public_key = []
    for (let x = 0; x < numberOfTests; x++) {
      public_key.push(0)
    }
    public_keys.push(public_key)
  }

  for (let i = 0; i < numberOfTests; i++) {
    const secret_key_1 = randomBytes(numberSizeBytes).toString('hex')
    const secret_key_2 = randomBytes(numberSizeBytes).toString('hex')
    secret_keys[0][i] = parseInt(secret_key_1, 16)
    secret_keys[1][i] = parseInt(secret_key_2, 16)

    public_keys[0][i] = parseInt(keccak256(`0x${secret_key_1}`).toString().slice(0, numberSizeBytes), 16)
    public_keys[1][i] = parseInt(keccak256(`0x${secret_key_2}`).toString().slice(0, numberSizeBytes), 16)
  }

  return [secret_keys, public_keys]
}

export function signMessageLamport (hashedMessage: Buffer, secretKeys: number[][]): Buffer {
  const sig = []
  for (let x = 0; x < numberOfTests; x++) {
    sig.push(0)
  }

  const hashedMessageInt = parseInt(hashedMessage.toString('hex'), 16)
  for (let i = 0; i < numberOfTests; i++) {
    const b = (hashedMessageInt >> i) & 1
    sig[i] = secretKeys[b][i].toString(16)
  }

  return Buffer.from(sig.join(''))
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
