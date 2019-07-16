import axios from 'axios';
import { MEDPHARMAVN_API, DEFAULT_ORDER_LOCK_SECONDS } from '../appConfig';
import moment from 'moment';

export function getPurchases() {
    return axios.get(MEDPHARMAVN_API + 'purchases');
}

export function editPurchase(payload) {
    return axios.put(MEDPHARMAVN_API + 'purchases/' + payload.id, payload);
}

export function createPurchase(payload) {
    return axios.post(MEDPHARMAVN_API + 'purchases', payload);
}

export function deletePurchase(id) {
    return axios.delete(MEDPHARMAVN_API + 'purchases/' + id);
}

export function getTrackingInfo(zaslatId) {
    return axios.post(MEDPHARMAVN_API + 'zaslat/shipments/tracking', zaslatId);
}

export function getAllProductsCustomTimeRange(from, to) {
    return axios.get(MEDPHARMAVN_API + 'charts/products?from=' + from + '&to=' + to);
}

export function exportCashOrders(from, to, customer) {

    let momentFrom = moment(from);
    let momentTo = moment(to);

    let payload = {
        fromDay: momentFrom.date(),
        fromMonth: momentFrom.month() + 1,
        fromYear: momentFrom.year(),
        toDay: momentTo.date(),
        toMonth: momentTo.month() + 1,
        toYear: momentTo.year(),
        firstName: customer.firstName,
        lastName: customer.lastName,
        street: customer.streetName,
        city: customer.city,
        zip: customer.zip,
        streetNumber: customer.streetNumber,
        phone: customer.phone
    }
    return axios.post(MEDPHARMAVN_API + 'scripts/exportNoVs', payload);
}

export function exportOrders(from, to) {

    let payload = {
        fromDay: from.date(),
        fromMonth: from.month() + 1,
        fromYear: from.year(),
        toDay: to.date(),
        toMonth: to.month() + 1,
        toYear: to.year(),
    }
    return axios.post(MEDPHARMAVN_API + 'scripts/export', payload);
}

export function expireOrder(variableSymbols) {
    return axios.post(MEDPHARMAVN_API + 'scripts/expire', variableSymbols);
}

export function exportOrderByVS(variableSymbol) {
    return axios.get(MEDPHARMAVN_API + 'scripts/vs/' + variableSymbol);
}

export function gmailGetEmails() {
    return axios.get(MEDPHARMAVN_API + 'gmail/emails')
}

export function gmailValidateToken(token) {
    return axios.get(MEDPHARMAVN_API + 'gmail/token?code=' + token)
}

export function gmailIsLogged() {
    return axios.get(MEDPHARMAVN_API + 'gmail/is_logged')
}

export function gmailAuth() {
    return axios.get(MEDPHARMAVN_API + 'gmail/auth')
}

export function getNotPaidOrders() {
    return axios.get(MEDPHARMAVN_API + 'orders/notpaid')
}

export function getProductsDaily(from, to) {
    return axios.get(MEDPHARMAVN_API + 'charts/products/daily?from=' + from + '&to=' + to)
}

export function getProductsMonthly() {
    return axios.get(MEDPHARMAVN_API + 'charts/products/monthly')
}

export function getOrderedOrdersDaily(from, to) {
    return axios.get(MEDPHARMAVN_API + 'orders/ordered/filter/daily?from=' + from + '&to=' + to)
}

export function getOrderedOrdersMonthly() {
    return axios.get(MEDPHARMAVN_API + 'orders/ordered/filter/monthly')
}

export function getPaidOrdersMonthly() {
    return axios.get(MEDPHARMAVN_API + 'orders/paid/filter/month')
}

export function getCostsMonthly() {
    return axios.get(MEDPHARMAVN_API + 'costs/filter/month')
}

/**
 *
 * @param {Number} month
 * @param {Number} year
 */
export function getWarehouseProducts(month, year) {
    if (!month) {
        month = moment().month() + 1;
    }

    if (!year) {
        year = moment().year();
    }

    return axios.get(MEDPHARMAVN_API + 'warehouse/v2?month=' + month + '&year=' + year)
}

export function createProduct(product) {
    return axios.post(MEDPHARMAVN_API + 'products', product)
}

export function editProduct(product) {
    return axios.put(MEDPHARMAVN_API + 'products/v2/' + product.id, product)
}

export function deleteProduct(id) {
    return axios.delete(MEDPHARMAVN_API + 'products/v2/' + id)
}

export function editWarehouseProduct(id, payload) {
    return axios.put(MEDPHARMAVN_API + 'warehouse/products/' + id, payload)
}

/**
 *
 * @param {Number} costId
 */
export function deleteCost(costId) {
    return axios.delete(MEDPHARMAVN_API + 'costs/' + costId)
}

/**
 *
 * @param {Object} cost
 */
export function createCost(cost) {
    return axios.post(MEDPHARMAVN_API + 'costs', cost)
}

/**
 *
 * @param {Object} cost
 */
