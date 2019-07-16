import React from 'react'
import { Button, Modal, Form, Grid, Header, Segment, Icon, Dropdown, Table, Divider } from 'semantic-ui-react';
import { editPurchase, createPurchase } from '../utils/requests';
import { showGenericModalAction, editPurchaseAction, createPurchaseAction } from '../utils/actions';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Flatpickr from 'react-flatpickr';
import moment from 'moment';
import { SUPPLIERS, LOCALSTORAGE_NAME } from '../appConfig';
import SimpleTable from './SimpleTable';
import { isISOString } from '../utils/helpers';

class AddEditPurchaseModal extends React.PureComponent {

    renderProductsForMobile = (products, mappedAllProductsForDropdown) => {

        var result = []

        // map existing products
        result = products.map((product, i) => {
            return (
                <React.Fragment key={product.productId}>
                    <Form.Field>
                        <label>Product Name</label>
                        <Dropdown
                            selection
                            onChange={(e, m) => {
                                let found = this.props.products.data.find(x => x.name === m.value);

                                this.handleProductDropdownOnChange(
                                    i,
                                    {
                                        productId: found.id,
                                        productName: found.name,
                                        count: product.count
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
                    </Form.Field>
                    <Form.Field>
                        <Form.Group>
                            <label>Product Count</label>
                            <Form.Input
                                autoFocus
                                fluid
                                value={product.count}
                                onChange={(e, m) => {
                                    this.handleProductDropdownOnChange(
                                        i,
                                        {
                                            productId: product.productId,
                                            productName: product.productName,
                                            count: m.value
                                        })
                                }} />
                            <Button onClick={() => this.removeProductFromPurchase(i)} className="buttonIconPadding" icon="close"></Button>
                        </Form.Group>
                    </Form.Field>
                    <Divider style={{ borderColor: '#f20056' }} />
                </React.Fragment>
            )
        })

        // add new product
        result.push(
            <React.Fragment key={-1}>
                <Form.Field>
                    <label><Icon name='add' />Add Product</label>
                    <Dropdown
                        selection
                        onChange={(e, m) => {
                            let found = this.props.products.data.find(x => x.name === m.value);

                            this.handleProductDropdownOnChange(
                                products.length,
                                {
                                    productId: found.id,
                                    productName: found.name,
                                    count: 1
                                })
                        }}
                        options={mappedAllProductsForDropdown}
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

    handleSavePurchase = () => {
        let { date, to, products } = this.state;

        let payload = {
            date: !isISOString(date) ? date.toISOString() : date,
            to: to,
            products: products,
        }

        payload.user = localStorage.getItem(LOCALSTORAGE_NAME) ? JSON.parse(atob(localStorage.getItem(LOCALSTORAGE_NAME).split('.')[1])).username : ""
        if (this.props.purchase) {
            payload.id = this.props.purchase.id
            editPurchase(payload)
                .then(() => {
                    this.props.editPurchaseAction({ success: true, data: payload });
                })
                .catch((err) => {
                    this.props.showGenericModalAction({
                        header: "Failed to edit purchase",
                        err: err
                    })
                })
                .finally(() => {
                    this.props.handleTogglePurchaseModal()
                })
        }
        else {
            createPurchase(payload)
                .then((res) => {
                    this.props.createPurchaseAction({ success: true, data: res.data });
                })
                .catch((err) => {
                    this.props.showGenericModalAction({
                        header: "Failed to create purchase",
                        err: err
                    })
                })
                .finally(() => {
                    this.props.handleTogglePurchaseModal()
                })
        }
    }

    handleSupplierDropdownOnChange = (e, m) => {
        let found = m.options.find(x => x.key === m.value)
        this.setState({ to: found.text });
    }

    handleProductDropdownOnChange = (i, product) => {
        let products = this.state.products.slice();

        product.count = Number.parseInt(product.count)

        products[i] = product;
        this.setState({ products: products });
    };


    state = {
        date: this.props.purchase ? this.props.purchase.date : moment().local().toISOString(),
        to: this.props.purchase && this.props.purchase.to,
        products: this.props.purchase ? this.props.purchase.products : [],
    }

    handleFlatpickr = (event, m, c) => {
        this.setState({ [c.element.className.split(" ")[0]]: moment(event[0]) });
    }

    removeProductFromPurchase = (index) => {
        let products = this.state.products.slice();
        products.splice(index, 1)

        this.setState({ products });
    }

    render() {

        let content;

        let { date, to, products } = this.state;

        var mappedAllProductsForDropdown = []
        if (this.props.products.data) {
            mappedAllProductsForDropdown = this.props.products.data
                .filter(x => x.isActive)
                .map(x =>
                    ({
                        value: x.name,
                        text: x.name + " | " + x.category
                    })
                )
        }

        if (this.props.isMobile) {
            content = (
                <Grid stackable>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column>
                            <Header block attached='top' as='h4'>
                                Date
                            </Header>
                            <Segment attached="bottom">
                                <Form>
                                    <Form.Field>
                                        <Flatpickr
                                            defaultValue={date ? date : null}
                                            className="date"
                                            onChange={this.handleFlatpickr}
                                            options={{
                                                dateFormat: 'd.m.Y', disableMobile: true, locale: {
                                                    "firstDayOfWeek": 1 // start week on Monday
                                                }
                                            }} />
                                    </Form.Field>
                                </Form>
                            </Segment>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column>
                            <Header block attached='top' as='h4'>
                                To
                            </Header>
                            <Segment attached="bottom">
                                <Form>
                                    <Dropdown
                                        defaultValue={to && SUPPLIERS.findIndex(x => x.email === to)}
                                        onChange={this.handleSupplierDropdownOnChange}
                                        fluid
                                        selection
                                        options={SUPPLIERS.map((e, i) => ({ key: i, text: e.email, value: i }))} />
                                </Form>
                            </Segment>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row columns="equal" >
                        <Grid.Column>
                            <Header block attached='top' as='h4'>
                                Products
                            </Header>
                            <Segment attached="bottom">
                                <Form>
                                    {this.renderProductsForMobile(products, mappedAllProductsForDropdown)}
                                </Form>
                            </Segment>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            )
        }
        else {
            let productsTableColumnProperties = [
                {
                    name: "#",
                    width: 1,
                },
                {
                    name: "Product Name",
                    width: 7,
                },
                {
                    name: "Product Count [Pcs]",
                    width: 2,
                },
                {
                    name: "Remove",
                    width: 1,
                }
            ];

            let productsTableRow = products.map((product, i) => {
                return (
                    <Table.Row key={product.productId} >
                        <Table.Cell collapsing>
                            {i + 1}
                        </Table.Cell>
                        <Table.Cell>
                            <Dropdown
                                selection
                                onChange={(e, m) => {
                                    let found = this.props.products.data.find(x => x.name === m.value);

                                    this.handleProductDropdownOnChange(
                                        i,
                                        {
                                            productId: found.id,
                                            productName: found.name,
                                            count: product.count
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
                                autoFocus
                                fluid
                                value={product.count}
                                onChange={(e, m) => {
                                    this.handleProductDropdownOnChange(
                                        i,
                                        {
                                            productId: product.productId,
                                            productName: product.productName,
                                            count: m.value
                                        })
                                }} />
                        </Table.Cell>

                        <Table.Cell textAlign='center'>
                            <Button onClick={() => this.removeProductFromPurchase(i)} className="buttonIconPadding" icon="close"></Button>
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
                                let found = this.props.products.data.find(x => x.name === m.value);

                                this.handleProductDropdownOnChange(
                                    products.length,
                                    {
                                        productId: found.id,
                                        productName: found.name,
                                        count: 1
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

            content = (
                <Grid>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={5}>
                            <strong>
                                Date
                        </strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <Form>
                                <Form.Field>
                                    <Flatpickr
                                        defaultValue={date ? date : null}
                                        className="date"
                                        onChange={this.handleFlatpickr}
                                        options={{
                                            dateFormat: 'd.m.Y', disableMobile: true, locale: {
                                                "firstDayOfWeek": 1 // start week on Monday
                                            }
                                        }} />
                                </Form.Field>
                            </Form>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={5}>
                            <strong>
                                To
                        </strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <Dropdown
                                defaultValue={to && SUPPLIERS.findIndex(x => x.email === to)}
                                onChange={this.handleSupplierDropdownOnChange}
                                fluid
                                selection
                                options={SUPPLIERS.map((e, i) => ({ key: i, text: e.email, value: i }))} />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                        <Grid.Column width={5}>
                            <strong>
                                Products
                        </strong>
                        </Grid.Column>
                        <Grid.Column width={11}>
                            <SimpleTable columnProperties={productsTableColumnProperties} body={productsTableRow} showHeader={productsTableRow.length > 1 ? true : false} compact="very" />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            )
        }

        return (
            <Modal
                size='small'
                open={this.props.show}
                closeOnDimmerClick={true}
                closeOnEscape={true}
                closeIcon={true}
                onClose={() => this.props.handleTogglePurchaseModal()}
            >
                <Modal.Header>{this.props.purchase ? 'Edit purchase' : 'Add purchase'}</Modal.Header>
                <Modal.Content>
                    {content}
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        disabled={!(to && date && products.length > 0)}
                        onClick={this.handleSavePurchase}
                        className="primaryButton"
                        labelPosition='right'
                        icon='checkmark'
                        content='OK'
                    />
                    <Button
                        onClick={() => this.props.handleTogglePurchaseModal()}
                        labelPosition='right'
                        icon='checkmark'
                        content='Close'
                    />
                </Modal.Actions>
            </Modal>
        )
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        showGenericModalAction,
        editPurchaseAction,
        createPurchaseAction
    }, dispatch);
}

export default connect(null, mapDispatchToProps)(AddEditPurchaseModal);