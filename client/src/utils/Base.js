import React from 'react';
import { Route, Switch, BrowserRouter, Redirect, withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import axios from 'axios';

import { Message, Icon, Image } from 'semantic-ui-react'

import Header from './Header';
import Login from '../pages/Login/Login';
import Orders from '../pages/Orders/Orders';

import { authenticateAction, authenticationInProgressAction, authenticateSucceededAction } from './actions';
import { LOCALSTORAGE_NAME } from '../appConfig'

import OrderInfo from '../pages/Orders/OrderInfo';
import { validateToken } from './requests';
import ErrorBoundary from '../components/ErrorBoundary';
import logo from '../assets/logo.png';
import GenericModal from '../components/GenericModal';
import Costs from '../pages/Costs/Costs';
import ScrollToTop from './ScrollToTop';
import WarehouseContainer from '../containers/WarehouseContainer';
import BankContainer from '../containers/BankContainer';
import SummaryContainer from '../containers/SummaryContainer';
import numeral from 'numeral';
// eslint-disable-next-line
import cs from 'numeral/locales/cs';
import GmailContainer from '../containers/GmailContainer';
import NotFound from '../pages/NotFound';
import ScriptsContainer from '../containers/ScriptsContainer';
import PurchasesContainer from '../containers/PurchasesContainer';

class Base extends React.Component {

    constructor(props) {
        super(props)

        axios.defaults.headers.post['Content-Type'] = 'application/json';

        axios.defaults.headers.common['x-access-token'] = localStorage.getItem(LOCALSTORAGE_NAME) ? localStorage.getItem(LOCALSTORAGE_NAME) : '';

        axios.interceptors.response.use(
            (response) => { return response; },
            (error) => {
                // handle error
                if (error.response && error.response.data &&
                    (error.response.data.message.name === "TokenExpiredError" || error.response.data.message === "No authentication token!")) {
                    props.authenticateSucceededAction(false);
                    props.history.push('/login');
                }

                throw error;
            });

        numeral.locale('cs');

        window.addEventListener('resize', this.handleWindowSizeChange);

        this.state = {
            width: window.innerWidth
        }

        props.authenticationInProgressAction(true);

        validateToken()
            .then(() => {
                props.authenticateSucceededAction(true);
            })
            .catch(() => {
                props.authenticateSucceededAction(false);
                props.history.push('/login')
            })
            .finally(() => {
                props.authenticationInProgressAction(false);
            })
    }

    handleWindowSizeChange = () => {
        this.setState({ width: window.innerWidth });
    };

    render() {
        const { width } = this.state;
        var isMobile = width <= 766;

        // still authenticating
        if (this.props.loginStore.authenticationInProgress) {
            return (
                <div className="messageBox">
                    <Message positive icon >
                        <Icon name='circle notched' loading />
                        <Message.Content content={
                            <Message.Header>Authentication</Message.Header>
                        }>
                        </Message.Content>
                        {isMobile ? null : <Image size='tiny' src={logo} />}
                    </Message>
                </div>
            );
        }

        // if authentication fails
        if (!(this.props.loginStore.authenticationInProgress || this.props.loginStore.authenticationSucceeded)) {
            return (<Login isMobile={isMobile} ex={{ authExceptionMessage: "Please login again" }} />);
        }

        var body, switchBody;

        switchBody = (
            <ErrorBoundary>
                <Switch>
                    <Redirect exact from='/' to='/orders' />
                    <Route path='/login' render={(props) => <Login {...props} isMobile={isMobile} />} />
                    <Route path='/orders/new' render={(props) => <OrderInfo {...props} isMobile={isMobile} />} />
                    <Route path='/orders/:id' render={(props) => <OrderInfo {...props} key={props.match.params.id} isMobile={isMobile} />} />
                    <Route exact path='/orders' render={(props) => <Orders {...props} isMobile={isMobile} />} />
                    <Route exact path='/bank' render={(props) => <BankContainer {...props} isMobile={isMobile} />} />
                    <Route exact path='/costs' render={(props) => <Costs {...props} isMobile={isMobile} />} />
                    <Route exact path='/warehouse' render={(props) => <WarehouseContainer {...props} isMobile={isMobile} />} />
                    <Route exact path='/summary' render={(props) => <SummaryContainer {...props} isMobile={isMobile} />} />
                    <Route exact path='/gmail' render={(props) => <GmailContainer {...props} isMobile={isMobile} />} />
                    <Route exact path='/scripts' render={(props) => <ScriptsContainer {...props} isMobile={isMobile} />} />
                    <Route exact path='/purchases' render={(props) => <PurchasesContainer {...props} isMobile={isMobile} />} />
                    <Route component={NotFound} />
                </Switch>
            </ErrorBoundary>
        )

        if (isMobile) {
            body = (
                <div style={{ paddingTop: '0.5em', paddingBottom: '0.5em' }}>
                    {switchBody}
                </div>
            )
        }
        else {
            body = (
                <div style={{ paddingTop: '2em', marginLeft: '1em', marginRight: '1em', marginBottom: '0.5em' }}>
                    {switchBody}
                </div>
            )
        }
        return (
            <BrowserRouter>
                <ScrollToTop>
                    <Route
                        path='/:entityType?/:entityId?'
                        render={(props) => <Header {...props} isMobile={isMobile} />}
                    />
                    {
                        this.props.baseStore.showGenericModal &&
                        <GenericModal
                            show={this.props.baseStore.showGenericModal}
                            header={this.props.baseStore.modal.header}
                            content={this.props.baseStore.modal.modalContent}
                            redirectTo={this.props.baseStore.modal.redirectTo}
                            parentProps={this.props.baseStore.modal.parentProps}
                            err={this.props.baseStore.modal.err} />
                    }

                    {body}
                </ScrollToTop>
            </BrowserRouter >
        )
    }
}

function mapStateToProps(state) {
    return {
        baseStore: state.BaseReducer,
        loginStore: state.LoginReducer
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        authenticateAction,
        authenticationInProgressAction,
        authenticateSucceededAction
    }, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Base));