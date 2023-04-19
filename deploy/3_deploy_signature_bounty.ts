import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { Create2Factory } from '../src/Create2Factory'
import { ethers } from 'hardhat'
import config from '../hardhat.config'
import { MetamaskClient } from 'hardhat_metamask_client'

const deploySignatureBounty: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const client = new MetamaskClient(config, 'goerli')
  const from = await (await client.getSigner()).getAddress()
  await new Create2Factory(ethers.provider).deployFactory()

  const publicKeys = []
  for (let i = 0; i < 10; i++) {
    const randomWallet = ethers.Wallet.createRandom()
    publicKeys.push(randomWallet.address)
  }

  // const entrypoint = await hre.deployments.get('EntryPoint')
  const account = await hre.deployments.deploy(
    'SignatureBounty', {
      from,
      args: [publicKeys],
      gasLimit: 6e6,
      deterministicDeployment: true
    })
  console.log('==SignatureBounty addr=', account.address)

  client.close()
}

module.exports = deploySignatureBounty
module.exports.tags = ['SignatureBounty']
