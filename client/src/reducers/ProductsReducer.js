const initialState = {
    products: { success: true },
    productCategories: [],
    warehouseProducts: { success: true }
}

const ProductsReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'GET_PRODUCTS':
            let categories = [];
            if (action.payload.data && action.payload.success) {

                categories = [...new Set(action.payload.data.map(item => item.category))];
            }

            return Object.assign({}, state, { products: action.payload, productCategories: categories })
        case 'ADD_PRODUCT':

            let temp = Object.assign({}, state.products)
            temp.data = temp.data.slice()
            temp.data.unshift(action.payload)

            categories = state.productCategories;

            if (!state.productCategories.includes(action.payload.category)) {
                categories = state.productCategories.slice()
                categories.push(action.payload.category)
            }

            return {
                ...state,
                products: temp, productCategories: categories
            }
        case 'GET_WAREHOUSE_PRODUCTS':
            categories = [];
            if (action.payload.data && action.payload.success) {

                categories = [...new Set(action.payload.data.products.map(item => item.category))];
            }

            return Object.assign({}, state, {
                timeSpan: action.payload.data.timeSpan,
                warehouseProducts: { data: action.payload.data.products, success: true },
                productCategories: categories
            })
        case 'EDIT_PRODUCT':
            let products = state.products.data.slice()
            let index = products.findIndex(x => x.id === action.payload.id)

            if (index >= 0) {
                products[index] = action.payload
            }

            categories = state.productCategories;

            if (!state.productCategories.includes(action.payload.category)) {
                categories = state.productCategories.slice()
                categories.push(action.payload.category)
            }

            return Object.assign({}, state, { products: { success: state.products.success, data: products }, productCategories: categories });
        case 'DELETE_PRODUCT':
            products = state.products.data.slice()
            index = products.findIndex(x => x.id === action.payload)

            if (index >= 0) {
                products.splice(index, 1)
            }

            return Object.assign({}, state, { products: { success: state.products.success, data: products } })
        default:
            return state;
    }
}

export default ProductsReducer;