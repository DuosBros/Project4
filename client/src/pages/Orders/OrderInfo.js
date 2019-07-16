import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Grid, Header, Button, Icon, Segment, Form, Dropdown, Divider, Table, Message, TextArea } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import { deliveryTypes, deliveryCompanies, LOCALSTORAGE_NAME, DEFAULT_ORDER_LOCK_SECONDS, APP_TITLE, CONTACT_TYPES } from '../../appConfig';
import { getProductsAction, openOrderDetailsAction } from '../../utils/actions';
import { verifyLock, lockOrder, getOrder, getHighestVS, saveOrder, createOrder } from '../../utils/requests';
import SimpleTable from '../../components/SimpleTable';
import ProductRow from '../../components/ProductRow';
import { handleVerifyLockError, getGLSDeliveryPrice, contains } from '../../utils/helpers';
import _ from 'lodash';
import moment from 'moment';
import { fetchAndHandleProducts } from '../../handlers/productHandler';
import OrderProductsWeightTablePopup from '../../components/OrderProductsWeightTablePopup';

const DeliveryCompanyButtonGroup = (props) => {
    return (
        <Button.Group fluid size='medium'>
            <Button
                onClick={() => props.handleToggleDeliveryAndPaymentTypeButtons("deliveryCompany", deliveryCompanies[0])}
                id={contains(props.deliveryCompany, deliveryCompanies[0]) ? "primaryButton" : "secondaryButton"}>
                GLS
            </Button>
            <Button.Or text='OR' />
            <Button
                onClick={() => props.handleToggleDeliveryAndPaymentTypeButtons("deliveryCompany", deliveryCompanies[1])}
                id={contains(props.deliveryCompany, deliveryCompanies[1]) ? "primaryButton" : "secondaryButton"}>
                Česká Pošta
            </Button>
            <Button.Or text='OR' />
            <Button
                onClick={() => props.handleToggleDeliveryAndPaymentTypeButtons("deliveryCompany", deliveryCompanies[2])}
                id={contains(props.deliveryCompany, deliveryCompanies[2]) ? "primaryButton" : "secondaryButton"}>
                Delivery by BoMe
            </Button>
        </Button.Group>
    )
}

const BankAccountPaymentButtonGroup = (props) => {
    return (
        <Button.Group fluid size='medium'>
            <Button
                onClick={() => props.handleToggleBankAccountPaymentButtons(false)}
                id={props.cashOnDelivery ? "secondaryButton" : "primaryButton"}>
                Yes
            </Button>
            <Button.Or text='OR' />
            <Button
                onClick={() => props.handleToggleBankAccountPaymentButtons(true)}
                id={props.cashOnDelivery ? "primaryButton" : "secondaryButton"}>
                NO
            </Button>
        </Button.Group>
    )
}

const PaymentTypeButtonGroup = (props) => {
    return (
        <Button.Group fluid size='medium'>
            <Button
                onClick={() => props.handleToggleDeliveryAndPaymentTypeButtons("deliveryType", deliveryTypes[0])}
                id={contains(props.deliveryType, deliveryTypes[0]) ? "primaryButton" : "secondaryButton"}>
                VS
        </Button>
            <Button.Or text='OR' />
            <Button
                onClick={() => props.handleToggleDeliveryAndPaymentTypeButtons("deliveryType", deliveryTypes[1])}
                id={contains(props.deliveryType, deliveryTypes[0]) ? "secondaryButton" : "primaryButton"}>
                Cash
        </Button>
        </Button.Group>
    )
}

const TotalPriceForm = (props) => {
    let deliveryPrice;
    if (props.order.payment.price) {
        deliveryPrice = props.order.payment.price
    }
    else {
        deliveryPrice = "0"
    }

    if (props.isMobile) {
        return (
            <Form className='form' size='large'>
                <Form.Input value={deliveryPrice} onChange={props.handleDeliveryPriceOnChange} label='Delivery Price [CZK]' fluid name='price' id='deliveryPrice' />
                <label><strong>Total price [CZK]</strong></label>
                <input style={{ marginBottom: '0.5em' }} readOnly value={props.order.totalPrice ? props.order.totalPrice.toLocaleString('cs-CZ') : 0} ></input>
                <TextArea autoHeight rows={1} defaultValue={props.isEdit ? props.order.note : null} id='note' label='Note' name='note' />
            </Form>
        )
    }
    else {
        return (
            <Grid>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={4}>
                        <strong>
                            Delivery Price [CZK]
                            <OrderProductsWeightTablePopup
                                isMobile={props.isMobile}
                                order={props.order}
                                productsStore={props.productsStore} />
                        </strong>
                    </Grid.Column>
                    <Grid.Column width={12}>
                        <Form.Field>
                            <Form.Input value={deliveryPrice} onChange={props.handleDeliveryPriceOnChange} fluid id="deliveryPrice" />
                        </Form.Field>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={4}>
                        <strong>
                            Total price [CZK]
                </strong>
                    </Grid.Column>
                    <Grid.Column width={12}>
                        <Form.Field>
                            <Form.Input disabled fluid value={props.order.totalPrice ? props.order.totalPrice.toLocaleString('cs-CZ') : 0} />
                        </Form.Field>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={4}>
                        <strong>
                            Note
                </strong>
                    </Grid.Column>
                    <Grid.Column width={12}>
                        <Form>
                            <Form.Field>
                                <TextArea autoHeight rows={1} defaultValue={props.isEdit ? props.order.note : null} id='note' />
                            </Form.Field>
                        </Form>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        )
    }
}

