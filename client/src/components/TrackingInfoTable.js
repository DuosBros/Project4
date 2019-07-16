import React from 'react'
import GenericTable from './GenericTable';

export default class TrackingInfoTable extends React.PureComponent {
    columns = [
        {
            name: "Date",
            prop: "date",
            width: 2,
        },
        {
            name: "Time",
            prop: "time",
            width: 2,
        },
        {
            name: "Status",
            prop: "status",
            width: 2,
        },
        {
            name: "Details",
            prop: "name",
            width: 6,
        },
    ]

    getDataKey(data) {
        return data.date + data.time + data.status + data.name
    }

    render() {
        return (
            <GenericTable
                getDataKey={this.getDataKey}
                columns={this.columns}
                {...this.props}
            />
        );
    }
}