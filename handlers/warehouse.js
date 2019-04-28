var Q = require('q');
var mongo;
var ACTIVE_ORDERS_STATE;
var warehouseHandler;

var ProdHandler = require('../handlers/products.js').Handler;
var prodHandler;

Handler = function (app) {
    mongo = app.get('mongodb');
    ACTIVE_ORDERS_STATE = app.get('ACTIVE_ORDERS_STATE');
    warehouseHandler = this;

    prodHandler = new ProdHandler(app);
};

Handler.prototype.saveProductAmount = function (productName, amount, calculationDate, difference, user, notificationThreshold) {
    var deferred = Q.defer();

    var productsV2 = mongo.collection('productsV2');

    productsV2.update(
        { 'name': productName },
        {
            $set: {
                'warehouse.amount': amount,
                'warehouse.calculationDate': new Date(calculationDate),
                'warehouse.notificationThreshold': notificationThreshold
            },
            $push: {
                'warehouse.history': {
                    'timestamp': new Date(),
                    'difference': difference,
                    'user': user
                }
            }
        },
        function (err, result) {
            if (result.result.n == 1) {
                deferred.resolve(result);
            } else {
                var error = new Error('error while updating product ' + productName);
                console.log(error + '> ' + err);
                error.status = 400;
                deferred.reject(error);
            }
        });

    return deferred.promise;
}

Handler.prototype.getSingleProductData = function (productName) {
    var deferred = Q.defer();

    var productsV2 = mongo.collection('productsV2');

    productsV2.findOne({ name: productName }, function (err, result) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(result.warehouse);
        }
    });
    return deferred.promise;
}

Handler.prototype.getProductsData = function () {
    var deferred = Q.defer();

    var productsV2 = mongo.collection('productsV2');

    productsV2.find().toArray(function (err, result) {
        if (err) {
            deferred.reject(err);
        } else {
            var tmpProductsData = [];
            for (var i = 0; i < result.length; i++) {
                if (result[i].category !== 'Nonbillable') {
                    var prod = result[i].warehouse;
                    prod.productName = result[i].name;
                    tmpProductsData.push(prod);
                }
            }

            deferred.resolve(tmpProductsData);
        }
    });

    return deferred.promise;
}

Handler.prototype.getProductsInOrders = function (productName) {
    var deferred = Q.defer();

    var ordersCollection = mongo.collection('orders');
    var match;
    var unwind = { $unwind: "$products" };
    var projection = { $project: { 'products.productName': 1, 'products.count': 1, 'paymentDate': { $ifNull: ['$payment.paymentDate', 'notPaid'] }, '_id': 0 } };
    var projection2 = { $project: { 'products.productName': 1, 'products.count': 1, 'paymentDate': { $cond: { if: { $eq: ["$paymentDate", 'notPaid'] }, then: 'notPaid', else: 'paid' } }, '_id': 0 } };
    var match2 = { $match: { 'products.productName': productName } };
    var group = { $group: { _id: { paymentDate: "$paymentDate", product: "$products.productName" }, count: { $sum: "$products.count" } } };
    var projection3 = { $project: { 'product': "$_id.product", 'payment': '$_id.paymentDate', 'count': 1, _id: 0 } };
    var pipeline = [];

    this.getProductsCalculationDate(productName)
        .then(function (calculationDate) {
            match = { $match: { 'state': ACTIVE_ORDERS_STATE, 'payment.orderDate': { '$gte': calculationDate } } };

            pipeline.push(match);
            pipeline.push(projection);
            pipeline.push(projection2);
            pipeline.push(unwind);
            pipeline.push(match2);
            pipeline.push(group);
            pipeline.push(projection3);

            ordersCollection.aggregate(pipeline, function (err, result) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(warehouseHandler.mapResults(productName, result));
                }
            });
        })

    return deferred.promise;
}

Handler.prototype.mapResults = function (productName, results) {
    var resultObject = {};
    resultObject[productName] = {};
    resultObject[productName].paid = 0;
    resultObject[productName].notPaid = 0;
    results.forEach(function (result) {
        if (result.payment == "paid") {
            resultObject[productName].paid = result.count;
        } else {
            resultObject[productName].notPaid = result.count;
        }
    })
    return resultObject;
}

Handler.prototype.getProductsCalculationDate = function (productName) {
    var deferred = Q.defer();

    var productsV2 = mongo.collection('productsV2');


    var match = { 'name': productName };
    productsV2.findOne(match, function (err, result) {
        if (err) {
            deferred.reject(err);
        } else if (!result) {
            deferred.resolve(new Date());
        } else {
            deferred.resolve(result.warehouse.calculationDate);
        }
    });

    return deferred.promise;
}

