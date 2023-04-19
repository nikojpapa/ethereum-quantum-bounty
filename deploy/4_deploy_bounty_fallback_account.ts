import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'
import { createAccountOwnerLamport } from '../test/bounty-fallback-account/testutils-lamport'
import { randomBytes } from 'crypto'
import * as dotenv from 'dotenv'
import { MetamaskClient } from 'hardhat_metamask_client'
import config from '../hardhat.config'

dotenv.config()

const deployBountyFallbackAccount: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const client = new MetamaskClient(config, 'goerli')
  const from = await (await client.getSigner()).getAddress()

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

  const accountOwner = createAccountOwnerLamport(32, 32, from)
  const salt = randomBytes(16)
  const addressParams = [accountOwner.baseWallet.address, salt, accountOwner.lamportKeys.publicKeys, signatureBounty.address]
  // @ts-ignore
  const accountTransaction = await factory.createAccount(...addressParams)
  await accountTransaction.wait()
  // @ts-ignore
  const accountAddress = await factory.getAddress(...addressParams)
  console.log('==BountyFallbackAccount addr=', accountAddress)

  client.close()
}

module.exports = deployBountyFallbackAccount
module.exports.tags = ['BountyFallbackAccount']
