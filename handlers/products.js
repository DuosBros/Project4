

var Q = require('q');
var mongo;


Handler = function (app) {
    mongo = app.get('mongodb');
};


Handler.prototype.getAllProductsJson = function () {
    var deferred = Q.defer();

    var products = mongo.collection('productsV2');

    products.find()
        .toArray(function (err, allProducts) {
            var productsObject = {};

            allProducts.forEach(function (product) {
                productsObject[product.name] = {
                    price: product.price,
                    weight: product.weight,
                    tax: product.tax,
                    category: product.category,
                    invoiceDisplayName: product.invoiceDisplayName,
                    displayName: product.displayName,
                    id: product.id,
                    warehouse: product.warehouse,
                }
            });

            if (err) {
                console.log('ERROR while getting all products> ' + err);
                deferred.reject(err);
            } else {
                deferred.resolve(productsObject);
            }
        });

    return deferred.promise;
}

exports.Handler = Handler;
