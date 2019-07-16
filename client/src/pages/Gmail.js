import React from 'react';
import { Grid, Header, Button, Icon } from 'semantic-ui-react';
import { gmailValidateToken } from '../utils/requests';
import MailsTable from '../components/MailsTable';

class Gmail extends React.PureComponent {
    state = {}

    handleOpenWindow = () => {
        let authWindow = window.open(this.props.isLogged.url, "Please sign in with Google", "width=300px,height:500px");
        window.onmessage = async (e) => {
            authWindow.close();
            let urlWithCode = e.data;
            let idx = urlWithCode.lastIndexOf("code=");
            let codeWithScope = urlWithCode.substring(idx + 5).replace("#", "");
            let code = codeWithScope.substring(0, codeWithScope.lastIndexOf('&'));

            try {
                await gmailValidateToken(code);
                this.props.validateTokenAction({ isValid: true, token: code })
            }
            catch (err) {
                this.props.validateTokenAction({ isValid: false, token: null })

            }

            this.props.gmailGetEmailsAndHandleResult();
        }
    }


    render() {
        if (!this.props.isLogged.data) {
            return (
                <Grid stackable>
                    <Grid.Row style={{ marginBottom: '1em' }}>
                        <Grid.Column width={2}>
                            <Header as='h1'>
                                Gmail
                            </Header>
                        </Grid.Column>
                    </Grid.Row>
                    <Grid.Row>
                        <Grid.Column>
                            <Button
                                onClick={() => this.handleOpenWindow()}
                                animated
                                as="a"
                                style={{ padding: '0.3em' }}
                                size='medium'
                            >
                                <Button.Content visible>
                                    <Button labelPosition="left" icon>
                                        You are not logged in.
                                        <Icon name="google" />
                                    </Button>
                                </Button.Content>
                                <Button.Content hidden>
                                    <Icon name='arrow right' />
                                </Button.Content>
                            </Button>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            )
        }
        return (
            <Grid stackable>
                <Grid.Row style={{ marginBottom: '1em' }}>
                    <Grid.Column width={2}>
                        <Header as='h1'>
                            Gmail
                    </Header>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column>
                        <MailsTable rowsPerPage={50} compact="very" data={this.props.emails.data} />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        );
    }
}

export default Gmail;