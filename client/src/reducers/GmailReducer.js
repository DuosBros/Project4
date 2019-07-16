const initialState = {
    isLogged: { data: false, url: null },
    token: { isValid: false, token: null },
    emails: { success: true },
    nextPageToken: null
}

const GmailReducer = (state = initialState, action) => {
    switch (action.type) {
        case 'GMAIL_AUTH':
            return Object.assign({}, state, { isLogged: action.payload })
        case 'GMAIL_VALIDATE_TOKEN':
            return Object.assign({}, state, { token: action.payload })
        case 'GMAIL_GET_EMAILS':
            debugger
            let emails, nextPageToken;
            if (action.payload.data && action.payload.success) {
                emails = action.payload.data.emails;
                nextPageToken = action.payload.data.nextPageToken;
            }
            return Object.assign({}, state, { emails: { data: emails, success: action.payload.success }, nextPageToken: nextPageToken })
        default:
            return state;
    }
}

export default GmailReducer;