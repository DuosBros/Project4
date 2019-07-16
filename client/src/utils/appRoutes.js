import React from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import HttpsRedirect from 'react-https-redirect';

import CommonReducer from './CommonReducer';
import Base from './Base';

export default class AppRoutes extends React.Component {
    constructor() {
        super();
        this.store = createStore(CommonReducer);
    }

    render() {
        return (
            <Provider store={this.store}>
                <HttpsRedirect>
                    <Base />
                </HttpsRedirect>
            </Provider >
        );
    }
}