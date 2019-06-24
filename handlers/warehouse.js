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

Handler.prototype.saveProductAmount = function (filterBy, difference, user) {
    var deferred = Q.defer();

    var productsV2 = mongo.collection('productsV2');

    let parsed = parseInt(filterBy);

    let filter;
    if(isNaN(parsed)) {
        filter = { 'name': filterBy }
    }
    else {
        filter = { 'id': parsed }
    }

    productsV2.update(
        filter,
        {
            $push: {
                'warehouse.history': {
                    'timestamp': new Date(),
                    'difference': difference,
                    'user': user,
                }
            }
        },
        function (err, result) {
            if (result.result.n == 1) {
                deferred.resolve(result);
            } else {
                var error = new Error('error while updating product ' + filterBy);
                console.log(error + '> ' + err);
                error.status = 400;
                deferred.reject(error);
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
    var input = 0;

    for (var i = 0; i < history.length; i++) {
        var timestamp = new Date(history[i].timestamp);
        var difference = history[i].difference;
        if (timestamp.getFullYear() == year && timestamp.getMonth() == month && !isNaN(difference)) {
            input += difference;
        }
    }

    return input;
}

Handler.prototype.getProductsInOrdersBetweenDates = function (productName, fromDate, toDate) {
    var deferred = Q.defer();

    var ordersCollection = mongo.collection('orders');
    var match;
    var unwind = { $unwind: "$products" };
    var projection = { $project: { 'products.productName': 1, 'products.count': 1, 'products.id': 1, 'paymentDate': { $ifNull: ['$payment.paymentDate', 'notPaid'] }, '_id': 0 } };
    var projection2 = { $project: { 'products.productName': 1, 'products.count': 1, 'products.id': 1,
        'paymentDate': { $cond: { if: { $eq: ["$paymentDate", 'notPaid'] }, then: 'notPaid', else: 'paid' } }, '_id': 0 } };
    var match2 = { $match: { 'products.productName': productName } };
    var group = { $group: { _id: { paymentDate: "$paymentDate", product: "$products.productName", id: "$products.id" },
        count: { $sum: "$products.count" } } };
    var projection3 = { $project: { 'product': "$_id.product", 'payment': '$_id.paymentDate', 'count': 1, _id: 0, "id": "$_id.id" } };
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

//test beginning
Handler.prototype.getWarehouseV2 = function (year, month) {
    var deferred = Q.defer();

    var data = {
        timeSpan: {
            month: month + 1,
            year: year,
        },
    };

    var calculateBeginningPromises = [];
    prodHandler.getAllProductsJson()
        .then(function (products) {
            Object.keys(products).forEach(function (key) {
                if (products[key].category === "Nonbillable") {
                    delete products[key]
                }
                else {
                    var product = products[key];
                    product.input = calculateProductInput(product.warehouse, month, year);
                    calculateBeginningPromises.push(calculateBeginning(product.warehouse, year, month, key));
                    delete product.warehouse;
                }
            });

            data.products = products;

            return Q.all(calculateBeginningPromises);
        })
        .then(function(beginningPromisesResults) {
            Object.keys(data.products).forEach(function (key) {
                for (var i = 0; i < beginningPromisesResults.length; i++) {
                    if (beginningPromisesResults[i].product == key) {
                        data.products[key].beginning = beginningPromisesResults[i].beginning;
                        data.products[key].available = data.products[key].beginning + data.products[key].input;
                    }
                }
            });

            var fromDate = new Date(year, month, 1);
            var toDate = new Date(year, month, 1);
            toDate = toDate.setMonth(toDate.getMonth() + 1);
            toDate = new Date(toDate);
            var getProductsInOrdersPromises = [];
            Object.keys(data.products).forEach(function(key) {
                getProductsInOrdersPromises.push(warehouseHandler.getProductsInOrdersBetweenDates(key, fromDate, toDate));
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

function calculateBeginning(whData, year, month, key) {
    var deferred = Q.defer();

    var toDate = new Date(year, month, 1);
    var from = new Date(2000, month, 1);


    var history = whData.history;

    var beginning = 0;
    for (var i = 0; i < history.length; i++) {
        if (history[i].timestamp < toDate && !isNaN(history[i].difference)) {
            beginning += history[i].difference;
        }
    }

    var result = {
        product: key,
        beginning: beginning,
    };

    warehouseHandler.getProductsInOrdersBetweenDates(key, from, toDate)
    .then(function(productInOrders) {
        result.beginning -= productInOrders.paid;

        deferred.resolve(result);
    });

    return deferred.promise;
}

exports.Handler = Handler;

