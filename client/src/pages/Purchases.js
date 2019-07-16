import React from 'react';
import ErrorMessage from '../components/ErrorMessage';
import { Grid, Header, Message, Icon, Button, Table, Transition, Input, List } from 'semantic-ui-react';
import PurchasesTable from '../components/PurchasesTable';
import AddEditPurchaseModal from '../components/AddEditPurchaseModal';
import { debounce, filterInArrayOfObjects, buildFilter } from '../utils/helpers';
import { APP_TITLE, GET_ORDERS_LIMIT } from '../appConfig';
import moment from 'moment';

class Purchases extends React.PureComponent {

    constructor(props) {
        super(props);

        this.updateFilters = debounce(this.updateFilters, 1000);
    }
    state = {
        isPurchaseModalShowing: false,
        showFunctionsMobile: false,
        multiSearchInput: "",
        recordsLimit: this.props.isMobile && GET_ORDERS_LIMIT / 5,
    }

    componentDidMount() {
        document.title = APP_TITLE + "Purchases"
    }

    loadMoreData = () => {
        var currentLimit = this.state.recordsLimit + 100
        this.setState({ recordsLimit: currentLimit });
    }

    handleTogglePurchaseModal = (purchaseToEdit, isMobile) => {
        if (purchaseToEdit) {
            if (!isMobile) {
                purchaseToEdit.products = typeof purchaseToEdit.products === "string" ? JSON.parse(purchaseToEdit.products) : purchaseToEdit.products
            }
        }

        this.setState({ isPurchaseModalShowing: !this.state.isPurchaseModalShowing, purchaseToEdit });
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

    render() {

        // in case of error
        if (!this.props.purchases.success) {
            return (
                <Grid stackable>
                    <Grid.Row>
                        <Grid.Column>
                            <Header as='h1'>
                                Costs
                            </Header>
                            <ErrorMessage error={this.props.purchases.error} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            );
        }

        // in case it's still loading data
        if (!this.props.purchases.data) {
            return (
                <div className="messageBox">
                    <Message info icon>
                        <Icon name='circle notched' loading />
                        <Message.Content>
                            <Message.Header>Fetching purchases</Message.Header>
                        </Message.Content>
                    </Message>
                </div>
            )
        }

        let purchaseModal, mappedPurchases, filteredByMultiSearch;
        let { isPurchaseModalShowing, purchaseToEdit } = this.state;

        if (isPurchaseModalShowing) {
            purchaseModal = (
                <AddEditPurchaseModal isMobile={this.props.isMobile} purchase={purchaseToEdit} products={this.props.products} show={isPurchaseModalShowing} handleTogglePurchaseModal={this.handleTogglePurchaseModal} />
            )
        }

        if (this.props.isMobile) {

            let purchases = this.props.purchases.data
            if (this.state.multiSearchInput && this.state.multiSearchInput.length > 1) { // if filter is specified
                filteredByMultiSearch = filterInArrayOfObjects(buildFilter(this.state.multiSearchInput), purchases, ["date", "to", "user", "products"], true)
            }
            else {
                filteredByMultiSearch = purchases
            }

            let pageHeader = (
                <Grid stackable>
                    <Grid.Row>
                        <Grid.Column>
                            <Header as='h1'>
                                Purchases
                                <Button toggle onClick={this.toggleShowFunctionsMobile} floated='right' style={{ backgroundColor: this.state.showFunctionsMobile ? '#f2005696' : '#f20056', color: 'white' }} content={this.state.showFunctionsMobile ? 'Hide' : 'Show'} />
                            </Header>
                        </Grid.Column>
                    </Grid.Row>
                    <Transition.Group animation='drop' duration={500}>
                        {this.state.showFunctionsMobile && (
                            <Grid.Row>
                                <Grid.Column>
                                    <Button style={{ marginBottom: '0.3em' }} onClick={() => this.handleTogglePurchaseModal()} fluid size='large' compact content='Add Purchase' className="primaryButton" />
                                    <Input
                                        style={{ width: document.getElementsByClassName("ui fluid input drop visible transition")[0] ? document.getElementsByClassName("ui fluid input drop visible transition")[0].clientWidth : null }}
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

            mappedPurchases = filteredByMultiSearch.slice(0, this.state.recordsLimit).map(purchase => {
                // mobile return
                return (
                    <Table.Row
                        key={purchase.id}
                        textAlign='center'>
                        <Table.Cell>
                            <Grid columns={2} style={{ marginTop: '0', marginBottom: '0', paddingLeft: '0.25em', paddingRight: '0.25em' }}>
                                <Grid.Row style={{ padding: '0.25em' }} verticalAlign='middle'>
                                    <Grid.Column width={16}>
                                        {moment(purchase.date).local().format('DD.MM.')}<strong> |</strong> {purchase.to} <strong>|</strong> {purchase.user}
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row>
                                    <Grid.Column width={13}>
                                        <List>{purchase.products.map(x => {
                                            return (
                                                <List.Item key={x.productId}>
                                                    {x.productName + ": " + x.count}
                                                </List.Item>
                                            )
                                        })}</List>
                                    </Grid.Column>
                                    <Grid.Column style={{ textAlign: 'right' }} width={3}>
                                        <>
                                            <Button
                                                onClick={() => this.handleTogglePurchaseModal(purchase, true)}
                                                className='buttonIconPadding'
                                                size='large'
                                                icon='edit' />
                                            <Button
                                                onClick={() => this.props.handleDeletePurchase(purchase.id)}
                                                className='buttonIconPadding'
                                                size='large'
                                                icon='remove' />
                                        </>
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Table.Cell>
                    </Table.Row>
                )
            })
            let table = (
                <Table compact basic='very'>
                    <Table.Header>
                        <Table.Row className="textAlignCenter">
                            <Table.HeaderCell width={2}>Date | Supplier | By</Table.HeaderCell>
                            <Table.HeaderCell width={1}>Products</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {mappedPurchases}
                    </Table.Body>
                </Table>
            )

            return (
                <>
                    {purchaseModal}
                    {pageHeader}
                    {table}
                    {
                        this.state.multiSearchInput === "" && (
                            <Button onClick={this.loadMoreData} style={{ marginTop: '0.5em' }} fluid>Show More</Button>
                        )
                    }
                </>
            )
        }
        else {
            return (
                <Grid stackable>
                    {purchaseModal}
                    <Grid.Row style={{ marginBottom: '1em' }}>
                        <Grid.Column width={2}>
                            <Header as='h1'>
                                Purchases
                            </Header>
                        </Grid.Column>
                        <Grid.Column width={2} textAlign='left'>
                            <Button onClick={() => this.handleTogglePurchaseModal()} fluid size='large' compact content='Add Purchase' className="primaryButton" />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column>
                            <PurchasesTable handleDeletePurchase={this.props.handleDeletePurchase} handleTogglePurchaseModal={this.handleTogglePurchaseModal} compact="very" rowsPerPage={50} data={this.props.purchases.data} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            )
        }
    }
}

export default Purchases;