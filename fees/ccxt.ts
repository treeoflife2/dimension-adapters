import { CHAIN } from '../helpers/chains'
import { FetchOptions, SimpleAdapter } from '../adapters/types'
import { fetchBuilderCodeRevenue } from '../helpers/hyperliquid'

const CCXT_BUILDER_ADD = '0x6530512A6c89C7cfCEbC3BA7fcD9aDa5f30827a6'

const fetch = async (_a: any, _b: any, options: FetchOptions) => {
  const { dailyVolume, dailyFees, dailyRevenue, dailyProtocolRevenue } = await fetchBuilderCodeRevenue({ options, builder_address: CCXT_BUILDER_ADD });

  return {
    dailyVolume,
    dailyFees,
    dailyRevenue,
    dailyProtocolRevenue,
  }
}

const methodology = {
  Fees: 'ccxt builder code revenue from Hyperliquid Perps Trades.',
  Revenue: 'ccxt builder code revenue from Hyperliquid Perps Trades.',
  ProtocolRevenue: 'ccxt builder code revenue from Hyperliquid Perps Trades.',
}

const adapter: SimpleAdapter = {
  fetch,
  chains: [CHAIN.HYPERLIQUID],
  start: '2025-07-08',
  methodology,
  doublecounted: true,
  // isExpensiveAdapter: true,
}

export default adapter;

