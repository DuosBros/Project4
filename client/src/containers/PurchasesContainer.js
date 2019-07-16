import React from 'react';

import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { getPurchasesAction, getProductsAction, deletePurchaseAction, showGenericModalAction } from '../utils/actions';
import { getPurchases, deletePurchase } from '../utils/requests';
import Purchases from '../pages/Purchases';
import { fetchAndHandleProducts } from '../handlers/productHandler';

class PurchasesContainer extends React.Component {

    componentDidMount() {
        this.fetchPurchases()
        fetchAndHandleProducts(this.props.getProductsAction)
    }

    componentDidUpdate(prevProps) {
        if (prevProps.location.key !== this.props.location.key) {
            this.fetchAllData()
            fetchAndHandleProducts(this.props.getProductsAction)
        }
    }

    handleDeletePurchase = (id) => {
        deletePurchase(id)
            .then(() => {
                this.props.deletePurchaseAction({ success: true, data: id })
            })
            .catch((err) => {
                this.props.showGenericModalAction({
                    header: "Failed to delete purchase",
                    err: err
                })
            })
    }

    fetchPurchases = async () => {
        try {
            let res = await getPurchases()
            this.props.getPurchasesAction({ success: true, data: res.data })
        } catch (err) {
            this.props.getPurchasesAction({ success: false, error: err })
        }
    }

    render() {
        let pathname = this.props.location.pathname;

        if (pathname === "/purchases") {
            return (
                <Purchases
                    products={this.props.productsStore.products}
                    purchases={this.props.purchasesStore.purchases}
                    handleDeletePurchase={this.handleDeletePurchase}
                    {...this.props}
                />
            )
        }
    }
}

function mapStateToProps(state) {
    return {
        purchasesStore: state.PurchasesReducer,
        productsStore: state.ProductsReducer
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getPurchasesAction,
        getProductsAction,
        deletePurchaseAction,
        showGenericModalAction
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PurchasesContainer);