import React from 'react'
import GenericTable from './GenericTable';
import moment from 'moment';

export default class MailsTable extends React.PureComponent {
    columns = [
        {
            name: "Date",
            prop: "date",
            width: 2,
        },
        {
            name: "From",
            prop: "from",
            width: 2,
        },
        {
            name: "Subject",
            prop: "subject",
            width: 2,
        },
        {
            name: "Snippet",
            prop: "snippet",
            width: 2,
        },
    ]

    getDataKey(data) {
        return data.date + data.from + data.subject + data.snippet
    }

    transformDataRow(data) {
        data.date = moment(data.date).local().format("DD.MM.YYYY HH:mm:ss")

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