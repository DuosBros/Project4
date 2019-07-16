import moment from 'moment';
import { getOrder, lockOrder, updateOrder, getCosts, getCurrentYearOrders, getOrders, getNotPaidOrders } from '../utils/requests';
import { DEFAULT_ORDER_LOCK_SECONDS } from '../appConfig';

export const fetchAndHandleNotPaidOrders = (getNotPaidOrdersAction) => {
    getNotPaidOrders()
        .then(res => {
            getNotPaidOrdersAction({ data: res.data, success: true })
        })
        .catch(err => {
            getNotPaidOrdersAction({ error: err, success: false })
        })
}

export const fetchAndHandleOrders = (from, to, getOrdersAction) => {
    getOrders(from, to)
        .then(res => {
            getOrdersAction({ data: res.data, success: true })
        })
        .catch(err => {
            getOrdersAction({ error: err, success: false })
        })
}

export const fetchAndHandleThisYearOrders = (getOrdersAction, limit, sinceId, mapOrdersToTransactionsActions) => {
    getCurrentYearOrders(limit, sinceId)
        .then(res => {
            getOrdersAction({ data: res.data, success: true })
            if (mapOrdersToTransactionsActions) {
                mapOrdersToTransactionsActions({ data: res.data, success: true })
            }
        })
        .catch(err => {
            getOrdersAction({ error: err, success: false })
        })
}

export const handleTogglePaidOrder = async (props) => {
    let { order, user } = props;
    await lockOrder(order.id, user, DEFAULT_ORDER_LOCK_SECONDS)
    let fetchedOrder = await getOrder(order.id);
    fetchedOrder = fetchedOrder.data

    // to not confuse user -> do the action based on what user currently see, not what is fetched from the server
    if (order.payment.paid) {
        delete fetchedOrder.payment.paymentDate
        delete fetchedOrder.payment.paid
    }
    else {
        fetchedOrder.payment.paid = true
        fetchedOrder.payment.paymentDate = moment().toISOString()
    }

    await updateOrder(fetchedOrder, user)
    props.getOrderAction({ success: true, data: fetchedOrder })

    return fetchedOrder;
}

export const getOrderAndHandleResult = async (props) => {
    try {
        let res = await getOrder(props.id)
        let obj = { data: res.data, success: true }
        props.openOrderDetailsAction(obj)
        return obj
    }
    catch (err) {
        let obj = { error: err, success: false }
        props.openOrderDetailsAction(obj)
        return obj
    }
}

export const fetchCostsAndHandleResult = (props) => {
    getCosts()
        .then(res => {
            props.getCostsAction({ success: true, data: res.data })
        })
        .catch(err => {
            props.getCostsAction({ success: false, error: err })
        })
}