class OrderInfo extends React.Component {
    constructor(props) {
        super(props);

        var hasId = this.props.match.params.id ? true : false
        var isInStore = this.props.ordersPageStore.orderToEdit.data ? true : false
        var isEdit = hasId || isInStore

        this.state = {
            streetAndNumberInput: null,
            isEdit: isEdit,
            isMobile: this.props.isMobile,
            user: localStorage.getItem(LOCALSTORAGE_NAME) ? JSON.parse(atob(localStorage.getItem(LOCALSTORAGE_NAME).split('.')[1])).username : "",
            contactType: null,
            order: isEdit ? this.props.ordersPageStore.orderToEdit.data : {
                address: {},
                state: "active",
                products: [],
                deliveryType: 'VS',
                deliveryCompany: 'GLS',
                totalPrice: 0,
                payment: {
                    price: 0,
                    cashOnDelivery: true
                },
                note: ""
            }
        }
    }

    componentWillUnmount() {
        if (this.state.isEdit) {
            this.props.openOrderDetailsAction({ success: true })
            clearInterval(this.intervalId);
        }

        clearInterval(this.smartformInterval)
        window.smartformReloaded = false

        this.isCancelled = true;
    }

    async componentDidMount() {
        document.title = APP_TITLE + (this.state.isEdit ? "Edit order" : "New order")

        if (!this.props.productsStore.products.data) {
            fetchAndHandleProducts(this.props.getProductsAction);
        }

        if (this.state.isEdit) {
            // check if order is locked
            try {
                await verifyLock(this.props.match.params.id, this.state.user)
            }
            catch (err) {
                handleVerifyLockError(this.props, err, this.state.user)
            }

            // if the order to edit is not in store
            // temp needed to set the value of address elements
            //let temp;
            if (!this.props.ordersPageStore.orderToEdit.data) {
                // temp = await this.getOrderDetails()
                await this.getOrderDetails()
            }
            else {

                // temp = this.props.ordersPageStore.orderToEdit.data
            }

            // fire immediately after mounting
            await lockOrder(this.props.match.params.id, this.state.user, DEFAULT_ORDER_LOCK_SECONDS)

            this.intervalId = setInterval(() => {
                lockOrder(this.props.match.params.id, this.state.user, DEFAULT_ORDER_LOCK_SECONDS)
            }, DEFAULT_ORDER_LOCK_SECONDS * 1000)

            // // mapping for calculating the total delivery price
            // temp.products.forEach(x => {
            //     x.product = this.props.productsStore.products.data[x.productName]
            // })
        }

        // run regardless if its add or edit
        this.smartformInterval = setInterval(() => {
            if (window.smartform && !window.smartformReloaded) {
                window.smartformReloaded = true
                window.smartform.rebindAllForms(true);
            }
        }, 5000);
    }

    componentDidUpdate() {
        if (this.state.isEdit && this.state.order && document.getElementById("streetAndNumber")) {
            // if (temp.contactType)
            //     this.setState({ conta:  });
            var temp = this.state.order
            document.getElementById("streetAndNumber").value = temp.address.street + " " + temp.address.streetNumber
            document.getElementById("city").value = temp.address.city ? temp.address.city : ""
            document.getElementById("zip").value = temp.address.psc ? temp.address.psc : ""
            document.getElementById("firstName").value = temp.address.firstName ? temp.address.firstName : ""
            document.getElementById("lastName").value = temp.address.lastName ? temp.address.lastName : ""
            document.getElementById("phone").value = temp.address.phone ? temp.address.phone : ""
            document.getElementById("company").value = temp.address.company ? temp.address.company : ""
            document.getElementById("deliveryPrice").value = temp.payment.price ? temp.payment.price : ""
            document.getElementById("vs").value = temp.payment.vs ? temp.payment.vs : ""
        }
    }

