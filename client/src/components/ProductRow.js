import { Form, Divider, Dropdown, Button } from "semantic-ui-react";
import React from 'react';
const ProductRow = (props) => {
    return (
        <>
            <Form.Field>
                <label>Product Name</label>
                <Dropdown
                    selection
                    options={props.allProducts
                        .filter(x => x.isActive)
                        .map(x =>
                            ({
                                value: x.name,
                                text: x.name + " | " + x.category
                            })
                        )}
                    onChange={(e, m) => {
                        let found = props.allProducts.find(x => x.name === m.value);

                        this.handleProductDropdownOnChange(
                            null, null, props.i,
                            {
                                productName: m.value,
                                count: 1,
                                pricePerOne: found.price,
                                id: found.id,
                                category: found.category
                            })
                    }}
                    defaultValue={props.product.productName}
                    fluid
                    selectOnBlur={false}
                    selectOnNavigation={false}
                    placeholder='Type to search...'
                    search
                />
            </Form.Field>
            <Form.Field>
                <Form.Input
                    label='Product Price [CZK]'
                    fluid
                    value={props.product.pricePerOne}
                    onChange={(e, m) => props.handleProductDropdownOnChange(e, m, props.i, {
                        pricePerOne: m.value,
                        productName: props.product.productName,
                        count: props.product.count,
                        id: props.product.id,
                        category: props.product.category
                    })} />
            </Form.Field>
            <Form.Input
                autoFocus
                readOnly={props.product.category === 'Nonbillable' ? true : false}
                label='Product Count [Pcs]'
                fluid
                value={props.product.category === 'Nonbillable' ? 1 : props.product.count}
                onChange={(e, m) => props.handleProductDropdownOnChange(e, m, props.i, {
                    pricePerOne: props.product.pricePerOne,
                    productName: props.product.productName,
                    count: parseInt(m.value),
                    id: props.product.id,
                    category: props.product.category
                })} />
            <Form.Field>
                <label>Total Product Price [CZK]</label>
                <input readOnly value={props.product.totalPricePerProduct}></input>
            </Form.Field>
            <Button onClick={() => props.removeProductFromOrder(props.i)} className="buttonIconPadding" icon="close"></Button>
            <Divider style={{ borderColor: '#f20056' }} />
        </>);
}

export default ProductRow;