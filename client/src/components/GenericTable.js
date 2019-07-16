import React, { Component } from 'react'
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Table, Grid, Message, Input, Button, Icon, Label, Popup, Dropdown } from 'semantic-ui-react'
import Pagination from 'semantic-ui-react-button-pagination';
import { filterInArrayOfObjects, isNum, debounce, pick, sortMonthYear, optionsDropdownMapper, buildFilter } from '../utils/helpers';
import { exportDataToExcel } from '../utils/requests';
import FileSaver from 'file-saver';
import ExportDropdown from './ExportDropdown';

const DEFAULT_COLUMN_PROPS = {
    collapsing: false,
    sortable: true,
    searchable: true,
    visibleByDefault: true,
    exportable: true,
    skipRendering: false
}

export default class GenericTable extends Component {
    static propTypes = {
        columns: PropTypes.arrayOf(PropTypes.shape({
            prop: PropTypes.string.isRequired,
            name: PropTypes.string.isRequired,
            display: PropTypes.string,
            collapsing: PropTypes.bool,
            exportable: PropTypes.bool,
            skipRendering: PropTypes.bool,
            searchable: PropTypes.oneOfType([
                PropTypes.bool,
                PropTypes.oneOf(["distinct"])
            ]),
            sortable: PropTypes.bool,
            visibleByDefault: PropTypes.bool,
        })).isRequired,
        compact: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.oneOf(['very'])
        ]),
        customFilterCallback: PropTypes.func,
        disableGrouping: PropTypes.bool,
        recurseSearch: PropTypes.bool,
        expandable: PropTypes.bool,
        getDataKey: PropTypes.func,
        grouping: PropTypes.array,
        multiSearchInput: PropTypes.string,
        onRowExpandToggle: PropTypes.func,
        renderCustomFilter: PropTypes.func,
        renderExpandedRow: PropTypes.func,
        rowsPerPage: n => Number.isInteger(n) && n >= 0,
        tableHeader: PropTypes.oneOfType([
            PropTypes.bool,
            PropTypes.arrayOf(PropTypes.string),
            PropTypes.oneOf(
                ["hidden", "export", "filter", "paging", "columnfilters"]
            )
        ]),
        transformDataRow: PropTypes.func,
    }

    static defaultProps = {
        compact: false,
        customFilterCallback: GenericTable.customFilterCallback,
        disableGrouping: false,
        expandable: false,
        getDataKey: GenericTable.getDataKey,
        grouping: [],
        multiSearchInput: "",
        onRowExpandToggle: GenericTable.onRowExpandToggle,
        renderCustomFilter: GenericTable.renderCustomFilter,
        renderExpandedRow: GenericTable.renderExpandedRow,
        rowsPerPage: 15,
        tableHeader: true,
    }

    constructor(props) {
        super(props);

        // generate columns and grouping
        let { columns, grouping } = GenericTable.generateColumnsAndGrouping(props);

        // generate empty filters and filterInputs objects
        let filterInputs = {},
            filterInputsChanged = {},
            filterInputsValid = {},
            filters = {};
        for (let col of columns.filter(c => c.searchable !== false)) {
            filterInputs[col.prop] = col.searchable === true ? "" : -1;
            filterInputsChanged[col.prop] = false;
            filterInputsValid[col.prop] = true;
            filters[col.prop] = null;
        }

        let multiSearch = this.multiSearchFilterFromInput(props.multiSearchInput);
        let columnDistinctValues = GenericTable.generateDistinctValues(columns, props.data, props.distinctValues);


        this.state = {
            recurseSearch: this.props.recurseSearch ? true : false,
            showGenericModal: { show: false },
            columnDistinctValues,
            columns,
            columnToggle: columns.filter(c => c.visibleByDefault === false).length > 0,
            data: props.data,
            propData: props.data,
            expandedRows: [],
            filterInputs,
            filterInputsChanged,
            filterInputsValid,
            filters,
            grouping,
            limit: parseInt(props.rowsPerPage),
            limitInput: props.rowsPerPage.toString(),
            limitInputValid: true,
            multiSearchInput: props.multiSearchInput,
            ...multiSearch,
            offset: 0,
            showColumnFilters: false,
            showColumnToggles: false,
            showTableHeader: props.tableHeader,
            sortColumn: null,
            sortDirection: null,
            visibleColumnsList: columns.filter(c => c.visibleByDefault && !c.skipRendering).map(c => c.prop),
        }

        if (Array.isArray(this.state.data)) {
            this.state.data = GenericTable.sort(this.state.data, this.state.grouping, null);
        }

        this.updateMultiFilter = debounce(this.updateMultiFilter, 400);
        this.updateColumnFilters = debounce(this.updateColumnFiltersImmediate, 400);
        this.updateLimit = debounce(this.updateLimit, 400);
    }

    static generateColumnsAndGrouping(props) {
        let columns = props.columns;

        if (!columns) {
            throw new Error("Columns are undefined!");
        }

        columns = columns.map(c => Object.assign({}, DEFAULT_COLUMN_PROPS, c));
        for (let c of columns) {
            if (!c.hasOwnProperty("prop")) {
                throw new Error("Columns need a 'prop' property");
            }
        }

        let grouping = props.disableGrouping ? [] : props.grouping;
        grouping = grouping.map(gp => {
            let match = columns.filter(c => c.prop === gp);
            if (match.length > 1) {
                throw new Error("Grouping on '" + gp + "' is ambiguous. Mulitple columns with this prop are defined.");
            } else if (match.length < 1) {
                throw new Error("Grouping on '" + gp + "' not possible. Grouping only possible on props that are specified by a column.");
            }
            match[0].sortable = false;
            return match[0];
        });

        return {
            columns,
            grouping
        };
    }

    static generateDistinctValues(columns, data, fromProps) {
        const unfilteredOption = { key: -1, text: (<em>unfiltered</em>), value: -1 };

        let columnDistinctValues = {};

        for (let c of columns.filter(e => e.searchable === "distinct")) {
            let values = [];
            let mappedData = data.map(e => e[c.prop]);

            if (!fromProps) {
                let filteredData = mappedData.filter(e =>
                    e !== undefined &&
                    e != null)
                    .map(e => e.toString());
                values = _.uniq(filteredData).sort().map(optionsDropdownMapper);
            }
            else {
                if (Array.isArray(fromProps[c.prop])) {
                    values = fromProps[c.prop].map(optionsDropdownMapper);
                }
            }

            let index = mappedData.findIndex(x => x === undefined || x == null || x.toString().trim().length === 0)
            if (index >= 0) {
                values.push({ key: -2, text: (<em>empty</em>), value: -2 });
            }

            values.unshift(unfilteredOption);
            columnDistinctValues[c.prop] = values;
        }
        return columnDistinctValues;
    }

    static getDerivedStateFromProps(nextProps, state) {
        if (state.propData !== nextProps.data) {
            let data;
            let { grouping, columns } = GenericTable.generateColumnsAndGrouping(nextProps)
            if (nextProps.data != null && Array.isArray(nextProps.data)) {
                data = GenericTable.sort(nextProps.data, grouping ? grouping : state.grouping, null);
            }

            let columnDistinctValues = GenericTable.generateDistinctValues(columns, data, nextProps.distinctValues)
            return { data, columnDistinctValues, propData: nextProps.data, grouping };
        } else { // else if, so we don't generate distinct values twice if (state.distinctValues !== nextProps.distinctValues)
            let { grouping, columns } = GenericTable.generateColumnsAndGrouping(nextProps)
            let columnDistinctValues = GenericTable.generateDistinctValues(state.columns, state.data, nextProps.distinctValues)
            return { columnDistinctValues, grouping, columns };
        }
    }

    handleSort = clickedColumn => () => {
        this.setState(prev => {
            let { sortColumn, data, grouping, sortDirection } = prev;
            if (sortColumn !== clickedColumn) {

                return {
                    sortColumn: clickedColumn,
                    data: GenericTable.sort(data, grouping, clickedColumn, 'ascending'),
                    sortDirection: 'ascending',
                    expandedRows: []
                };
            }

            sortDirection = sortDirection === 'ascending' ? 'descending' : 'ascending';
            return {
                data: GenericTable.sort(data, grouping, sortColumn, sortDirection),
                sortDirection,
                expandedRows: []
            };
        });
    }

    handlePaginationChange = (e, props, offset) => {
        this.setState({
            offset,
            expandedRows: []
        });
    }

    handleColumnFilterChange = (e, { name, value }) => {
        this.setState(prev => {
            let filterInputs = Object.assign({}, prev.filterInputs, { [name]: value }),
                filterInputsChanged = Object.assign({}, prev.filterInputsChanged, { [name]: true });

            return {
                filterInputs,
                filterInputsChanged
            };
        });
        this.updateColumnFilters();
    }

    handleColumnFilterDropdown = (e, { name, value }) => {
        this.setState(prev => {
            let filterInputs = Object.assign({}, prev.filterInputs, { [name]: value }),
                filterInputsChanged = Object.assign({}, prev.filterInputsChanged, { [name]: true });

            return {
                filterInputs,
                filterInputsChanged
            };
        });
        this.updateColumnFilters();
    }

    updateColumnFiltersImmediate() {
        this.setState((prev) => {
            let filters = Object.assign({}, prev.filters),
                filterInputsChanged = Object.assign({}, prev.filterInputsChanged),
                filterInputsValid = Object.assign({}, prev.filterInputsValid);

            for (let key of Object.getOwnPropertyNames(prev.filters).filter(c => prev.filterInputsChanged[c])) {
                let func = null,
                    valid = false;

                try {
                    func = this.buildColumnFilter(key, prev.filterInputs[key]);
                    valid = true;
                } catch (e) {
                    // ignore errors, valid will be false anyway
                }

                filterInputsChanged[key] = false;
                filterInputsValid[key] = valid;
                filters[key] = func;
            }
            return {
                filters,
                filterInputsChanged,
                filterInputsValid
            };
        });
    }

    buildColumnFilter(key, needle) {
        if (typeof needle === "number") {
            // TODO find cleaner solution
            if (needle === -1) {
                return null;
            }

            if (needle === -2) {
                return heystack => (
                    heystack[key] === undefined ||
                    heystack[key] == null ||
                    heystack[key].toString().trim().length === 0
                );
            }

            return heystack => (
                heystack[key] !== undefined &&
                heystack[key] != null &&
                heystack[key].toString() === this.state.columnDistinctValues[key][needle + 1].text.toString()
            );
        }
        let func = buildFilter(needle);
        if (func == null || this.props.recurseSearch) {
            return func;
        }
        return heystack => (
            heystack[key] !== undefined &&
            heystack[key] != null &&
            func(heystack[key])
        );
    }

    handleMultiFilterChange = (e, { value }) => {
        this.setState({ multiSearchInput: value });
        this.updateMultiFilter();
    }

    multiSearchFilterFromInput(input) {
        let func = null,
            valid = false;

        try {
            func = buildFilter(input);
            valid = true;
        } catch (e) {
            // ignore errors, valid will be false anyway
        }

        return {
            multiSearch: func,
            multiSearchInputValid: valid
        }
    }

    updateMultiFilter() {
        this.setState((prev) => this.multiSearchFilterFromInput(prev.multiSearchInput));
    }

    handleToggleColumnFilters = () => {
        this.setState({
            showColumnFilters: !this.state.showColumnFilters
        });
    }

    handleStateToggle = (e, { name }) => {
        this.setState({
            [name]: !this.state[name]
        });
    }

    handleColumnToggle = (e, { prop, value }) => {
        const { columns, visibleColumnsList } = this.state;
        let newVisibleValue = !value;

        let newVisibleColumnsList = columns.filter(c => {
            if (c.prop === prop) {
                return newVisibleValue;
            }
            return visibleColumnsList.indexOf(c.prop) !== -1;
        }).map(c => c.prop);

        this.setState({
            visibleColumnsList: newVisibleColumnsList
        });
    }

    handleChangeRecordsPerPage = (e, { value }) => {
        let n = value.trim(),
            limitInputValid = isNum(n) && n > 0;

        this.setState({
            limitInput: value,
            limitInputValid
        });

        if (limitInputValid) {
            this.updateLimit();
        }
    }

    updateLimit() {
        this.setState(prev => {
            let n = prev.limitInput.trim(),
                limitInputValid = isNum(n) && n > 0;

            if (limitInputValid) {
                return { limit: parseInt(n) };
            }
        });
    }

    static sort(input, grouping, by, direction) {
        const data = input.slice();
        data.sort((a, b) => GenericTable.comparatorGrouped(direction, grouping, by, a, b));
        return data
    }

    static comparatorGrouped(direction, grouping, prop, a, b) {
        let sortFactor = direction === "descending" ? -1 : 1;

        var res;
        for (let g of grouping) {
            res = GenericTable.compareBase(a[g.prop], b[g.prop]);

            if (res !== 0) {
                return res;
            }
        }
        if (prop == null) {
            return res;
        }
        return sortFactor * GenericTable.compareBase(a[prop], b[prop]);
    }

    static compareBase(a, b) {
        if (a == null || a === undefined) {
            return b == null ? 0 : -1;
        } else if (b == null || b === undefined) {
            return 1;
        }
        if (typeof a === "number" && typeof b === "number") {
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
            return 0;
        }
        return a.toString().localeCompare(b.toString());
    }

    handleExport = (data, type) => {
        const { columns, visibleColumnsList } = this.state;

        // only export visible and exportable columns
        let columnsToExport = columns
            .filter(c => c.exportable === true && visibleColumnsList.indexOf(c.prop) !== -1)
            .map(c => { return { label: c.name, key: c.prop } });
        let dataToExport = pick(data, columnsToExport.map(x => x.key));

        if (type === "json") {
            const fileName = new Date().toISOString() + "." + type

            var a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";

            var json = JSON.stringify(dataToExport),
                blob = new Blob([json], { type: "octet/stream" }),
                url = window.URL.createObjectURL(blob);
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        }
        else {
            const fileName = new Date().toISOString() + "_" + document.title
            exportDataToExcel(dataToExport, fileName, document.title).then((res) => {
                let blob = new Blob([res.data], { type: 'vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8' });
                FileSaver.saveAs(blob, fileName + '.xlsx')
            })
            return;
        }
    }

    onExpandToggle = (e, { rowkey, rowdata }) => {
        this.setState(function (prev) {
            const visible = prev.expandedRows.indexOf(rowkey) === -1

            // callback
            if (this.props.onRowExpandToggle) {
                this.props.onRowExpandToggle(visible, rowkey, rowdata);
            }

            if (visible) {
                return { expandedRows: [...prev.expandedRows, rowkey] };
            } else {
                return { expandedRows: prev.expandedRows.filter(e => e !== rowkey) }
            }
        });
    }

    onTableHeaderShow = () => {
        this.setState({ showTableHeader: true });
    }

    renderTableFunctions(filteredData) {
        const {
            columns,
            columnToggle,
            limit,
            limitInput,
            limitInputValid,
            multiSearchInput,
            multiSearchInputValid,
            showColumnFilters,
            showColumnToggles,
            showTableHeader,
            visibleColumnsList,
        } = this.state;

        let columnToggleButton = null,
            toggleColumnsRow = null;

        if (columnToggle) {
            columnToggleButton = (
                <div>
                    <Button
                        size="small"
                        name="showColumnToggles"
                        onClick={this.handleStateToggle}
                        compact
                        content={showColumnToggles ? 'Hide Column Toggles' : 'Show Column Toggles'}
                        style={{ padding: '0.3em', marginTop: '0.5em', textAlign: 'right' }}
                        icon={showColumnToggles ? 'eye slash' : 'eye'}
                        labelPosition='right' />
                </div>
            )

            if (showColumnToggles) {
                let columnToggles = columns.map(c => {
                    let visible = visibleColumnsList.indexOf(c.prop) !== -1;
                    return (
                        <Label
                            key={c.prop}
                            color={visible ? "green" : "red"}
                            content={c.name}
                            value={visible}
                            onClick={this.handleColumnToggle}
                            prop={c.prop} />
                    );
                });
                toggleColumnsRow = (
                    <Grid.Row>
                        <Grid.Column textAlign="right" className="column toggles">
                            {columnToggles}
                        </Grid.Column>
                    </Grid.Row>
                );
            } else {
                toggleColumnsRow = null;
            }
        }

        if (showTableHeader !== false) {
            if ((Array.isArray(showTableHeader) && !showTableHeader.includes("hidden")) || showTableHeader === true) {
                return (
                    <Grid>
                        <Grid.Row>
                            {
                                ((Array.isArray(showTableHeader) && showTableHeader.includes("filter")) || showTableHeader === true) && (
                                    <Grid.Column verticalAlign='bottom' floated='left' width={4}>
                                        <Input
                                            label={(
                                                <Label className='iconMargin'>
                                                    <Popup on='click' hideOnScroll trigger={<Icon name='question circle' size='small' />} inverted>
                                                        <Popup.Content>
                                                            Did you know that you can also use <a target="_blank" rel="noopener noreferrer" href='https://regexr.com/'>Regular Expressions</a> in this filter and column filters by prefixing your expression with "~"?
                                                    </Popup.Content>
                                                    </Popup>
                                                    Filter:
                                            </Label>
                                            )}
                                            id="multiSearchFilterInBuffedTable"
                                            fluid
                                            value={multiSearchInput}
                                            placeholder="Type to search..."
                                            name="multiSearchInput"
                                            onChange={this.handleMultiFilterChange}
                                            error={!multiSearchInputValid} />
                                    </Grid.Column>
                                )
                            }
                            {
                                ((Array.isArray(showTableHeader) && showTableHeader.includes("export")) || showTableHeader === true) && (
                                    <Grid.Column verticalAlign='bottom' width={1}>
                                        <ExportDropdown data={filteredData} columns={columns} visibleColumnsList={visibleColumnsList} />
                                    </Grid.Column>
                                )
                            }
                            {
                                ((Array.isArray(showTableHeader) && showTableHeader.includes("paging")) || showTableHeader === true) && (
                                    <>
                                        <Grid.Column verticalAlign='bottom' width={3}>
                                            <div style={{ float: "right", margin: "0 20px", display: limit === 0 ? "none" : "visible" }}>
                                                <span>Showing {filteredData.length > 0 ? this.state.offset + 1 : 0} to {filteredData.length < limit ? filteredData.length : this.state.offset + limit} of {filteredData.length} entries</span>
                                            </div>
                                        </Grid.Column>
                                        <Grid.Column width={4}>
                                            <div style={{ float: "left", margin: "0 20px", display: limit === 0 ? "none" : "visible" }}>
                                                <Input
                                                    label='Records per page:'
                                                    className="RecordsPerPage"
                                                    error={!limitInputValid}
                                                    value={limitInput}
                                                    name="inputRecordsPerPage"
                                                    onChange={this.handleChangeRecordsPerPage} />
                                            </div>
                                        </Grid.Column>
                                    </>
                                )
                            }
                            {
                                ((Array.isArray(showTableHeader) && showTableHeader.includes("columnfilters")) || showTableHeader === true) && (
                                    <Grid.Column floated='right' width={4} textAlign="right">
                                        <>
                                            <Button
                                                size="small"
                                                className="showColumnFilters"
                                                name="showColumnFilters"
                                                onClick={this.handleStateToggle}
                                                compact
                                                content={showColumnFilters ? 'Hide Column Filters' : 'Show Column Filters'}
                                                style={{ padding: '0.3em', textAlign: 'right' }}
                                                icon={showColumnFilters ? 'eye slash' : 'eye'}
                                                labelPosition='right' />
                                            {columnToggleButton}
                                            {this.props.renderCustomFilter()}
                                        </>

                                    </Grid.Column>
                                )
                            }
                        </Grid.Row>
                        {toggleColumnsRow}
                    </Grid>
                )
            }
            else {
                return (
                    <Grid>
                        <Grid.Row>
                            <Grid.Column width={16}>
                                <Popup trigger={
                                    <Button compact onClick={this.onTableHeaderShow} icon floated="right">
                                        <Icon name="setting"></Icon>
                                    </Button>
                                } content='Show table settings' inverted />

                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                )
            }
        }
        return null;
    }

    render() {
        const {
            columnDistinctValues,
            columns,
            grouping,
            visibleColumnsList,
            sortColumn,
            sortDirection,
            multiSearch,
            multiSearchInputValid,
            limit,
            showColumnFilters,
            data,
            filters,
            filterInputs,
            filterInputsValid,
            offset,
            expandedRows,
            recurseSearch
        } = this.state;

        const {
            compact,
            expandable,
            getDataKey
        } = this.props;

        let visibleColumns = columns.filter(c => visibleColumnsList.indexOf(c.prop) !== -1);

        if (!Array.isArray(data)) {
            let msg = this.props.placeholder ? this.props.placeholder : "Fetching data...";
            return (
                <div className="centered">
                    <Message info icon>
                        <Icon name='circle notched' loading />
                        <Message.Content>
                            <Message.Header>{msg}</Message.Header>
                        </Message.Content>
                    </Message>
                </div>
            );
        }

        if (this.props.data.length < 1) {
            return null;
        }

        var renderData, tableFooter, filteredData,
            filterColumnsRow,
            isEdit, isAdd, toAdd, toRemove;

        isEdit = this.props.isEdit;
        isAdd = this.props.isAdd;

        if (isEdit) {
            toAdd = this.props.toAdd;
            toRemove = this.props.toRemove;
        }

        let headerCells = visibleColumns.map(c => {
            let headerProps;
            if (c.sortable) {
                headerProps = {
                    sorted: sortColumn === c.prop ? sortDirection : null,
                    onClick: this.handleSort(c.prop)
                };
            } else {
                headerProps = {
                    disabled: true
                };
            }
            return (
                <Table.HeaderCell
                    collapsing={c.collapsing}
                    width={c.collapsing ? null : c.width}
                    key={"c-" + c.prop}
                    content={c.name}
                    {...headerProps}
                />
            );
        });
        if (expandable) {
            headerCells.unshift((
                <Table.HeaderCell
                    collapsing
                    key="expand"
                    disabled
                />
            ));
        }
        if (isEdit) {
            headerCells.push((
                <Table.HeaderCell
                    collapsing={false}
                    width={1}
                    key="action"
                    content="Actions"
                    disabled
                />
            ));
        }

        if (multiSearchInputValid && multiSearch != null) {
            filteredData = filterInArrayOfObjects(multiSearch, data, visibleColumns.filter(c => c.searchable !== false).map(c => c.prop), recurseSearch);
        } else {
            filteredData = data;
        }

        filteredData = this.props.customFilterCallback(filteredData);

        if (showColumnFilters) {
            for (let col of Object.getOwnPropertyNames(filters)) {
                if (filters[col] != null) {
                    if (recurseSearch) {
                        filteredData = filterInArrayOfObjects(filters[col], filteredData, [col], recurseSearch)
                    }
                    else {
                        filteredData = filteredData.filter(filters[col]);
                    }
                }
            }
        }

        if (grouping.findIndex(x => x.prop === "monthAndYear") >= 0) {
            filteredData = sortMonthYear(filteredData, true);
        }

        if (limit && filteredData.length > limit) {
            renderData = filteredData.slice(offset, offset + limit)
            tableFooter = (
                <Pagination
                    className="pagination"
                    compact
                    reduced
                    size="small"
                    floated="right"
                    offset={offset}
                    limit={limit}
                    total={filteredData.length}
                    onClick={this.handlePaginationChange}
                />
            )
        }
        else {
            renderData = filteredData
            tableFooter = (
                null
            )
        }

        if (showColumnFilters) {
            let headerFilterCells = visibleColumns.map(c => {
                let filterInput = null;
                if (c.searchable === true) {
                    filterInput = (<Input fluid name={c.prop} onChange={this.handleColumnFilterChange} value={filterInputs[c.prop]} error={!filterInputsValid[c.prop]} />)
                } else if (c.searchable === "distinct") {
                    filterInput = (<Dropdown fluid search selection name={c.prop} onChange={this.handleColumnFilterDropdown} value={filterInputs[c.prop]} options={columnDistinctValues[c.prop]} selectOnNavigation={false} />)
                }
                return (
                    <Table.HeaderCell collapsing={c.collapsing} width={c.collapsing ? null : c.width} key={c.prop}>
                        {filterInput}
                    </Table.HeaderCell>
                );
            })
            if (expandable) {
                headerFilterCells.unshift((<Table.HeaderCell collapsing key="expand">
                </Table.HeaderCell>))
            }
            filterColumnsRow = (
                <Table.Header>
                    <Table.Row>{headerFilterCells}</Table.Row>
                </Table.Header>
            )
        }
        else {
            filterColumnsRow = null
        }

        var tableBody = [],
            prevRow = {};
        let transformer = this.props.transformDataRow ? data => this.props.transformDataRow(Object.assign({}, data)) : data => data;
        renderData.map(transformer).forEach(data => {

            let rowKey = getDataKey(data);
            // check whether grouping header should be inserted
            let insertGroupingHeader = false;
            for (let gc of grouping) {
                if (data[gc.prop] !== prevRow[gc.prop]) {
                    insertGroupingHeader = true;
                    break;
                }
            }

            // insert grouping header if needed
            if (insertGroupingHeader === true) {
                let groupingHeaderKey = grouping.map(gc => data[gc.prop]),
                    groupingHeaderText = grouping.map(gc => data[gc.display ? gc.display : gc.prop]);
                tableBody.push((
                    <Table.Row key={"group-" + groupingHeaderKey.join('::')}>
                        <Table.HeaderCell style={{ backgroundColor: '#f2f2f2' }} colSpan='11'>{groupingHeaderText.join(', ')}</Table.HeaderCell>
                    </Table.Row>
                ));
            }

            let isRowExpanded = expandable === true && expandedRows.indexOf(rowKey) !== -1;

            // create table cells from row data
            let cells = visibleColumns.map(c => {
                let cellData;
                if (c.data === false) {
                    return null;
                }
                if (c.display) {
                    cellData = data[c.display];
                } else {
                    cellData = data[c.prop];
                }
                return (<Table.Cell style={data[c.styleProp] ? data[c.styleProp] : null} key={c.prop}>{cellData}</Table.Cell>)
            });
            if (expandable === true) {
                let expandName = isRowExpanded ? "minus" : "plus";
                cells.unshift((
                    <Table.Cell key="expand" collapsing>
                        <Icon link
                            rowkey={rowKey}
                            rowdata={data}
                            name={expandName + " square outline"}
                            onClick={this.onExpandToggle} />
                    </Table.Cell>));
            }

            // add cell for add/remove buttons if enabled
            if (isEdit) {
                let editIcon;
                if (isAdd) {
                    editIcon = toAdd.map(x => x.Id).indexOf(data.Id) > -1 ? (<Icon color="red" corner name='minus' />) : (<Icon color="green" corner name='add' />);
                } else {
                    editIcon = toRemove.map(x => x.Id).indexOf(data.Id) > -1 ? (<Icon color="green" corner name='add' />) : (<Icon color="red" corner name='minus' />);
                }
                let editIconGroup = (
                    <>
                        <Icon name='balance' />
                        {editIcon}
                    </>
                );

                cells.push((
                    <Table.Cell key="a">
                        <Button
                            onClick={isEdit && isAdd ? () => this.props.handleAdd(data) : () => this.props.handleRemove(data)}
                            style={{ padding: '0.3em' }}
                            size='medium'
                            icon={editIconGroup} >
                        </Button>
                    </Table.Cell>
                ));
            }

            // build row from cells
            tableBody.push((
                <Table.Row positive={isEdit && isAdd === true && toAdd.map(x => x.Id).indexOf(data.Id) > -1}
                    negative={isEdit && isAdd === false && toRemove.map(x => x.Id).indexOf(data.Id) > -1}
                    key={'data' + rowKey}>
                    {cells}
                </Table.Row>
            ));

            // insert details-row if row is in expanded state
            if (isRowExpanded) {
                tableBody.push((
                    <Table.Row key={'expanded' + rowKey}>
                        {/* +1 because there is extra column for toggling */}
                        <Table.Cell />
                        <Table.Cell style={{ borderLeft: 'none', paddingTop: '0px' }} colSpan={visibleColumns.length}>{this.props.renderExpandedRow(rowKey, data)}</Table.Cell>
                    </Table.Row>
                ));
            }

            // important for drawing grouping headers
            prevRow = data;
        });

        var tableFunctionsGrid = this.renderTableFunctions(filteredData);

        return (
            <div className="generic table">
                {tableFunctionsGrid}
                <div className="scroll-wrapper">
                    <Table compact={compact} selectable sortable celled basic='very'>
                        <Table.Header>
                            <Table.Row>{headerCells}</Table.Row>
                        </Table.Header>
                        {filterColumnsRow}
                        <Table.Body>
                            {tableBody}
                        </Table.Body>
                    </Table>
                </div>
                {tableFooter}
            </div >
        );
    }

    static renderCustomFilter() {
        return null;
    }

    static onRowExpandToggle(visible, rowKey, rowData) { // eslint-disable-line no-unused-vars
        return;
    }

    static renderExpandedRow(rowKey, rowData) { // eslint-disable-line no-unused-vars
        return null;
    }

    static customFilterCallback(filteredData) {
        return filteredData;
    }

    static getDataKey(data) {
        return data.id
    }
}
