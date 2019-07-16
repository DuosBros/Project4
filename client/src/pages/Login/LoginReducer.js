import { handleLocalStorageToken } from '../../utils/helpers';

const initialState = {
    currentUser: {},
    authenticationInProgress: true,
    authenticationSucceeded: false
}

const LoginReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'AUTHENTICATE':
            return Object.assign({}, state, { currentUser: action.payload })
        case 'AUTHENTICATION_IN_PROGRESS':
            return Object.assign({}, state, { authenticationInProgress: action.payload })
        case 'AUTHENTICATION_SUCCEEDED':
            handleLocalStorageToken(action.payload, state.currentUser.token)
            return Object.assign({}, state, { authenticationSucceeded: action.payload })
        default:
            return state;
    }
}

export default LoginReducer;