import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { Create2Factory } from '../src/Create2Factory'
import { ethers } from 'hardhat'
import { BigNumber } from 'ethers'

const MAX_GAS_LIMIT_OPTION = { gasLimit: BigNumber.from('0x1c9c380') }

const deployPrimeFactoringBounty: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const provider = ethers.provider
  const from = await provider.getSigner().getAddress()
  await new Create2Factory(ethers.provider).deployFactory()

  const numberOfLocks = 23
  const byteSizeOfModulus = 98
  let gasUsed = BigNumber.from(0)

  const deployResult = await hre.deployments.deploy(
    'OrderFindingBountyWithLockGeneration', {
      ...MAX_GAS_LIMIT_OPTION,
      from,
      args: [numberOfLocks, byteSizeOfModulus],
      gasLimit: 6e6,
      deterministicDeployment: true
    })
  console.log('==PrimeFactoringBounty addr=', deployResult.address)
  gasUsed = gasUsed.add(deployResult.receipt?.gasUsed)

  const bounty = await ethers.getContractAt('OrderFindingBountyWithLockGeneration', deployResult.address)
  while (!(await bounty.generationIsDone())) {
    const tx = await bounty.triggerLockAccumulation(MAX_GAS_LIMIT_OPTION)
    const receipt = await tx.wait()
    gasUsed = gasUsed.add(receipt.gasUsed)
  }
  console.log('==PrimeFactoringBounty gasUsed=', gasUsed.toHexString())
  const modulus = await bounty.locks(0, 0)
  const base = await bounty.locks(0, 1)
  console.log('Modulus: ', modulus)
  console.log('Base: ', base)
}

module.exports = deployPrimeFactoringBounty
module.exports.tags = ['PrimeFactoringBounty']
