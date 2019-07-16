import React from 'react'
import GenericTable from './GenericTable';
import { Button } from 'semantic-ui-react';
import moment from 'moment';

class PurchasesTable extends React.PureComponent {
    columns = [
        {
            name: "Date",
            prop: "date",
            display: "dateFormat",
            width: 2,
        },
        {
            name: "Supplier",
            prop: "to",
            searchable: "distinct",
            width: 2,
        },
        {
            name: "By",
            prop: "user",
            searchable: "distinct",
            width: 2,
        },
        {
            name: "Products",
            prop: "products",
            display: "productsList",
            width: 9,
        },
        {
            name: "Actions",
            prop: "actions",
            sortable: false,
            searchable: false,
            exportByDefault: false,
            width: 1
        },
    ]

    transformDataRow(data) {
        data.dateFormat = moment(data.date).local().format("DD.MM.YYYY HH:mm:ss")
        data.productsList = <ul>{data.products.map(x => {
            return (
                <li key={x.productId}>
                    {x.productName + ": " + x.count}
                </li>
            )
        })}</ul>
        data.products = JSON.stringify(data.products)
        data.actions = (
            <>
                <Button
                    onClick={() => this.handleTogglePurchaseModal(data, false)}
                    className='buttonIconPadding'
                    size='large'
                    icon='edit' />
                <Button
                    onClick={() => this.handleDeletePurchase(data.id)}
                    className='buttonIconPadding'
                    size='large'
                    icon='remove' />
            </>
        );

        return data;
    }

    getDataKey(data) {
        return data.date + "-" + data.to + "-" + data.user
    }
    render() {

        return (
            <GenericTable
                recurseSearch={true}
                columns={this.columns}
                transformDataRow={this.transformDataRow}
                getDataKey={this.getDataKey}
                {...this.props}
            />
        );
    }
}


export default PurchasesTable;