    getOrderDetails = async () => {
        try {
            var res = await getOrder(this.props.match.params.id)
            this.setState({ order: res.data });

            if (Number.isInteger(res.data.contactType)) {
                this.setState({ contactType: res.data.contactType });
            }

            this.props.openOrderDetailsAction({ data: res.data, success: true })
            return res.data;
        }
        catch (err) {
            this.props.showGenericModalAction({
                redirectTo: '/orders',
                parentProps: this.props,
                err: err
            })
        }
    }

    handleProductDropdownOnChange = (e, m, i, product) => {
        //product.product = this.props.productsStore.products.data[product.productName];
        var temp = this.handleProductDropdownOnChangeHelper(product, this.state.order, i);
        temp.totalPrice = this.getTotalPriceHelper(temp);
        if (!this.isCancelled) {
            this.setState(() => ({
                order: temp
            }));
        }
    };

    handleProductDropdownOnChangeHelper = (product, stateOrder, i) => {
        if (_.isNaN(product.count)) {
            product.count = ""
        }

        if (_.isNumber(product.count) || _.isNumber(product.pricePerOne)) {
            product.totalPricePerProduct = product.pricePerOne * product.count
        }
        else {
            product.totalPricePerProduct = ""
        }

        var o = Object.assign({}, stateOrder)
        o.products[i] = product
        let weight = 0
        o.products.forEach(x => {
            weight += this.props.productsStore.products.data.find(y => y.id === x.id).weight * x.count
        })
        if (stateOrder.deliveryType === deliveryTypes[0]) {
            o.payment.price = getGLSDeliveryPrice(weight, stateOrder.payment.cashOnDelivery)
        }

        return o;
    }

    getTotalPrice = () => {
        var o = Object.assign({}, this.state.order)
        o.totalPrice = this.getTotalPriceHelper(this.state.order);
        this.setState({ order: o });
    }

    handleDeliveryPriceOnChange = (e, { value }) => {
        var o = Object.assign({}, this.state.order)
        o.payment.price = Number(value)
        o.totalPrice = this.getTotalPriceHelper(o);

        this.setState({ order: o });
    }
    getTotalPriceHelper = (orderState) => {
        var sum = 0;

        sum = orderState.payment.price ? orderState.payment.price : 0

        orderState.products.forEach(product => {
            sum += product.count * product.pricePerOne
        });

        return sum;
    }

    renderProductsForMobile = (order) => {

        var result = []

        // map existing products
        result = order.products.map((product, i) => {
            return (
                <React.Fragment key={i}>
                    <ProductRow
                        allProducts={this.props.productsStore.products.data ? this.props.productsStore.products.data : {}}
                        i={i}
                        product={product}
                        removeProductFromOrder={this.removeProductFromOrder}
                        handleProductDropdownOnChange={this.handleProductDropdownOnChange} />
                </React.Fragment>
            )
        })

        // add new product
        result.push(
            <React.Fragment key={-1}>
                <Form.Field>
                    <label><Icon name='add' />Product Name</label>
                    <Dropdown
                        selection
                        onChange={(e, m) => {
                            let found = this.props.productsStore.products.data.find(x => x.name === m.value);

                            this.handleProductDropdownOnChange(
                                null, null, this.state.order.products.length,
                                {
                                    productName: m.value,
                                    count: 1,
                                    pricePerOne: found.price,
                                    product: found,
                                    id: found.id,
                                    category: found.category
                                })
                        }}
                        options={this.props.productsStore.products.data.map(x =>
                            ({
                                value: x.name,
                                text: x.name + " | " + x.category
                            })
                        )}
                        fluid
                        selectOnBlur={false}
                        selectOnNavigation={false}
                        placeholder='Type to search & add...'
                        search
                    />
                </Form.Field>
            </React.Fragment>
        )

        return result;
    }

    handleToggleDeliveryAndPaymentTypeButtons = (prop, type) => {
        var temp = this.handleToggleDeliveryButtonsHelper(prop, type, this.state.order);

        this.setState({ order: temp }, () => this.getTotalPrice());
    }

