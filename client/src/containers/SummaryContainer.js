import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { LOCALSTORAGE_NAME } from '../appConfig';
import { getCostsMonthly, getOrderedOrdersMonthly, getOrderedOrdersDaily, getProductsDaily, getAllProductsCustomTimeRange } from '../utils/requests';
import {
    getCostsMonthlyAction, getOrdersAction, mapOrdersToTransactionsActions, getBankTransactionsAction,
    getOrderedOrdersMonthlyAction, getOrderedOrdersDailyAction, getProductsDailyAction,
    getProductsAction, getNotPaidOrdersAction, getWarehouseProductsAction, getAllProductsCustomTimeRangeAction
} from '../utils/actions';
import Summary from '../pages/Summary';
import { fetchBankTransactions } from '../handlers/bankHandler';
import { sortMonthYear, groupBy, getMedian } from '../utils/helpers';
import _ from 'lodash';
import moment from 'moment';
import { fetchAndHandleOrders, fetchAndHandleNotPaidOrders } from '../handlers/orderHandler';
import { fetchWarehouseProducts } from '../handlers/warehouseHandler';
import { fetchAndHandleProducts } from '../handlers/productHandler';

class SummaryContainer extends React.PureComponent {

    state = {
        user: localStorage.getItem(LOCALSTORAGE_NAME) ? JSON.parse(atob(localStorage.getItem(LOCALSTORAGE_NAME).split('.')[1])).username : ""
    }

    componentDidMount() {
        this.fetchDataAndHandleResult();
        this.fetchProductsDaily();

        // get products for custom type
        fetchAndHandleProducts(this.props.getProductsAction)

        // get all orders
        this.fetchOrdersAndHandleResult();

        // get receivables
        fetchAndHandleNotPaidOrders(this.props.getNotPaidOrdersAction)

        // get current WH value
        fetchWarehouseProducts(moment().month() + 1, moment().year(), this.props.getWarehouseProductsAction)
        fetchBankTransactions(this.props.getBankTransactionsAction);
    }

    fetchOrdersAndHandleResult = (from, to) => {
        fetchAndHandleOrders(from, to, this.props.getOrdersAction)
    }

    fetchProductsDaily = async (from, to) => {
        if (!from) {
            from = moment().utc().startOf('month').toISOString()
        }

        if (!to) {
            to = moment().utc().endOf('month').toISOString()
        }
        try {
            let res = await getProductsDaily(from, to)
            this.props.getProductsDailyAction({ success: true, data: res.data })

        } catch (err) {
            this.props.getProductsDailyAction({ success: false, error: err })
        }
    }

    fetchDataAndHandleResult = async () => {
        try {
            let res = await getOrderedOrdersMonthly()
            this.props.getOrderedOrdersMonthlyAction({ success: true, data: res.data })

        } catch (err) {
            this.props.getOrderedOrdersMonthlyAction({ success: false, error: err })
        }

        try {
            let res = await getCostsMonthly()
            this.props.getCostsMonthlyAction({ success: true, data: res.data })

        } catch (err) {
            this.props.getCostsMonthlyAction({ success: false, error: err })
        }

        this.fetchOrderedOrdersDaily();
    }

    fetchOrderedOrdersDaily = async (from, to) => {
        if (!from) {
            from = moment().utc().startOf('month').toISOString()
        }

        if (!to) {
            to = moment().utc().endOf('month').toISOString()
        }
        try {
            let res = await getOrderedOrdersDaily(from, to)
            this.props.getOrderedOrdersDailyAction({ success: true, data: res.data })

        } catch (err) {
            this.props.getOrderedOrdersDailyAction({ success: false, error: err })
        }
    }

    handleGetProductsCustom = async (from, to) => {
        from = moment(from).format('YYYY-MM-DDT00:00:00.000[Z]')
        to = moment(to).format('YYYY-MM-DDT00:00:00.000[Z]')

        try {
            let res = await getAllProductsCustomTimeRange(from, to)
            this.props.getAllProductsCustomTimeRangeAction({ success: true, data: res.data })

        } catch (err) {
            this.props.getAllProductsCustomTimeRangeAction({ success: false, error: err })
        }
    }

