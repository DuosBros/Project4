import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import moment from 'moment';
import { Grid, Header, Message, Icon, Button, Table, Transition, Input } from 'semantic-ui-react';
import { getCostsAction, showGenericModalAction, deleteCostAction } from '../../utils/actions';
import { APP_TITLE, GET_ORDERS_LIMIT, LOCALSTORAGE_NAME } from '../../appConfig';
import ErrorMessage from '../../components/ErrorMessage';
import CostsTable from '../../components/CostsTable';
import AddEditCostsModal from '../../components/AddEditCostModal';
import { fetchCostsAndHandleResult } from '../../handlers/orderHandler';
import { optionsDropdownMapper, debounce, filterInArrayOfObjects, buildFilter } from '../../utils/helpers';
import { deleteCost } from '../../utils/requests';

class Costs extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            showEditCostModal: false,
            isMobile: this.props.isMobile,
            multiSearchInput: "",
            showFunctionsMobile: false,
            recordsLimit: this.props.isMobile && GET_ORDERS_LIMIT / 5,
            costToEdit: null,
            user: localStorage.getItem(LOCALSTORAGE_NAME) ? JSON.parse(atob(localStorage.getItem(LOCALSTORAGE_NAME).split('.')[1])).username : ""
        }

        this.updateFilters = debounce(this.updateFilters, 1000);
    }

    componentDidMount() {
        fetchCostsAndHandleResult({
            getCostsAction: this.props.getCostsAction
        })

        document.title = APP_TITLE + "Costs"
    }

    handleToggleEditCostModal = (cost) => {
        this.setState({ showEditCostModal: !this.state.showEditCostModal, costToEdit: cost });
    }

    loadMoreCosts = () => {
        var currentLimit = this.state.recordsLimit + 100
        this.setState({ recordsLimit: currentLimit });
    }

    toggleShowFunctionsMobile = () => {
        this.setState({ showFunctionsMobile: !this.state.showFunctionsMobile })
    }

    handleDeleteCost = (cost) => {
        deleteCost(cost.id)
            .then(() => {
                this.props.deleteCostAction(cost.id)
            })
            .catch(err => {
                this.props.showGenericModalAction({
                    redirectTo: '/costs',
                    parentProps: this.props,
                    err: err
                })
            })
    }

    handleFilterChange = (e, { value }) => {
        this.updateFilters(value ? value : "");
    }

    updateFilters = (value) => {
        this.setState({ multiSearchInput: value });
    }

    render() {

        // in case of error
        if (!this.props.costsStore.costs.success) {
            return (
                <Grid stackable>
                    <Grid.Row>
                        <Grid.Column>
                            <Header as='h1'>
                                Costs
                            </Header>
                            <ErrorMessage handleRefresh={this.fetchCostsAndHandleResult} error={this.props.costsStore.costs.error} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            );
        }

        // in case it's still loading data
        if (!this.props.costsStore.costs.data) {
            return (
                <div className="messageBox">
                    <Message info icon>
                        <Icon name='circle notched' loading />
                        <Message.Content>
                            <Message.Header>Fetching costs</Message.Header>
                        </Message.Content>
                    </Message>
                </div>
            )
        }

        const { isMobile, multiSearchInput, showFunctionsMobile, recordsLimit, costToEdit } = this.state
        let mappedCosts, pageHeader, table, filteredByMultiSearch, costs;
        let modal = null
        if (this.state.showEditCostModal) {
            modal = (
                <AddEditCostsModal
                    handleToggleEditCostModal={this.handleToggleEditCostModal}
                    show={true} cost={costToEdit} categories={this.props.costsStore.costCategories.map(optionsDropdownMapper)} />
            )
        }

        costs = this.props.costsStore.costs.data;

        if (multiSearchInput && multiSearchInput.length > 1) { // if filter is specified
            filteredByMultiSearch = filterInArrayOfObjects(buildFilter(multiSearchInput), costs, ["description", "category", "dateFormated", "cost", "note"])
        }
        else {
            filteredByMultiSearch = costs
        }

        if (isMobile) {
            pageHeader = (
                <Grid stackable>
                    <Grid.Row>
                        <Grid.Column>
                            <Header as='h1'>
                                Cost
                                <Button toggle onClick={this.toggleShowFunctionsMobile} floated='right' style={{ backgroundColor: showFunctionsMobile ? '#f2005696' : '#f20056', color: 'white' }} content={showFunctionsMobile ? 'Hide' : 'Show'} />
                            </Header>
                        </Grid.Column>
                    </Grid.Row>
                    <Transition.Group animation='drop' duration={500}>
                        {showFunctionsMobile && (
                            <Grid.Row>
                                <Grid.Column>
                                    {/* <Button onClick={this.handleToggleEditCostModal} fluid size='large' compact content='Add Cost' id="primaryButton" style={{ marginBottom: '0.3em' }} /> */}
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

            mappedCosts = filteredByMultiSearch.slice(0, recordsLimit).map(cost => {
                // mobile return
                return (
                    <Table.Row
                        key={cost.id}
                        textAlign='center'>
                        <Table.Cell>
                            <Grid columns={2} style={{ marginTop: '0', marginBottom: '0', paddingLeft: '0.25em', paddingRight: '0.25em' }}>
                                <Grid.Row style={{ padding: '0.25em' }} verticalAlign='middle'>
                                    <Grid.Column width={13}>
                                        {cost.description}
                                        <strong> |</strong> {cost.cost} <strong>|</strong> {moment(cost.date).local().format('DD.MM.')} <strong>|</strong> {cost.note}
                                    </Grid.Column>
                                    <Grid.Column style={{ textAlign: 'right' }} width={3}>
                                        <>
                                            <Button
                                                onClick={() => this.handleToggleEditCostModal(cost)}
                                                className='buttonIconPadding'
                                                style={{ marginBottom: '0.25em' }}
                                                size='large'
                                                icon='edit' />
                                            <Button
                                                onClick={() => this.handleDeleteCost(cost)}
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
            table = (
                <Table compact basic='very'>
                    <Table.Header>
                        <Table.Row className="textAlignCenter">
                            <Table.HeaderCell width={2}>Description | Value | Date</Table.HeaderCell>
                            <Table.HeaderCell width={1}>Note</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {mappedCosts}
                    </Table.Body>
                </Table>
            )

            return (
                <>
                    {modal}
                    {pageHeader}
                    {table}
                    {
                        multiSearchInput === "" && (
                            <Button onClick={this.loadMoreCosts} style={{ marginTop: '0.5em' }} fluid>Show More</Button>
                        )
                    }
                </>
            )
        } else {
            // render page
            return (
                <Grid stackable>
                    {modal}
                    <Grid.Row style={{ marginBottom: '1em' }}>
                        <Grid.Column width={2}>
                            <Header as='h1'>
                                Costs
                            </Header>
                        </Grid.Column>
                        <Grid.Column width={2} textAlign='left'>
                            {/* <Button onClick={() => this.handleToggleEditCostModal()} fluid size='large' compact content='Add Cost' id="primaryButton" /> */}
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column>
                            <CostsTable handleToggleEditCostModal={this.handleToggleEditCostModal} handleDeleteCost={this.handleDeleteCost} compact="very" rowsPerPage={50} data={filteredByMultiSearch} />
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            )
        }
    }
}

function mapStateToProps(state) {
    return {
        costsStore: state.CostsReducer
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getCostsAction,
        deleteCostAction,
        showGenericModalAction
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(Costs);
