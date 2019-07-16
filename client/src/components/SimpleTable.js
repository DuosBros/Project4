import React from 'react';
import { Table } from 'semantic-ui-react';

const SimpleTable = (props) => {
    return (
        <Table stackable compact={props.compact} basic='very' size='small'>
            <Table.Header>
                <Table.Row>
                    {
                        props.showHeader ?
                            props.columnProperties.map(property => {
                                return (
                                    <Table.HeaderCell
                                        key={property.name}
                                        width={property.collapsing ? null : property.width}
                                        content={property.name}
                                        collapsing={property.collapsing} />
                                )
                            }) : null
                    }
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {props.body}
            </Table.Body>
        </Table>
    )
}

export default SimpleTable;
