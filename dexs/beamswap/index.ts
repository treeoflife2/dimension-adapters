import { BreakdownAdapter, ChainEndpoints } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";
import { getGraphDimensions2 } from "../../helpers/getUniSubgraph";
import { getUniV2LogAdapter } from "../../helpers/uniswap";

const endpoints: ChainEndpoints = {
  [CHAIN.MOONBEAM]:
    "https://graph.beamswap.io/subgraphs/name/beamswap/beamswap-amm-v2",
};

const graphs = getGraphDimensions2({
  graphUrls: endpoints,
  totalVolume: {
    factory: "uniswapFactories",
    field: "totalVolumeUSD",
  },
  feesPercent: {
    type: "volume",
    UserFees: 0.3,
    ProtocolRevenue: 0.13,
    SupplySideRevenue: 0.17,
    HoldersRevenue: 0,
    Revenue: 0.13,
    Fees: 0.3,
  },
});

const v1graphs = getGraphDimensions2({
  graphUrls: {
    [CHAIN.MOONBEAM]:
      "https://graph.beamswap.io/subgraphs/name/beamswap/beamswap-stableamm",
  },
  totalVolume: {
    factory: "tradeVolumes",
    field: "volume",
  },
  feesPercent: {
    type: "volume",
    UserFees: 0.04,
    ProtocolRevenue: 0.02,
    SupplySideRevenue: 0.02,
    HoldersRevenue: 0,
    Revenue: 0.02,
    Fees: 0.04,
  },
});

const methodology = {
  UserFees: "User pays 0.30% fees on each swap.",
  Fees: "A 0.30% of each swap is collected as trading fees",
  Revenue: "Protocol receives 0.13% on each swap.",
  ProtocolRevenue: "Protocol receives 0.13% on each swap.",
  SupplySideRevenue: "All user fees are distributed among LPs.",
  HoldersRevenue: "Stakers received $GLINT in staking rewards.",
};

const methodologyStable = {
  UserFees: "User pays a 0.04% fee on each swap.",
  Fees: "A 0.04% of each swap is collected as trading fees",
  Revenue: "Protocol receives 0.02% of the swap fee",
  ProtocolRevenue: "Protocol receives 0.02% of the swap fee",
  SupplySideRevenue: "0.02% of the swap fee is distributed to LPs",
  HoldersRevenue: "Stakers received $GLINT in staking rewards.",
};

const adapter: BreakdownAdapter = {
  version: 2,
  breakdown: {
    classic: {
      [CHAIN.MOONBEAM]: {
        fetch: getUniV2LogAdapter({ factory: '0x985BcA32293A7A496300a48081947321177a86FD', revenueRatio: 0.13/0.30, protocolRevenueRatio: 0.13/0.30, }),
        meta: {
          methodology: {
            ...methodology,
          },
        },
      },
    },
    "stable-amm": {
      [CHAIN.MOONBEAM]: {
        fetch: v1graphs,
        start: '2022-07-04',
        meta: {
          methodology: {
            ...methodologyStable,
          },
        },
      },
    },
  },
};

export default adapter;
