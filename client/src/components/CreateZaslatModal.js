import React from 'react';
import { Button, Modal, Grid, Segment, Header, Form, Popup, Icon, Divider, TextArea, Dropdown, Message } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { getSenders, getOrder, orderDelivery } from '../utils/requests';
import { getProductsAction, getSendersAction, showGenericModalAction, getOrderAction } from '../utils/actions';
import { ORDER_DELIVERY_JSON } from '../appConfig';
import { fetchAndHandleProducts } from '../handlers/productHandler';
import OrderProductsWeightTablePopup from './OrderProductsWeightTablePopup';

const SenderDropdown = (props) => {
    return (
        <Popup trigger={
            <span>
                <Dropdown
                    disabled
                    fluid
                    selection
                    onChange={props.handleSenderDropdownChange}
                    options={props.senders ? props.senders : []}
                    text={props.currentSender ? props.currentSender.label : null}
                    selectOnBlur={false}
                    selectOnNavigation={false} />
            </span>
        }
            size='large'
            inverted
            on={props.isMobile ? 'click' : 'hover'}
            content="We are using parcel shops to send. Can not specify sender address anymore!" />
    )
}
class CreateZaslatModal extends React.PureComponent {

    state = {
        isMobile: this.props.isMobile,
        sender: null,
        hasOrderDeliveryStarted: false
    }
    async componentDidMount() {
        getSenders()
            .then(res => {
                this.props.getSendersAction({ success: true, data: res.data.map(e => ({ text: e.label, value: e.id, obj: e })) })
                this.setState({ sender: res.data[0] });
            })
            .catch(err => {
                this.props.getSendersAction({ success: true, error: err })
            })

        var temp = this.props.order
        if (!this.props.productsStore.products.data) {
            await fetchAndHandleProducts(
                this.props.getProductsAction,
                this.props.showGenericModalAction, {
                    redirectTo: '/orders',
                    parentProps: this.props
                })
        }

        let totalWeight = 0
        temp.products.forEach(
            x => totalWeight += this.props.products.data.find(y => y.id === x.id).weight * x.count
        )

        totalWeight += 500
        totalWeight = totalWeight / 1000

        // setting default values and order specific values
        document.getElementById("width").value = 20
        document.getElementById("height").value = 20
        document.getElementById("length").value = 20
        document.getElementById("weight").value = totalWeight

        document.getElementById("bankAccountPayment").value = temp.payment.cashOnDelivery ? "No" : "Yes"
        document.getElementById("totalPrice").value = temp.totalPrice
        document.getElementById("note").value = "POZOR: Prosím před příjezdem zavolejte příjemci na tel. " + temp.address.phone + ". V případě problému, volejte odesílateli."

        document.getElementById("streetCustomer").value = temp.address.street
        document.getElementById("streetNumberCustomer").value = temp.address.streetNumber
        document.getElementById("cityCustomer").value = temp.address.city ? temp.address.city : ""
        document.getElementById("zipCustomer").value = temp.address.psc ? temp.address.psc : ""
        document.getElementById("firstNameCustomer").value = temp.address.firstName ? temp.address.firstName : ""
        document.getElementById("lastNameCustomer").value = temp.address.lastName ? temp.address.lastName : ""
        document.getElementById("phoneCustomer").value = temp.address.phone ? temp.address.phone : ""
        document.getElementById("companyCustomer").value = temp.address.company ? temp.address.company : ""
    }
    handleSenderDropdownChange = (e, { value }) => {
        var senders = this.props.zaslatStore.senders
        this.setState({ sender: senders.data.find(x => x.value === value).obj });
    }

    close = () => {
        this.props.closeCreateZaslatModal()
    }

    orderDelivery = async () => {
        this.setState({ hasOrderDeliveryStarted: true });
        var parsed = ORDER_DELIVERY_JSON
        parsed.shipments[0].reference = this.props.order.payment.vs
        parsed.shipments[0].to.firstname = this.props.order.address.firstName
        parsed.shipments[0].to.surname = this.props.order.address.lastName
        parsed.shipments[0].to.street = this.props.order.address.street + " " + this.props.order.address.streetNumber
        parsed.shipments[0].to.city = this.props.order.address.city
        parsed.shipments[0].to.zip = this.props.order.address.psc
        parsed.shipments[0].to.phone = this.props.order.address.phone
        parsed.shipments[0].to.company = this.props.order.address.company

        if (this.props.order.payment.cashOnDelivery) {
            parsed.shipments[0].services[1].data.bank_variable = this.props.order.payment.vs
            parsed.shipments[0].services[1].data.value.value = this.props.order.totalPrice
        }
        else {
            delete parsed.shipments[0].services
        }

        parsed.shipments[0].packages[0].weight = parseFloat(document.getElementById("weight").value)
        parsed.shipments[0].packages[0].width = parseInt(document.getElementById("width").value)
        parsed.shipments[0].packages[0].height = parseInt(document.getElementById("height").value)
        parsed.shipments[0].packages[0].length = parseInt(document.getElementById("length").value)

        parsed.shipments[0].note = document.getElementById("note").value

        var payload = {
            shipment: parsed,
            orderId: this.props.order.id,
            shipmentType: parsed.shipments[0].type
        }

        try {
            await orderDelivery(payload)
        }
        catch (err) {
            this.props.showGenericModalAction({
                err: err,
                header: "Failed to send the order to Zaslat"
            })
        }

        try {
            let res = await getOrder(payload.orderId)
            this.props.getOrderAction({ success: true, data: res.data })
            this.props.closeCreateZaslatModal()
        }
        catch (err) {
            this.props.showGenericModalAction({
                err: err,
                header: "Failed to get order after sending to Zaslat"
            })
        }
        finally {
            this.setState({ hasOrderDeliveryStarted: false });
        }
    }

