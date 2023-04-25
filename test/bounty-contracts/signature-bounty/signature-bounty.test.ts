import getBountyTests from '../bounty-test-factory'
import SignatureBountyUtils from './signature-bounty-utils'

const bountyUtils = new SignatureBountyUtils()

describe('SignatureBounty', getBountyTests(bountyUtils))
