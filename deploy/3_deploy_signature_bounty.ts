import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { Create2Factory } from '../src/Create2Factory'
import { ethers } from 'hardhat'

const deploySignatureBounty: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const provider = ethers.provider
  const from = await provider.getSigner().getAddress()
  await new Create2Factory(ethers.provider).deployFactory()

  const publicKeys = []
  for (let i = 0; i < 10; i++) {
    const randomWallet = ethers.Wallet.createRandom()
    publicKeys.push(randomWallet.address)
  }

  const ret = await hre.deployments.deploy(
    'SignatureBounty', {
      from,
      args: [publicKeys],
      gasLimit: 6e6,
      deterministicDeployment: true
    })
  console.log('==entrypoint addr=', ret.address)
}

module.exports = deploySignatureBounty
module.exports.tags = ['SignatureBounty']
