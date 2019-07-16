import React from 'react'
import { Button, Modal, Form, Grid, Dropdown, TextArea } from 'semantic-ui-react';
import { createCost, editCost } from '../utils/requests';
import moment from 'moment';
import { addCostAction, showGenericModalAction, editCostAction } from '../utils/actions';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

class AddEditCostModal extends React.PureComponent {

    setInput = (e, b) => {
        this.setState({ [b.id]: b.value });
    }

    handleSaveCost = async () => {
        let { description, note, cost, category } = this.state
        let payload = {
            description: description,
            note: note,
            cost: cost,
            category: category,
        }


        if (this.state.isEdit) {
            payload.id = this.props.cost.id
            payload.date = this.props.cost.date
            try {
                await editCost(payload)
                this.props.editCostAction(payload)
            } catch (err) {
                this.props.showGenericModalAction({
                    redirectTo: '/costs',
                    parentProps: this.props,
                    err: err
                })
            }
            finally {
                this.props.handleToggleEditCostModal()
            }
        }
        else {
            payload.date = moment().toISOString();
            try {
                await createCost(payload)
                this.props.addCostAction(payload)
            }
            catch (err) {
                this.props.showGenericModalAction({
                    redirectTo: '/costs',
                    parentProps: this.props,
                    err: err
                })
            }
            finally {
                this.props.handleToggleEditCostModal()
            }
        }
    }

    state = {
        description: this.props.cost && this.props.cost.description,
        note: this.props.cost && this.props.cost.note,
        cost: this.props.cost && this.props.cost.cost,
        category: this.props.cost && this.props.cost.category,
        isEdit: this.props.cost ? true : false
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

        let costObject = this.props.cost && this.props.cost;
        let content;

        content = (
            <Grid>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            Description
                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form>
                            <Form.Field>
                                <TextArea onChange={this.setInput} value={this.state.description ? this.state.description : costObject && costObject.description} autoHeight rows={1} id="description" />
                            </Form.Field>
                        </Form>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            Note
                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form>
                            <Form.Field>
                                <TextArea onChange={this.setInput} value={this.state.note ? this.state.note : costObject && costObject.note} autoHeight rows={1} id="note" />
                            </Form.Field>
                        </Form>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row verticalAlign='middle' className="paddingTopAndBottomSmall">
                    <Grid.Column width={5}>
                        <strong>
                            Value [CZK]
                            </strong>
                    </Grid.Column>
                    <Grid.Column width={11}>
                        <Form.Input onChange={this.setInput} fluid id="cost" value={this.state.cost ? this.state.cost : costObject && costObject.cost} />
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
                            text={this.state.category ? this.state.category : costObject ? costObject.category && costObject.category : ""}
                            selectOnBlur={false}
                            selectOnNavigation={false} />
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
                onClose={this.props.handleToggleEditCostModal}
            >
                <Modal.Header>{costObject ? 'Edit cost' : 'Add cost'}</Modal.Header>
                <Modal.Content>
                    {content}
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        disabled={!(this.state.description && this.state.cost && this.state.category)}
                        onClick={this.handleSaveCost}
                        className="primaryButton"
                        labelPosition='right'
                        icon='checkmark'
                        content='OK'
                    />
                    <Button
                        onClick={this.props.handleToggleEditCostModal}
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
        addCostAction,
        showGenericModalAction,
        editCostAction
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(AddEditCostModal);