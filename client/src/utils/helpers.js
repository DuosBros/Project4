import { LOCALSTORAGE_NAME, successColor, warningColor, errorColor, notActiveColor } from "../appConfig";
import axios from 'axios';
import moment from "moment";
import React from 'react';

export const getMedian = (array, prop) => {

    let sorted, median;
    if (prop) {
        sorted = array.sort((a, b) => {
            return a[prop] - b[prop]
        })
    }
    else {
        sorted = array.sort()
    }

    var half = Math.floor(sorted.length / 2);

    if (sorted.length % 2) {
        if (prop) {
            median = sorted[half][prop];
        }
        else {
            median = sorted[half].ordersCount;
        }
    }
    else {
        if (prop) {
            median = (sorted[half - 1][prop] + sorted[half][prop]) / 2.0;
        }
        else {
            median = (sorted[half - 1] + sorted[half]) / 2.0;
        }
    }

    return median;
}

export const getNonBillableProducts = (products) => {
    return products.filter(x => x.category !== 'Nonbillable')
}

export const groupBy = (items, key) => items.reduce(
    (result, item) => ({
        ...result,
        [item[key]]: [
            ...(result[item[key]] || []),
            item,
        ],
    }),
    {},
);

export const mapDataForGenericChart = (data, key, filter, filterZeroCount) => {
    var grouped = groupBy(data, key);
    var keys = Object.keys(grouped);

    if (filter) {
        if (key === Object.keys(filter)[0]) {
            keys = keys.filter(y => y.search(filter[Object.keys(filter)[0]], "i") >= 0)
        }
    }
    var mapped = keys.map(x => {
        var count = grouped[x].length
        let result;
        if (filterZeroCount) {
            if (filter) {
                if (count !== 0 && grouped[x].filter(y =>
                    y[Object.keys(filter)[0]].toString().search(filter[Object.keys(filter)[0]], "i") >= 0)) {
                    result = ({
                        name: x && x !== "null" ? x : "Unknown",
                        count: grouped[x].filter(y =>
                            y[Object.keys(filter)[0]].toString().search(filter[Object.keys(filter)[0]], "i") >= 0).length
                    })
                }
            }
            else {
                if (count !== 0) {
                    result = ({
                        name: x && x !== "null" ? x : "Unknown",
                        count: count
                    })
                }
            }

        }
        else {
            result = ({
                name: x && x !== "null" ? x : "Unknown",
                count: filter ? grouped[x].filter(y =>
                    y[Object.keys(filter)[0]].toString().search(filter[Object.keys(filter)[0]], "i") >= 0).length : count
            })
        }

        return result;
    })

    return mapped.filter(x => x).sort((a, b) => b.count - a.count)
}


export const mapOrderToExcelExport = (data) => {
    let maxProductCount = 0;
    for (let i = 0; i < data.length; i++) {
        if (maxProductCount < data[i].products.length) {
            maxProductCount = data[i].products.length;
        }
    }

    let formattedOrders = [];

    for (let i = 0; i < data.length; i++) {
        let formattedOrder = {};
        formattedOrder.firstName = data[i].address.firstName;
        formattedOrder.lastName = data[i].address.lastName;
        formattedOrder.phone = data[i].address.phone;
        formattedOrder.street = data[i].address.street;
        formattedOrder.city = data[i].address.city;
        formattedOrder.streetNumber = data[i].address.streetNumber;
        formattedOrder.zip = data[i].address.psc;
        formattedOrder.company = data[i].address.company;
        formattedOrder.totalPrice = data[i].totalPrice;
        formattedOrder.orderDate = moment(data[i].payment.orderDate).local().format("DD.MM.YYYY");
        formattedOrder.paymentDate = data[i].payment.paymentDate ? moment(data[i].payment.paymentDate).local().format("DD.MM.YYYY") : "Not paid";

        for (let j = 0; j < maxProductCount; j++) {
            formattedOrder['product' + (j + 1)] = '';
            formattedOrder['product' + (j + 1) + ' count'] = '';
        }
        for (let j = 0; j < data[i].products.length; j++) {
            formattedOrder['product' + (j + 1)] = data[i].products[j].productName;
            formattedOrder['product' + (j + 1) + ' count'] = data[i].products[j].count;
        }

        formattedOrders.push(formattedOrder);
    }

    return formattedOrders;
}

export const optionsDropdownMapper = (e, i) => ({ key: i, text: e, value: i });

export const flattenObject = (ob) => {
    var toReturn = {};

    for (var i in ob) {
        if (!ob.hasOwnProperty(i)) continue;

        if ((typeof ob[i]) == 'object' && ob[i] != null) {
            var flatObject = flattenObject(ob[i]);
            for (var x in flatObject) {
                if (!flatObject.hasOwnProperty(x)) continue;

                toReturn[i + '.' + x] = flatObject[x];
            }
        } else {
            toReturn[i] = ob[i];
        }
    }
    return toReturn;
}

export const sortMonthYear = (array, isDesc) => {
    array.sort(function (a, b) {
        a = a.monthAndYear ? a.monthAndYear.split(".") : a.date.split(".");
        b = b.monthAndYear ? b.monthAndYear.split(".") : b.date.split(".");
        if (isDesc) {
            return new Date(b[1], b[0], 1) - new Date(a[1], a[0], 1)
        }
        else {
            return new Date(a[1], a[0], 1) - new Date(b[1], b[0], 1)
        }
    })

    return array;
}

