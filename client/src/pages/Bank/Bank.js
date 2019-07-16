import React from 'react';
import { Icon, Message, Grid, Header, Table, Input, Button, Transition, Popup, Modal, Dropdown, Form, Segment, Checkbox } from 'semantic-ui-react';
import moment from 'moment';
import ErrorMessage from '../../components/ErrorMessage';
import { APP_TITLE, GET_ORDERS_LIMIT, SUPPLIERS } from '../../appConfig';
import { filterInArrayOfObjects, debounce, contains, pick, buildFilter } from '../../utils/helpers';
import OrderInlineDetails from '../../components/OrderInlineDetails';
import ExportDropdown from '../../components/ExportDropdown';
import { createPurchase, editWarehouseProduct } from '../../utils/requests';
import SimpleTable from '../../components/SimpleTable';
import Flatpickr from 'react-flatpickr';

const MarkAllButtons = (props) => {
    return (
        <>
            <Button loading={props.hasMarkAllAsPaidStarted} onClick={() => props.handleMarkAllAsPaidButton(props.notPaidOrders)} fluid size='small' disabled={props.notPaidOrders.length > 0 ? false : true} content={'Mark orders as paid (' + props.notPaidOrders.length + ')'} id="primaryButton" />
        </>
    )
}
class Bank extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            isAddToWarehouseChecked: true,
            showCategoryModal: false,
            multiSearchInput: "",
            isMobile: props.isMobile,
            showFunctionsMobile: false,
            inputWidth: 0,
            showMultiSearchFilter: false,
            recordsLimit: props.isMobile ? GET_ORDERS_LIMIT / 5 : GET_ORDERS_LIMIT,
            rowIdsShowingDetails: [],
            products: []
        }

        this.updateFilters = debounce(this.updateFilters, 500);

        this.showTogglePaidOrdersButtonRef = React.createRef()
    }

    componentDidMount() {
        document.title = APP_TITLE + "Bank"
    }

    loadMoreTransactions = () => {
        var currentLimit = this.state.recordsLimit + 100
        this.setState({ recordsLimit: currentLimit });
    }

    filterData = (transactions, multiSearchInput) => {

        return filterInArrayOfObjects(
            buildFilter(multiSearchInput),
            transactions,
            [
                "date",
                "value",
                "vs",
                "accountNameSender",
                "accountIdSender",
                "note"
            ])
    }

    toggleShowFunctionsMobile = () => {
        this.setState({ showFunctionsMobile: !this.state.showFunctionsMobile })
    }

    handleFilterChange = (e, { value }) => {
        this.updateFilters(value ? value : "");
    }

    updateFilters = (value) => {
        this.setState({ multiSearchInput: value });
    }

    showFilter = () => {
        // for mobile shit
        if (this.showTogglePaidOrdersButtonRef.current) {
            this.setState({ inputWidth: this.showTogglePaidOrdersButtonRef.current.ref.offsetWidth });
        }

        this.setState({ showMultiSearchFilter: true })
    }

    toggleInlineDetails = (id, e) => {
        // do not fire if onclick was triggered on child elements
        e.preventDefault();
        if (e.target.className.indexOf("column") > -1 || e.target.className === "") {
            if (this.state.rowIdsShowingDetails.indexOf(id) > -1) {
                this.setState({
                    rowIdsShowingDetails: this.state.rowIdsShowingDetails.filter(x => {
                        return x !== id
                    })
                });
            }
            else {
                this.setState(prevState => ({
                    rowIdsShowingDetails: [...prevState.rowIdsShowingDetails, id]
                }))
            }
        }
    }

    handleCategoryModalAddCost = () => {
        this.setState({ hasAddToCostStarted: true });
        if (this.state.category === "Products purchase") {
            this.handleSavePurchase()
            debugger
            if (this.state.isAddToWarehouseChecked) {
                this.state.products.forEach(async product => {
                    let payload = {
                        difference: product.count,
                        user: this.props.user
                    }
                    await editWarehouseProduct(product.productId, payload)
                })
            }
        }
        let transaction = this.state.transaction;
        transaction.category = this.state.category;
        debugger
        this.props.handleAddTransactionToCost(transaction)
        this.setState({ hasAddToCostStarted: false });
        this.setState({ showCategoryModal: !this.state.showCategoryModal })
    }

    handleAddition = (e, { value }) => {
        this.setState({ category: value });
    }

    handleCategoryDropdownOnChange = (e, b) => {
        let category = this.props.costCategories[b.value]
        if (category) {
            this.setState({ category: category.text });
        }
    }

    handleSavePurchase = () => {
        let { date, to, products } = this.state;
        let payload = {
            date: date,
            to: to,
            products: products,
        }

        payload.user = this.props.user

        createPurchase(payload)
            .catch((err) => {
                this.props.showGenericModalAction({
                    header: "Failed to create purchase",
                    err: err
                })
            })
    }

    handleSupplierDropdownOnChange = (e, m) => {
        let found = m.options.find(x => x.key === m.value)
        this.setState({ to: found.text });
    }

    handleFlatpickr = (event, m, c) => {
        this.setState({ [c.element.className.split(" ")[0]]: moment(event[0]) });
    }

    removeProductFromPurchase = (index) => {
        let products = this.state.products.slice();
        products.splice(index, 1)

        this.setState({ products });
    }

    handleProductDropdownOnChange = (i, product) => {
        let products = this.state.products.slice();

        product.count = Number.parseInt(product.count)

        products[i] = product;
        this.setState({ products: products });
    };

    handleOnChangeCheckbox = (e, { name, checked }) => {
        this.setState({ [name]: checked });
    }

    render() {
        // in case of error
        if (!(this.props.transactions.success && this.props.costs.success)) {
            return (
                <Grid stackable>
                    <Grid.Row>
                        <Grid.Column>
                            <Header as='h1'>
                                Bank transaction
                            </Header>
                            <ErrorMessage handleRefresh={this.props.fetchBankTransactions} error={this.props.transactions.error} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            );
        }

        // in case it's still loading data
        if (!(this.props.transactions.data && this.props.costs.data)) {
            return (
                <div className="messageBox">
                    <Message info icon>
                        <Icon name='circle notched' loading />
                        <Message.Content>
                            <Message.Header>Fetching bank transactions</Message.Header>
                        </Message.Content>
                    </Message>
                </div>
            )
        }

        let categoryModal;
        if (this.state.showCategoryModal) {
            let purchaseSection;
            if (this.state.category === "Products purchase") {

                let { date, to, products } = this.state;

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

                let productsTableRow = this.state.products.map((product, i) => {
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

                purchaseSection = (
                    <Grid.Column>
                        <Header block attached='top' as='h4'>
                            Purchase record
                        </Header>
                        <Segment attached='bottom' >
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
                                <Grid.Row>
                                    <Grid.Column>
                                        <Checkbox name="isAddToWarehouseChecked" onChange={this.handleOnChangeCheckbox} label="Add products to warehouse" checked={this.state.isAddToWarehouseChecked} />
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Segment>
                    </Grid.Column>
                )
            }

            categoryModal = (
                <Modal
                    closeOnDimmerClick={false}
                    dimmer={true}
                    size='small'
                    open={this.state.showCategoryModal}
                    closeOnEscape={true}
                    closeIcon={true}
                    onClose={() => this.setState({ showCategoryModal: !this.state.showCategoryModal })}
                >
                    <Modal.Header>
                        Add Category
                    </Modal.Header>
                    <Modal.Content>
                        <Grid>
                            <Grid.Row>
                                <Grid.Column>
                                    <dl className="dl-horizontal">
                                        <dt>Date:</dt>
                                        <dd>{this.state.transaction.date}</dd>
                                        <dt>Cost:</dt>
                                        <dd>{this.state.transaction.value}</dd>
                                        <dt>Note:</dt>
                                        <dd>{this.state.transaction.note}</dd>
                                    </dl>
                                </Grid.Column>
                            </Grid.Row>
                            <Grid.Row>
                                <Grid.Column>
                                    Category
                                <Dropdown
                                        search
                                        allowAdditions
                                        onAddItem={this.handleAddition}
                                        fluid
                                        selection
                                        text={this.state.category}
                                        onChange={this.handleCategoryDropdownOnChange}
                                        options={this.props.costCategories}
                                        selectOnBlur={false}
                                        selectOnNavigation={false} />
                                </Grid.Column>
                            </Grid.Row>
                            <Grid.Row>
                                {purchaseSection}
                            </Grid.Row>
                        </Grid>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button
                            content="Close"
                            onClick={() => this.setState({ showCategoryModal: false })}
                        />
                        <Button
                            disabled={this.state.products.length <= 0 && this.state.category === "Products purchase"}
                            loading={this.state.hasAddToCostStarted}
                            className="primaryButton"
                            onClick={() => this.handleCategoryModalAddCost()}
                            labelPosition='right'
                            icon='checkmark'
                            content='Add to Cost'
                        />
                    </Modal.Actions>
                </Modal >
            )
        }

        const { multiSearchInput, isMobile, showFunctionsMobile, showMultiSearchFilter, recordsLimit, rowIdsShowingDetails } = this.state;
        let filteredByMultiSearch, mappedTransactions, table, pageHeader, notPaidOrders;
        let transactions = this.props.transactions.data;
        let costs = this.props.costs.data;

        if (multiSearchInput && multiSearchInput.length > 1) { // if filter is specified
            filteredByMultiSearch = this.filterData(transactions, multiSearchInput);
        } else {
            filteredByMultiSearch = transactions.slice(0, recordsLimit);
        }

        notPaidOrders = []
        mappedTransactions = filteredByMultiSearch.map(transaction => {
            let transactionInlineDetails, actionButtons = null

            if (rowIdsShowingDetails.indexOf(transaction.index) > -1) {
                if (transaction.order) {
                    transactionInlineDetails = <OrderInlineDetails products={this.props.products} order={transaction.order} isMobile={isMobile} />
                } else {
                    transactionInlineDetails = isMobile ? <Table.Cell>No order details mapped. Probably not an incoming transaction.</Table.Cell> : <Table.Row style={transaction.rowStyle}><Table.Cell colSpan='6'>No order details mapped. Probably not an incoming transaction.</Table.Cell></Table.Row>
                }
            }

            if (transaction.isTransactionIncoming) {
                if (transaction.order) {
                    if (transaction.order.totalPrice !== transaction.value) {
                        transaction.areValuesNotMatching = true
                    }
                    if (!transaction.order.payment.paid) {
                        notPaidOrders.push(transaction.order)
                        actionButtons = <Button onClick={() => this.props.handleTogglePaidOrder(transaction.order)} className="buttonIconPadding" size={isMobile ? 'huge' : 'medium'} icon='dollar sign' />
                    }
                }
            } else {
                let found = costs.some(cost => {
                    return (cost.dateFormated === transaction.date && cost.description === transaction.note && contains(cost.note, "Generated from Bank page"))
                })

                if (!found) {
                    actionButtons = <Button onClick={() => this.setState({ showCategoryModal: !this.state.showCategoryModal, transaction: transaction, date: moment(transaction.date, "DD.MM.YYYY").toISOString() })} className="buttonIconPadding" size={isMobile ? 'huge' : 'medium'} icon='dollar sign' />
                }
            }

            if (isMobile) {
                // mobile return
                return (
                    <Table.Row
                        onClick={(e) => this.toggleInlineDetails(transaction.index, e)}
                        key={transaction.index}
                        style={transaction.rowStyle}
                        textAlign='center'>
                        <Table.Cell>
                            <Grid style={{ marginTop: '0', marginBottom: '0', paddingLeft: '1em', paddingRight: '1em' }}>
                                <Grid.Row style={{ padding: '0.5em' }}>
                                    <Grid.Column width={13}>
                                        {transaction.note}
                                    </Grid.Column>
                                    <Grid.Column style={{ textAlign: 'right' }} width={3}>
                                        {actionButtons}
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row style={{ padding: '0.5em' }}>
                                    <Grid.Column width={13}>
                                        {transaction.vs} <strong>|</strong> {moment(transaction.date, 'DD.MM.YYYY').local().format('DD.MM')} <strong>|</strong> {transaction.value}
                                    </Grid.Column>
                                    <Grid.Column style={{ textAlign: 'right' }} width={3}>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Table.Cell>
                        {transactionInlineDetails}
                    </Table.Row>
                )
            } else {
                // desktop return
                return (
                    <React.Fragment key={transaction.index}>
                        <Table.Row
                            onClick={(e) => this.toggleInlineDetails(transaction.index, e)}
                            style={transaction.rowStyle}
                            textAlign='center'>
                            <Table.Cell>{transaction.index}</Table.Cell>
                            <Table.Cell>{transaction.date}</Table.Cell>
                            <Table.Cell><strong>{transaction.value}</strong>{transaction.areValuesNotMatching && <Popup inverted trigger={<Icon color="red" name="warning" />} content="Transaction value is not matching with order value" />}</Table.Cell>
                            <Table.Cell>{transaction.vs}</Table.Cell>
                            <Table.Cell>{transaction.note}</Table.Cell>
                            <Table.Cell>{actionButtons}</Table.Cell>
                        </Table.Row>
                        {transactionInlineDetails}
                    </React.Fragment>
                )
            }
        })


        if (isMobile) {
            table = (
                <Table compact basic='very'>
                    <Table.Header>
                        <Table.Row className="textAlignCenter">
                            <Table.HeaderCell width={2}>Note</Table.HeaderCell>
                            <Table.HeaderCell width={1}>VS | Date | Price [CZK]</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {mappedTransactions}
                    </Table.Body>
                </Table>
            )

            pageHeader = (
                <Grid stackable>
                    <Grid.Row>
                        <Grid.Column>
                            <Header as='h1'>
                                Bank
                                <Button toggle onClick={this.toggleShowFunctionsMobile} floated='right' style={{ backgroundColor: showFunctionsMobile ? '#f2005696' : '#f20056', color: 'white' }} content={showFunctionsMobile ? 'Hide' : 'Show'} />
                            </Header>
                        </Grid.Column>
                        <Grid.Column>
                            <strong>Balance:</strong> {this.props.bankAccountInfo.closingBalance} CZK
                        </Grid.Column>
                    </Grid.Row>
                    <Transition.Group animation='drop' duration={500}>
                        {showFunctionsMobile && (
                            <Grid.Row>
                                <MarkAllButtons hasMarkAllAsPaidStarted={this.props.hasMarkAllAsPaidStarted} handleMarkAllAsPaidButton={this.props.handleMarkAllAsPaidButton} notPaidOrders={notPaidOrders} />
                                <Grid.Column>
                                    <Input
                                        style={{ width: document.getElementsByClassName("ui fluid input drop visible transition")[0] ? document.getElementsByClassName("ui fluid input drop visible transition")[0].clientWidth : null }}
                                        ref={this.handleRef}
                                        fluid
                                        name="multiSearchInput"
                                        placeholder='Search...'
                                        onChange={this.handleFilterChange} />
                                </Grid.Column>
                            </Grid.Row>
                        )}
                    </Transition.Group>
                </Grid>
            )
        } else {
            table = (
                <Table compact padded basic='very'>
                    <Table.Header>
                        <Table.Row className="textAlignCenter">
                            <Table.HeaderCell width={1}>#</Table.HeaderCell>
                            <Table.HeaderCell width={2}>Date</Table.HeaderCell>
                            <Table.HeaderCell width={2}>Value [CZK]</Table.HeaderCell>
                            <Table.HeaderCell width={3}>VS</Table.HeaderCell>
                            <Table.HeaderCell width={6}>Note</Table.HeaderCell>
                            <Table.HeaderCell width={1}>Actions</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {mappedTransactions}
                    </Table.Body>
                </Table>
            )

            pageHeader = (
                <Grid>
                    <Grid.Row columns={5} style={{ marginBottom: '1em' }}>
                        <Grid.Column width={2}>
                            <Header as='h1' content='Bank' />
                            <ExportDropdown data={pick(filteredByMultiSearch, ["date", "value", "vs", "note"])} />
                        </Grid.Column>
                        <Grid.Column width={4}>
                            <Header as='h4'>
                                <strong>Balance:</strong> {this.props.bankAccountInfo.closingBalance} CZK
                            </Header>
                        </Grid.Column>
                        <Grid.Column width={2}>
                            <MarkAllButtons hasMarkAllAsPaidStarted={this.props.hasMarkAllAsPaidStarted} handleMarkAllAsPaidButton={this.props.handleMarkAllAsPaidButton} notPaidOrders={notPaidOrders} />
                        </Grid.Column>
                        <Grid.Column width={3}>
                        </Grid.Column>
                        <Grid.Column width={2}>
                        </Grid.Column>
                        <Grid.Column width={3} textAlign='left' floated='right'>
                            <Transition animation='drop' duration={500} visible={showMultiSearchFilter}>
                                <>
                                    <Input
                                        fluid
                                        ref={this.handleRef}
                                        name="multiSearchInput"
                                        placeholder='Search...'
                                        onChange={this.handleFilterChange} />
                                </>
                            </Transition>
                            {
                                !showMultiSearchFilter && (
                                    <div style={{ textAlign: 'right' }}>
                                        <Icon
                                            name='search'
                                            style={{ backgroundColor: '#f20056', color: 'white', marginRight: '0.2em' }}
                                            circular
                                            link
                                            onClick={this.showFilter} />
                                    </div>
                                )
                            }
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            )
        }

        // render page
        return (
            <>
                {categoryModal}
                {pageHeader}
                {table}
                {
                    multiSearchInput === "" && (
                        <Button onClick={this.loadMoreTransactions} style={{ marginTop: '0.5em' }} fluid>Show More</Button>
                    )
                }
            </>
        )
    }
}

export default Bank;