    render() {
        let { isMobile } = this.state
        var popup, modalContent, packageSegment, deliverySegment,
            customerSegment, senderSegment = null

        if (this.props.productsStore.products.data) {
            popup = (
                <OrderProductsWeightTablePopup
                    isMobile={isMobile}
                    order={this.props.order}
                    productsStore={this.props.productsStore} />
            )
        }

        customerSegment = (
            <Grid>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            Street
                                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form.Input disabled fluid id="streetCustomer" />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            Street number
                                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form.Input disabled fluid id="streetNumberCustomer" />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            City
                                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form.Input disabled fluid id="cityCustomer" />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            ZIP
                                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form.Input disabled fluid id="zipCustomer" />
                    </Grid.Column>
                </Grid.Row>
                <Divider />
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            First Name
                                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form.Input disabled fluid id="firstNameCustomer" />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            Last Name
                                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form.Input id='lastNameCustomer' disabled fluid />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            Phone Number
                                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form.Input id='phoneCustomer' disabled fluid />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' style={{ paddingTop: '0.25em', paddingBottom: '1em' }}>
                    <Grid.Column width={5}>
                        <strong>
                            Company
                                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form.Input id='companyCustomer' disabled fluid />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        )

        if (this.state.sender) {
            senderSegment = (
                <Grid>
                    <Grid.Row className="paddingTopAndBottomSmall">
                        <Grid.Column width={16}>
                            <SenderDropdown
                                handleSenderDropdownChange={this.handleSenderDropdownChange}
                                senders={this.props.zaslatStore.senders.data}
                                currentSender={this.state.sender}
                                isMobile={isMobile}
                            />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={5}>
                            <strong>Street</strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <Form.Input value={this.state.sender.street} disabled fluid id="streetSender" />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={5}>
                            <strong>Street number</strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <Form.Input value={this.state.sender.street_number} disabled fluid id="streetNumberSender" />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={5}>
                            <strong>City</strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <Form.Input value={this.state.sender.city} disabled fluid id="citySender" />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={5}>
                            <strong>ZIP</strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <Form.Input value={this.state.sender.zip} disabled fluid id="zipSender" />
                        </Grid.Column>
                    </Grid.Row>
                    <Divider />
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={5}>
                            <strong>First Name</strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <Form.Input value={this.state.sender.firstname} disabled fluid id="firstNameSender" />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={5}>
                            <strong>Last Name</strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <Form.Input value={this.state.sender.lastname} id='lastNameSender' disabled fluid />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={5}>
                            <strong>Phone Number</strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <Form.Input value={this.state.sender.phone_number} id='phoneSender' disabled fluid />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' style={{ paddingTop: '0.25em', paddingBottom: '1em' }}>
                        <Grid.Column width={5}>
                            <strong>Company</strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <Form.Input value={this.state.sender.company} id='companySender' disabled fluid />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            )
        }
        else {
            senderSegment = (
                <Message positive icon >
                    <Icon name='circle notched' loading />
                    <Message.Content content={
                        <Message.Header>Fetching senders</Message.Header>
                    }>
                    </Message.Content>
                </Message>
            )
        }

        if (isMobile) {
            packageSegment = (
                <Grid>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={5}>
                            <strong>
                                Width [cm]
                                    </strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <Form.Input fluid id="width" />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={5}>
                            <strong>
                                Height [cm]
                                    </strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <Form.Input fluid id="height" />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={5}>
                            <strong>
                                Length [cm]
                                    </strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <Form.Input fluid id="length" />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={5}>
                            <strong>
                                Weight [kg]
                                {popup}
                            </strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <Form.Input fluid id="weight" />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            )

            deliverySegment = (
                <Form>
                    <Form.Field>
                        <label>Note to Zaslat</label>
                        <TextArea autoHeight rows={2} id="note" />
                    </Form.Field>
                    <Form.Field>
                        <label>Bank account payment</label>
                        <input readOnly id="bankAccountPayment" ></input>
                    </Form.Field>
                    <Form.Field>
                        <label>Total price [CZK]</label>
                        <input readOnly id="totalPrice" ></input>
                    </Form.Field>
                </Form>
            )
        }
        else {
            packageSegment = (
                <Grid>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={2}>
                            <strong>
                                Width [cm]
                                        </strong>
                        </Grid.Column>
                        <Grid.Column width={3}>
                            <Form.Input fluid id="width" />
                        </Grid.Column>
                        <Grid.Column width={3}>
                            <strong>
                                Total price [CZK]
                                        </strong>
                        </Grid.Column>
                        <Grid.Column width={8}>
                            <Form.Input disabled fluid id="totalPrice" />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={2}>
                            <strong>
                                Height [cm]
                                        </strong>
                        </Grid.Column>
                        <Grid.Column width={3}>
                            <Form.Input fluid id="height" />
                        </Grid.Column>
                        <Grid.Column width={3}>
                            <strong>
                                Bank account payment
                                        </strong>
                        </Grid.Column>
                        <Grid.Column width={8}>
                            <Form.Input disabled fluid id="bankAccountPayment" />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={2}>
                            <strong>
                                Length [cm]
                                        </strong>
                        </Grid.Column>
                        <Grid.Column width={3}>
                            <Form.Input fluid id="length" />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={2}>
                            <strong>
                                Weight [kg]
                                            {popup}
                            </strong>
                        </Grid.Column>
                        <Grid.Column width={3}>
                            <Form.Input fluid id="weight" />
                        </Grid.Column>
                        <Grid.Column width={3}>
                            <strong>
                                Note to Zaslat
                                        </strong>
                        </Grid.Column>
                        <Grid.Column width={8}>
                            <Form>
                                <TextArea autoHeight rows={2} id="note" />
                            </Form>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            )
        }

        modalContent = (
            <Grid stackable>
                <Grid.Row>
                    <Grid.Column>
                        <Header block attached='top' as='h4'>
                            Package info
                        </Header>
                        <Segment attached='bottom' >
                            {packageSegment}
                        </Segment>
                    </Grid.Column>
                </Grid.Row>
                {isMobile ? (
                    <Grid.Row>
                        <Grid.Column>
                            <Header block attached='top' as='h4'>
                                Delivery info
                        </Header>
                            <Segment attached='bottom' >
                                {deliverySegment}
                            </Segment>
                        </Grid.Column>
                    </Grid.Row>
                ) : null}
                <Grid.Row columns='equal'>
                    <Grid.Column>
                        <Header block attached='top' as='h4'>
                            Customer info
                        </Header>
                        <Segment attached='bottom' >
                            {customerSegment}
                        </Segment>
                    </Grid.Column>
                    <Grid.Column>
                        <Header block attached='top' as='h4'>
                            Sender info
                        </Header>
                        <Segment attached='bottom' >
                            {senderSegment}
                        </Segment>
                    </Grid.Column>
                </Grid.Row>
            </Grid>

        )

        return (
            <Modal
                closeOnDimmerClick={false}
                dimmer={true}
                size='large'
                open={this.props.show}
                closeOnEscape={true}
                onClose={() => this.close()}
            >
                {isMobile ? (
                    <Modal.Actions className={isMobile ? "zaslatActions" : null}>
                        <Button
                            loading={this.state.hasOrderDeliveryStarted}
                            onClick={() => this.orderDelivery()}
                            labelPosition='right'
                            className="primaryButton"
                            icon='checkmark'
                            content='Export'
                        />
                        <Button
                            onClick={() => this.close()}
                            labelPosition='right'
                            icon='close'
                            content='Close'
                        />
                    </Modal.Actions>
                ) : null}
                <Modal.Header>
                    Send to Zaslat
                </Modal.Header>
                <Modal.Content>
                    {modalContent}
                </Modal.Content>
                <Modal.Actions className={isMobile ? "zaslatActions" : null}>
                    <Button
                        onClick={() => this.orderDelivery()}
                        labelPosition='right'
                        className="primaryButton"
                        icon='checkmark'
                        content='Export'
                    />
                    <Button
                        onClick={() => this.close()}
                        labelPosition='right'
                        icon='close'
                        content='Close'
                    />
                </Modal.Actions>
            </Modal>
        )
    }
}

function mapStateToProps(state) {
    return {
        ordersPageStore: state.OrdersReducer,
        zaslatStore: state.ZaslatReducer,
        productsStore: state.ProductsReducer
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getProductsAction,
        getSendersAction,
        showGenericModalAction,
        getOrderAction,
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateZaslatModal);