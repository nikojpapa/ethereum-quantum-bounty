import { bytes } from '../../solidityTypes'
import {
  OrderFindingBountyWithPredeterminedLocks,
  OrderFindingBountyWithPredeterminedLocks__factory
} from '../../../typechain'
import { ethers } from 'hardhat'
import { submitSolution } from '../bounty-utils'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { randomBytes } from 'crypto'

describe.skip('Test the cost of solving the order finding bounty', () => {
  let bounty: OrderFindingBountyWithPredeterminedLocks

  const locks = [
    [
      '0xccda5ed8b7b0a45eb02d23b07e62f088fbe14781ce0baf896605957519c2e0cdf8206066d6d1f7acaddeea0a5edc97277998024a093ee70358aabcf322c0b748ea4ac0cd884344c55564ab5a9d6d6ac7f89e67f488e84a0e19d0ced4c89bc818a35735f1b563234aea4da7c09fc150e7317a2efcf7f0b1741bd85671650e3e927d2eee89c5556a6a37ed619a36178a1b6b8790c0ffdc6c0438eac646f533c6252e6e6766501ba0392adde287e0e1f83360e590c9caa155b1285c6cd4563ed0d7456d22919fe118090b9fd00c3714daebfa21f5216a76b1ee6b46f135b9670b5465b7a089c9d7aad3acd3fbd65f98c5e625914744c19690ff1299685307458cb0504d1f8283872bdac22cc5bdbc39778fdd3dd57e87b58fe64bdcb547675ff8f85688cb807e913b584b0e4b5123da438acc793a1c7de8e9b42607e39750faec17f0a245bfaed21a0c4da06e419c9c36b876e8c207564e194920fa694754df4c6615c57bf984aa879d79c07b7ae4cb525936ddd6755690347c3e040454a2feb511125c97fed8d4a2df2f27cc972eb020bd87ef88e374db49d969497173379929cd7e412389cab6ff0da39abba7dc75dde1a95c83683ad4386cdf39032260570106334fe5488b141ea614d7da0d5b8b5dab6ec7442abe9e6f36278f6f0c4d24da35355cda21cbca6001924f130cebca3bd1d0a29762cb4a14ca0b44e1837db0a8b649cde4ab8727c60f3df4949520fa30cf3788f77d1edb93ba7e6e17936782c4abb1654f948096070ce76866f2f2aeacc74c13d555794bd03daf9906356e66392692212c0be04ae6d3e9261cb1b6172d7816cf40f72c7b56629e43f43a1c8ce161f599a82389b933b497782198c2907f465f312e4a1d8efd5a827a3726f536d7b3ef39958ec005',
      '0x2629d6a15cf3b09993334ce7ac19a6a41103b9cb8ee5f998b65b9f70ab30484ddac593110a5bfad98485f0b9eafc5eef792a8595a4c2f3ecc122061e4400bfb7652fbc7df6c55113b855b16356c2ee00d2ab269ca4cd8861dc4e30150420112a34a76a3c64244dd94c9ae0a8d0b04ee7a61d2714a1fe1c95d36232dd3a34793b7cb0efc83230163d0d96db5868b148792ec71c2e484ab13da2ece45efed5d0cf8ff4e517afa012ce1d9818765eaa31c1bdacd7587c1c0c079c35f5905d16b0e15550d7eb0cddc17aa333f4221d85f9f2dad5cc8a041c92dcaa9e7f4ce72ea2230a48313aca90a2fba91edf72f9d36567e711948606e911c563813a7ed8710893e035e62051fe30d6250581e34a7636ac4eb03cfe94a54cc5487728a67960fc0d89cbc30966bb7ae6a01ccd7b5b670e6d6b687cfa3d30e44e43302f3d5ffd371f2ee1bcacad2b66c58556b1948d86db1c2bef88dd5eda638d5c67f744c9d2da8ab0d102ee01710144e64b2296bc919dd398ab3d2ec86e89025a02854f616823a86701c106646e291591240bc15e71fde3531ac235be5f6279420b8af39c2a9b0cc9dfbbbf0e623268a8e60abea3e0aac21e2e8e02ad51ae51938675f73e3a44ea2805c9bb18c741b8e3fbb614a0360c036ef9f3b4d14cb2131ce8dbbefac8af03056c552cd30f7d2975fb38b20657c7fdd50959b15acbd2b06ff45cdc97f4d0e37fcb2e5b7f876faca11b87452c02e538d4044323745e6771ecc15f7f6ff6d9da4b5ee33324e689d1da6a108cd2dcc0fc34357b78deb977ead7d7f89ac79f4ee25bf632728d3ece5c7059b7cbc804f06e689add350cea9f9e13caf15b7b62f059b2226baa4efe7676dc13d4c3d0022c5b1b0a70ff67e74be93b2309211c99f4a3899839c60b31'
    ]
  ]

  async function deployBounty (locks: bytes[][]): Promise<OrderFindingBountyWithPredeterminedLocks> {
    const ethersSigner = ethers.provider.getSigner()
    const bounty = await new OrderFindingBountyWithPredeterminedLocks__factory(ethersSigner).deploy(locks.length)
    for (let i = 0; i < locks.length; i++) {
      await bounty.setLock(i, locks[i])
    }
    return bounty
  }

  beforeEach(async () => {
    bounty = await deployBounty(locks)
  })

  it('should find the gas cost to attempt a 5166-bit base with various sized exponents', async () => {
    let maxGas = BigNumber.from(0)
    let minGas = null
    for (let i = 1; i <= 1292; i++) {
      const solution = randomBytes(i)
      solution[0] = solution[0] | (1 << 7)
      const tx = submitSolution(i, solution, bounty)
      await expect(tx, `Base ${locks[0][1]} worked with exponent 0x${solution.toString('hex')}`).to.be.reverted

      const latestBlock = await ethers.provider.getBlock('latest')
      const latestTransactionHash = latestBlock.transactions[latestBlock.transactions.length - 1]
      const latestReceipt = await ethers.provider.getTransactionReceipt(latestTransactionHash)

      const gasUsed = latestReceipt.gasUsed
      console.log(`Gas for solution ${solution.toString('hex')} is ${gasUsed.toHexString()}`)
      if (gasUsed.gt(maxGas)) maxGas = gasUsed
      if (minGas == null || gasUsed.lt(minGas)) minGas = gasUsed
    }
    console.log(`Min gas: ${minGas.toHexString()}`)
    console.log(`Max gas: ${maxGas.toHexString()}`)
  })
})