export function editCost(cost) {
    return axios.put(MEDPHARMAVN_API + 'costs/' + cost.id, cost)
}

/**
 * Export data to excel
 * @param {Array} data
 * @param {string} fileName
 * @param {string} sheetName
 */
export function exportDataToExcel(data, fileName, sheetName) {
    return axios.post(MEDPHARMAVN_API + 'export/' + fileName + '/' + sheetName, data, { responseType: 'blob' })
}

/**
 * Send authentication payload
 * @param {object} payload
 */
export function sendAuthenticationData(payload) {
    return axios.post(MEDPHARMAVN_API + 'authenticate', payload);
}

/**
 * Validate localStorage token
 */
export function validateToken() {
    // limit 1 -> its enough to know if token is valid
    return getCurrentYearOrders(1, null)
}

/**
 *
 * @param {object} order
 */
export function updateOrder(order, user) {
    return axios.put(MEDPHARMAVN_API + 'orders/' + order.id + '?username=' + user, order)
}

/**
 *
 * @param {int} id
 */
export function getOrder(id) {
    return axios.get(MEDPHARMAVN_API + 'orders/' + id)
}

/**
 *
 * @param {object} payload
 */
export function printLabels(payload) {
    return axios.post(MEDPHARMAVN_API + 'zaslat/shipments/label', payload)
}

export function deleteOrder(id) {
    return axios.delete(MEDPHARMAVN_API + 'orders/' + id)
}

/**
 * Get the senders for Zaslat
 */
export function getSenders() {
    return axios.get(MEDPHARMAVN_API + 'config/senders')
}

/**
 *
 * @param {object} payload
 */
export function orderDelivery(payload) {
    return axios.post(MEDPHARMAVN_API + 'zaslat/shipments/create', payload)
}

/**
 * Get all costs
 */
export function getCosts() {
    return axios.get(MEDPHARMAVN_API + 'costs')
}

/**
 *
 * @param {object} cost
 */
export function addCost(cost) {
    return axios.post(MEDPHARMAVN_API + 'costs', cost)
}

// ----------------------------------------------------------------------------------------

export function getInvoice(orderId) {
    return axios.get(MEDPHARMAVN_API + "pdf/orders/" + orderId)
}

export function getAllZaslatOrders() {
    return axios.get(MEDPHARMAVN_API + 'zaslat/orders/list')
}

export function getHighestVS() {
    return axios.get(MEDPHARMAVN_API + "orders/vs/next")
}

export function verifyLock(orderId, user) {
    return axios.get(MEDPHARMAVN_API + 'orders/' + orderId + '/lock?username=' + user)
}

export function lockOrder(orderId, user, seconds) {
    if (!seconds) {
        seconds = DEFAULT_ORDER_LOCK_SECONDS
    }

    return axios.put(MEDPHARMAVN_API + 'orders/' + orderId + '/lock?username=' + user + "&seconds=" + seconds)
}

export function unlockOrder(orderId, user) {
    return axios.put(MEDPHARMAVN_API + 'orders/' + orderId + '/unlock?username=' + user)
}

export function saveOrder(order, user) {
    return axios.put(MEDPHARMAVN_API + 'orders/' + order.id + '?username=' + user, order)
}

export function createOrder(order, user) {
    return axios.post(MEDPHARMAVN_API + 'orders?username=' + user, order)
}

export function getProducts() {
    return axios.get(MEDPHARMAVN_API + 'products/v2')
}

export function getAllOrders() {
    return axios.get(MEDPHARMAVN_API + 'orders'
    )
}

export function getOrders(from, to) {
    let query = "";
    if (from && to) {
        query = "?from=" + from + '&to=' + to;
    }

    return axios.get(MEDPHARMAVN_API +
        'orders' + query
    )
}

export function getCurrentYearOrders(limit, sinceId) {
    var from = moment().utc().startOf('year').toISOString()
    var to = moment().utc().endOf('year').toISOString()

    if (!limit) {
        return axios.get(MEDPHARMAVN_API +
            'orders?from=' +
            from +
            '&to=' +
            to
        )
    }

    if (sinceId) {
        return axios.get(MEDPHARMAVN_API +
            'orders?from=' +
            from +
            '&to=' +
            to +
            '&limit=' + limit +
            '&sinceId=' + sinceId)

    }
    else {
        return axios.get(MEDPHARMAVN_API +
            'orders?from=' +
            from +
            '&to=' +
            to +
            '&limit=' + limit)
    }
}

// /orders?from=December 31, 2017 23:59:59&to=December%2031,%202018%2023:59:59&limit=100

export function getBankTransactions(from) {
    if (!from) {
        from = moment().subtract(1, 'month').format('YYYY-MM-DD')
    }
    return axios.get(MEDPHARMAVN_API + 'bank/transactions?from=' + from)
}

export function getWarehouseNotifications() {
    return axios.get(MEDPHARMAVN_API + "warehouseNotifications")
}

export function getNotPaidNotificationsNotifications() {
    return axios.get(MEDPHARMAVN_API + "notPaidNotifications")
}