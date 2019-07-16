import React from 'react';
import { Menu, Segment, Icon } from 'semantic-ui-react'
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Link } from 'react-router-dom';

import { authenticateAction, authenticateSucceededAction, authenticationInProgressAction } from './actions';
import { LOCALSTORAGE_NAME } from '../appConfig';
import packageJson from '../../package.json'

class Header extends React.Component {
    constructor(props) {
        super(props)

        var currentPath = props.location.pathname.replace("/", "");

        this.state = {
            activeItem: currentPath,
            isMobile: this.props.isMobile,
            showMobileMenu: false
        }
    }

    componentDidUpdate(prevProps, prevState) {

        let activeItem = this.props.location.pathname.replace("/", "");

        if (prevState.activeItem !== activeItem) {

            this.setState({ activeItem });
        }

        if (prevProps.isMobile !== this.props.isMobile) {
            this.setState({ isMobile: this.props.isMobile });
        }
    }

    handleItemClick = (e, { name }) => {

        if (name === 'MedpharmaVN') {
            window.location.reload()
        }
        else {
            this.setState({ activeItem: name })
            this.props.history.push('/' + name);
        }

        if (this.state.showMobileMenu) {
            this.toggleMobileMenu()
        }
    }

    logout() {
        this.props.authenticateAction({});
        this.props.authenticateSucceededAction(false);
        this.props.authenticationInProgressAction(false);
        this.props.history.push('/login');
    }

    toggleMobileMenu = () => {
        this.setState({
            showMobileMenu: !this.state.showMobileMenu
        })
    }

    render() {

        const { activeItem, isMobile, showMobileMenu } = this.state

        let menu, menuItems, showMenuItems;

        // in case that the authentication failed and its done already
        if (!this.props.loginPageStore.authenticationSucceeded && this.props.loginPageStore.authenticationDone) {
            menuItems = (
                <Menu.Item name='MedpharmaVN' onClick={() => this.handleItemClick} />
            )
        }


        if (!showMobileMenu) {
            if (isMobile) {
                menuItems = (
                    <Menu.Item name='MedpharmaVN'>
                        Medpharma VN
                        <Icon name='content' style={{ position: 'absolute', right: '0px' }} onClick={this.toggleMobileMenu} />
                    </Menu.Item>
                )
            }
            else {
                showMenuItems = true
            }
        }
        else {
            showMenuItems = true
        }

        if (showMenuItems) {
            menuItems = (
                <>
                    <Menu.Item name='MedpharmaVN'>
                        Medpharma VN
                        {isMobile ? (<Icon name='content' style={{ position: 'absolute', right: '0px' }} onClick={this.toggleMobileMenu} />) : null}
                    </Menu.Item>
                    <Menu.Item
                        as={Link} to='/orders'
                        content='Orders'
                        name='orders'
                        active={activeItem === 'orders' || !activeItem}
                        onClick={this.handleItemClick} />
                    <Menu.Item
                        as={Link} to='/bank'
                        content='Bank'
                        name='bank'
                        active={activeItem === 'bank'}
                        onClick={this.handleItemClick} />
                    <Menu.Item
                        as={Link} to='/costs'
                        content='Costs'
                        name='costs'
                        active={activeItem === 'costs'}
                        onClick={this.handleItemClick} />
                    <Menu.Item
                        as={Link} to='/warehouse'
                        content='Warehouse'
                        name='warehouse'
                        active={activeItem === 'warehouse'}
                        onClick={this.handleItemClick} />
                    <Menu.Item
                        as={Link} to='/summary'
                        content='Summary'
                        name='summary'
                        active={activeItem === 'summary'}
                        onClick={this.handleItemClick} />
                    {/* <Menu.Item
                        as={Link} to='/gmail'
                        content='Gmail'
                        name='gmail'
                        active={activeItem === 'gmail'}
                        onClick={this.handleItemClick} /> */}
                    <Menu.Item
                        as={Link} to='/scripts'
                        content='Scripts'
                        name='scripts'
                        active={activeItem === 'scripts'}
                        onClick={this.handleItemClick} />
                    <Menu.Item
                        as={Link} to='/purchases'
                        content='Purchases'
                        name='purchases'
                        active={activeItem === 'purchases'}
                        onClick={this.handleItemClick} />
                    <Menu.Menu position='right'>
                        <Menu.Item>Version: {packageJson.version}</Menu.Item>
                        {!isMobile ? (<Menu.Item>{localStorage.getItem(LOCALSTORAGE_NAME) ? JSON.parse(atob(localStorage.getItem(LOCALSTORAGE_NAME).split('.')[1])).username : ""}</Menu.Item>) : null}
                        <Menu.Item
                            style={{ color: 'black' }}
                            className='logout'
                            name='logout'
                            onClick={() => this.logout()}>
                            Logout <Icon name='log out' style={{ marginLeft: '0.5em' }} />
                        </Menu.Item>
                    </Menu.Menu>
                </>
            )
        }

        menu = (
            <Menu stackable inverted className='borderlessMenu' pointing secondary size='small'>
                {menuItems}
            </Menu>
        )

        return (
            <Segment id="header" inverted>
                {menu}
            </Segment>
        );
    }
}

function mapStateToProps(state) {
    return {
        loginPageStore: state.LoginReducer
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        authenticateAction,
        authenticateSucceededAction,
        authenticationInProgressAction
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);
