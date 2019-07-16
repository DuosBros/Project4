import React from 'react'
import GenericTable from './GenericTable';
import { Button } from 'semantic-ui-react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

class CostsTable extends React.PureComponent {
    columns = [
        {
            name: "Description",
            prop: "description",
            width: 4,
        },
        {
            name: "Category",
            prop: "category",
            searchable: "distinct",
            width: 2,
        },
        {
            name: "Date",
            prop: "dateFormated",
            width: 2,
        },
        {
            name: "Cost [CZK]",
            prop: "cost",
            width: 2,
        },
        {
            name: "Actions",
            prop: "actions",
            sortable: false,
            searchable: false,
            exportByDefault: false,
            width: 1
        },
        {
            name: "Note",
            prop: "note",
            width: 3
        },
        {
            name: "monthAndYear",
            prop: "monthAndYear",
            skipRendering: true
        }
    ]

    transformDataRow(data) {
        data.actions = (
            <>
                <Button
                    onClick={() => this.handleToggleEditCostModal(data)}
                    className='buttonIconPadding'
                    size='large'
                    icon='edit' />
                <Button
                    onClick={() => this.handleDeleteCost(data)}
                    className='buttonIconPadding'
                    size='large'
                    icon='remove' />
            </>
        );

        return data;
    }

    grouping = [
        "monthAndYear"
    ]


    render() {
        let distinctValuesObject = {
            category: this.props.costsStore.costCategories
        }


        return (
            <GenericTable
                distinctValues={distinctValuesObject}
                grouping={this.grouping}
                columns={this.columns}
                transformDataRow={this.transformDataRow}
                {...this.props}
            />
        );
    }
}

function mapStateToProps(state) {
    return {
        costsStore: state.CostsReducer
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(CostsTable);