import { getWarehouseProducts } from "../utils/requests";

export const fetchWarehouseProducts = (month, year, getWarehouseProductsAction) => {
    getWarehouseProducts(month, year)
        .then(res => {
            getWarehouseProductsAction({ success: true, data: res.data })
        })
        .catch(err => {
            getWarehouseProductsAction({ success: false, error: err })
        })
}