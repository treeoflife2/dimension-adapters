import { Balances } from "@defillama/sdk";
import { FetchOptions, SimpleAdapter } from "../../adapters/types";
import { CHAIN } from "../../helpers/chains";
import { postURL } from "../../utils/fetchURL";

const UBTC_DEPLOYER = '0xf036a5261406a394bd63eb4df49c464634a66155'
// const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
const UNIT_TOKENS = ["UBTC", "USOL", "UETH"]
const UNIT_TOKENS_MAP = {
    "UBTC": "bitcoin",
    "USOL": "solana",
    "UETH": "ethereum"
}

// not working
async function addReceivedUSDC(options:FetchOptions, balances: Balances, address:string){
    const txs:any[] = await postURL("https://api.hyperliquid.xyz/info", { "type": "userNonFundingLedgerUpdates", "user": address })
    txs.forEach(tx=>{
        const ts = tx.time/1e3
        if(options.startTimestamp < ts && ts < options.endTimestamp && (tx.delta.type === "spotTransfer" || tx.delta.type === "spotSend") && UNIT_TOKENS.includes(tx.delta.token) && tx.delta.destination === address.toLowerCase()){
            balances.addCGToken(UNIT_TOKENS_MAP[tx.delta.token], Number(tx.delta.amount))
        }
    })
}

const fetch: any = async (options: FetchOptions) => {
    const dailyFees = options.createBalances()
    const dailyRevenue = options.createBalances()
    // await addReceivedUSDC(options, dailyRevenue, "0x501a76325a353a4249740ada1d4bce46dbdd67d6")
    await addReceivedUSDC(options, dailyFees, UBTC_DEPLOYER)
    dailyFees.addBalances(dailyRevenue);
    return { dailyFees, dailyRevenue }
}

const adapter: SimpleAdapter = {
    version: 2,
    adapter: {
        [CHAIN.HYPERLIQUID]: {
            fetch
        },
    }
};

export default adapter;