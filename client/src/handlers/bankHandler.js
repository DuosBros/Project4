import { getBankTransactions } from "../utils/requests";
import { fetchAndHandleThisYearOrders } from "./orderHandler";

export const fetchBankTransactions = (getBankTransactionsAction, getOrdersAction, mapOrdersToTransactionsActions) => {
    getBankTransactions()
        .then(res => {
            getBankTransactionsAction({ success: true, data: res.data })
        })
        .then(() => {
            if(mapOrdersToTransactionsActions) {
                fetchAndHandleThisYearOrders(getOrdersAction, null, null, mapOrdersToTransactionsActions)
            }
        })
        .catch(err => {
            getBankTransactionsAction({ success: false, error: err })
        })
}