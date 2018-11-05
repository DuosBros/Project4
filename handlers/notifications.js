

var rp = require('request-promise');
var Q = require('q');

var OthersHandler = require('../handlers/others.js').Handler;
var othersHandler;

var WarehouseHandler = require('../handlers/warehouse.js').Handler;
var warehouseHandler;

Handler = function(app) {
    handler = this;

    othersHandler = new OthersHandler(app);
    warehouseHandler = new WarehouseHandler(app);
};

Handler.prototype.getNotPaidNotifications = function() {

    var deferred = Q.defer();


    deferred.resolve("kund")

    return deferred.promise;
    // {
    //     product: xxx,
    //     current: 123,
    //     threshold: 100
    // },
    // {
    //     VS: 123,
    //     orderDate: 10.10.2018,
    //     threshold: 1.10.2018,
    // }
}

Handler.prototype.mapProductNamesToAmountsPromise = function(productNames, productsData) {
    var deferred = Q.defer();

    console.log('piiizda')
    var mappedProductNamesToAmounts = mapProductNamesToAmounts(productNames, productsData);
    console.log('will resolve')
    deferred.resolve(mappedProductNamesToAmounts);

    return deferred.promise;
}

function mapProductNamesToAmounts(productNames, productsData) {
    var mappedDatabaseObject = {};
    productsData.forEach(function(product) {
        mappedDatabaseObject[product.productName] = {
            total: product.amount,
            calculationDate: new Date(product.calculationDate),
            notificationThreshold: product.notificationThreshold
        };
    })

    var mappedDefaultProductsCounts = {};

    productNames.forEach(function(productName) {
        mappedDefaultProductsCounts[productName] = {total: 0, booked: 0, calculationDate: new Date()};
    })

    return Object.assign({}, mappedDefaultProductsCounts, mappedDatabaseObject);
}

Handler.prototype.getWarehouseNotifications = function() {

    var deferred = Q.defer();

    var allProductNames;
    var allProductSales;
    var allProductsData;
    var mappedProductsCounts;

    var result = [];

    othersHandler.getAllProductsJson()
    .then(function(products) {
        var productsSalesPromises = [];

        allProductNames = Object.keys(products);
        allProductNames.forEach(function(productName) {
            productsSalesPromises.push(warehouseHandler.getProductsInOrders(productName));
        });

        return Q.all(productsSalesPromises);
    })
    .then(function(productSales) {
        allProductSales = productSales.reduce(function(mappedData, obj) {
            var objKeys = Object.keys(obj);
            mappedData[objKeys[0]] = obj[objKeys[0]];

            return mappedData;
        }, {});

        return warehouseHandler.getProductsData();
    })
    .then(function(productsData) {
        allProductsData = productsData;

        mappedProductsCounts = mapProductNamesToAmounts(allProductNames, allProductsData);

        for (var i = 0; i < allProductNames.length; i++) {
            var productName = allProductNames[i];
            var notificationThreshold = mappedProductsCounts[productName].notificationThreshold;
            var currentValue = mappedProductsCounts[productName].total - allProductSales[productName].paid - allProductSales[productName].notPaid;

            if (!notificationThreshold) {
                notificationThreshold = 0;
            }

            if (currentValue < notificationThreshold) {
                result.push({product: productName, current: currentValue, threshold: notificationThreshold});
            }
        }

        deferred.resolve(result);
    })

    return deferred.promise;
    // {
    //     product: xxx,
    //     current: 123,
    //     threshold: 100
    // },
    // {
    //     VS: 123,
    //     orderDate: 10.10.2018,
    //     threshold: 1.10.2018,
    // }
}


exports.Handler = Handler;