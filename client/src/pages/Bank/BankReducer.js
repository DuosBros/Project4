import { successColor, warningColor } from "../../appConfig";
import moment from 'moment';

const initialState = {
    bankAccountInfo: {},
    transactions: { success: true }
}

const BankReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'GET_BANK_TRANSACTIONS':
            if (action.payload.success && action.payload.data) {
                let { accountId, bankId, bic, closingBalance, currency, iban } = action.payload.data.accountStatement.info;
                let bankAccountInfo = { accountId, bankId, bic, closingBalance, currency, iban };

                let mappedTransactions = action.payload.data.accountStatement.transactionList.transaction.reverse().map((x, i) => {
                    i++
                    let isTransactionIncoming = x.column1 ? (x.column1.value > 0 ? true : false) : false
                    return {
                        index: i,
                        date: x.column0 ? moment(x.column0.value.substring(0, x.column0.value.indexOf("+"))).local().format("DD.MM.YYYY") : null,
                        value: x.column1 ? x.column1.value : null,
                        accountIdSender: x.column2 ? x.column2.value : null,
                        bankIdSender: x.column3 ? x.column3.value : null,
                        cs: x.column4 ? x.column4.value : null,
                        vs: x.column5 ? Number(x.column5.value.replace(/^0+/gi, '')) : null,
                        accountNameSender: x.column10 ? x.column10.value : null,
                        bankNameSender: x.column12 ? x.column12.value : null,
                        currency: x.column14 ? x.column14.value : null,
                        paymentReference: x.column16 ? x.column16.value : null,
                        transactionId: x.column17 ? x.column17.value : null,
                        orderId: x.column22 ? x.column22.value : null,
                        note: x.column25 ? x.column25.value : null,
                        rowStyle: isTransactionIncoming ? { backgroundColor: successColor } : { backgroundColor: warningColor },
                        isTransactionIncoming: isTransactionIncoming
                    }
                });

                return Object.assign({}, state, {
                    transactions: { success: action.payload.success, data: mappedTransactions },
                    bankAccountInfo: bankAccountInfo
                });
            }

            return Object.assign({}, state, { transactions: action.payload })
        case 'MAP_ORDERS_TO_TRANSACTIONS':
            let transactions = Object.assign({}, state.transactions)
            if (action.payload.success && action.payload.data) {
                let orders = action.payload.data
                transactions.data.forEach(transaction => {
                    if (transaction.value > 0) {
                        let index = orders.findIndex(x => x.payment.vs === transaction.vs)
                        transaction.order = orders[index]
                    }
                });
            }

            return Object.assign({}, state, { transactions: transactions })
        case 'UPDATE_ORDER_IN_TRANSACTION':
            transactions = Object.assign({}, state.transactions)
            if (action.payload.data && action.payload.success) {
                let updatedOrder = action.payload.data;

                let index = transactions.data.findIndex(x => x.vs === updatedOrder.payment.vs);
                transactions.data[index].order = updatedOrder;
            }

            return Object.assign({}, state, { transactions: transactions })
        default:
            return state;
    }
}

export default BankReducer;