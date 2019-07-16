import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Grid, Header, Button, Table, Message, Image, Icon, Input, Transition, Popup } from 'semantic-ui-react';
import _ from 'lodash';
import moment from 'moment';
import { Link } from 'react-router-dom';

import {
    getCurrentYearOrders, getNotPaidNotificationsNotifications,
    getAllZaslatOrders, verifyLock, getInvoice, getOrder, printLabels, deleteOrder, getAllOrders, getWarehouseProducts, getTrackingInfo
} from '../../utils/requests';
import {
    getOrdersAction, openOrderDetailsAction, getNotPaidNotificationsAction, getWarehouseNotificationsAction,
    getMoreOrdersAction, showGenericModalAction, getAllZaslatOrdersAction, getOrderAction, deleteOrderAction,
    getProductsAction, getTrackingInfoAction
} from '../../utils/actions';

import { GET_ORDERS_LIMIT, LOCALSTORAGE_NAME, APP_TITLE, deliveryCompanies, CONTACT_TYPES } from '../../appConfig'
import { filterInArrayOfObjects, debounce, handleVerifyLockError, getOrderTableRowStyle, mapOrderToExcelExport, buildFilter, contains } from '../../utils/helpers';
import logo from '../../assets/logo.png';
import ErrorMessage from '../../components/ErrorMessage';
import OrderInlineDetails from '../../components/OrderInlineDetails';
import CreateZaslatModal from '../../components/CreateZaslatModal';
import { handleTogglePaidOrder, getOrderAndHandleResult, fetchAndHandleThisYearOrders } from '../../handlers/orderHandler';
import ExportDropdown from '../../components/ExportDropdown';
import { fetchAndHandleProducts } from '../../handlers/productHandler';
import TrackingInfoModal from '../../components/TrackingInfoModal';

