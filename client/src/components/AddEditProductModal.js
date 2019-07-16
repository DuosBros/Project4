import React from 'react'
import { Button, Modal, Form, Grid, Dropdown, Checkbox } from 'semantic-ui-react';
import { editProduct, createProduct } from '../utils/requests';
import { showGenericModalAction, addProductAction, editProductAction } from '../utils/actions';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

class AddEditProductModal extends React.PureComponent {

    setInput = (e, b) => {
        this.setState({ [b.id]: b.value });
    }

    handleOnChangeCheckbox = (e, { name, checked }) => {
        this.setState({ [name]: checked });
    }
    handleSaveProduct = async () => {
        let { name, price, weight, tax, category, isActive, notificationThreshold } = this.state;
        let payload = {
            name: name,
            price: parseInt(price),
            weight: parseInt(weight),
            tax: parseInt(tax),
            category: category,
            isActive: isActive,
            notificationThreshold: parseInt(notificationThreshold)
        }

        try {
            if (this.state.isEdit) {
                payload.id = this.props.product.id
                await editProduct(payload)
            }
            else {
                await createProduct(payload)
            }
        } catch (err) {
            this.props.showGenericModalAction({
                redirectTo: '/warehouse',
                parentProps: this.props,
                err: err
            })
        }
        finally {
            this.props.fetchAllData()
            this.props.handleToggleProductModal()
        }
    }

    state = {
        name: this.props.product && this.props.product.name,
        price: this.props.product && this.props.product.price,
        weight: this.props.product && this.props.product.weight,
        tax: this.props.product && this.props.product.tax,
        category: this.props.product && this.props.product.category,
        isEdit: this.props.product ? true : false,
        isActive: this.props.product && this.props.product.isActive,
        notificationThreshold: this.props.product ? this.props.product.notificationThreshold : 0
    }

    handleCategoryDropdownOnChange = (e, b) => {
        let category = this.props.categories[b.value]
        if (category) {
            this.setState({ category: category.text });
        }
    }

    handleAddition = (e, { value }) => {
        this.setState({ category: value });
    }

    render() {

        let content;

        let { name, price, weight, tax, isActive, notificationThreshold, isEdit, category } = this.state;
        content = (
            <Grid>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            Name
                        </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form>
                            <Form.Field>
                                <Form.Input fluid onChange={this.setInput} value={name} id="name" />
                            </Form.Field>
                        </Form>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            Price [CZK]
                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form>
                            <Form.Field>
                                <Form.Input fluid onChange={this.setInput} value={price} id="price" />
                            </Form.Field>
                        </Form>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            Weight [gr]
                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form.Input onChange={this.setInput} fluid id="weight" value={weight} />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            Tax [%]
                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form.Input onChange={this.setInput} fluid id="tax" value={tax} />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            Category
                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Dropdown
                            search
                            allowAdditions
                            onAddItem={this.handleAddition}
                            fluid
                            selection
                            onChange={this.handleCategoryDropdownOnChange}
                            options={this.props.categories}
                            text={this.state.category}
                            selectOnBlur={false}
                            selectOnNavigation={false} />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            Notification Threshold:
                        </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form.Input onChange={this.setInput} fluid id="notificationThreshold" value={notificationThreshold} />
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            Is Active:
                        </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Checkbox name="isActive" onChange={this.handleOnChangeCheckbox} checked={isActive} />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        )

        return (
            <Modal
                size='small'
                open={this.props.show}
                closeOnDimmerClick={true}
                closeOnEscape={true}
                closeIcon={true}
                onClose={this.props.handleToggleProductModal}
            >
                <Modal.Header>{isEdit ? 'Edit product' : 'Add product'}</Modal.Header>
                <Modal.Content>
                    {content}
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        disabled={!(name && price && category)}
                        onClick={this.handleSaveProduct}
                        className="primaryButton"
                        labelPosition='right'
                        icon='checkmark'
                        content='OK'
                    />
                    <Button
                        onClick={this.props.handleToggleProductModal}
                        labelPosition='right'
                        icon='checkmark'
                        content='Close'
                    />
                </Modal.Actions>
            </Modal>
        )
    }
}

function mapStateToProps(state) {
    return {
        costsStore: state.CostsReducer
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        showGenericModalAction,
        editProductAction,
        addProductAction
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AddEditProductModal);