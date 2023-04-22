import '../aa.init'
import { ethers } from 'hardhat'
import { RandomNumberGenerator, RandomNumberGenerator__factory } from '../../typechain'

describe('PrimeGenerator', () => {
  const ethersSigner = ethers.provider.getSigner()
  let primeGenerator: RandomNumberGenerator

  beforeEach(async function () {
    primeGenerator = await new RandomNumberGenerator__factory(ethersSigner).deploy()
  })

  it('should generate numbers that satisfy miller-rabin', () => {
    for (let i = 0; i < 20; i++) {
      let prime = RandomNumberGenerator.generateLargePrime()
    }
  })
})
