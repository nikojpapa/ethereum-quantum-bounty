import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { Create2Factory } from '../src/Create2Factory'
import { ethers } from 'hardhat'
import { createAccountOwnerLamport } from '../test/bounty-fallback-account/testutils-lamport'
import { randomBytes } from 'crypto'
import { BountyFallbackAccount__factory, BountyFallbackAccountFactory__factory } from '../typechain'

const deployBountyFallbackAccount: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const provider = ethers.provider
  const from = await provider.getSigner().getAddress()

  const accountOwner = createAccountOwnerLamport(64, 64)
  const salt = randomBytes(16)

  const entrypoint = await hre.deployments.get('EntryPoint')
  const signatureBounty = await hre.deployments.get('SignatureBounty')
  const factoryDeployment = await hre.deployments.deploy(
    'BountyFallbackAccountFactory', {
      from,
      args: [entrypoint.address],
      gasLimit: 6e6,
      deterministicDeployment: true
    })
  const factory = await ethers.getContractAt('BountyFallbackAccountFactory', factoryDeployment.address)
  console.log('==BountyFallbackAccountFactory addr=', factory.address)

  const account = await factory.createAccount(accountOwner.baseWallet.address, salt, accountOwner.lamportKeys.publicKeys, signatureBounty.address)
  console.log('==BountyFallbackAccount addr=', account)
}

module.exports = deployBountyFallbackAccount
module.exports.tags = ['BountyFallbackAccount']
