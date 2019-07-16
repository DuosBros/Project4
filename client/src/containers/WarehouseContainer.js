import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import moment from 'moment';

import {
    getProductsAction, getWarehouseProductsAction, deleteProductAction, editProductAction
} from '../utils/actions';
import Warehouse from '../pages/Warehouse/Warehouse';
import { editProduct, editWarehouseProduct } from '../utils/requests';
import { fetchWarehouseProducts } from '../handlers/warehouseHandler';
import { fetchAndHandleProducts } from '../handlers/productHandler';
import { LOCALSTORAGE_NAME, errorColor } from '../appConfig';

class WarehouseContainer extends React.PureComponent {

    componentDidMount() {
        this.fetchAllData()
    }

    fetchAllData = () => {
        this.fetchAndHandleWarehouseProducts();

        fetchAndHandleProducts(this.props.getProductsAction)
    }

    handleDeleteProduct = async (product) => {
        let payload = Object.assign({}, product)
        delete payload.actions
        payload.isActive = false
        await editProduct(payload)

        this.fetchAllData()
    }

    handleEditWarehouseProductCount = async (id, difference) => {
        let payload = {
            difference: difference,
            user: JSON.parse(atob(localStorage.getItem(LOCALSTORAGE_NAME).split('.')[1])).username
        }
        await editWarehouseProduct(id, payload)
        this.fetchAllData()
    }

    fetchAndHandleWarehouseProducts = (month, year) => {
        if (!month && !year) {
            if (this.props.location.search) {
                let param = new URLSearchParams(this.props.location.search)
                month = param.get("month")
                year = param.get("year")
            }
            else {
                month = moment().month() + 1
                year = moment().year()
            }
        }

        fetchWarehouseProducts(month, year, this.props.getWarehouseProductsAction)
    }

    render() {
        let mappedWhProducts = [];
        if (this.props.productsStore.warehouseProducts.success && this.props.productsStore.warehouseProducts.data
            && this.props.productsStore.products.success && this.props.productsStore.products.data) {
            mappedWhProducts = this.props.productsStore.warehouseProducts.data.slice();

            mappedWhProducts.map(x => {
                let found = this.props.productsStore.products.data.find(y => y.id === x.id)
                // x.calculationDate = found.warehouse.calculationDate
                x.isActive = found.isActive
                x.history = found.warehouse.history.reverse()
                x.notificationThreshold = found.notificationThreshold
                x.availableAlert = x.available < x.notificationThreshold && { backgroundColor: errorColor }
                return x;
            })
        }

        return (
            <Warehouse
                fetchAllData={this.fetchAllData}
                isMobile={this.props.isMobile}
                warehouseProducts={mappedWhProducts.length > 0 ? { data: mappedWhProducts, success: true } : this.props.productsStore.warehouseProducts}
                fetchAndHandleWarehouseProducts={this.fetchAndHandleWarehouseProducts}
                productCategories={this.props.productsStore.productCategories}
                handleDeleteProduct={this.handleDeleteProduct}
                handleEditWarehouseProductCount={this.handleEditWarehouseProductCount}
                {...this.props} />)
    }
}

function mapStateToProps(state) {
    return {
        ordersStore: state.OrdersReducer,
        productsStore: state.ProductsReducer
    };
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators({
        getProductsAction,
        getWarehouseProductsAction,
        deleteProductAction,
        editProductAction
    }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(WarehouseContainer);