/**
 *
 * @param {boolean} isAuthenticated
 * @param {string} token
 */
export const handleLocalStorageToken = (isAuthenticated, token) => {

    if (isAuthenticated) {
        let localStorageToken = localStorage.getItem(LOCALSTORAGE_NAME)
        if (!localStorageToken && token) {
            localStorage.setItem(LOCALSTORAGE_NAME, token)
            axios.defaults.headers.common['x-access-token'] = token;
        }

        return;
    }

    // if authentication is not successful
    if (!token) localStorage.removeItem(LOCALSTORAGE_NAME)
}

/**
 *
 * @param {functionCall} fn
 * @param {number} time
 */
export const debounce = (fn, time) => {
    let timeout;

    return function () {
        const functionCall = () => fn.apply(this, arguments);

        clearTimeout(timeout);
        timeout = setTimeout(functionCall, time);
    }
}

/**
 *
 * @param {string} timestamp in ISO
 */
export const verifyOrderTimestamp = (timestamp) => {
    if (!timestamp) return false

    return moment(timestamp).isAfter(moment())
}

/**
 *
 * @param {object} parentProps
 * @param {object} error
 * @param {string} currentUser
 */
export const handleVerifyLockError = (parentProps, error, currentUser) => {
    if (error.response && error.response.data && error.response.data.message.lockedBy !== currentUser) {
        parentProps.showGenericModalAction({
            modalContent: (
                <span>
                    This order is locked by <strong>{error.response.data.message.lockedBy}</strong>!
                    </span>
            ),
            modalHeader: "Locked order",
            redirectTo: '/orders',
            parentProps: parentProps
        })

    }
    else {
        parentProps.showGenericModalAction({
            modalContent: (
                <span>
                    Details:
        </span>
            ),
            redirectTo: '/orders',
            parentProps: parentProps,
            err: error
        })
    }
}

/**
 *
 * @param {string} sourceString
 * @param {string} pattern
 */
export const contains = (sourceString, pattern) => {
    return sourceString.toString().search(new RegExp(pattern, "i")) >= 0
}

export const isISOString = (string) => {
    return /^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/.test(string)
}
/*
 * "keys" (optional) Specifies which properties of objects should be inspected.
 *                   If omitted, all properties will be inspected.
 */
export const filterInArrayOfObjects = (filter, array, keys, recurse) => {
    return array.filter(element => {
        let objk = keys ? keys : Object.keys(element);
        for (let key of objk) {
            let elementToTest = element[key]
            if (recurse && Array.isArray(elementToTest)) {
                let recurseRes = filterInArrayOfObjects(filter, elementToTest, null, true)
                if (recurseRes.length > 0) {
                    return true;
                }
            }
            if (isISOString(elementToTest)) {
                elementToTest = moment(elementToTest).local().format("DD.MM.YYYY HH:mm:ss");
            }
            if (elementToTest !== undefined &&
                elementToTest != null &&
                filter(elementToTest)
            ) { // fuken lodash returning isEmpty true for numbers
                return true;
            }
        }
        return false;
    });
}

export const buildFilter = (needle) => {
    if (needle.length > 0 && needle.substr(0, 1) === "~") {
        if (needle.length === 1) {
            return null;
        }
        let re = new RegExp(needle.substr(1), "i");
        return heystack => heystack.toString().search(re) >= 0;
    }
    let n = needle.trim().toLowerCase();
    if (n.length === 0) {
        return null;
    }
    return heystack => heystack.toString().toLowerCase().indexOf(n) >= 0;
}

/**
 *
 * @param {object} order
 */
export const getOrderTableRowStyle = (order) => {
    var backgroundColor;

    if (!order) {
        return null
    }

    if (order.state !== "active") {
        return { backgroundColor: notActiveColor }
    }

    if (order.payment.paid) {
        backgroundColor = successColor
    }
    else if (order.zaslatDate && !order.payment.paid) {
        backgroundColor = warningColor
    }
    else if (!order.zaslatDate && order.state === "active") {
        backgroundColor = errorColor
    }
    else {
        backgroundColor = notActiveColor
    }

    return { backgroundColor: backgroundColor }
}

/**
 * @param {number} weight
 */
export const getGLSDeliveryPrice = (weight, cashOnDelivery) => {
    if (!weight)
        return 0
    // weight of the box
    weight += 500
    if (cashOnDelivery) { // cashOnDelivery is false

        if (weight < 3000)
            return 116
        if (weight < 5000)
            return 121
        if (weight < 6000)
            return 133
        if (weight < 11000)
            return 146
    }
    else {
        if (weight < 3000)
            return 90
        if (weight < 5000)
            return 94
        if (weight < 6000)
            return 106
        if (weight < 11000)
            return 120
    }
}

const REGEX_DIGITS = /^\d+$/;
/**
 *
 * @param {*} value
 */
export const isNum = (value) => {
    if (value == null || value === undefined) {
        return false;
    }
    const valueString = value.toString();

    const length = valueString.length;
    var isNum = REGEX_DIGITS.test(valueString);

    if (length > 0 && isNum) {
        return true;
    }
    else {
        return false;
    }
}

/**
 *
 * @param {Array} array
 * @param {Array} keys
 */
export const pick = (array, keys) => {
    return array.map(x => {
        return keys.map(k => k in x ? { [k]: x[k] } : {})
            .reduce((res, o) => Object.assign(res, o), {})
    })
}
