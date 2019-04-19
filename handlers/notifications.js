

var rp = require('request-promise');
var Q = require('q');

var OthersHandler = require('../handlers/others.js').Handler;
var othersHandler;

var WarehouseHandler = require('../handlers/warehouse.js').Handler;
var warehouseHandler;

var ZaslatHandler = require('../handlers/zaslat-api.js').Handler;
var zaslatHandler;

var ProdHandler = require('../handlers/products.js').Handler;
var prodHandler;

Handler = function(app) {
    handler = this;

    othersHandler = new OthersHandler(app);
    warehouseHandler = new WarehouseHandler(app);
    zaslatHandler = new ZaslatHandler(app);
    prodHandler = new ProdHandler(app);
};

Handler.prototype.getNotPaidNotifications = function() {

    var deferred = Q.defer();

    var checkedDate = new Date();
    checkedDate.setDate(checkedDate.getDate() - 14);

    var result = [];

    var allShipments = {};

    var getShipmentsPromises = [];
    getShipmentsPromises.push(zaslatHandler.getAllShipments());
    getShipmentsPromises.push(zaslatHandler.getAllShipments(100));
    getShipmentsPromises.push(zaslatHandler.getAllShipments(200));

    Q.all(getShipmentsPromises)
    .then(function(shipments) {
        allShipments = Object.assign(allShipments, shipments[0], shipments[1], shipments[2]);

        return zaslatHandler.getAllZaslatOrders();
    })
    .then(function(zaslatOrders) {
        for (var i = 0; i < zaslatOrders.length; i++) {
            var zaslatOrder = zaslatOrders[i];
            if (!zaslatOrder.payment.paymentDate) {
                if (allShipments[zaslatOrder.zaslatShipmentId]) {
                    var deliveryDate = new Date(allShipments[zaslatOrder.zaslatShipmentId].delivery_date);
                    if (deliveryDate < checkedDate) {
                        var notificationItem = {
                            vs: zaslatOrder.payment.vs,
                            deliveryDate: deliveryDate,
                            threshold: checkedDate
                        }
                        result.push(notificationItem);
                    }
                }
            }
        }

        deferred.resolve(result);
    });

    return deferred.promise;
}

Handler.prototype.mapProductNamesToAmountsPromise = function(productNames, productsData) {
    var deferred = Q.defer();

    var mappedProductNamesToAmounts = mapProductNamesToAmounts(productNames, productsData);
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

    prodHandler.getAllProductsJson()
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
}


exports.Handler = Handler;