const ordersPageInitialState = {
    orders: { success: true },
    ordersDetails: { success: true },
    warehouseNotifications: { success: true },
    notPaidNotifications: { success: true },
    isLoadingDone: false,
    orderToEdit: {},
    notPaidOrders: { success: true }
}

const OrdersReducer = (state = ordersPageInitialState, action) => {
    switch (action.type) {
        // case 'UPDATE_ORDER':
        //     let temp = Object.assign({}, state.orders.data)
        //     if (action.payload.success && action.payload.data) {
        //         let index = temp.findIndex(x => x.id === action.payload.data.id)
        //         if (index >= 0) {
        //             temp[index] = action.payload.data
        //         }
        //     }

        //     return Object.assign({}, state, { orders: { success: state.orderToEdit.success, data: temp } })
        case 'GET_NOT_PAID_ORDERS':
            return Object.assign({}, state, { notPaidOrders: action.payload })
        case 'GET_ORDER':
            let temp = Object.assign({}, state.orders)

            if (temp.data && action.payload.success && action.payload.data) {
                let index = temp.data.findIndex(x => x.id === action.payload.data.id)

                temp.data[index] = action.payload.data
            }

            return Object.assign({}, state, { orders: temp })
        case 'DELETE_ORDER':
            temp = Object.assign({}, state.orders)

            if (temp.data && action.payload.success && action.payload.id) {
                let index = temp.data.findIndex(x => x.id === action.payload.id)

                temp.data.splice(index, 1)
            }

            return Object.assign({}, state, { orders: temp })
        case 'GET_ORDERS':
            return Object.assign({}, state, { orders: action.payload })
        case 'OPEN_ORDER_DETAILS':
            return Object.assign({}, state, { ordersDetails: action.payload })
        case 'GET_WAREHOUSE_NOTIFICATIONS':
            return Object.assign({}, state, { warehouseNotifications: action.payload })
        case 'GET_NOT_PAID_NOTIFICATIONS':
            return Object.assign({}, state, { notPaidNotifications: action.payload })
        case 'GET_MORE_ORDERS':
            temp = Object.assign([], state.orders)
            if (action.payload.success) {

                if (temp.data) {
                    temp.data = temp.data.concat(action.payload.data)
                }
                else {
                    temp.data = action.payload.data
                }
            }
            return Object.assign({}, state, { orders: temp })
        default:
            return state;
    }
}

export default OrdersReducer;