class Orders extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isSearchIconLoading: false,
            isTrackingInfoModalShowing: false,
            isMobile: props.isMobile,
            multiSearchInput: "",
            showFunctionsMobile: false,
            showPaidOrders: false,
            orderIdsShowingDetails: [],
            orderLabelsToPrint: [],
            showPrintLabelsIcon: false,
            showMultiSearchFilter: false,
            ordersLimit: props.isMobile ? GET_ORDERS_LIMIT / 5 : GET_ORDERS_LIMIT,
            inputWidth: 0,
            showCreateZaslatModal: false,
            generateInvoice: {
                generateInvoiceDone: true,
                orderToGenerateInvoice: {}
            },
            user: localStorage.getItem(LOCALSTORAGE_NAME) ? JSON.parse(atob(localStorage.getItem(LOCALSTORAGE_NAME).split('.')[1])).username : ""
        }

        this.updateFilters = debounce(this.updateFilters, 1000);

        this.showTogglePaidOrdersButtonRef = React.createRef()
    }

    componentDidMount() {

        document.title = APP_TITLE + "Orders"

        // load current year orders when landing on orders for the first time
        // or there are no orders in store
        if (!this.props.location.state || !this.props.ordersStore.orders.data) {
            this.fetchAndHandleThisYearOrders()
        }

        // reload orders only if the previous location wasn't order details
        if (this.props.location.state) {
            if (!this.props.location.state.isFromDetails) {
                this.fetchAndHandleThisYearOrders()
            }
        }

        if (!this.props.productsStore.products.data) {
            fetchAndHandleProducts(this.props.getProductsAction);
        }

        this.fetchAndHandleNotPaidNotifications()
        this.fetchAndHandleWarehouseNotifications()
    }

    fetchAndHandleThisYearOrders = () => {
        fetchAndHandleThisYearOrders(this.props.getOrdersAction, GET_ORDERS_LIMIT, null)
    }

    fetchAndHandleNotPaidNotifications = () => {
        getNotPaidNotificationsNotifications()
            .then(res => {
                this.props.getNotPaidNotificationsAction({ data: res.data, success: true })
            })
            .catch(err => {
                this.props.getNotPaidNotificationsAction({ error: err, success: false })
            })
    }

    fetchAndHandleWarehouseNotifications = async () => {
        try {
            let res = await getWarehouseProducts()
            let filtered = [];

            if (res.data) {
                filtered = res.data.products.filter(x => {
                    let found = this.props.productsStore.products.data.find(y => y.id === x.id);

                    return found.isActive === true && x.available < found.notificationThreshold
                })
            }

            this.props.getWarehouseNotificationsAction({ data: filtered, success: true })
        } catch (err) {
            this.props.getWarehouseNotificationsAction({ error: err, success: false })
        }
    }

    verifyLockAndHandleError = (orderId) => {
        verifyLock(orderId, this.state.user)
            .catch(err => {
                handleVerifyLockError(this.props, err, this.state.user)
            })
    }

    openOrderDetails = (order) => {
        this.verifyLockAndHandleError(order.id)

        this.props.openOrderDetailsAction({ success: true, data: order });
        this.props.history.push("/orders/" + order.id);
    }

    handleToggleShowPaidOrders = () => {
        this.setState({ showPaidOrders: !this.state.showPaidOrders });
    }

    loadMoreOrders = () => {
        var currentLimit = this.state.ordersLimit + 100

        var sinceId = this.props.ordersStore.orders.data[
            this.props.ordersStore.orders.data.length - 1].id

        getCurrentYearOrders(currentLimit, sinceId)
            .then(res => {
                this.props.getMoreOrdersAction({ data: res.data, success: true })
                this.setState({ ordersLimit: currentLimit });
            })
            .catch(err => {
                this.props.getMoreOrdersAction({ success: false })
                this.props.showGenericModalAction({
                    redirectTo: '/orders',
                    parentProps: this.props,
                    err: err
                })
            })
    }

    toggleInlineOrderDetails = (orderId, e) => {
        // do not fire if onclick was triggered on child elements
        e.preventDefault();
        if (e.target.className === "blackColor" || e.target.className === "") {
            if (this.state.orderIdsShowingDetails.indexOf(orderId) > -1) {
                this.setState({
                    orderIdsShowingDetails: this.state.orderIdsShowingDetails.filter(id => {
                        return id !== orderId
                    })
                });
            }
            else {
                this.setState(prevState => ({
                    orderIdsShowingDetails: [...prevState.orderIdsShowingDetails, orderId]
                }))
            }
        }

    }

    togglePrintLabelIcon = (orderId) => {
        if (this.state.orderLabelsToPrint.indexOf(orderId) > -1) {
            this.setState({
                orderLabelsToPrint: this.state.orderLabelsToPrint.filter(id => {
                    return id !== orderId
                })
            });
        }
        else {
            this.setState(prevState => ({
                orderLabelsToPrint: [...prevState.orderLabelsToPrint, orderId]
            }))
        }
    }

    handleFilterChange = (e, { value }) => {
        this.updateFilters(value ? value : "");
    }

    updateFilters = (value) => {
        this.setState({ multiSearchInput: value });
    }

    handleNotPaidVSOnClick = (vs) => {
        this.setState({ multiSearchInput: vs });
        this.showFilter()
    }

    showFilter = () => {
        this.setState({ isSearchIconLoading: !this.state.isSearchIconLoading });

        // fetch _all_ orders
        getAllOrders()
            .then(res => {
                this.props.getOrdersAction({ data: res.data, success: true })
            })
            .catch(err => {
                this.props.getOrdersAction({ error: err, success: false })
            })
            .finally(() => {

                // for mobile shit
                if (this.showTogglePaidOrdersButtonRef.current) {
                    this.setState({ inputWidth: this.showTogglePaidOrdersButtonRef.current.ref.offsetWidth });
                }

                this.handleToggleShowPaidOrders();
                this.setState({ showMultiSearchFilter: !this.state.showMultiSearchFilter })
            })
    }

    handlePrintLabelButtonOnClick = () => {
        // if no orders are selected to print then get all zaslat orders
        // if yes then print labels
        if (this.state.orderLabelsToPrint.length > 0) {
            var foundIZs = [];

            this.state.orderLabelsToPrint.forEach(x => {
                foundIZs.push(this.props.zaslatStore.zaslatOrders.data.find(y => {
                    return y.id === x
                }).zaslatShipmentId)
            })

            printLabels(foundIZs)
                .then((resp) => {
                    var iframe = "<iframe width='100%' height='100%' src='" + resp.data + "'></iframe>";
                    var win = window.open();
                    win.document.write(iframe);

                    this.setState({ orderLabelsToPrint: [] });
                })
                .catch((err) => {
                    this.props.showGenericModalAction({
                        err: err,
                        header: "Failed to print Zaslat labels"
                    })
                })
        }
        else {
            this.getAllZaslatOrdersAndHandleResult()
            this.setState({ showPrintLabelsIcon: !this.state.showPrintLabelsIcon })
        }

    }

    getAllZaslatOrdersAndHandleResult = () => {
        getAllZaslatOrders()
            .then(res => {
                this.props.getAllZaslatOrdersAction({ data: res.data, success: true })
            })
            .catch(err => {
                this.props.getAllZaslatOrdersAction({ error: err, success: false })
            })
    }

    generateInvoice = (order) => {
        this.setState({ generateInvoice: { generateInvoiceDone: false, orderToGenerateInvoice: order } });
        verifyLock(order.id, this.state.user)
            .then(() => {
                return true
            })
            .catch(err => {
                handleVerifyLockError(this.props, err, this.state.user)
            })
            .then((res) => {
                if (res) {
                    return getInvoice(order.id)

                }
            })
            .then(res => {
                var pdfDocGenerator = window.pdfMake.createPdf(res.data);
                pdfDocGenerator.getBase64((data) => {
                    var base64string = 'data:application/pdf;base64,' + data;
                    var iframe = "<iframe width='100%' height='100%' src='" + base64string + "'></iframe>"
                    var win = window.open();
                    win.document.write(iframe);

                });
            })
            .catch(err => {
                this.props.showGenericModalAction({
                    redirectTo: '/orders',
                    header: 'Failed to generate invoice for orderID:' + order.id,
                    parentProps: this.props,
                    err: err
                })

            })
            .finally(() => {
                this.setState({ generateInvoice: { generateInvoiceDone: true, orderToGenerateInvoice: order } });
            })
    }

    filterData = (orders, multiSearchInput) => {
        var mappedOrdersForFiltering = _.orderBy(orders, ['payment.orderDate'], ['desc']).map(order => {

            // joing product names to string to be searchable
            var products = order.products.map(product => {
                return (product.productName)
            }).join(" ")

            return (
                {
                    original: order,
                    fullName: order.address.firstName + " " + order.address.lastName,
                    fullNameReversed: order.address.lastName + " " + order.address.firstName,
                    phone: order.address.phone,
                    street: order.address.street,
                    vs: order.payment.vs,
                    totalPrice: order.totalPrice,
                    products: products,
                    note: order.note
                }
            )
        })

        return filterInArrayOfObjects(
            buildFilter(multiSearchInput),
            mappedOrdersForFiltering,
            [
                "fullName",
                "fullNameReversed",
                "phone",
                "street",
                "vs",
                "totalPrice",
                "products",
                "note"
            ])
            .map(order => order.original)
    }

    toggleShowFunctionsMobile = () => {
        this.handleToggleShowPaidOrders()
        this.setState({ showFunctionsMobile: !this.state.showFunctionsMobile })

        // fetch _all_ orders
        getCurrentYearOrders(null, null)
            .then(res => {
                this.props.getOrdersAction({ data: res.data, success: true })
            })
            .catch(err => {
                this.props.getOrdersAction({ error: err, success: false })
            })
    }

    handleTogglePaidOrder = (order) => {
        handleTogglePaidOrder({
            order: order,
            user: this.state.user,
            getOrderAction: this.props.getOrderAction
        })
    }

    handleDeleteOrder = async (id) => {
        try {
            await deleteOrder(id)
        }
        catch (err) {
            this.props.showGenericModalAction({
                err: err,
                header: "Failed to delete order"
            })
        }

        try {
            await getOrder(id)
            this.props.deleteOrderAction({ success: true, id: id })
        }
        catch (err) {
            this.props.showGenericModalAction({
                err: err,
                header: "Failed to get order after deletion"
            })
        }
    }

    handleCloseCreateZaslatModal = () => {
        this.setState({ showCreateZaslatModal: false });
    }

    handleOpenCreateZaslatModal = async (order) => {
        try {
            var res = await getOrderAndHandleResult({
                id: order.id,
                openOrderDetailsAction: this.props.openOrderDetailsAction
            })

            if (!res.success) {
                throw res.error
            }

            this.setState({ showCreateZaslatModal: true });
        }
        catch (err) {
            this.props.showGenericModalAction({
                err: err,
                header: "Failed to get order details"
            })
        }
    }

    handleToggleTrackingInfoModal = () => {
        this.setState({ isTrackingInfoModalShowing: !this.state.isTrackingInfoModalShowing });
    }

    handleTrackingInfoButtonOnClick = (zaslatId) => {
        this.setState({ isFetchingTrackingInfoRunning: true, zaslatId });
        let payload = {
            shipments: Array(1).fill(zaslatId)
        };

        getTrackingInfo(payload)
            .then(res => {
                this.props.getTrackingInfoAction({ success: true, data: res.data })
                this.handleToggleTrackingInfoModal();
            })
            .catch(err => {
                this.props.showGenericModalAction({
                    err: err, header: "Failed to get tracking info"
                })
            })
            .finally(() => {
                this.setState({ isFetchingTrackingInfoRunning: false });
            })
    }

    render() {

        const { isMobile, orderIdsShowingDetails } = this.state;

        // in case of error
        if (!this.props.ordersStore.orders.success) {
            return (
                <Grid stackable={isMobile}>
                    <Grid.Row>
                        <Grid.Column>
                            <Header as='h1'>
                                Orders
                            </Header>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <ErrorMessage handleRefresh={this.fetchAndHandleThisYearOrders} error={this.props.ordersStore.orders.error} />
                    </Grid.Row>
                </Grid>
            );
        }

        let orders = this.props.ordersStore.orders.data;
        // in case it's still loading data
        if (!orders) {
            return (
                <div className="messageBox">
                    <Message positive icon >
                        <Icon name='circle notched' loading />
                        <Message.Content content={
                            <Message.Header>Loading orders</Message.Header>
                        }>
                        </Message.Content>
                        {isMobile ? null : <Image size='tiny' src={logo} />}
                    </Message>
                </div>
            );
        }

        let {
            showPaidOrders,
            multiSearchInput,
            orderLabelsToPrint,
            showFunctionsMobile,
            showCreateZaslatModal,
            isTrackingInfoModalShowing,
            isFetchingTrackingInfoRunning,
            zaslatId
        } = this.state;
        let rowCounter = 0;
        let filteredByMultiSearch, mappedOrders, sortedOrders, trackingInfoModal;

        if (this.props.zaslatStore.trackingInfo.data && this.props.zaslatStore.trackingInfo.success) {
            let key = Object.keys(this.props.zaslatStore.trackingInfo.data)
            let data = this.props.zaslatStore.trackingInfo.data[key[0]].packages[0]
            trackingInfoModal = <TrackingInfoModal zaslatId={key[0]} handleToggleTrackingInfoModal={this.handleToggleTrackingInfoModal} data={data} show={isTrackingInfoModalShowing} />
        }

        // sort orders by order date and render orders count based by orderLimit
        sortedOrders = _.orderBy(orders.slice(0, this.state.ordersLimit), ['payment.orderDate'], ['desc']);
        if (!showPaidOrders) {
            sortedOrders = sortedOrders.filter(order => {
                return !order.payment.paid
            });
        }

        if (multiSearchInput && multiSearchInput.length > 1) { // if filter is specified
            filteredByMultiSearch = this.filterData(orders, multiSearchInput)
        }
        else {
            filteredByMultiSearch = sortedOrders
        }

        mappedOrders = filteredByMultiSearch.map(order => {

            var orderInlineDetails = null

            if (orderIdsShowingDetails.indexOf(order.id) > -1) {
                orderInlineDetails = <OrderInlineDetails products={this.props.productsStore.products} order={order} isMobile={isMobile} />
            }
            let buttons;
            if (isMobile) {
                // mobile return

                if (this.state.showPrintLabelsIcon) {
                    if (order.zaslatDate) {
                        buttons = (
                            <Button loading={isFetchingTrackingInfoRunning} onClick={() => this.togglePrintLabelIcon(order.id)} className="buttonIconPadding" size='huge'
                                icon={
                                    <>
                                        <Icon name='barcode' />
                                        {
                                            orderLabelsToPrint.indexOf(order.id) > -1 ? (<Icon color="red" corner name='minus' />) : (<Icon color="green" corner name='add' />)
                                        }
                                    </>
                                } >
                            </Button>
                        )
                    }
                }
                else {
                    buttons = (
                        <>
                            {
                                moment().add(-30, 'days').isAfter(order.payment.paymentDate) ? null : (
                                    <>
                                        <Button onClick={() => this.openOrderDetails(order)} className="buttonIconPadding" size='huge' icon='edit' />
                                        <Button onClick={() => this.handleTogglePaidOrder(order)} className="buttonIconPadding" size='huge' icon={
                                            <>
                                                <Icon name='dollar' />
                                                {
                                                    order.payment.paid ? (<Icon color="red" corner name='minus' />) : (<Icon color="green" corner name='add' />)
                                                }
                                            </>
                                        } />
                                    </>
                                )
                            }

                            <Button className="buttonIconPadding" size='huge' icon='file pdf' onClick={() => this.generateInvoice(order)} />

                            {
                                !order.payment.paid && (
                                    <>
                                        <Button onClick={() => this.handleOpenCreateZaslatModal(order)} className="buttonIconPadding" size='huge' icon='shipping fast' />
                                        {
                                            order.zaslatShipmentId && (
                                                <Button
                                                    loading={zaslatId === order.zaslatShipmentId && isFetchingTrackingInfoRunning}
                                                    onClick={() => this.handleTrackingInfoButtonOnClick(order.zaslatShipmentId)}
                                                    className="buttonIconPadding"
                                                    size='huge'
                                                    icon={
                                                        <Icon name="history" />
                                                    } />
                                            )
                                        }
                                        <Button onClick={() => this.handleDeleteOrder(order.id)} className="buttonIconPadding" size='huge' icon={<Icon name='close' color='red' />} />
                                    </>
                                )
                            }
                        </>
                    )
                }

                return (
                    <Table.Row onClick={(e) => this.toggleInlineOrderDetails(order.id, e)} key={order.id} style={getOrderTableRowStyle(order)}
                        textAlign='center'>
                        <Table.Cell>{(order.address.lastName ? order.address.lastName : "") + " " + (order.address.firstName ? order.address.firstName : "")}</Table.Cell>
                        <Table.Cell>{order.payment.vs ? order.payment.vs : "cash"} <strong>|</strong> {moment(order.payment.orderDate).local().format("DD.MM")} <strong>|</strong> <strong>{order.totalPrice} Kč</strong></Table.Cell>
                        <Table.Cell>
                            {buttons}
                        </Table.Cell>
                        {orderInlineDetails}
                    </Table.Row>
                )

            }
            else {
                if (this.state.showPrintLabelsIcon) {
                    if (order.zaslatDate) {
                        buttons = (
                            <Popup trigger={<Button onClick={() => this.togglePrintLabelIcon(order.id)} className="buttonIconPadding" size='huge'
                                icon={
                                    <>
                                        <Icon name='barcode' />
                                        {
                                            orderLabelsToPrint.indexOf(order.id) > -1 ? (<Icon color="red" corner name='minus' />) : (<Icon color="green" corner name='add' />)
                                        }
                                    </>
                                } >
                            </Button>} content="Print label" />
                        )
                    }
                }
                else {
                    buttons = (
                        <>
                            {
                                moment().add(-30, 'days').isAfter(order.payment.paymentDate) || (
                                    <>
                                        <Popup trigger={<Button onClick={() => this.openOrderDetails(order)} className="buttonIconPadding" size='huge' icon='edit' />} content="Edit order" />
                                        <Popup trigger={<Button onClick={() => this.handleTogglePaidOrder(order)} className="buttonIconPadding" size='huge' icon={
                                            <>
                                                <Icon name='dollar' />
                                                {
                                                    order.payment.paid ? (<Icon color="red" corner name='minus' />) : (<Icon color="green" corner name='add' />)
                                                }
                                            </>
                                        } />} content="Mark as Paid" />
                                    </>
                                )
                            }

                            < Popup trigger={< Button className="buttonIconPadding" size='huge' icon='file pdf' onClick={() => this.generateInvoice(order)
                            } />} content="Generate Invoice" />
                            {
                                !order.payment.paid && (
                                    <>
                                        {
                                            order.deliveryCompany && contains(order.deliveryCompany, deliveryCompanies[0]) && (
                                                <Popup trigger={<Button onClick={() => this.handleOpenCreateZaslatModal(order)} className="buttonIconPadding" size='huge' icon='shipping fast' />} content="Send to Zaslat" />
                                            )
                                        }
                                        {
                                            order.zaslatShipmentId && (
                                                <Popup
                                                    trigger={
                                                        <Button
                                                            loading={zaslatId === order.zaslatShipmentId && isFetchingTrackingInfoRunning}
                                                            onClick={() => this.handleTrackingInfoButtonOnClick(order.zaslatShipmentId)}
                                                            className="buttonIconPadding"
                                                            size='huge'
                                                            icon={
                                                                <Icon name="history" />
                                                            } />}
                                                    content="Tracking history" />
                                            )
                                        }
                                        <Popup trigger={<Button onClick={() => this.handleDeleteOrder(order.id)} className="buttonIconPadding" size='huge' icon={<Icon name='close' color='red' />} />} content="Delete order" />
                                    </>
                                )
                            }
                        </>
                    )
                }
                rowCounter++;
                // desktop return
                return (
                    <React.Fragment key={order.id}>
                        <Table.Row
                            verticalAlign="bottom"
                            onClick={(e) => this.toggleInlineOrderDetails(order.id, e)}
                            style={getOrderTableRowStyle(order)}
                            textAlign='center'
                            key={order.id}>
                            <Table.Cell> {Number.isInteger(order.contactType) && (
                                CONTACT_TYPES[order.contactType].icon ? (
                                    CONTACT_TYPES[order.contactType].corner ? (
                                        <>
                                            <Popup trigger={
                                                <Icon name={CONTACT_TYPES[order.contactType].icon} />
                                            } content={CONTACT_TYPES[order.contactType].text} />
                                            <Popup trigger={
                                                <Icon name={CONTACT_TYPES[order.contactType].corner} />
                                            } content={CONTACT_TYPES[order.contactType].text} />
                                        </>
                                    ) : (
                                            <Popup trigger={<Icon name={CONTACT_TYPES[order.contactType].icon} />} content={CONTACT_TYPES[order.contactType].text} />
                                        )
                                ) : (
                                        <Popup trigger={<Image avatar inline src={window.location.protocol + '//' + window.location.host + "/icons/" + CONTACT_TYPES[order.contactType].image} />} content={CONTACT_TYPES[order.contactType].text} />
                                    )
                            )}{rowCounter} </Table.Cell>
                            <Table.Cell>{(order.address.lastName ? order.address.lastName : "") + " " + (order.address.firstName ? order.address.firstName : "")}</Table.Cell>
                            <Table.Cell>{order.payment.vs}</Table.Cell>
                            <Table.Cell>{moment(order.payment.orderDate).local().format("DD.MM")}</Table.Cell>
                            <Table.Cell><strong>{order.totalPrice} Kč</strong></Table.Cell>
                            <Table.Cell>{order.note}</Table.Cell>
                            <Table.Cell verticalAlign="bottom">
                                {buttons}
                            </Table.Cell>
                        </Table.Row>
                        {orderInlineDetails}
                    </React.Fragment>
                )
            }
        })

        var table;

        if (isMobile) {
            table = (
                <Table compact basic='very'>
                    <Table.Header>
                        <Table.Row className="textAlignCenter">
                            <Table.HeaderCell width={2}>Name</Table.HeaderCell>
                            <Table.HeaderCell width={1}>VS | Order Date | Price [CZK]</Table.HeaderCell>
                            <Table.HeaderCell width={3}>Actions</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {mappedOrders}
                    </Table.Body>
                </Table>
            )
        }
        else {
            table = (
                <Table compact padded basic='very'>
                    <Table.Header>
                        <Table.Row className="textAlignCenter">
                            <Table.HeaderCell width={1}>#</Table.HeaderCell>
                            <Table.HeaderCell width={2}>Name</Table.HeaderCell>
                            <Table.HeaderCell width={1}>VS</Table.HeaderCell>
                            <Table.HeaderCell width={1}>Order Date</Table.HeaderCell>
                            <Table.HeaderCell width={1}>Price</Table.HeaderCell>
                            <Table.HeaderCell width={4}>Notes</Table.HeaderCell>
                            <Table.HeaderCell width={3}>Actions</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {mappedOrders}
                    </Table.Body>
                </Table>
            )

        }

        var notPaidNotificationsMessage, warehouseNotificationsMessage;

        // if its mobile and menu not expanded then save some time with not rendering messages
        if ((showFunctionsMobile && isMobile) || !isMobile) {
            if (this.props.ordersStore.warehouseNotifications.data) {
                if (this.props.ordersStore.warehouseNotifications.data.length > 0) {
                    var message = this.props.ordersStore.warehouseNotifications.data.map((notification, i) => {
                        return (
                            <React.Fragment key={i}>
                                <strong>{notification.name}: </strong> {notification.available} <br />
                            </React.Fragment>
                        )
                    })

                    warehouseNotificationsMessage = (
                        <Message className="textAlignCenter" warning>Some of the products are below threshold:<br />{message}
                            <Link to="/warehouse">Go to Warehouse</Link></Message>
                    )
                }
                else {
                    warehouseNotificationsMessage = null
                }
            }
            else {
                warehouseNotificationsMessage = (
                    <Message warning icon>
                        <Icon name='circle notched' loading />
                        <Message.Content>
                            <Message.Header>Checking what's missing in warehouse</Message.Header>
                        </Message.Content>
                    </Message>
                )
            }

            if (this.props.ordersStore.notPaidNotifications.data) {
                if (this.props.ordersStore.notPaidNotifications.data.length > 0) {
                    var VSs = this.props.ordersStore.notPaidNotifications.data.map(notification => {
                        return (
                            <span key={notification.vs} onClick={() => this.handleNotPaidVSOnClick(notification.vs.toString())} style={{ padding: '0.2em', cursor: "pointer" }}>
                                <strong>
                                    {notification.vs} <br />
                                </strong>
                            </span>
                        )
                    })

                    if (this.props.ordersStore.notPaidNotifications.data.length > 1) {
                        notPaidNotificationsMessage = (
                            <Message className="textAlignCenter" warning>Orders are delivered but not paid: <br />{VSs}</Message>
                        )
                    }
                    else {
                        notPaidNotificationsMessage = (
                            <Message className="textAlignCenter" warning>
                                Order is delivered but not paid: <br />
                                <strong>{VSs}</strong>
                            </Message>
                        )
                    }
                }
                else {
                    notPaidNotificationsMessage = null
                }
            }
            else {
                notPaidNotificationsMessage = (
                    <Message warning icon>
                        <Icon name='circle notched' loading />
                        <Message.Content>
                            <Message.Header>Findind not paid orders</Message.Header>
                        </Message.Content>
                    </Message>
                )
            }
        }

        var orderPageHeader;
        if (isMobile) {
            orderPageHeader = (
                <Grid stackable>
                    <Grid.Row>
                        <Grid.Column>
                            <Header as='h1'>
                                Orders
                                <Button toggle onClick={this.toggleShowFunctionsMobile} floated='right' style={{ backgroundColor: this.state.showFunctionsMobile ? '#f2005696' : '#f20056', color: 'white' }} content={this.state.showFunctionsMobile ? 'Hide' : 'Show'} />
                            </Header>
                        </Grid.Column>
                    </Grid.Row>
                    <Transition.Group animation='drop' duration={500}>
                        {this.state.showFunctionsMobile && (
                            <>
                                <Grid.Row>
                                    <Button onClick={() => this.props.history.push('orders/new')} fluid size='small' content='Add Order' id="primaryButton" />
                                    {
                                        this.props.zaslatStore.zaslatOrders.success ? (
                                            <Button
                                                onClick={this.handlePrintLabelButtonOnClick}
                                                style={{ marginTop: '0.5em' }} id={this.state.showPrintLabelsIcon || "secondaryButton"}
                                                fluid
                                                size='small'
                                                compact
                                                content={this.state.orderLabelsToPrint.length > 0 ? ("Print labels (" + this.state.orderLabelsToPrint.length + ")") : this.state.showPrintLabelsIcon ? "Print labels (0)" : "Print labels"}
                                                color={this.state.orderLabelsToPrint.length > 0 ? "green" : this.state.showPrintLabelsIcon ? "orange" : null} />
                                        ) : (
                                                <ErrorMessage stripImage={true} error={this.props.zaslatStore.zaslatOrders.error} handleRefresh={this.getAllZaslatOrdersAndHandleResult} />
                                            )
                                    }

                                </Grid.Row>
                                {
                                    (warehouseNotificationsMessage == null && notPaidNotificationsMessage == null) || (
                                        <Grid.Row>
                                            {
                                                warehouseNotificationsMessage == null || (
                                                    <Grid.Column>
                                                        {warehouseNotificationsMessage}
                                                    </Grid.Column>
                                                )
                                            }
                                            {
                                                notPaidNotificationsMessage == null || (
                                                    <Grid.Column>
                                                        {notPaidNotificationsMessage}
                                                    </Grid.Column>
                                                )
                                            }
                                        </Grid.Row>
                                    )
                                }

                                <Grid.Row>
                                    <Grid.Column>
                                        <Input
                                            style={{ width: document.getElementsByClassName("ui fluid input drop visible transition")[0] ? document.getElementsByClassName("ui fluid input drop visible transition")[0].clientWidth : null }}
                                            fluid
                                            name="multiSearchInput"
                                            placeholder='Search...'
                                            onChange={this.handleFilterChange} />
                                        <Button
                                            fluid
                                            size="small"
                                            onClick={this.handleToggleShowPaidOrders}
                                            compact
                                            content={showPaidOrders ? 'Hide Paid Orders' : 'Show Paid Orders'}
                                            style={{ padding: '0.3em', marginTop: '0.5em' }}
                                            id="secondaryButton"
                                            icon={showPaidOrders ? 'eye' : 'eye slash'}
                                            labelPosition='left' />
                                    </Grid.Column>
                                </Grid.Row>
                            </>
                        )}
                    </Transition.Group>
                </Grid>
            )
        }
        else {
            orderPageHeader = (
                <Grid>
                    <Grid.Row columns={5} style={{ marginBottom: '1em' }}>
                        <Grid.Column width={2}>
                            <Header as='h1' content='Orders' />
                            <ExportDropdown data={mapOrderToExcelExport(filteredByMultiSearch)} />
                        </Grid.Column>
                        <Grid.Column width={2}>
                            <Button onClick={() => this.props.history.push('orders/new')} fluid size='large' compact content='Add Order' id="primaryButton" />
                            {
                                this.props.zaslatStore.zaslatOrders.success ? (
                                    <Button
                                        onClick={this.handlePrintLabelButtonOnClick}
                                        style={{ marginTop: '0.5em' }} id={this.state.orderLabelsToPrint.length > 0 || this.state.showPrintLabelsIcon || "secondaryButton"}
                                        fluid
                                        size='small'
                                        compact
                                        content={this.state.orderLabelsToPrint.length > 0 ? ("Print labels (" + this.state.orderLabelsToPrint.length + ")") : this.state.showPrintLabelsIcon ? "Print labels (0)" : "Print labels"}
                                        color={this.state.orderLabelsToPrint.length > 0 ? "green" : this.state.showPrintLabelsIcon ? "orange" : null} />
                                ) : (
                                        <ErrorMessage stripImage={true} error={this.props.zaslatStore.zaslatOrders.error} handleRefresh={this.getAllZaslatOrdersAndHandleResult} />
                                    )
                            }

                        </Grid.Column>
                        <Grid.Column width={5}>
                            {warehouseNotificationsMessage}
                        </Grid.Column>
                        <Grid.Column width={3}>
                            {notPaidNotificationsMessage}
                        </Grid.Column>
                        <Grid.Column width={4} textAlign='left' floated='right'>
                            <>
                                {/* <Transition animation='drop' duration={500} visible={this.state.showMultiSearchFilter}>
                                    <Input
                                        fluid
                                        name="multiSearchInput"
                                        placeholder='Search...'
                                        onChange={this.handleFilterChange} />
                                </Transition> */}
                                {
                                    !this.state.showMultiSearchFilter ? (
                                        <div style={{ textAlign: 'right' }}>
                                            <Icon
                                                loading={this.state.isSearchIconLoading}
                                                name='search'
                                                style={{ cursor: 'pointer !important', backgroundColor: '#f20056', color: 'white', marginRight: '0.2em' }}
                                                circular
                                                link
                                                onClick={this.showFilter} />
                                        </div>
                                    ) : (
                                            <Input
                                                fluid
                                                name="multiSearchInput"
                                                placeholder='Search...'
                                                onChange={this.handleFilterChange} />
                                        )
                                }
                                <Button
                                    ref={this.showTogglePaidOrdersButtonRef}
                                    fluid
                                    size="small"
                                    onClick={this.handleToggleShowPaidOrders}
                                    compact
                                    content={showPaidOrders ? 'Hide Paid Orders' : 'Show Paid Orders'}
                                    style={{ padding: '0.3em', marginTop: '0.5em' }}
                                    id="secondaryButton"
                                    icon={showPaidOrders ? 'eye' : 'eye slash'}
                                    labelPosition='left' />
                            </>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            )
        }

        // desktop return
        return (
            <>
                {trackingInfoModal}
                {
                    this.state.generateInvoice.generateInvoiceDone === false && (
                        <div className="messageBox">
                            <Message info icon>
                                <Icon name='circle notched' loading />
                                <Message.Content>
                                    <Message.Header>
                                        {
                                            !_.isEmpty(this.state.generateInvoice.orderToGenerateInvoice) && (
                                                this.state.generateInvoice.orderToGenerateInvoice.payment.vs || (this.state.generateInvoice.orderToGenerateInvoice.address.lastName ? this.state.generateInvoice.orderToGenerateInvoice.address.lastName : "") + " " + (this.state.generateInvoice.orderToGenerateInvoice.address.firstName ? this.state.generateInvoice.orderToGenerateInvoice.address.firstName : "")
                                            )
                                        }
                                        {" : Generating pdf"}
                                    </Message.Header>
                                </Message.Content>
                            </Message>
                        </div>
                    )}
                {
                    showCreateZaslatModal && (
                        <CreateZaslatModal
                            products={this.props.productsStore.products}
                            isMobile={isMobile}
                            order={this.props.ordersStore.ordersDetails.data}
                            show={showCreateZaslatModal}
                            closeCreateZaslatModal={this.handleCloseCreateZaslatModal} />
                    )
                }
                {orderPageHeader}
                {table}
                {
                    multiSearchInput !== "" || (
                        <Button onClick={this.loadMoreOrders} style={{ marginTop: '0.5em' }} fluid>Show More</Button>
                    )
                }
            </>
        )
    }
}

function mapStateToProps(state) {
    return {
        ordersStore: state.OrdersReducer,
        zaslatStore: state.ZaslatReducer,
        baseStore: state.BaseReducer,
        productsStore: state.ProductsReducer
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getOrdersAction,
        openOrderDetailsAction,
        getNotPaidNotificationsAction,
        getWarehouseNotificationsAction,
        getMoreOrdersAction,
        showGenericModalAction,
        getAllZaslatOrdersAction,
        getOrderAction,
        deleteOrderAction,
        getProductsAction,
        getTrackingInfoAction
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Orders);