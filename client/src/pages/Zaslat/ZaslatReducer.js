const initialState = {
    zaslatOrders: { success: true },
    senders: { success: true },
    trackingInfo: { success: true },
}

const ZaslatReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'GET_ZASLAT_ORDERS':
            return Object.assign({}, state, { zaslatOrders: action.payload })
        case 'GET_SENDERS':
            return Object.assign({}, state, { senders: action.payload })
        case 'GET_TRACKING':
            return Object.assign({}, state, { trackingInfo: action.payload })
        default:
            return state;
    }
}

export default ZaslatReducer;