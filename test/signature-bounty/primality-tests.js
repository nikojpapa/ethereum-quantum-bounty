// /*
//  * Adapted from https://www.geeksforgeeks.org/how-to-generate-large-prime-numbers-for-rsa-algorithm/
//  */
//
// const firstPrimesList = [
//   2, 3, 5, 7, 11, 13, 17, 19, 23, 29,
//   31, 37, 41, 43, 47, 53, 59, 61, 67,
//   71, 73, 79, 83, 89, 97, 101, 103,
//   107, 109, 113, 127, 131, 137, 139,
//   149, 151, 157, 163, 167, 173, 179,
//   181, 191, 193, 197, 199, 211, 223,
//   227, 229, 233, 239, 241, 251, 257,
//   263, 269, 271, 277, 281, 283, 293,
//   307, 311, 313, 317, 331, 337, 347, 349
// ]
//
// function divisibleByLowLevelPrime (primeCandidate) {
//   return firstPrimesList.some(divisor => primeCandidate % divisor === 0 && divisor ** 2 <= primeCandidate)
// }
//
// // This function calculates (base ^ exp) % mod
// function expmod (base, exp, mod) {
//   if (exp === 0) return 1
//   if (exp % 2 === 0) {
//     return Math.pow(expmod(base, (exp / 2), mod), 2) % mod
//   } else {
//     return (base * expmod(base, (exp - 1), mod)) % mod
//   }
// }
//
// function isMillerRabinPassed (millerRabinCandidate) {
//   // Run 20 iterations of Rabin Miller Primality test
//
//   let maxDivisionsByTwo = 0
//   let evenComponent = millerRabinCandidate - 1
//
//   while (evenComponent % 2 === 0) {
//     evenComponent >>= 1
//     maxDivisionsByTwo += 1
//   }
//
//   function trialComposite (roundTester) {
//     if (expmod(roundTester, evenComponent, millerRabinCandidate) === 1) {
//       return false
//     }
//     for (let i = 0; i < (maxDivisionsByTwo); i++) {
//       if (expmod(roundTester, 2 ** i * evenComponent, millerRabinCandidate) === millerRabinCandidate - 1) {
//         return false
//       }
//     }
//     return true
//   }
//
//   const numberOfRabinTrials = 50
//   for (let i = 0; i < (numberOfRabinTrials); i++) {
//     const roundTester = Math.random() * (millerRabinCandidate - 2) + 2
//
//     if (trialComposite(roundTester)) { return false }
//   }
//   return true
// }
