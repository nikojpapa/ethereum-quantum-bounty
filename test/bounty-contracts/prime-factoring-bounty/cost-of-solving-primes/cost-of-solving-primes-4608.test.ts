import { BigNumber } from 'ethers'
import { costOfSolvingPrimesFactory } from './cost-of-solving-primes-factory'

const smallPrimes = [
  BigNumber.from(2),
  BigNumber.from(2),
  BigNumber.from(2),
  BigNumber.from(2),
  BigNumber.from(2)
]
const mediumPrimes = [
  BigNumber.from('0x9e794d825d5367f1'),
  BigNumber.from('0xec0b7a6b425fffc9'),
  BigNumber.from('0xef07c72251d9e1f17b10ec9788b3ae15'),
  BigNumber.from('0xee73b9f192c177575499190f3ded0631'),
  BigNumber.from('0xce385bf7585e967fa3be0c722d15ee41'),
  BigNumber.from('0x9deb56589d3dbc359f4d7ad556cd6114e6e0d5d380d45aff59fe564fe2d0c7e7'),
  BigNumber.from('0xb237e0a87baa96360e7faa432a40fd550cea247ad83198a08674b6af0c8aab1f'),
  BigNumber.from('0x98b506e93598a98579c9ce06a99d65d5a7694d9d739c270d5fa04abb4518af7b'),
  BigNumber.from('0xcc3422fbc329d582d216c4b4b879e4873a155864d9e95e6722136ac94c3fdb21')
]
const largePrimes = [
  BigNumber.from('0x74f79cee3d88530b7cbb80ed8db835541fcc44a240c2752bf54df8e979520803ef2db7c48d47bad7a783711b7b50c4431052652fad376fc861d2bd08d7bff0867d7095a78128c9df3fbb7a59914d66dc72b8909b151a4573fb7d7eaa3dcc391c9569ad225c864927adb76758685a50ba2d238c23e594d1a6900080a4274dc239bf7a6708c1779f1c0d3fb426556f1619e2c9fe9a6a15d00b9cacdc5c8ae311eea3978aff7ed601919ee76b6e1bbc1b227075ae99b8d2fb72545a4650086540f1'),
  BigNumber.from('0x7fc28ca8594e8cafa0d28b3278ba021cb37024dd98d3debc29691d83ea08836462017c548db59e36a19ff37fa28ce447b9c7e79f4d0c131ec3e62fc3441144baa036d0e10f9e4852f67a7743a65d9a9ed000856674c04898252117e151fd407b96b591e8ba4a591b0b07c195c3228fabcc4ade0de2d8b07d7813202e782a06c9927a05cb8638cf919a159c40db2533a16a5be15c5936c914fb289a53733e6191aaf0365d15795ac50e4183a1c2fbb5451325e839e4250f2f92b9a3f821552f89')
]
const primeFactors = smallPrimes
    .concat(mediumPrimes)
    .concat(largePrimes)

describe(
  'Test the cost of solving the prime factoring bounty with 4608-bit key',
  costOfSolvingPrimesFactory(192, primeFactors)
)
