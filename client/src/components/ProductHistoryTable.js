import React from 'react'
import GenericTable from './GenericTable';
import moment from 'moment';

export default class ProductHistoryTable extends React.PureComponent {
    columns = [
        {
            name: "Date",
            prop: "timestamp",
        },
        {
            name: "Difference",
            prop: "difference",
        },
        {
            name: "Changed by",
            prop: "user",
        },
    ]


    transformDataRow(data) {
        data.timestamp = moment(data.timestamp).local().format("DD.MM.YYYY HH:mm:ss")

        return data;
    }

    getDataKey(data) {
        return data.timestamp + data.difference + data.user
    }

    render() {
        return (
            <GenericTable
                transformDataRow={this.transformDataRow}
                columns={this.columns}
                {...this.props}
            />
        );
    }
}