function mapWarehouseV2(whData) {
    var mappedData = {
        timeSpan: whData.timeSpan,
        products: [],
    };

    Object.keys(whData.products).forEach(function (key) {
        var product = whData.products[key];
        product.name = key;

        mappedData.products.push(product);
    });

    return mappedData;
}

function calculateProductInput(warehouse, month, year) {
    if (!warehouse || !warehouse.history || !warehouse.history.length > 0) {
        return 0;
    }

    var history = warehouse.history;

    for (var i = 0; i < history.length; i++) {
        var timestamp = history[i].timestamp;
        var difference = history[i].difference;
        if (timestamp.getFullYear() == year && timestamp.getMonth() == month) {
            return difference;
        }
    }

    return 0;
}

Handler.prototype.getProductsInOrdersV2 = function (productName, month, year) {
    var deferred = Q.defer();

    var fromDate = new Date(year, month, 1);
    var toDate = new Date(year, month, 1);
    toDate = toDate.setMonth(toDate.getMonth() + 1);
    toDate = new Date(toDate);

    var ordersCollection = mongo.collection('orders');
    var match;
    var unwind = { $unwind: "$products" };
    var projection = { $project: { 'products.productName': 1, 'products.count': 1, 'paymentDate': { $ifNull: ['$payment.paymentDate', 'notPaid'] }, '_id': 0 } };
    var projection2 = { $project: { 'products.productName': 1, 'products.count': 1, 'paymentDate': { $cond: { if: { $eq: ["$paymentDate", 'notPaid'] }, then: 'notPaid', else: 'paid' } }, '_id': 0 } };
    var match2 = { $match: { 'products.productName': productName } };
    var group = { $group: { _id: { paymentDate: "$paymentDate", product: "$products.productName" }, count: { $sum: "$products.count" } } };
    var projection3 = { $project: { 'product': "$_id.product", 'payment': '$_id.paymentDate', 'count': 1, _id: 0 } };
    var pipeline = [];

    match = {
        $match: {
            'state': ACTIVE_ORDERS_STATE,
            'payment.orderDate': {
                '$gte': fromDate,
                '$lt': toDate,
            }
        }
    };

    pipeline.push(match);
    pipeline.push(projection);
    pipeline.push(projection2);
    pipeline.push(unwind);
    pipeline.push(match2);
    pipeline.push(group);
    pipeline.push(projection3);

    ordersCollection.aggregate(pipeline, function (err, result) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(warehouseHandler.mapResultsV2(productName, result));
        }
    });

    return deferred.promise;
}

Handler.prototype.mapResultsV2 = function (productName, results) {
    var resultObject = {
        productName: productName,
        paid: 0,
        notPaid: 0,
    };

    results.forEach(function (result) {
        if (result.payment === 'paid') {
            resultObject.paid = result.count;
        } else {
            resultObject.notPaid = result.count;
        }
    });

    return resultObject;
}

Handler.prototype.getWarehouseV2 = function (year, month) {
    var deferred = Q.defer();

    var data = {
        timeSpan: {
            month: month,
            year: year,
        },
    };

    prodHandler.getAllProductsJson()
        .then(function (products) {
            Object.keys(products).forEach(function (key) {
                if (products[key].category === "Nonbillable") {
                    delete products[key]
                }
                else {
                    var product = products[key];
                    product.input = calculateProductInput(product.warehouse, month, year);

                    //beginning + currentavailable
                    product.beginning = calculateBeginning(product.warehouse);
                    product.available = product.beginning + product.input;
                    delete product.warehouse;
                }
            });

            data.products = products;

            var getProductsInOrdersPromises = [];
            Object.keys(data.products).forEach(function(key) {
                getProductsInOrdersPromises.push(warehouseHandler.getProductsInOrdersV2(key, month, year));
            });

            return Q.all(getProductsInOrdersPromises);
        })
        .then(function(productsInOrders) {
            productsInOrders.forEach(function(productInOrders) {
                var output = productInOrders.paid + productInOrders.notPaid;
                data.products[productInOrders.productName].output = output;
                data.products[productInOrders.productName].available -= output;
            });

            deferred.resolve(mapWarehouseV2(data));
        })
        .fail(function (err) {
            console.log('ERR getting warehouse V2: ' + err);
            deferred.reject(err);
        });

    return deferred.promise;
}

function calculateBeginning(whData) {
    //TODO extend this
    return whData.amount;
}

exports.Handler = Handler;

