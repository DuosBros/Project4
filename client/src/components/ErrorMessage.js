import React, { useState } from 'react'
import { Message, Icon, Image, Accordion } from 'semantic-ui-react'
import pikachu from '../assets/pikachu.jpg'

const ErrorMessage = (props) => {
    const [isRefreshButtonLoading, toggleRefreshButtonLoading] = useState(false);
    const [isAccordionExpanded, toggleAccordion] = useState(false);

    const handleRefresh = () => {
        toggleRefreshButtonLoading(true);
        props.handleRefresh();
        toggleRefreshButtonLoading(false);
    }

    let refresh = null;
    if (props.handleRefresh) {
        refresh = (
            <>
                Try again
                <Icon
                    className="pointerCursor"
                    onClick={() => handleRefresh()}
                    name="refresh"
                    loading={isRefreshButtonLoading} />
            </>
        )
    }

    const handleToggleAccordion = () => {
        toggleAccordion(!isAccordionExpanded)
    }

    let errorAccordion = null;
    if (props.error) {
        errorAccordion = (
            <Accordion>
                <Accordion.Title active={isAccordionExpanded} index={0} onClick={() => handleToggleAccordion()}>
                    <Icon name='dropdown' />
                    Details
                        </Accordion.Title>
                <Accordion.Content active={isAccordionExpanded}>
                    {props.error && props.error.toString()}
                    <br />
                    {props.error.stack}
                </Accordion.Content>
            </Accordion>
        )
    }

    return (
        <Message icon>
            {props.stripImage ? null : <Image src={pikachu} size='tiny' spaced />}
            <Message.Content>
                <Message.Header>{(props.title || "Ooops something went wrong")}</Message.Header>
                {props.message === "" ? null : <>{props.message} <br /></>}
                {refresh}
                {errorAccordion}
            </Message.Content>
        </Message>
    )
}

export default ErrorMessage;
