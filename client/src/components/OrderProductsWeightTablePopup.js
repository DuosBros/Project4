import React from 'react'
import { Grid, Divider, Popup, Icon } from 'semantic-ui-react';

class OrderProductsWeightTablePopup extends React.PureComponent {
    state = {}
    render() {
        let popupContentTable;

        let totalWeight = 0
        this.props.order.products.forEach(
            x => totalWeight += this.props.productsStore.products.data.find(y => y.id === x.id).weight * x.count
        )

        totalWeight += 500
        totalWeight = totalWeight / 1000

        popupContentTable = this.props.order.products.map((product, i) => {
            let found = this.props.productsStore.products.data.find(x => x.id === product.id);
            return (
                <Grid.Row key={i} className="noPaddingTopAndBottom">
                    <Grid.Column width={9} style={{ fontSize: '0.8em' }}>
                        {product.productName}
                    </Grid.Column>
                    <Grid.Column width={1} style={{ fontSize: '0.8em', paddingLeft: '0px', paddingRight: '0px', maxWidth: '85px' }}>
                        {product.count}
                    </Grid.Column>
                    <Grid.Column width={3} style={{ fontSize: '0.8em' }}>
                        {found.weight}
                    </Grid.Column>
                    <Grid.Column width={3} style={{ fontSize: '0.8em' }}>
                        <strong>{found.weight * product.count}</strong>
                    </Grid.Column>
                </Grid.Row>
            );
        })


        popupContentTable.push(
            <React.Fragment key={this.props.order.products.length + 1}>
                <Grid.Row className="noPaddingTopAndBottom">
                    <Grid.Column width={9} style={{ fontSize: '0.8em' }}>
                        Packaging
                        </Grid.Column>
                    <Grid.Column width={1} style={{ fontSize: '0.8em', paddingLeft: '0px', paddingRight: '0px', maxWidth: '85px' }}>
                    </Grid.Column>
                    <Grid.Column width={3} style={{ fontSize: '0.8em' }}>
                    </Grid.Column>
                    <Grid.Column width={3} style={{ fontSize: '0.8em' }}>
                        <strong>500</strong>
                    </Grid.Column>
                </Grid.Row>
                <Divider className="marginTopAndBottomSmall" />
                <Grid.Row>
                    <Grid.Column width={9}>
                        <strong>Total [gr]</strong>
                    </Grid.Column>
                    <Grid.Column width={1} style={{ paddingLeft: '0px', paddingRight: '0px', maxWidth: '85px' }}>
                    </Grid.Column>
                    <Grid.Column width={3}>
                    </Grid.Column>
                    <Grid.Column width={3}>
                        <strong>{totalWeight * 1000}</strong>
                    </Grid.Column>
                </Grid.Row>
            </React.Fragment>
        )

        return (
            <Popup
                hoverable={this.props.isMobile ? false : true}
                size={this.props.isMobile ? 'tiny' : 'large'}
                wide={this.props.isMobile ? false : true}
                position={this.props.isMobile ? 'top right' : 'bottom left'}
                trigger={<Icon name="question" />}
                inverted
                on={this.props.isMobile ? 'click' : 'hover'}  >
                <Popup.Content>
                    Weight of package - Automatically calculated based on products.
                                                    <Divider />
                    <br />
                    <Grid>
                        <Grid.Row style={{ fontWeight: 'bold', fontSize: '0.8em', paddingTop: '0px', paddingBottom: '0px' }}>
                            <Grid.Column width={9} >
                                Product
                                                            </Grid.Column>
                            <Grid.Column width={1} style={{ paddingLeft: '0px', paddingRight: '0px', maxWidth: '85px' }}>
                                #
                                                            </Grid.Column>
                            <Grid.Column width={3} style={{ fontSize: '0.8em' }}>
                                {this.isMobile ? 'WpU [gr]' : 'Weight/Unit [gr]'}
                            </Grid.Column>
                            <Grid.Column width={3} style={{ bottom: '0.25em' }}>
                                Sum [gr]
                                                            </Grid.Column>
                        </Grid.Row>
                        {popupContentTable}
                    </Grid>
                </Popup.Content>
            </Popup>
        );
    }
}

export default OrderProductsWeightTablePopup;