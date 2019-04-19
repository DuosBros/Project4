

var Q = require('q');
var mongo;
var ACTIVE_ORDERS_STATE;
var warehouseHandler;

var ProdHandler = require('../handlers/products.js').Handler;
var prodHandler;

Handler = function(app) {
    mongo = app.get('mongodb');
    ACTIVE_ORDERS_STATE = app.get('ACTIVE_ORDERS_STATE');
    warehouseHandler = this;

    prodHandler = new ProdHandler(app);
};

Handler.prototype.saveProductAmount = function(productName, amount, calculationDate, difference, user, notificationThreshold) {
    var deferred = Q.defer();

    var warehouseCollection = mongo.collection('warehouse');

    this.getSingleProductData(productName)
    .then(function(singleProductData) {
        warehouseCollection.update(
            {'productName': productName},
            {
                $set: {
                    'amount': amount, 'calculationDate': new Date(calculationDate),
                    'notificationThreshold': notificationThreshold
                },
                $push: {
                    history: {
                        'timestamp': new Date(),
                        'difference': difference,
                        'user': user
                    }
                }
            },
            { upsert: true },
            function(err, result) {
            if(result.result.n == 1) {
                deferred.resolve(result);
            } else {
                var error = new Error('error while updating product ' + productName);
                console.log(error + '> ' + err);
                error.status = 400;
                deferred.reject(error);
            }
        })
    })

    return deferred.promise;
}

Handler.prototype.getSingleProductData = function(productName) {
    var deferred = Q.defer();

    var warehouseCollection = mongo.collection('warehouse');

    warehouseCollection.findOne({productName: productName}, function(err, result) {
        if(err) {
            deferred.reject(err);
        } else {
            deferred.resolve(result);
        }
    });
    return deferred.promise;
}

Handler.prototype.getProductsData = function() {
    var deferred = Q.defer();

    var warehouseCollection = mongo.collection('warehouse');

    warehouseCollection.find().toArray(function(err, result) {
        if(err) {
            deferred.reject(err);
        } else {
            deferred.resolve(result);
        }
    });

    return deferred.promise;
}

Handler.prototype.getProductsInOrders = function(productName) {
    var deferred = Q.defer();

    var ordersCollection = mongo.collection('orders');
    var match;
    var unwind = {$unwind: "$products"};
    var projection = {$project: {'products.productName': 1, 'products.count': 1, 'paymentDate': { $ifNull: ['$payment.paymentDate', 'notPaid']}, '_id': 0}};
    var projection2 = {$project: {'products.productName': 1, 'products.count': 1, 'paymentDate': {$cond: { if: { $eq: [ "$paymentDate", 'notPaid' ] }, then: 'notPaid', else: 'paid' }}, '_id': 0}};
    var match2 = {$match: {'products.productName': productName}};
    var group = {$group: {_id: {paymentDate: "$paymentDate", product: "$products.productName"},  count: {$sum: "$products.count"}}};
    var projection3 = {$project: {'product': "$_id.product", 'payment': '$_id.paymentDate', 'count': 1, _id: 0}};
    var pipeline = [];

    this.getProductsCalculationDate(productName)
    .then(function(calculationDate) {
        match = {$match: {'state': ACTIVE_ORDERS_STATE, 'payment.orderDate' : {'$gte': calculationDate}}};

        pipeline.push(match);
        pipeline.push(projection);
        pipeline.push(projection2);
        pipeline.push(unwind);
        pipeline.push(match2);
        pipeline.push(group);
        pipeline.push(projection3);

        ordersCollection.aggregate(pipeline, function(err, result) {
            if(err) {
                deferred.reject(err);
            } else {
                deferred.resolve(warehouseHandler.mapResults(productName, result));
            }
        });
    })

    return deferred.promise;
}

Handler.prototype.mapResults = function(productName, results) {
    var resultObject = {};
    resultObject[productName] = {};
    resultObject[productName].paid = 0;
    resultObject[productName].notPaid = 0;
    results.forEach(function(result) {
        if(result.payment == "paid") {
            resultObject[productName].paid = result.count;
        } else {
            resultObject[productName].notPaid = result.count;
        }
    })
    return resultObject;
}

Handler.prototype.getProductsCalculationDate = function(productName) {
    var deferred = Q.defer();

    var warehouseCollection = mongo.collection('warehouse');


    var match = {'productName' : productName};
    warehouseCollection.findOne(match, function(err, result) {
        if(err) {
            deferred.reject(err);
        } else if (!result) {
            deferred.resolve(new Date());
        } else {
            deferred.resolve(result.calculationDate);
        }
    });

    return deferred.promise;
}

Handler.prototype.getWarehouseV2 = function(year, month) {
    var deferred = Q.defer();

    var data = {};
    prodHandler.getAllProductsJson()
    .then(function(products) {
        data = products;
        return warehouseHandler.getProductsData();
    })
    .then(function(productsData) {
        productsData.forEach(function(product) {
            data[product.productName].input = (product.history && product.history.length > 0) ? product.history[0].difference : 0;
        });
        deferred.resolve(data);
    })
    .fail(function(err) {
        console.log('ERR getting warehouse V2: ' + err);
        deferred.reject(err);
    });

    return deferred.promise;
}


exports.Handler = Handler;