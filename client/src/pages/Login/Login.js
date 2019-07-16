import React from 'react';
import { Button, Form, Grid, Image, Message, Segment } from 'semantic-ui-react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import logo from '../../assets/logo.png';
import { authenticateAction, authenticateSucceededAction, authenticationInProgressAction } from '../../utils/actions'
import { sendAuthenticationData } from '../../utils/requests'

class Login extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            username: "",
            password: "",
            authExceptionMessage: this.props.ex ? this.props.ex.authExceptionMessage : "",
            isMobile: this.props.isMobile,
            backgroundColor: '#336699'
        }
    }

    componentDidMount() {
        if (this.props.loginStore.authenticationSucceeded && !this.props.loginStore.authenticationInProgress) {
            this.props.history.push('/orders')
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.isMobile !== this.props.isMobile) {
            this.setState({ isMobile: this.props.isMobile });
        }
    }

    handleChange = (e, { name, value }) => {
        this.setState({ [name]: value })
    }

    auth = () => {
        this.props.authenticationInProgressAction(true);

        var payload = {
            username: this.state.username,
            password: this.state.password
        }

        sendAuthenticationData(payload)
            .then(res => {
                this.props.authenticateAction(res.data)
                this.props.authenticateSucceededAction(true);

                this.props.history.push('/orders')
            })
            .catch((err) => {
                if (err.response) {
                    if (err.response.status >= 400 && err.response.status < 500) {
                        this.setState({ authExceptionMessage: 'Wrong username or password' })
                    }
                    else {
                        this.setState({ authExceptionMessage: JSON.stringify(err) })
                    }
                }

                this.props.authenticateSucceededAction(false);
            })
            .finally(() => {
                this.props.authenticationInProgressAction(false);
            })
    }

    render() {

        let isMobile = this.props.isMobile
        var errorMessage = null

        if (this.state.authExceptionMessage) {
            errorMessage = (
                <Message error floating>
                    Failed to log in:
                    <br />
                    {this.state.authExceptionMessage}
                </Message>
            )
        }

        return (
            <Grid textAlign='center' style={{ height: '100%' }} verticalAlign='middle' columns={this.state.isMobile ? 1 : 2}>
                <Grid.Column>
                    {errorMessage}
                    <Image verticalAlign='middle' size={isMobile ? 'medium' : 'large'} src={logo} />
                    <Form loading={this.props.loginStore.authenticationInProgress} size='large'>
                        <Segment raised stacked>
                            <Form.Input
                                fluid
                                icon='user'
                                iconPosition='left'
                                placeholder='Username'
                                name='username'
                                onChange={this.handleChange} />
                            <Form.Input
                                fluid
                                icon='lock'
                                iconPosition='left'
                                placeholder='Password'
                                type='password'
                                name='password'
                                onChange={this.handleChange} />
                            <Button
                                onClick={() => this.auth()}
                                className="primaryButton"
                                fluid
                                size='large'
                                content='Login' />
                        </Segment>
                    </Form>
                </Grid.Column>
            </Grid >
        )
    }
}

function mapStateToProps(state) {
    return {
        loginStore: state.LoginReducer
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        authenticateAction,
        authenticateSucceededAction,
        authenticationInProgressAction
    }, dispatch);
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Login));