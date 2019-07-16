import React from 'react'
import GenericTable from './GenericTable';
import numeral from 'numeral';

export default class SummaryTable extends React.PureComponent {
    columns = [
        {
            name: "Month/Year",
            prop: "date",
            width: 2,
        },
        {
            name: "Turnover [CZK]",
            prop: "turnover",
            width: 2,
        },
        {
            name: "Costs [CZK]",
            prop: "costs",
            width: 2,
        },
        {
            name: "Profit [CZK]",
            prop: "profit",
            width: 2,
        },
        {
            name: "# Orders",
            prop: "ordersCount",
            width: 2,
        }
    ]

    getDataKey(data) {
        return data.monthAndYear + data.turnover
    }

    transformDataRow(data) {
        if(data.monthAndYear === "Average") {
            data.monthAndYear = (<strong><em>Average</em></strong>)
        }
        data.turnover = numeral(data.turnover).format('0,0')
        data.costs = numeral(data.costs).format('0,0')
        data.profit = numeral(data.profit).format('0,0')
        data.ordersCount = numeral(data.ordersCount).format('0,0')

        return data;
    }

    render() {
        return (
            <GenericTable
                transformDataRow={this.transformDataRow}
                getDataKey={this.getDataKey}
                columns={this.columns}
                {...this.props}
            />
        );
    }
}