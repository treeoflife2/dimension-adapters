import { FetchOptions, SimpleAdapter } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";
import request, { gql } from "graphql-request";
import BigNumber from "bignumber.js";
import { SWAPX_GRAPHQL_ENDPOINT, whitelistedSwapXV3Pools } from "../../dexs/SwapX-algebra";

type TStartTime = {
  [key: string]: number;
};

// Start time as per the dexs adapter
const startTime: TStartTime = {
  [CHAIN.SONIC]: 1735129946, // 2024-12-24
};

interface IGraphRes {
  volumeUSD: number;
  feesUSD: number;
  protocolRevenueUSD: number;
  holdersRevenueUSD: number;
  supplyRevenueUSD: number;
}

interface IPoolDayData {
  pool: {
    id: string;
  };
  feesUSD: string;
  volumeUSD: string;
}

interface IGauge {
  id: string;
  pool?: {
    id: string;
  };
}

async function fetchPoolDayData(options: FetchOptions) {
  const query = gql`
    {
      v3PoolDayDatas(where:{pool_in: ${whitelistedSwapXV3Pools}, date:${options.startOfDay}}) {
        pool {
          id
        }
        feesUSD
        volumeUSD
      }
    }`;

  return request(SWAPX_GRAPHQL_ENDPOINT, query);
}

async function fetchGauges(options: FetchOptions) {
  const query = gql`
    {
      gauges(where: { isAlive: true }) {
        id
        pool {
          id
        }
      }
    }`;

  return request(SWAPX_GRAPHQL_ENDPOINT, query);
}

export async function fetchStats(options: FetchOptions): Promise<IGraphRes> {
  // Fetch pool data
  const poolDayDataReq = await fetchPoolDayData(options);
  const gaugesReq = await fetchGauges(options);
  
  // Calculate total volume and fees
  let totalVolumeUSD = "0";
  let totalFeesUSD = "0";
  
  poolDayDataReq.v3PoolDayDatas.forEach((dayData: IPoolDayData) => {
    totalVolumeUSD = new BigNumber(totalVolumeUSD).plus(dayData.volumeUSD || 0).toString();
    totalFeesUSD = new BigNumber(totalFeesUSD).plus(dayData.feesUSD || 0).toString();
  });
  
  // Get all alive gauge IDs
  const aliveGaugeIds = gaugesReq.gauges.map((gauge: IGauge) => gauge.id);
  const gaugedPoolIds = gaugesReq.gauges.map((gauge: IGauge) => gauge.pool?.id).filter(Boolean);
  
  // Separate pools with gauges and without gauges
  const gaugedPools = poolDayDataReq.v3PoolDayDatas.filter(
    (dayData: IPoolDayData) => gaugedPoolIds.includes(dayData.pool.id)
  );
  
  const ungaugedPools = poolDayDataReq.v3PoolDayDatas.filter(
    (dayData: IPoolDayData) => !gaugedPoolIds.includes(dayData.pool.id)
  );
  
  // Calculate protocol revenue (5% of non-gauge fees)
  const protocolRevenueUSD = ungaugedPools.reduce((acc: number, pool: IPoolDayData) => {
    return acc + Number(pool.feesUSD || 0) * 0.05;
  }, 0);
  
  // Calculate holders revenue (100% of gauged pool fees)
  const holdersRevenueUSD = gaugedPools.reduce((acc: number, pool: IPoolDayData) => {
    return acc + Number(pool.feesUSD || 0);
  }, 0);
  
  // Calculate supply side revenue (fees - holders - protocol)
  const supplyRevenueUSD = Number(totalFeesUSD) - holdersRevenueUSD - protocolRevenueUSD;

  return {
    volumeUSD: Number(totalVolumeUSD),
    feesUSD: Number(totalFeesUSD),
    protocolRevenueUSD,
    holdersRevenueUSD,
    supplyRevenueUSD
  };
}

const fetch = async (_: any, _1: any, options: FetchOptions) => {
  const stats = await fetchStats(options);

  return {
    dailyVolume: String(stats.volumeUSD),
    dailyFees: String(stats.feesUSD),
    dailyUserFees: String(stats.feesUSD),
    dailyHoldersRevenue: String(stats.holdersRevenueUSD),
    dailyProtocolRevenue: String(stats.protocolRevenueUSD),
    dailyRevenue: String(stats.protocolRevenueUSD + stats.holdersRevenueUSD),
    dailySupplySideRevenue: String(stats.supplyRevenueUSD)
  };
};

const methodology = {
  UserFees: "User pays fees on each swap.",
  ProtocolRevenue: "5% of non-gauged pools fees go to the protocol.",
  HoldersRevenue: "User fees from gauged pools are distributed among holders.",
  SupplySideRevenue: "Remaining fees go to liquidity providers."
};

const adapter: SimpleAdapter = {
  adapter: {
    [CHAIN.SONIC]: {
      fetch,
      start: startTime[CHAIN.SONIC],
      meta: {
        methodology
      },
    },
  },
};

export default adapter; 