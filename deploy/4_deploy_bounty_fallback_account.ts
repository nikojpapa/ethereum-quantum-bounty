import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { Create2Factory } from '../src/Create2Factory'
import { ethers } from 'hardhat'
import { createAccountOwnerLamport } from '../test/bounty-fallback-account/testutils-lamport'
import { randomBytes } from 'crypto'

const deployBountyFallbackAccount: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const provider = ethers.provider
  const from = await provider.getSigner().getAddress()
  await new Create2Factory(ethers.provider).deployFactory()

  const accountOwner = createAccountOwnerLamport(64, 64)
  const salt = randomBytes(16)

  const entrypoint = await hre.deployments.get('EntryPoint')
  const account = await hre.deployments.deploy(
    'BountyFallbackAccount', {
      from,
      args: [entrypoint.address],
      gasLimit: 6e6,
      deterministicDeployment: true
    })
  console.log('==entrypoint addr=', account.address)

  // address owner, uint256 salt, bytes[][] memory lamportKey, address payable bountyContractAddress
  await account.initialize(accountOwner.baseWallet.address, salt, accountOwner.lamportKeys.publicKeys, '')
}

module.exports = deployBountyFallbackAccount
module.exports.tags = ['BountyFallbackAccount']