    handleToggleDeliveryButtonsHelper = (prop, type, stateOrder) => {
        var o = Object.assign({}, stateOrder)
        if ((prop === "deliveryType" && type === deliveryTypes[0]) || (prop === "deliveryCompany" && type === deliveryCompanies[0])) {
            o.payment.price = getGLSDeliveryPrice(o.products.map(x => x.product.weight).reduce((a, b) => a + b, 0), o.payment.cashOnDelivery)
        }
        else {
            o.payment.price = 0
        }

        o[prop] = type

        if (o.deliveryType === deliveryTypes[0] && !o.deliveryCompany) {
            o.deliveryCompany = deliveryCompanies[0]
        }

        return o;
    }

    handleToggleBankAccountPaymentButtons = (type) => {
        var o = Object.assign({}, this.state.order)
        o.payment.cashOnDelivery = type

        if (o.deliveryType === deliveryTypes[0] && o.deliveryCompany === deliveryCompanies[0]) {
            o.payment.price = getGLSDeliveryPrice(o.products.map(x => x.product.weight).reduce((a, b) => a + b, 0), type)
        }
        else {
            o.payment.price = 0
        }

        this.setState({ order: o });
    }

    removeProductFromOrder = (index) => {
        var o = Object.assign({}, this.state.order)
        o.products.splice(index, 1)
        o.totalPrice = this.getTotalPriceHelper(o)

        this.setState({ order: o });
    }

    // needed to make smartform working
    scrollToTop = () => {
        var currentScroll = document.documentElement.scrollTop || document.body.scrollTop;
        if (currentScroll > 0) {
            window.requestAnimationFrame(this.scrollToTop);
            window.scrollTo(0, currentScroll - (currentScroll / 5));
        }
    }

    handleOrder = async (order, props) => {
        if (contains(order.deliveryType, deliveryTypes[1])) {
            delete order.deliveryCompany
            delete order.payment.cashOnDelivery
            delete order.payment.vs
            delete order.payment.price
        }

        order.products.forEach(x => {
            delete x.product
        })

        // TODO: add branch picker
        order.branch = order.branch ? order.branch : "VN"

        // TODO: error is here
        if (document.getElementById("hiddenStreet").value) {
            order.address.street = document.getElementById("hiddenStreet").value
        }
        if (document.getElementById("hiddenStreetNumber").value) {
            order.address.streetNumber = document.getElementById("hiddenStreetNumber").value
        }

        order.address.city = document.getElementById("city").value
        order.address.psc = document.getElementById("zip").value

        order.totalPrice = this.getTotalPriceHelper(order);

        order.address.firstName = document.getElementById("firstName").value
        order.address.lastName = document.getElementById("lastName").value
        order.address.phone = document.getElementById("phone").value
        order.address.company = document.getElementById("company").value

        order.payment.price = document.getElementById("deliveryPrice").value ? parseInt(document.getElementById("deliveryPrice").value) : null
        order.note = document.getElementById("note").value
        order.contactType = this.state.contactType

        var user = localStorage.getItem(LOCALSTORAGE_NAME) ? JSON.parse(atob(localStorage.getItem(LOCALSTORAGE_NAME).split('.')[1])).username : ""

        if (this.state.isEdit) {
            if (document.getElementById("hiddenStreet").value) {
                order.address.street = document.getElementById("hiddenStreet").value
            }
            if (document.getElementById("hiddenStreetNumber").value) {
                order.address.streetNumber = document.getElementById("hiddenStreetNumber").value
            }

            saveOrder(order, user)
                .then(() => {
                    props.history.push('/orders')
                })
                .catch((err) => {
                    props.showGenericModalAction({
                        header: 'Failed to update order: ' + order.id,
                        parentProps: this.props,
                        err: err
                    })
                })
        }
        else {
            if (contains(order.deliveryType, deliveryTypes[0])) {
                let res = await getHighestVS();
                order.payment.vs = res.data
            }

            order.address.street = document.getElementById("hiddenStreet").value
            order.address.streetNumber = document.getElementById("hiddenStreetNumber").value

            order.payment.orderDate = moment().toISOString()

            createOrder(order, user)
                .then(() => {
                    props.history.push('/orders')
                })
                .catch((err) => {
                    props.showGenericModalAction({
                        header: 'Failed to create order',
                        parentProps: this.props,
                        err: err
                    })
                })
        }
    }

    handleStreetInput = (e) => {
        this.setState({ streetAndNumberInput: e.target.value })
    }

    handleStreetInputOnChange = (e) => {
        this.scrollToTop()
        if (this.state.isEdit) {
            this.handleStreetInput(e);
        }
    }

    handleContactTypeDropdownOnChange = (e, m) => {
        let found = CONTACT_TYPES.find(x => x.text === m.value)
        this.setState({ contactType: found.key });
    }

