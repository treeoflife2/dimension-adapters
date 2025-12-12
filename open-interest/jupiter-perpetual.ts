import { SimpleAdapter, FetchOptions, FetchResultV2 } from "../adapters/types";
import { CHAIN } from "../helpers/chains";
import { getSqlFromFile, queryDuneSql } from "../helpers/dune";

const fetch = async (_a: any, _b: any, options: FetchOptions): Promise<FetchResultV2> => {

  // Use the new decoded query for better performance
  const sql = getSqlFromFile("helpers/queries/jupiter-perpetual-oi.sql", {
    start: options.startTimestamp - (7 * 24 * 60 * 60), // 7 days before start
    end: options.endTimestamp
  });
  const data: any[] = (await queryDuneSql(options, sql));
  
  // Filter data for the requested date range
  const startDate = new Date(options.startTimestamp * 1000);
  const endDate = new Date(options.endTimestamp * 1000);
  
  const filteredData = data.filter(row => {
    const rowDate = new Date(row.day);
    return rowDate >= startDate && rowDate <= endDate;
  });
  
  const dailyFees = filteredData.reduce((sum, row) => sum + (row.total_fees || 0), 0);

  return {
    openInterestAtEnd: dailyFees,
  }
};

const adapter: SimpleAdapter = {
  version: 2,
  fetch,
  chains: [CHAIN.SOLANA],
  start: "2024-01-23",
};

export default adapter;