    render() {

        let costsSummary = 0;
        let turnoverSummary = 0;
        let profitSummary = 0;
        let ordersCountSummary = 0;

        if (!this.props.summaryStore.orderedOrders.data
            || !this.props.summaryStore.costs.data || !this.props.summaryStore.costs.data ||
            !this.props.summaryStore.orderedOrdersDaily.data || !this.props.summaryStore.productsDaily.data) {
            return (
                <Summary
                    isMobile={this.props.isMobile}
                    fetchDataAndHandleResult={this.fetchDataAndHandleResult}
                    costs={this.props.summaryStore.costs}
                    orderedOrders={this.props.summaryStore.orderedOrders}
                    bankAccountInfo={this.props.bankStore.bankAccountInfo}
                    orderedOrdersDaily={this.props.summaryStore.orderedOrdersDaily}
                    productsDaily={this.props.summaryStore.productsDaily}
                />
            )
        }
        //#region order's total price [monthly, yearly]
        let ordersTotalPriceMedian = []
        if (this.props.ordersStore.orders.data) {
            // map each order to get month, year and string form of monthAndYear
            let temp = this.props.ordersStore.orders.data.map(x => {
                x.month = moment(x.payment.orderDate).month() + 1
                x.year = moment(x.payment.orderDate).year()
                x.monthAndYear = (x.month < 10 ? "0" + x.month : x.month) + "." + x.year

                return x
            });

            // filter out 2016 as this year contains incomplete data
            temp = temp.filter(x => x.year !== 2016)
            let groupedOrders = _.groupBy(temp, (item) => {
                return item.monthAndYear
            })
            let keys = Object.keys(groupedOrders)

            // getting monthly data of order's total price based on all orders
            temp = keys.map(x => {
                let y = {}
                y.totalPriceMonthlyMedian = getMedian(groupedOrders[x], "totalPrice")
                y.monthAndYear = x
                y.month = groupedOrders[x][0].month
                y.year = groupedOrders[x][0].year
                return y
            })

            let totalMedian = getMedian(temp, "totalPriceMonthlyMedian")
            ordersTotalPriceMedian = temp.map(x => {
                x.totalPriceTotalMedian = totalMedian
                return x
            })

            ordersTotalPriceMedian = sortMonthYear(ordersTotalPriceMedian, false)
        }
        //#endregion

        //#region current month products and categories [monthly]
        let productsDaily = this.props.summaryStore.productsDaily.data.slice();
        productsDaily = productsDaily.map(x => x.products).flat(1)

        let grouped = groupBy(productsDaily, "name")
        let groupedCategories = groupBy(productsDaily, "category")
        let keys = Object.keys(grouped);
        let keysCategories = Object.keys(groupedCategories).filter(x => x !== "null"); // filter out products with no category

        productsDaily = []
        let categoriesDaily = [];

        keys.forEach(x => {
            let temp = Object.assign({}, grouped[x][0]);
            if (grouped[x].length > 1) {

                temp.totalAmount = grouped[x].reduce((a, b) => { return { totalAmount: (Number.isInteger(a.totalAmount) ? a.totalAmount : 0) + (Number.isInteger(b.totalAmount) ? b.totalAmount : 0) } }).totalAmount
                temp.totalCount = grouped[x].reduce((a, b) => { return { totalCount: (Number.isInteger(a.totalCount) ? a.totalCount : 0) + (Number.isInteger(b.totalCount) ? b.totalCount : 0) } }).totalCount
                productsDaily.push(temp)
            }
            else {
                productsDaily.push(temp)
            }
        })
        productsDaily = _.sortBy(productsDaily, (i) => i.name)

        keysCategories.forEach(x => {
            if (groupedCategories[x].length > 1) {
                let tempObject = {}
                tempObject.totalAmount = groupedCategories[x].reduce((a, b) => { return { totalAmount: (Number.isInteger(a.totalAmount) ? a.totalAmount : 0) + (Number.isInteger(b.totalAmount) ? b.totalAmount : 0) } }).totalAmount
                tempObject.category = x
                categoriesDaily.push(tempObject)
            }
        })
        //#endregion

        //#region orders turnover and count [monthly]
        let dailyOrderedOrders = this.props.summaryStore.orderedOrdersDaily.data.slice();
        if (dailyOrderedOrders.length > 0) {
            dailyOrderedOrders.map(x => {
                x.date = (x._id.day < 10 ? "0" + x._id.day : x._id.day) + "." + (x._id.month < 10 ? "0" + x._id.month : x._id.month)
                x.ordersCount = x.cashOrders.filter(x => x).length + x.vsOrders.filter(x => x).length
                return x;
            })

            let turnoverMedian = getMedian(dailyOrderedOrders, "turnover");
            let ordersCountMedian = getMedian(dailyOrderedOrders, "ordersCount");
            dailyOrderedOrders.forEach(x => {
                x.turnoverMedian = turnoverMedian
                x.ordersCountMedian = ordersCountMedian
            })

            dailyOrderedOrders = dailyOrderedOrders.sort((a, b) => a.date - b.date)
        }

        //#endregion

        let orderedOrders = this.props.summaryStore.orderedOrders.data.slice();
        let orderedOrdersYearly = [];

        orderedOrders.map(x => {
            x.costs = 0;
            x.profit = 0;

            let found = this.props.summaryStore.costs.data.find(y => y._id.month === x._id.month && y._id.year === x._id.year)
            if (found) {
                x.costs = found.costs
                x.profit = x.turnover - x.costs
            }
            costsSummary += (x.costs !== undefined || x.costs != null) ? x.costs : 0
            turnoverSummary += (x.turnover !== undefined || x.turnover != null) ? x.turnover : 0
            profitSummary += (x.profit !== undefined || x.profit != null) ? x.profit : 0

            x.date = (x._id.month < 10 ? "0" + x._id.month : x._id.month) + "." + x._id.year
            x.ordersCount = x.cashOrders.filter(x => x).length + x.vsOrders.filter(x => x).length
            ordersCountSummary += x.ordersCount
            return x;
        })

        let ordersCountMedian = getMedian(orderedOrders, "ordersCount")
        orderedOrders.map(x => x.ordersCountMedian = ordersCountMedian)

        grouped = _.groupBy(orderedOrders, (item) => {
            return item._id.year
        });

        keys = Object.keys(grouped);

        // removing 2016
        keys.splice(0, 1)

        keys.forEach(x => {
            let turnoverSumYearly = 0
            let costsSumYearly = 0
            let ordersCountSumYearly = 0
            grouped[x].forEach(y => {
                turnoverSumYearly += y.turnover
                costsSumYearly += y.costs
                ordersCountSumYearly += y.ordersCount
            })

            orderedOrdersYearly.push({
                date: x,
                turnover: turnoverSumYearly,
                costs: costsSumYearly,
                ordersCount: ordersCountSumYearly,
                profit: turnoverSumYearly - costsSumYearly
            })
        });

        orderedOrdersYearly = orderedOrdersYearly.reverse();

        orderedOrdersYearly.unshift({
            date: 'Average',
            costs: costsSummary / keys.length,
            turnover: turnoverSummary / keys.length,
            profit: profitSummary / keys.length,
            ordersCount: ordersCountSummary / keys.length
        });

        orderedOrdersYearly.unshift({
            date: 'SUM',
            costs: costsSummary,
            turnover: turnoverSummary,
            profit: profitSummary,
            ordersCount: ordersCountSummary
        });

        orderedOrders = sortMonthYear(orderedOrders, true);

        orderedOrders.unshift({
            date: 'Average',
            costs: costsSummary / orderedOrders.length,
            turnover: turnoverSummary / orderedOrders.length,
            profit: profitSummary / orderedOrders.length,
            ordersCount: ordersCountSummary / orderedOrders.length,
        });

        orderedOrders.forEach(x => {
            x.turnoverAverage = (turnoverSummary / orderedOrders.length).toFixed(2)
            x.ordersCountAverage = (ordersCountSummary / orderedOrders.length).toFixed(2)
        })

        let receivables;
        if (this.props.ordersStore.notPaidOrders.success && this.props.ordersStore.notPaidOrders.data) {
            receivables = this.props.ordersStore.notPaidOrders.data.map(x => x.totalPrice).reduce((a, b) => a + b)
        }

        let warehouseValue = 0;
        if (this.props.productsStore.warehouseProducts.success && this.props.productsStore.warehouseProducts.data) {
            this.props.productsStore.warehouseProducts.data.forEach(x => {
                warehouseValue += x.price * x.available
            })
        }

        return (
            <Summary
                products={this.props.productsStore.products}
                isMobile={this.props.isMobile}
                fetchDataAndHandleResult={this.fetchDataAndHandleResult}
                orderedOrders={{ success: this.props.summaryStore.orderedOrders.success, data: orderedOrders }}
                costs={this.props.summaryStore.costs}
                bankAccountInfo={this.props.bankStore.bankAccountInfo}
                orderedOrdersYearly={orderedOrdersYearly}
                sum={{
                    costs: costsSummary,
                    turnover: turnoverSummary,
                    profit: profitSummary,
                    ordersCount: ordersCountSummary
                }}
                orderedOrdersDaily={{ success: true, data: dailyOrderedOrders }}
                fetchProductsDaily={this.fetchProductsDaily}
                fetchOrderedOrdersDaily={this.fetchOrderedOrdersDaily}
                productsDaily={{ success: true, data: productsDaily }}
                categoriesDaily={categoriesDaily}
                fetchOrdersAndHandleResult={this.fetchOrdersAndHandleResult}
                ordersTotalPriceMedian={ordersTotalPriceMedian}
                receivables={receivables}
                warehouseValue={warehouseValue}
                productsCustom={this.props.summaryStore.productsCustom}
                handleGetProductsCustom={this.handleGetProductsCustom}
            />
        )
    }
}

function mapStateToProps(state) {
    return {
        summaryStore: state.SummaryReducer,
        bankStore: state.BankReducer,
        ordersStore: state.OrdersReducer,
        productsStore: state.ProductsReducer
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getCostsMonthlyAction,
        getOrdersAction,
        getBankTransactionsAction,
        mapOrdersToTransactionsActions,
        getOrderedOrdersMonthlyAction,
        getOrderedOrdersDailyAction,
        getProductsDailyAction,
        getProductsAction,
        getNotPaidOrdersAction,
        getWarehouseProductsAction,
        getAllProductsCustomTimeRangeAction
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SummaryContainer);
