import React from 'react';
import { Button, Modal, Grid } from 'semantic-ui-react';

import TrackingInfoTable from './TrackingInfoTable';

class TrackingInfoModal extends React.PureComponent {

    close = () => {
        this.props.handleToggleTrackingInfoModal()
    }

    toggleAccordion = () => {
        this.setState({ active: !this.state.active });
    }

    render() {
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
                <Modal.Header>Tracking Info - {this.props.zaslatId}</Modal.Header>
                <Modal.Content>
                    <Grid>
                        <Grid.Row>
                            <Grid.Column>
                                <TrackingInfoTable tableHeader={false} compact="very" rowsPerPage={0} data={this.props.data} />
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
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

export default TrackingInfoModal;