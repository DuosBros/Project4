import React from 'react';

import { Grid, Header, Button, Message, Icon, Input, Transition, Table, Modal, Form } from 'semantic-ui-react';
import ErrorMessage from '../../components/ErrorMessage';
import { APP_TITLE } from '../../appConfig';
import WarehouseTable from '../../components/WarehouseTable';
import { optionsDropdownMapper, buildFilter, filterInArrayOfObjects, debounce, isNum } from '../../utils/helpers';
import AddEditProductModal from '../../components/AddEditProductModal';
import moment from 'moment';
import ProductHistoryTable from '../../components/ProductHistoryTable';

export default class Warehouse extends React.PureComponent {

    constructor(props) {
        super(props);

        let month;
        let year;
        if (props.location.search) {
            let param = new URLSearchParams(props.location.search)
            month = param.get("month")
            year = param.get("year")
        }

        let currentMonth = (moment().month() + 1).toString();
        let currentYear = (moment().year()).toString()
        this.state = {
            showProductHistoryModal: false,
            productCountToEdit: null,
            difference: null,
            isMobile: props.isMobile,
            multiSearchInput: "",
            showFunctionsMobile: false,
            isGroupingEnabled: true,
            showProductModal: false,
            productToEdit: null,
            month: month ? month : currentMonth,
            year: year ? year : currentYear,
            currentMonth,
            currentYear
        }

        this.updateFilters = debounce(this.updateFilters, 1000);

    }
    componentDidMount() {
        document.title = APP_TITLE + "Warehouse"
        this.updateRoute(this.state.month, this.state.year);

    }

    updateRoute = (month, year) => {
        var route = "/warehouse?month=" + month + "&year=" + year;
        this.props.history.push(route);
    }

    handleToggleGrouping = () => {
        this.setState({ isGroupingEnabled: !this.state.isGroupingEnabled });
    }

    handleToggleProductHistoryModal = (product) => {
        this.setState({ showProductHistoryModal: !this.state.showProductHistoryModal, productHistoryToShow: product });
    }

    handleToggleProductModal = (product) => {
        this.setState({ showProductModal: !this.state.showProductModal, productToEdit: product });
    }

    toggleShowFunctionsMobile = () => {
        this.setState({ showFunctionsMobile: !this.state.showFunctionsMobile })
    }

    handleFilterChange = (e, { value }) => {
        this.updateFilters(value ? value : "");
    }

    handleOnChange = (e, { value, name }) => {
        this.setState({ [name]: value });
    }

    updateFilters = (value) => {
        this.setState({ multiSearchInput: value });
    }

    setInput = (e, b) => {
        this.setState({ [b.id]: b.value },
            () => {
                if (isNum(this.state.month) && isNum(this.state.year)) {
                    this.props.fetchAndHandleWarehouseProducts(this.state.month, this.state.year);
                    this.updateRoute(this.state.month, this.state.year);
                }
            });
    }

    handleEditWarehouseProductcount = (product) => {
        this.setState({ productCountToEdit: product, showEditProductCountModal: true, difference: "" });
    }

    editWarehouseProductcount = () => {
        let parsed = parseInt(this.state.difference)
        this.props.handleEditWarehouseProductCount(this.state.productCountToEdit.id, parsed);
        this.setState({ showEditProductCountModal: false });
    }

