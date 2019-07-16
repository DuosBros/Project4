import React from 'react';
import { Grid, Header, Form, Button, Input } from 'semantic-ui-react';
import Flatpickr from 'react-flatpickr';
import '../../node_modules/flatpickr/dist/themes/dark.css';
import moment from 'moment';

class Scripts extends React.PureComponent {
    state = {
        isExportCashOrdersRunning: false,
        isExportOrdersRunning: false,
        isExportByVsRunning: false,
        isExpireByVsRunning: false
    }

    handleFlatpickr = (event, m, c) => {
        this.setState({ [c.element.className.split(" ")[0]]: moment(event[0]) });
    }

    handleExportCashOrders = async () => {
        this.setState({ isExportCashOrdersRunning: true });
        let { firstName, lastName, streetName, streetNumber, city, zip, phone } = this.state

        let customerInfo = {
            firstName,
            lastName,
            streetName,
            streetNumber,
            city,
            zip,
            phone
        }

        // so iso string hours will be 00:00:00
        // let from = this.state.exportCashOrdersFrom.format('YYYY-MM-DDT00:00:00.000[Z]')
        // let to = this.state.exportCashOrdersTo.format('YYYY-MM-DDT00:00:00.000[Z]')
        try {
            await this.props.handleExportCashOrders(this.state.exportCashOrdersFrom, this.state.exportCashOrdersTo, customerInfo)
        } catch (error) {
            this.setState({ error });
        }
        finally {
            this.setState({ isExportCashOrdersRunning: false });
        }
    }

    handleChange = (e, { name, value }) => {
        this.setState({ [name]: value })
    }

    handleExportOrders = async () => {
        this.setState({ isExportOrdersRunning: true });
        try {
            await this.props.handleExportOrders(this.state.exportOrdersFrom, this.state.exportOrdersTo)
        } catch (error) {
            this.setState({ error });
        }
        finally {
            this.setState({ isExportOrdersRunning: false });
        }
    }

    handleExportByVs = async () => {
        this.setState({ isExportByVsRunning: true });
        try {
            await this.props.handleExportByVs(this.state.exportByVs)
        } catch (error) {
            this.setState({ error });
        }
        finally {
            this.setState({ isExportByVsRunning: false });
        }
    }

    handleExpireByVs = async () => {
        this.setState({ isExpireByVsRunning: true });
        try {
            let array = []
            array.push(this.state.expireByVs)
            await this.props.handleExpireByVs(array)
        } catch (error) {
            this.setState({ error });
        }
        finally {
            this.setState({ isExpireByVsRunning: false });
        }
    }

    render() {
        return (
            <Grid stackable>
                <Grid.Row style={{ marginBottom: '1em' }}>
                    <Grid.Column width={2}>
                        <Header as='h1'>
                            Scripts
                        </Header>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column width={5}>
                        <Header as='h3' content="Export And Replace Cash Orders" />
                        <Form>
                            <Form.Field required>
                                <label>From:</label>
                                <Flatpickr
                                    className="exportCashOrdersFrom"
                                    onChange={this.handleFlatpickr}
                                    options={{
                                        dateFormat: 'd.m.Y', disableMobile: true, locale: {
                                            "firstDayOfWeek": 1 // start week on Monday
                                        }
                                    }} />
                            </Form.Field>
                            <Form.Field required>
                                <label>To:</label>
                                <Flatpickr
                                    className="exportCashOrdersTo"
                                    onChange={this.handleFlatpickr}
                                    options={{
                                        dateFormat: 'd.m.Y', disableMobile: true, locale: {
                                            "firstDayOfWeek": 1 // start week on Monday
                                        }
                                    }} />
                            </Form.Field>
                            <Form.Field required>
                                <label>Customer Info:</label>
                                <Input onChange={this.handleChange} name="firstName" placeholder="First Name" />
                                <Input onChange={this.handleChange} name="lastName" placeholder="Last Name" />
                                <Input onChange={this.handleChange} name="streetName" placeholder="Street Name" />
                                <Input onChange={this.handleChange} name="streetNumber" placeholder="Street Number" />
                                <Input onChange={this.handleChange} name="city" placeholder="City" />
                                <Input onChange={this.handleChange} name="zip" placeholder="ZIP" />
                                <Input onChange={this.handleChange} name="phone" placeholder="Phone" />
                            </Form.Field>
                            <Form.Field>
                                <Button
                                    onClick={this.handleExportCashOrders}
                                    loading={this.state.isExportCashOrdersRunning}
                                    className="primaryButton"
                                    content="Export" />
                            </Form.Field>
                        </Form>
                    </Grid.Column>
                    <Grid.Column width={3}>
                        <Header as='h3' content="Export Orders" />
                        <Form>
                            <Form.Field required>
                                <label>From:</label>
                                <Flatpickr
                                    className="exportOrdersFrom"
                                    onChange={this.handleFlatpickr}
                                    options={{ dateFormat: 'd.m.Y', disableMobile: true }} />
                            </Form.Field>
                            <Form.Field required>
                                <label>To:</label>
                                <Flatpickr
                                    className="exportOrdersTo"
                                    onChange={this.handleFlatpickr}
                                    options={{ dateFormat: 'd.m.Y', disableMobile: true }} />
                            </Form.Field>
                            <Button onClick={this.handleExportOrders} loading={this.state.isExportOrdersRunning} className="primaryButton" content="Export" />
                        </Form>
                    </Grid.Column>
                    <Grid.Column width={4}>
                        <Header as='h3' content="Export By VS" />
                        <Form>
                            <Form.Field required>
                                <label>VS:</label>
                                <Form.Input onChange={this.handleChange} name="exportByVs" />
                                <Button loading={this.state.isExportByVsRunning} onClick={this.handleExportByVs} className="primaryButton" content="Export" />
                            </Form.Field>
                        </Form>
                    </Grid.Column>
                    <Grid.Column width={4}>
                        <Header as='h3' content="Expire Order" />
                        <Form>
                            <Form.Field required>
                                <label>VS:</label>
                                <Form.Input onChange={this.handleChange} name="expireByVs" />
                                <Button loading={this.state.isExpireByVsRunning} onClick={this.handleExpireByVs} className="primaryButton" content="Expire" />
                            </Form.Field>
                        </Form>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        );
    }
}

export default Scripts;