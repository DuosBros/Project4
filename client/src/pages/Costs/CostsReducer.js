import moment from 'moment';

const initialState = {
    costs: { success: true },
    costCategories: []
}

const CostsReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'GET_COSTS':
            let categories = [];
            if (action.payload.data && action.payload.success) {
                categories = [...new Set(action.payload.data.map(item => item.category).filter(x => x))];
                action.payload.data.forEach(x => {
                    x.cost = x.cost ? x.cost : 0
                    x.monthAndYear = moment(x.date).local().format('MM.YYYY')
                    x.dateFormated = moment(x.date).local().format('DD.MM.YYYY')
                })
            }

            return Object.assign({}, state, { costs: action.payload, costCategories: categories })
        case 'ADD_COST':
            action.payload.monthAndYear = moment(action.payload.date).local().format('MM.YYYY')
            action.payload.dateFormated = moment(action.payload.date).local().format('DD.MM.YYYY')

            let temp = Object.assign({}, state.costs)
            temp.data = temp.data.slice()
            temp.data.unshift(action.payload)

            categories = state.costCategories;

            if (!state.costCategories.includes(action.payload.category)) {
                categories = state.costCategories.slice()
                categories.push(action.payload.category)
            }

            return {
                ...state,
                costs: temp, costCategories: categories
            }
        case 'EDIT_COST':
            let costs = state.costs.data.slice()
            let index = costs.findIndex(x => x.id === action.payload.id)

            categories = state.costCategories;

            if (index >= 0) {
                action.payload.monthAndYear = moment(action.payload.date).format('MM.YYYY');
                action.payload.dateFormated = moment(action.payload.date).format('DD.MM.YYYY');
                costs[index] = action.payload;

                if (!state.costCategories.includes(action.payload.category)) {
                    categories = state.costCategories.slice()
                    categories.push(action.payload.category)
                }
            }

            return Object.assign({}, state, { costs: { success: state.costs.success, data: costs }, costCategories: categories });
        case 'DELETE_COST':
            costs = state.costs.data.slice()
            index = costs.findIndex(x => x.id === action.payload)

            if (index >= 0) {
                costs.splice(index, 1)
            }

            return Object.assign({}, state, { costs: { success: state.costs.success, data: costs } })
        default:
            return state;
    }
}

export default CostsReducer;