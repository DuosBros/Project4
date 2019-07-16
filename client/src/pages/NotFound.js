import React from 'react';
import { Image, Grid } from 'semantic-ui-react'
import obi from '../assets/obi.jpg'
import { APP_TITLE } from '../appConfig';

const NotFound = () => {
    document.title = APP_TITLE + "404 Not found";
    return (
        <Grid stackable>
            <Grid.Row>
                <Grid.Column>
                    <Image src={obi} />
                </Grid.Column>
            </Grid.Row>
        </Grid>

    )
}

export default NotFound