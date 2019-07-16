import React from 'react';
import Gmail from '../pages/Gmail';
import { gmailAuth, gmailIsLogged, gmailGetEmails } from '../utils/requests';
import { gmailAuthAction, validateTokenAction, gmailGetEmailsAction } from '../utils/actions';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

class GmailContainer extends React.Component {
    state = {}

    async componentDidMount() {
        let res = await gmailIsLogged()
        if (res.data !== true) {
            gmailAuth()
                .then((res) => {
                    if (res.data) {
                        this.props.gmailAuthAction({ data: false, url: res.data })
                    }
                    else {
                        this.props.gmailAuthAction({ data: true, url: null })
                    }
                })
        }
        else {
            this.props.gmailAuthAction({ data: true, url: null })
            this.gmailGetEmailsAndHandleResult()
        }
    }

    gmailGetEmailsAndHandleResult = async () => {
        try {
            let res = await gmailGetEmails();
            this.props.gmailGetEmailsAction({ success: true, data: res.data })
        } catch (err) {
            this.props.gmailGetEmailsAction({ success: false, err: err })
        }
    }
    render() {
        let pathname = this.props.location.pathname;

        if (pathname === "/gmail") {
            return (
                <Gmail
                    isLogged={this.props.gmailStore.isLogged}
                    validateTokenAction={this.props.validateTokenAction}
                    emails={this.props.gmailStore.emails}
                    gmailGetEmailsAndHandleResult={this.gmailGetEmailsAndHandleResult} />
            )
        }
    }
}

function mapStateToProps(state) {
    return {
        gmailStore: state.GmailReducer,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        gmailAuthAction,
        validateTokenAction,
        gmailGetEmailsAction
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(GmailContainer);