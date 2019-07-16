import { getProducts } from "../utils/requests";

export const fetchAndHandleProducts = (getProductsAction, showGenericModalAction, genericModalProps) => {
    getProducts()
        .then(res => {
            getProductsAction({ success: true, data: res.data })
        })
        .catch(err => {
            getProductsAction({ success: false, error: err })

            if (showGenericModalAction) {
                let { redirectTo, parentProps } = genericModalProps;

                showGenericModalAction({
                    redirectTo: redirectTo,
                    parentProps: parentProps,
                    err: err
                })
            }
        })
}

