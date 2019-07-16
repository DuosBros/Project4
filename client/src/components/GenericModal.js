import React from 'react';
import { Button, Modal, Accordion, Icon } from 'semantic-ui-react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { closeGenericModalAction } from '../utils/actions';
import { errorColor } from '../appConfig';

class GenericModal extends React.Component {

    state = { active: true }

    close = () => {
        this.props.closeGenericModalAction()
        if (this.props.redirectTo) {
            this.props.history.push(this.props.redirectTo)
        }
    }

    toggleAccordion = () => {
        this.setState({ active: !this.state.active });
    }

    render() {
        var accordion = null;
        const { active } = this.state;

        if (this.props.err) {
            accordion = (
                <Accordion fluid styled>
                    <Accordion.Title active={active} onClick={() => this.toggleAccordion()}>
                        <Icon name='dropdown' />
                        Error details
                </Accordion.Title>
                    <Accordion.Content style={{ overflowY: 'scroll' }} active={active}>
                        {this.props.err.response && this.props.err.response.data && this.props.err.response.data.message && this.props.err.response.data.message}
                        <br />
                        {this.props.err.message && this.props.err.message.toString()}
                        <br />
                        {this.props.err.toString()}
                        <br />
                        {this.props.err.stack}
                    </Accordion.Content>
                </Accordion>
            )
        }

        return (
            <Modal
                closeOnDimmerClick={false}
                dimmer={true}
                size='large'
                open={this.props.show}
                closeOnEscape={true}
                closeIcon={true}
                onClose={() => this.close()}
            >
                <Modal.Header style={this.props.err && { backgroundColor: errorColor }}>{this.props.header || "Error"}</Modal.Header>
                <Modal.Content>
                    {this.props.content || "Something happened!"}
                    {accordion}
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        onClick={() => this.close()}
                        labelPosition='right'
                        icon='checkmark'
                        content='Close'
                    />
                </Modal.Actions>
            </Modal>
        )
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        closeGenericModalAction
    }, dispatch);
}

export default withRouter(connect(null, mapDispatchToProps)(GenericModal));