    render() {

        // in case of error
        if (!this.props.warehouseProducts.success) {
            return (
                <Grid stackable>
                    <Grid.Row>
                        <Grid.Column>
                            <Header as='h1'>
                                Warehouse
                            </Header>
                            <ErrorMessage handleRefresh={this.props.fetchAndHandleWarehouseProducts} error={this.props.warehouseProducts.error} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            );
        }

        // in case it's still loading data
        if (!this.props.warehouseProducts.data) {
            return (
                <div className="messageBox">
                    <Message info icon>
                        <Icon name='circle notched' loading />
                        <Message.Content>
                            <Message.Header>Fetching warehouse details</Message.Header>
                        </Message.Content>
                    </Message>
                </div>
            )
        }

        const { isMobile, multiSearchInput, showFunctionsMobile,
            isGroupingEnabled, productToEdit, showProductModal, month, year,
            showEditProductCountModal, showProductHistoryModal } = this.state
        let modal = null,
            pageHeader,
            mappedProducts,
            filteredByMultiSearch

        if (showProductModal) {
            modal = (
                <AddEditProductModal
                    fetchAllData={this.props.fetchAllData}
                    handleToggleProductModal={this.handleToggleProductModal}
                    show={true}
                    product={productToEdit}
                    categories={this.props.productCategories.map(optionsDropdownMapper)} />
            )
        }

        let editProductCountModal;
        if (showEditProductCountModal) {
            editProductCountModal = (
                <Modal
                    closeOnDimmerClick={false}
                    dimmer={true}
                    size='tiny'
                    open={showEditProductCountModal}
                    closeOnEscape={true}
                    closeIcon={true}
                    onClose={() => this.setState({ showEditProductCountModal: !showEditProductCountModal })}
                >
                    <Modal.Header>Edit product count - {this.state.productCountToEdit.name}</Modal.Header>
                    <Modal.Content>
                        <strong>Difference:</strong>
                        <Form.Input value={this.state.difference} name="difference" onChange={this.handleOnChange} />

                        <strong>New value:</strong>
                        <Form.Input value={this.state.productCountToEdit.available + (isNaN(parseInt(this.state.difference)) ? 0 : parseInt(this.state.difference))} name="difference" disabled />
                    </Modal.Content>
                    <Modal.Actions>
                        <Button
                            disabled={isNaN(parseInt(this.state.difference)) ? true : false}
                            onClick={() => this.editWarehouseProductcount()}
                            labelPosition='right'
                            icon='checkmark'
                            content='Edit'
                            className="primaryButton"
                        />
                        <Button
                            onClick={() => this.setState({ showEditProductCountModal: false })}
                            content='Close'
                        />
                    </Modal.Actions>
                </Modal>
            )
        }

        let productHistoryModal;
        if (showProductHistoryModal) {
            productHistoryModal = (
                <Modal
                    closeOnDimmerClick={false}
                    dimmer={true}
                    size='tiny'
                    open={showProductHistoryModal}
                    closeOnEscape={true}
                    closeIcon={true}
                    onClose={() => this.setState({ showProductHistoryModal: !showProductHistoryModal })}
                >
                    <Modal.Header>Product history - {this.state.productHistoryToShow.name}</Modal.Header>
                    <Modal.Content>
                        <ProductHistoryTable data={this.state.productHistoryToShow.history} tableHeader={false} compact="very" rowsPerPage={10} />
                    </Modal.Content>
                    <Modal.Actions>
                        <Button
                            onClick={() => this.setState({ showProductHistoryModal: false })}
                            content='Close'
                        />
                    </Modal.Actions>
                </Modal>
            )
        }

        let isOnCurrentMonth = false;
        if (this.state.month === this.state.currentMonth && this.state.year === this.state.currentYear) {
            isOnCurrentMonth = true;
        }

        let products = this.props.warehouseProducts.data

        // render page
        if (isMobile) {
            if (multiSearchInput && multiSearchInput.length > 1) { // if filter is specified
                filteredByMultiSearch = filterInArrayOfObjects(buildFilter(multiSearchInput), products, ["category", "name", "price"])
            }
            else {
                filteredByMultiSearch = products
            }

            pageHeader = (
                <Grid stackable>
                    {productHistoryModal}
                    {modal}
                    {editProductCountModal}
                    <Grid.Row>
                        <Grid.Column>
                            <Header as='h1'>
                                Warehouse
                                <Button toggle onClick={this.toggleShowFunctionsMobile} floated='right' style={{ backgroundColor: showFunctionsMobile ? '#f2005696' : '#f20056', color: 'white' }} content={showFunctionsMobile ? 'Hide' : 'Show'} />
                            </Header>
                        </Grid.Column>
                    </Grid.Row>
                    <Transition.Group animation='drop' duration={500}>
                        {showFunctionsMobile && (
                            <Grid.Row>
                                <Grid.Column>
                                    <Input style={{ marginBottom: '0.3em' }} fluid label="Month" onChange={this.setInput} id="month" value={month} />
                                    <Input fluid label="Year" onChange={this.setInput} id="year" value={year} />
                                </Grid.Column>
                                <Grid.Column>
                                    <Input
                                        fluid
                                        name="multiSearchInput"
                                        placeholder='Search...'
                                        onChange={this.handleFilterChange} />
                                    <Button onClick={() => this.handleToggleProductModal()} fluid size='large' compact content='Add Product' id="primaryButton" style={{ marginTop: '0.3em' }} />
                                </Grid.Column>
                            </Grid.Row>
                        )}
                    </Transition.Group>
                </Grid>
            )

            mappedProducts = filteredByMultiSearch.map(product => {
                // mobile return
                return (
                    <Table.Row
                        key={product.id}
                        textAlign='center'>
                        <Table.Cell>
                            <Grid columns={2} style={{ marginTop: '0', marginBottom: '0', paddingLeft: '0.25em', paddingRight: '0.25em' }}>
                                <Grid.Row style={{ padding: '0.25em' }} verticalAlign='middle'>
                                    <Grid.Column width={13}>
                                        {product.name} <br />
                                        {product.price}
                                        <strong> | </strong>{product.input}<strong> | </strong>{product.output}
                                        <strong> | </strong>{product.available}
                                    </Grid.Column>
                                    <Grid.Column style={{ textAlign: 'right' }} width={3}>
                                        <>
                                            <Button
                                                onClick={() => this.handleEditWarehouseProductcount(product)}
                                                className='buttonIconPadding'
                                                size='large'
                                                icon='warehouse' />
                                            <Button
                                                onClick={() => this.handleToggleProductHistoryModal(product)}
                                                className='buttonIconPadding'
                                                size='large'
                                                icon='history' />
                                            <Button
                                                onClick={() => this.handleToggleProductModal(product)}
                                                className='buttonIconPadding'
                                                style={{ marginBottom: '0.25em' }}
                                                size='large'
                                                icon='edit' />
                                            <Button
                                                onClick={() => this.props.handleDeleteProduct(product)}
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
                            <Table.HeaderCell width={2}>Name</Table.HeaderCell>
                            <Table.HeaderCell width={1}>Price | Input | Output | Available</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {mappedProducts}
                    </Table.Body>
                </Table>
            )
            return (
                <>
                    {pageHeader}
                    {table}
                </>
            )

        }
        else {
            return (
                <Grid stackable>
                    {productHistoryModal}
                    {modal}
                    {editProductCountModal}
                    <Grid.Row style={{ marginBottom: '1em' }}>
                        <Grid.Column width={2}>
                            <Header as='h1'>
                                Warehouse
                                </Header>
                        </Grid.Column>
                        <Grid.Column width={2} textAlign='left'>
                            <Button onClick={() => this.handleToggleProductModal()} fluid size='large' compact content='Add Product' id="primaryButton" />
                        </Grid.Column>
                        <Grid.Column width={2} textAlign='left'>
                            <Button onClick={this.handleToggleGrouping} fluid size='large' compact content={isGroupingEnabled ? 'Remove grouping' : 'Add grouping'} id="secondaryButton" />
                        </Grid.Column>
                        <Grid.Column width={2}>
                            <Input style={{ maxWidth: '6em' }} label="Month" onChange={this.setInput} id="month" value={month} />
                        </Grid.Column>
                        <Grid.Column width={2}>
                            <Input style={{ maxWidth: '6em' }} label="Year" onChange={this.setInput} id="year" value={year} />
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column>
                            <WarehouseTable
                                handleToggleProductHistoryModal={this.handleToggleProductHistoryModal}
                                isOnCurrentMonth={isOnCurrentMonth}
                                handleEditWarehouseProductcount={this.handleEditWarehouseProductcount}
                                handleToggleProductModal={this.handleToggleProductModal}
                                compact="very" isGroupingEnabled={isGroupingEnabled}
                                categories={this.props.productCategories}
                                rowsPerPage={0}
                                data={this.props.warehouseProducts.data}
                                handleDeleteProduct={this.props.handleDeleteProduct} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            )
        }
    }
}
