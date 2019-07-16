import React from 'react';
import { Accordion, Icon } from 'semantic-ui-react'

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null, errorInfo: null, isActive: false };
    }

    componentDidCatch(error, errorInfo) {
        // Catch errors in any components below and re-render with error message
        this.setState({
            error: error,
            errorInfo: errorInfo
        })
    }

    render() {
        var { isActive, error, errorInfo } = this.state
        if (errorInfo) {
            return (
                <>
                    <Accordion>
                        <Accordion.Title active={isActive} index={0} onClick={() => this.setState({ isActive: !isActive })}>
                            <Icon name='dropdown' />
                            Something happened!<br/>Details
                        </Accordion.Title>
                        <Accordion.Content active={isActive}>
                            {error && error.toString()}
                            <br />
                            {errorInfo.componentStack}
                        </Accordion.Content>
                    </Accordion>
                </>)
        }

        return this.props.children;
    }
}