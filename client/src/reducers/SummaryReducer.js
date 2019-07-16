const initialState = {
    productsDaily: { success: true },
    productsMonthly: { success: true },
    paidOrders: { success: true },
    orderedOrders: { success: true },
    orderedOrdersDaily: { success: true },
    costs: { success: true },
    productsCustom: { success: true }
}

const SummaryReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'GET_PRODUCTS_MONTHLY':
            return Object.assign({}, state, { productsMonthly: action.payload })
        case 'GET_PRODUCTS_DAILY':
            if (action.payload.success) {
                let temp = action.payload.data.slice()
                temp.map(x => {
                    x.products = x.products.filter(y => y)
                    return x;
                })
                action.payload.data = temp
            }
            return Object.assign({}, state, { productsDaily: action.payload })
        case 'GET_PAID_ORDERS_MONTHLY':
            return Object.assign({}, state, { paidOrders: action.payload })
        case 'GET_ORDERED_ORDERS_MONTHLY':
            return Object.assign({}, state, { orderedOrders: action.payload })
        case 'GET_COSTS_MONTHLY':
            return Object.assign({}, state, { costs: action.payload })
        case 'GET_ORDERED_ORDERS_DAILY':
            return Object.assign({}, state, { orderedOrdersDaily: action.payload })
        case 'GET_PRODUCTS_CUSTOM_TIME_RANGE':
            return Object.assign({}, state, { productsCustom: action.payload })
        default:
            return state;
    }
}

export default SummaryReducer;