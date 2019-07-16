import React from 'react';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Scripts from '../pages/Scripts';
import { exportCashOrders, exportOrders, exportOrderByVS, expireOrder } from '../utils/requests';

class ScriptsContainer extends React.Component {

    // return promise to await in presentation component for loading and other stuff
    handleExportCashOrders = (from, to, customerInfo) => {
        return exportCashOrders(from, to, customerInfo);
    }

    handleExportOrders = (from, to) => {
        return exportOrders(from, to);
    }

    handleExportByVs = (vs) => {
        return exportOrderByVS(vs);
    }

    handleExpireByVs = (vs) => {
        return expireOrder(vs);
    }

    render() {
        let pathname = this.props.location.pathname;

        if (pathname === "/scripts") {
            return (
                <Scripts
                    handleExportCashOrders={this.handleExportCashOrders}
                    handleExportOrders={this.handleExportOrders}
                    handleExportByVs={this.handleExportByVs}
                    handleExpireByVs={this.handleExpireByVs}
                />
            )
        }
    }
}

function mapStateToProps(state) {
    return {
        // gmailStore: state.GmailReducer,
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(ScriptsContainer);