    render() {
        var grid;
        const { order, isMobile, isEdit } = this.state;

        // in case it's still loading data
        if (!this.props.productsStore.products.data) {
            return (
                <div className="messageBox">
                    <Message info icon>
                        <Icon name='circle notched' loading />
                        <Message.Content>
                            <Message.Header>Fetching products</Message.Header>
                        </Message.Content>
                    </Message>
                </div>
            )
        }

        if (isEdit) {
            if (!this.state.order) {
                return (
                    <div className="centered">
                        <Message info icon>
                            <Icon name='circle notched' loading />
                            <Message.Content>
                                <Message.Header>Loading order details</Message.Header>
                            </Message.Content>
                        </Message>
                    </div>
                )
            }
        }
        console.log("products: " + JSON.stringify(order.products))

        var headerButtons = (
            <Grid.Column width={isMobile ? null : 13} style={isMobile ? { paddingTop: '1em', paddingBottom: '1em' } : null}>
                <Button onClick={() => this.handleOrder(order, this.props)} fluid={isMobile} size='large' compact content='Save' id="primaryButton" />
                <Link to={{ pathname: '/orders', state: { isFromDetails: true } }}>
                    <Button
                        style={{ marginTop: '0.5em' }} id="secondaryButton" fluid={isMobile} size='medium'
                        compact content='Back'
                    />
                </Link>
            </Grid.Column>
        )

        let contactTypeDropdown = (
            <Dropdown
                value={this.state.contactType && CONTACT_TYPES[this.state.contactType].text}
                onChange={this.handleContactTypeDropdownOnChange} selection fluid options={
                    CONTACT_TYPES.map(x => {
                        if (x.icon) {
                            if (x.corner) {
                                return (
                                    {
                                        value: x.text,
                                        key: x.key,
                                        text: x.text,
                                        content: <Header as='h5' icon={(
                                            <>
                                                <Icon name={x.icon} />
                                                <Icon name={x.corner} />
                                            </>
                                        )} content={x.text} />
                                    }
                                )

                            }
                            else {
                                return (
                                    {
                                        value: x.text,
                                        key: x.key,
                                        text: x.text,
                                        content: <Header as='h5' icon={(
                                            <Icon name={x.icon} />
                                        )} content={x.text} />
                                    }
                                )
                            }
                        }
                        else {
                            return (
                                {
                                    value: x.text,
                                    key: x.key,
                                    text: x.text,
                                    content: <Header as='h5' image={{
                                        avatar: true,
                                        src: (window.location.protocol + '//' + window.location.host + "/icons/" + x.image)
                                    }} content={x.text} />
                                }
                            )
                        }
                    })
                }>
            </Dropdown>
        )

        if (isMobile) {
            // mobile
            grid = (
                <Grid stackable>
                    <Grid.Row>
                        <Grid.Column>
                            <Header as='h1'>
                                {isEdit ? 'Edit Order' : 'Add Order'}
                            </Header>
                        </Grid.Column>
                        {headerButtons}
                    </Grid.Row>
                    <Grid.Row columns='equal'>
                        <Grid.Column>
                            <Header block attached='top' as='h4'>
                                Contact Info
                            </Header>
                            <Segment attached='bottom'>
                                <Form className='form' size='large'>
                                    <Form.Field onClick={this.scrollToTop} >
                                        <label>
                                            Street and number
                                        </label>
                                        {isEdit ?
                                            <input name="nope" id="streetAndNumber" className="smartform-street-and-number" value={
                                                this.state.streetAndNumberInput != null ? this.state.streetAndNumberInput : order.address.street + " " + order.address.streetNumber
                                            } onChange={(e) => this.handleStreetInputOnChange(e)}></input> :
                                            <input onChange={this.handleStreetInputOnChange} name="nope" id="streetAndNumber" className="smartform-street-and-number"></input>}

                                        <input type="text" style={{ display: 'none' }} className="smartform-street" id="hiddenStreet" />
                                        <input type="text" style={{ display: 'none' }} className="smartform-number" id="hiddenStreetNumber" />
                                    </Form.Field>
                                    <Form.Field>
                                        <label>City</label>
                                        <input readOnly id="city" className="smartform-city"></input>
                                    </Form.Field>
                                    <Form.Field>
                                        <label>ZIP</label>
                                        <input readOnly id="zip" className="smartform-zip"></input>
                                    </Form.Field>
                                    <Form.Input id='firstName' label='First Name' fluid name='nope' />
                                    <Form.Input id='lastName' label='Last Name' fluid name='nope' />
                                    <Form.Input id='phone' label='Phone Number' fluid name='nope' />
                                    <Form.Input id='company' label='Company' fluid name='nope' />
                                    <Form.Field>
                                        <label>Contact Type</label>
                                        {contactTypeDropdown}
                                    </Form.Field>
                                </Form>
                            </Segment>
                        </Grid.Column>
                        <Grid.Column>
                            <Header block attached='top' as='h4'>
                                Delivery Info
                            </Header>
                            <Segment attached='bottom'>
                                <Form className='form' size='large'>
                                    {isEdit ? (
                                        <div className="marginTopAndBottomBig">
                                            <label><strong>VS</strong></label>
                                            <input readOnly id='vs' label='VS' name='vs' />
                                        </div>
                                    ) : null}
                                    <div className="marginTopAndBottomBig">
                                        <label><strong>Payment type</strong></label>
                                        <PaymentTypeButtonGroup deliveryType={order.deliveryType} handleToggleDeliveryAndPaymentTypeButtons={this.handleToggleDeliveryAndPaymentTypeButtons} />
                                    </div>
                                    {
                                        contains(order.deliveryType, deliveryTypes[0]) ? (
                                            <>
                                                <div className="marginTopAndBottomBig">
                                                    <label><strong>Delivery company</strong></label>
                                                    <DeliveryCompanyButtonGroup deliveryCompany={order.deliveryCompany} handleToggleDeliveryAndPaymentTypeButtons={this.handleToggleDeliveryAndPaymentTypeButtons} />
                                                </div>
                                                <div className="marginTopAndBottomBig">
                                                    <label><strong>Bank account payment</strong></label>
                                                    <BankAccountPaymentButtonGroup handleToggleBankAccountPaymentButtons={this.handleToggleBankAccountPaymentButtons} cashOnDelivery={order.payment.cashOnDelivery} />
                                                </div>
                                            </>
                                        ) : null
                                    }
                                </Form>
                            </Segment>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row columns="equal" >
                        <Grid.Column>
                            <Header block attached='top' as='h4'>
                                Products
                            </Header>
                            <Segment attached='bottom'>
                                <Form className='form' size='large'>
                                    {this.renderProductsForMobile(this.state.order)}
                                </Form>
                            </Segment>
                        </Grid.Column>
                        <Grid.Column>
                            <Header block attached='top' as='h4'>
                                Summary
                            </Header>
                            <Segment attached='bottom'>
                                <TotalPriceForm order={order} productsStore={this.props.productsStore} isMobile={isMobile} isEdit={isEdit} handleDeliveryPriceOnChange={this.handleDeliveryPriceOnChange} />
                            </Segment>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        {headerButtons}
                    </Grid.Row>
                </Grid >
            )
        }
        // desktop
        else {
            var productsTableColumnProperties = [
                {
                    name: "#",
                    width: 1,
                },
                {
                    name: "Product Name",
                    width: 7,
                },
                {
                    name: "Product Price [CZK]",
                    width: 2,
                },
                {
                    name: "Product Count [Pcs]",
                    width: 2,
                },
                {
                    name: "Total Product Price [CZK]",
                    width: 3,
                },
                {
                    name: "Remove",
                    width: 1,
                }
            ];

            var mappedAllProductsForDropdown = []
            if (this.props.productsStore.products.data) {
                mappedAllProductsForDropdown = this.props.productsStore.products.data
                    .filter(x => x.isActive)
                    .map(x =>
                        ({
                            value: x.name,
                            text: x.name + " | " + x.category
                        })
                    )
            }

            var productsTableRow = order.products.map((product, i) => {
                return (
                    <Table.Row key={product.id} >
                        <Table.Cell collapsing>
                            {i + 1}
                        </Table.Cell>
                        <Table.Cell>
                            <Dropdown
                                selection
                                onChange={(e, m) => {
                                    let found = this.props.productsStore.products.data.find(x => x.name === m.value);

                                    this.handleProductDropdownOnChange(
                                        null, null, i,
                                        {
                                            productName: m.value,
                                            count: 1,
                                            pricePerOne: found.price,
                                            id: found.id,
                                            category: found.category
                                        })
                                }}
                                options={mappedAllProductsForDropdown}
                                defaultValue={product.productName}
                                fluid
                                selectOnBlur={false}
                                selectOnNavigation={false}
                                placeholder='Type to search...'
                                search
                            />
                        </Table.Cell>
                        <Table.Cell collapsing>
                            <Form.Input
                                fluid
                                value={product.pricePerOne}
                                onChange={(e, m) => this.handleProductDropdownOnChange(null, null, i, {
                                    pricePerOne: m.value,
                                    productName: product.productName,
                                    count: product.count,
                                    id: product.id,
                                    category: product.category
                                })} />
                        </Table.Cell>
                        <Table.Cell collapsing>
                            <Form.Input
                                autoFocus
                                readOnly={product.category === 'Nonbillable' ? true : false}
                                fluid
                                value={product.category === 'Nonbillable' ? 1 : product.count}
                                onChange={(e, m) => this.handleProductDropdownOnChange(null, null, i, {
                                    pricePerOne: product.pricePerOne,
                                    productName: product.productName,
                                    count: parseInt(m.value),
                                    id: product.id,
                                    category: product.category
                                })} />
                        </Table.Cell>
                        <Table.Cell collapsing>
                            <Form.Input fluid readOnly value={product.totalPricePerProduct}></Form.Input>
                        </Table.Cell>
                        <Table.Cell textAlign='center'>
                            <Button onClick={() => this.removeProductFromOrder(i)} className="buttonIconPadding" icon="close"></Button>
                        </Table.Cell>
                    </Table.Row>
                )
            })

            // add new product
            productsTableRow.push(
                <Table.Row key={-1}>
                    <Table.Cell colSpan={6}>
                        <Dropdown
                            selection
                            onChange={(e, m) => {
                                let found = this.props.productsStore.products.data.find(x => x.name === m.value);

                                this.handleProductDropdownOnChange(
                                    null, null, order.products.length,
                                    {
                                        productName: m.value,
                                        count: 1,
                                        pricePerOne: found.price,
                                        product: found,
                                        id: found.id,
                                        category: found.category
                                    })
                            }}
                            options={mappedAllProductsForDropdown}
                            fluid
                            selectOnBlur={false}
                            selectOnNavigation={false}
                            placeholder='Type to search & add...'
                            search
                        />
                    </Table.Cell>
                </Table.Row>
            )

            grid = (
                <Grid stackable>
                    <Grid.Row>
                        <Grid.Column width={2}>
                            <Header as='h1'>
                                {isEdit ? 'Edit Order' : 'Add Order'}
                            </Header>
                        </Grid.Column>
                        {headerButtons}
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column width={7}>
                            <Header block attached='top' as='h4'>
                                Contact Info
                            </Header>
                            <Segment attached='bottom'>
                                <Form size='small'>
                                    <Grid>
                                        <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                                            <Grid.Column width={4}>
                                                <strong>
                                                    Street and number
                                                </strong>
                                            </Grid.Column>
                                            <Grid.Column width={12}>
                                                <Form.Field>
                                                    <Form.Input >
                                                        {isEdit ?
                                                            <input name="nope" id="streetAndNumber" className="smartform-street-and-number" value={
                                                                this.state.streetAndNumberInput != null ? this.state.streetAndNumberInput : order.address.street + " " + order.address.streetNumber
                                                            } onChange={(e) => this.handleStreetInputOnChange(e)}></input> :
                                                            <input onChange={this.handleStreetInputOnChange} name="nope" id="streetAndNumber" className="smartform-street-and-number"></input>}

                                                        <input type="text" style={{ display: 'none' }} className="smartform-street" id="hiddenStreet" />
                                                        <input type="text" style={{ display: 'none' }} className="smartform-number" id="hiddenStreetNumber" />
                                                    </Form.Input>
                                                </Form.Field>
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                                            <Grid.Column width={4}>
                                                <strong>
                                                    City
                                                </strong>
                                            </Grid.Column>
                                            <Grid.Column width={12}>
                                                <Form.Field>
                                                    <Form.Input>
                                                        <input readOnly id="city" className="smartform-city"></input>
                                                    </Form.Input>
                                                </Form.Field>
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                                            <Grid.Column width={4}>
                                                <strong>
                                                    ZIP
                                                </strong>
                                            </Grid.Column>
                                            <Grid.Column width={12}>
                                                <Form.Field>
                                                    <Form.Input>
                                                        <input readOnly id="zip" className="smartform-zip"></input>
                                                    </Form.Input>
                                                </Form.Field>
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Divider></Divider>
                                        <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                                            <Grid.Column width={4}>
                                                <strong>
                                                    First Name
                                                </strong>
                                            </Grid.Column>
                                            <Grid.Column width={12}>
                                                <Form.Input fluid id="firstName" name="nope" />
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                                            <Grid.Column width={4}>
                                                <strong>
                                                    Last Name
                                                </strong>
                                            </Grid.Column>
                                            <Grid.Column width={12}>
                                                <Form.Input fluid id='lastName' name="nope" />
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                                            <Grid.Column width={4}>
                                                <strong>
                                                    Phone Number
                                                </strong>
                                            </Grid.Column>
                                            <Grid.Column width={12}>
                                                <Form.Input fluid id='phone' name="nope" />
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row verticalAlign='middle' style={{ paddingTop: '0.25em', paddingBottom: '1em' }}>
                                            <Grid.Column width={4}>
                                                <strong>
                                                    Company
                                                </strong>
                                            </Grid.Column>
                                            <Grid.Column width={12}>
                                                <Form.Input fluid id='company' name="nope" />
                                            </Grid.Column>
                                        </Grid.Row>
                                        <Grid.Row verticalAlign='middle' style={{ paddingTop: '0.25em', paddingBottom: '1em' }}>
                                            <Grid.Column width={4}>
                                                <strong>
                                                    Contact Type
                                                </strong>
                                            </Grid.Column>
                                            <Grid.Column width={12}>
                                                {contactTypeDropdown}
                                            </Grid.Column>
                                        </Grid.Row>
                                    </Grid>
                                </Form>
                            </Segment>
                            <Header block attached='top' as='h4'>
                                Delivery Info
                            </Header>
                            <Segment attached='bottom'>
                                <Grid>
                                    {isEdit && (

                                        <Grid.Row>
                                            <Grid.Column width={5}>
                                                <strong>
                                                    VS
                                            </strong>
                                            </Grid.Column>
                                            <Grid.Column width={10}>
                                                <Form>
                                                    <input readOnly id='vs' label='VS' name='vs' />
                                                </Form>
                                            </Grid.Column>
                                        </Grid.Row>
                                    )}
                                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomMedium">
                                        <Grid.Column width={5}>
                                            <strong>
                                                Payment type
                                            </strong>
                                        </Grid.Column>
                                        <Grid.Column width={10}>
                                            <PaymentTypeButtonGroup deliveryType={order.deliveryType} handleToggleDeliveryAndPaymentTypeButtons={this.handleToggleDeliveryAndPaymentTypeButtons} />
                                        </Grid.Column>
                                    </Grid.Row>
                                    {
                                        contains(order.deliveryType, deliveryTypes[0]) ? (
                                            <>
                                                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomMedium">
                                                    <Grid.Column width={5}>
                                                        <strong>
                                                            Delivery company
                                                            </strong>
                                                    </Grid.Column>
                                                    <Grid.Column width={10}>
                                                        <DeliveryCompanyButtonGroup deliveryCompany={order.deliveryCompany} handleToggleDeliveryAndPaymentTypeButtons={this.handleToggleDeliveryAndPaymentTypeButtons} />
                                                    </Grid.Column>
                                                </Grid.Row>
                                                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomMedium">
                                                    <Grid.Column width={5}>
                                                        <strong>
                                                            Bank account payment
                                                            </strong>
                                                    </Grid.Column>
                                                    <Grid.Column width={10}>
                                                        <BankAccountPaymentButtonGroup handleToggleBankAccountPaymentButtons={this.handleToggleBankAccountPaymentButtons} cashOnDelivery={order.payment.cashOnDelivery} />
                                                    </Grid.Column>
                                                </Grid.Row>
                                            </>
                                        ) : (
                                                <>
                                                    <Grid.Row></Grid.Row>
                                                    <Grid.Row></Grid.Row>
                                                    <Grid.Row></Grid.Row>
                                                </>
                                            )
                                    }
                                </Grid>
                            </Segment>
                        </Grid.Column>
                        <Grid.Column width={9}>
                            <Header block attached='top' as='h4'>
                                Products
                            </Header>
                            <Segment attached='bottom'>
                                <SimpleTable columnProperties={productsTableColumnProperties} body={productsTableRow} showHeader={productsTableRow.length > 1 ? true : false} compact="very" />
                            </Segment>
                            <Header block attached='top' as='h4'>
                                Summary
                            </Header>
                            <Segment attached='bottom'>
                                <TotalPriceForm productsStore={this.props.productsStore} order={order} isMobile={isMobile} isEdit={isEdit} handleDeliveryPriceOnChange={this.handleDeliveryPriceOnChange} />
                            </Segment>
                        </Grid.Column>
                    </Grid.Row>
                </Grid >
            )
        }
        return (
            <>
                {grid}
            </>
        )
    }
}


function mapStateToProps(state) {
    return {
        ordersPageStore: state.OrdersReducer,
        baseStore: state.BaseReducer,
        productsStore: state.ProductsReducer
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getProductsAction,
        openOrderDetailsAction
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(OrderInfo);