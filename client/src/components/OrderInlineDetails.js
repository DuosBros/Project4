import React from 'react';
import { Grid, Table, Header, Divider, Popup, Image, Icon } from 'semantic-ui-react'
import SimpleTable from './SimpleTable';
import { getOrderTableRowStyle } from '../utils/helpers';
import { CONTACT_TYPES } from '../appConfig';
const OrderInlineDetails = (props) => {
    let result;
    let totalProductCount = 0

    if (Array.isArray(props.order.products)) {
        props.order.products.forEach(product => {
            if (product.category !== 'Nonbillable') {
                totalProductCount += product.count
            }
        })
    }

    let contactType = (
        Number.isInteger(props.order.contactType) ? (
            CONTACT_TYPES[props.order.contactType].icon ? (
                CONTACT_TYPES[props.order.contactType].corner ? (
                    <><strong>Contact type: </strong>
                        <>
                            <Icon name={CONTACT_TYPES[props.order.contactType].icon} />
                            <Icon name={CONTACT_TYPES[props.order.contactType].corner} />
                        </> {CONTACT_TYPES[props.order.contactType].text} <br /></>
                ) : (
                        <><strong>Contact type:</strong> <Icon name={CONTACT_TYPES[props.order.contactType].icon} /> {CONTACT_TYPES[props.order.contactType].text} <br /></>
                    )
            ) : (
                    <>   <strong>Contact type:</strong> <Image avatar inline src={window.location.protocol + '//' + window.location.host + "/icons/" + CONTACT_TYPES[props.order.contactType].image} /> {CONTACT_TYPES[props.order.contactType].text} <br /> </>
                )
        ) : (
                <>   <strong>Contact type:</strong> - </>
            )
    )
    if (props.isMobile) {
        result = (
            <Table.Cell>
                <Grid style={{ marginTop: '0.5em' }}>
                    <Grid.Row textAlign='left' columns='equal' style={{ paddingTop: '0px' }}>
                        <Grid.Column>
                            <strong>First name:</strong> {props.order.address.firstName} <br />
                            <strong>Last name:</strong> {props.order.address.lastName} <br />
                            <strong>Phone:</strong> {props.order.address.phone} <br />
                            <strong>Street:</strong> {props.order.address.street} <br />
                            <strong>City:</strong> {props.order.address.city} <br />
                            <strong>Street number:</strong> {props.order.address.streetNumber} <br />
                            <strong>ZIP:</strong> {props.order.address.psc} <br />
                        </Grid.Column>
                        <Grid.Column textAlign='left'>
                            <strong>Company:</strong> {props.order.address.company} <br />
                            <strong>Bank payment:</strong> {props.order.payment.cashOnDelivery ? "no" : "yes"} <br />
                            <strong>Delivery:</strong> {props.order.deliveryCompany ? props.order.deliveryType + " + " + props.order.deliveryCompany : props.order.deliveryType} <br />
                            {contactType} <br />
                            <strong>Note:</strong> {props.order.note} <br />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row style={{ fontWeight: 'bold', fontSize: '0.8em', paddingTop: '0px', paddingBottom: '0px' }}>
                        <Grid.Column width={9}>
                            Product
                        </Grid.Column>
                        <Grid.Column width={1} style={{ paddingLeft: '0px', paddingRight: '0px', maxWidth: '85px' }}>
                            #
                        </Grid.Column>
                        <Grid.Column width={3}>
                            <Popup hideOnScroll className="popup" inverted trigger={<p className='popup'>PpU [CZK]</p>} openOnTriggerClick={true} content='Price per Unit [CZK]' />
                        </Grid.Column>
                        <Grid.Column width={3} style={{ bottom: '0.25em' }}>
                            Sum [CZK]
                        </Grid.Column>
                    </Grid.Row>
                    {props.order.products.map((product, index) => {
                        if (product.category !== 'Nonbillable') {
                            return (
                                <Grid.Row key={index} className="noPaddingTopAndBottom">
                                    <Grid.Column style={{ fontSize: '0.8em' }} width={9}>
                                        {product.productName}
                                    </Grid.Column>
                                    <Grid.Column width={1} style={{ fontSize: '0.8em', paddingLeft: '0px', paddingRight: '0px', maxWidth: '85px' }}>
                                        {product.count}
                                    </Grid.Column>
                                    <Grid.Column style={{ fontSize: '0.8em' }} width={3}>
                                        {product.pricePerOne}
                                    </Grid.Column>
                                    <Grid.Column style={{ fontSize: '0.8em' }} width={3}>
                                        <strong>{product.totalPricePerProduct}</strong>
                                    </Grid.Column>
                                </Grid.Row>
                            )
                        }
                        else {
                            return (
                                <Grid.Row key={index} className="noPaddingTopAndBottom">
                                    <Grid.Column style={{ fontSize: '0.8em' }} width={9}>
                                        <i>{product.productName}</i>
                                    </Grid.Column>
                                    <Grid.Column width={1} style={{ fontSize: '0.8em', paddingLeft: '0px', paddingRight: '0px', maxWidth: '85px' }}>
                                    </Grid.Column>
                                    <Grid.Column style={{ fontSize: '0.8em' }} width={3}>
                                    </Grid.Column>
                                    <Grid.Column style={{ fontSize: '0.8em' }} width={3}>
                                        <i>{product.totalPricePerProduct}</i>
                                    </Grid.Column>
                                </Grid.Row>
                            )
                        }
                    })}
                    <Grid.Row className="noPaddingTopAndBottom">
                        <Grid.Column style={{ fontSize: '0.8em' }} width={9}>
                            <i>Delivery fee</i>
                        </Grid.Column>
                        <Grid.Column width={1} style={{ fontSize: '0.8em', paddingLeft: '0px', paddingRight: '0px', maxWidth: '85px' }}>
                        </Grid.Column>
                        <Grid.Column style={{ fontSize: '0.8em' }} width={3}>
                        </Grid.Column>
                        <Grid.Column style={{ fontSize: '0.8em' }} width={3}>
                            <i>{props.order.payment.price}</i>
                        </Grid.Column>
                    </Grid.Row>
                    <Divider fitted style={{ marginTop: '0px', marginBottom: '0px' }} />
                    <Grid.Row className="noPaddingTopAndBottom">
                        <Grid.Column width={9}>
                            <strong>Total</strong>
                        </Grid.Column>
                        <Grid.Column width={1} style={{ paddingLeft: '0px', paddingRight: '0px', maxWidth: '85px' }}>
                            <strong>{totalProductCount}</strong>
                        </Grid.Column>
                        <Grid.Column width={3}>
                        </Grid.Column>
                        <Grid.Column width={3}>
                            <strong>{props.order.totalPrice}</strong>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Table.Cell>
        )
    }
    else {
        let productTableBody = props.order.products.map((product, index) => {
            if (product.category !== 'Nonbillable') {
                return (
                    <Table.Row key={index}>
                        <Table.Cell >{product.productName}</Table.Cell>
                        <Table.Cell >{product.count}</Table.Cell>
                        <Table.Cell >{product.pricePerOne} Kč</Table.Cell>
                        <Table.Cell>{product.totalPricePerProduct} Kč</Table.Cell>
                    </Table.Row>
                )
            }
            else {
                return (
                    <Table.Row key={index}>
                        <Table.Cell><i>{product.productName}</i></Table.Cell>
                        <Table.Cell></Table.Cell>
                        <Table.Cell></Table.Cell>
                        <Table.Cell><i>{product.totalPricePerProduct} Kč</i></Table.Cell>
                    </Table.Row>
                )
            }
        })
        props.order.payment.price && (
            productTableBody.push(
                <Table.Row key={props.order.products.length + 1}>
                    <Table.Cell>
                        <i>Delivery fee</i>
                    </Table.Cell>
                    <Table.Cell>
                    </Table.Cell>
                    <Table.Cell>
                    </Table.Cell>
                    <Table.Cell>
                        <i>{props.order.payment.price} Kč</i>
                    </Table.Cell>
                </Table.Row>
            )
        )
        productTableBody.push(
            <Table.Row key={props.order.products.length + 2}>
                <Table.Cell>
                    <strong>Total</strong>
                </Table.Cell>
                <Table.Cell>
                    <strong>{totalProductCount}</strong>
                </Table.Cell>
                <Table.Cell>
                </Table.Cell>
                <Table.Cell>
                    <strong>{props.order.totalPrice} Kč</strong>
                </Table.Cell>
            </Table.Row>
        )
        let style = getOrderTableRowStyle(props.order)
        style.borderTopWidth = '0'

        result = (
            <Table.Row>
                <Table.Cell style={style} colSpan={9}>
                    <Grid style={{ marginTop: '1em', marginBottom: '1.5em', paddingLeft: '1em', paddingRight: '1em', color: 'black' }}>
                        <Grid.Row style={{ padding: '0.5em' }}>
                            <Grid.Column width={4}>
                                <Header as='h4'>
                                    Customer info
                                </Header>
                            </Grid.Column>
                            <Grid.Column width={4}>
                            </Grid.Column>
                            <Grid.Column width={8}>
                                <Header as='h4'>
                                    Order info
                                </Header>
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row>
                            <Grid.Column width={4}>
                                <strong>First name:</strong> {props.order.address.firstName} <br />
                                <strong>Last name:</strong> {props.order.address.lastName} <br />
                                <strong>Phone:</strong> {props.order.address.phone} <br />
                                <strong>Company:</strong> {props.order.address.company} <br />
                                {
                                    contactType
                                }
                                <Divider />
                                <strong>Bank account payment:</strong> {props.order.payment.cashOnDelivery ? "no" : "yes"} <br />
                            </Grid.Column>
                            <Grid.Column width={4}>
                                <strong>Street:</strong> {props.order.address.street} <br />
                                <strong>City:</strong> {props.order.address.city} <br />
                                <strong>Street number:</strong> {props.order.address.streetNumber} <br />
                                <strong>ZIP:</strong> {props.order.address.psc} <br />
                                <Divider />
                                <strong>Delivery:</strong> {props.order.deliveryCompany ? props.order.deliveryType + " + " + props.order.deliveryCompany : props.order.deliveryType} <br />
                            </Grid.Column>
                            <Grid.Column width={8}>
                                <SimpleTable showHeader={true} columnProperties={
                                    [
                                        {
                                            name: "Name",
                                            width: 4,
                                        },
                                        {
                                            name: "Count",
                                            width: 4,
                                        },
                                        {
                                            name: "Unit price",
                                            width: 4,
                                        },
                                        {
                                            name: "Amount",
                                            width: 4,
                                        }
                                    ]
                                } body={productTableBody} />
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Table.Cell>
            </Table.Row>
        )
    }

    return (
        result
    )
}

export default OrderInlineDetails;