const initialState = {
    showGenericModal: false,
    modal: {}
}

const BaseReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'CLOSE_GENERIC_MODAL':
            return Object.assign({}, state, { showGenericModal: false })
        case 'SHOW_GENERIC_MODAL':
            return Object.assign({}, state, {
                showGenericModal: true,
                modal: action.payload
            })
        default:
            return state;
    }
}

export default BaseReducer;