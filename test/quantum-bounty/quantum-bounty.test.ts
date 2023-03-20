import '../aa.init'
import { ethers, web3 } from 'hardhat'
import { expect } from 'chai'
import { QuantumBounty, QuantumBounty__factory } from '../../typechain'
import { address } from '../solidityTypes'
import { BigNumber } from 'ethers'
import { JsonRpcSigner } from '@ethersproject/providers/src.ts/json-rpc-provider'

describe('QuantumBounty', () => {
  let bounty: QuantumBounty
  const signers: JsonRpcSigner[] = []
  const publicKeys: address[] = []

  before(async () => {
    for (let i = 0; i < 10; i++) {
      signers.push(ethers.provider.getSigner(i))
    }
    for (const signer of signers) {
      publicKeys.push(await signer.getAddress())
    }
  })

  beforeEach(async () => {
    const ethersSigner = ethers.provider.getSigner()
    bounty = await new QuantumBounty__factory(ethersSigner).deploy(publicKeys)
  })

  describe('Withdraw', () => {
    const arbitraryBountyAmount = BigNumber.from(100)
    let arbitraryUser: JsonRpcSigner
    let previousBalance: BigNumber
    let message: string

    before(async () => {
      arbitraryUser = ethers.provider.getSigner(1)
      message = web3.utils.sha3('arbitrary') as string
    })

    beforeEach(async () => {
      previousBalance = await arbitraryUser.getBalance()
      await bounty.addToBounty({ value: arbitraryBountyAmount })
    })

    describe('Correct Signatures', () => {
      let signatures: string[]
      let gasUsed: BigNumber = BigNumber.from(0)

      before(async () => {
        signatures = await Promise.all(signers.map(async (signer) =>
          await web3.eth.sign(message, await signer.getAddress())))
      })

      beforeEach(async () => {
        const tx = await bounty.connect(arbitraryUser).widthdraw(message, signatures)
        const receipt = await tx.wait()
        gasUsed = BigNumber.from(receipt.cumulativeGasUsed).mul(BigNumber.from(receipt.effectiveGasPrice))
      })

      it('should have a bounty of zero afterwards', async () => {
        expect(await bounty.bounty()).to.equal(0)
      })

      it('should send the bounty to the user', async () => {
        const newBalance = await arbitraryUser.getBalance()
        const expectedBalance = previousBalance.sub(gasUsed).add(arbitraryBountyAmount)
        expect(newBalance).to.equal(expectedBalance)
      })

      // it('should set the bounty as solved', async () => {
      //   expect(true).to.equal(false)
      // })
    })

    describe('Incorrect Signatures', () => {
      let signatures: string[]

      before(async () => {
        signatures = await Promise.all(signers.map(async (_) =>
          await web3.eth.sign(message, await arbitraryUser.getAddress())))
      })

      beforeEach(async () => {
        const tx = bounty.connect(arbitraryUser).widthdraw(message, signatures)
        await expect(tx).to.be.revertedWith('Invalid signatures')
      })

      it('should have full bounty afterwards', async () => {
        expect(await bounty.bounty()).to.equal(arbitraryBountyAmount)
      })

      it('should not send the bounty to the user', async () => {
        const newBalance = await arbitraryUser.getBalance()
        expect(newBalance).to.equal(previousBalance)
      })

      // it('should keep the bounty as unsolved', async () => {
      //   expect(true).to.equal(false)
      // })
    })
  })

  describe('Lock generation', () => {
    it('should set locks', async () => {
      for (let i = 0; i < signers.length; i++) {
        const expectedPublicKey = publicKeys[i]
        const bountyLock = await bounty.locks(i)
        expect(bountyLock).to.equal(expectedPublicKey)
      }
    })
  })

  describe('Add to bounty', () => {
    const amountToAdd = 100
    const otherUser = ethers.provider.getSigner(1)

    async function testAddToBounty (func: () => Promise<void>): Promise<void> {
      expect(await bounty.bounty()).to.equal(0)
      await func()
      expect(await bounty.bounty()).to.equal(amountToAdd)
    }

    it('should allow adding to the bounty', async () => {
      await testAddToBounty(async () => {
        await bounty.connect(otherUser).addToBounty({ value: amountToAdd })
      })
    })

    it('should allow adding to the bounty by sending funds to address using receive', async () => {
      await testAddToBounty(async () => {
        await otherUser.sendTransaction({ to: bounty.address, value: amountToAdd })
      })
    })

    it('should allow adding to the bounty by sending funds to address using fallback', async () => {
      await testAddToBounty(async () => {
        const arbitrary_data = '0x54'
        await otherUser.sendTransaction({ to: bounty.address, value: amountToAdd, data: arbitrary_data })
      })
    })
  })
})
