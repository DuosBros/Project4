const initialState = {
    purchases: { success: true },
}

const PurchasesReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'GET_PURCHASES':
            if (action.payload.success && Array.isArray(action.payload.data)) {
                action.payload.data = action.payload.data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            }
            return Object.assign({}, state, { purchases: action.payload })
        case 'EDIT_PURCHASE':
            debugger
            let purchases = state.purchases.data.slice();
            if (action.payload.success) {
                let index = purchases.findIndex(x => x.id === action.payload.data.id);

                purchases[index] = action.payload.data;
            }


            purchases = purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            return Object.assign({}, state, { purchases: { success: action.payload.success, data: purchases } })
        case 'CREATE_PURCHASE':
            purchases = state.purchases.data.slice();
            if (action.payload.success) {
                purchases.push(action.payload.data)
            }
            debugger
            purchases = purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            return Object.assign({}, state, { purchases: { success: action.payload.success, data: purchases } })
        case 'DELETE_PURCHASE':

            if (action.payload.success) {
                purchases = state.purchases.data.filter(x => x.id !== action.payload.data)
            }

            return Object.assign({}, state, { purchases: { success: action.payload.success, data: purchases } })
        default:
            return state;
    }
}

export default PurchasesReducer;