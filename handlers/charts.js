

var Q = require('q');
var mongo;
var ACTIVE_ORDERS_STATE;

Handler = function(app) {
    mongo = app.get('mongodb');
    ACTIVE_ORDERS_STATE = app.get('ACTIVE_ORDERS_STATE');
};

Handler.prototype.getAllProductsData = function(fromDate, toDate) {
    var deferred = Q.defer();

    var orders = mongo.collection('orders');

    var pipeline = [];

    if (!fromDate) {
        fromDate = new Date();
        fromDate.setFullYear(2010);
    }
    if (!toDate) {
        toDate = new Date();
        toDate.setFullYear(2060);
    }

    var matchDefinition = {
        'payment.paymentDate': {$exists: true}, 'state': ACTIVE_ORDERS_STATE,
        'payment.orderDate': {'$gte': fromDate, '$lte': toDate}
    }

    var match = {$match: matchDefinition };
    var project1 = {$project: {'products.productName': 1, 'products.totalPricePerProduct': 1, _id: 0, 'products.count': 1}};
    var unwind = {$unwind: "$products"};
    var project2 = {$project: {'productName': '$products.productName', 'price': '$products.totalPricePerProduct', 'count': '$products.count'}};
    var group = {$group: {_id: "$productName", totalAmount: {$sum: "$price"}, totalCount: {$sum: "$count"}}};

    pipeline.push(match);
    pipeline.push(project1);
    pipeline.push(unwind);
    pipeline.push(project2);
    pipeline.push(group);

    orders.aggregate(pipeline)
    .toArray(function(err, productData) {
        if(err) {
            console.log('ERROR while getting all products groups> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(productData);
        }
    });

    return deferred.promise;
}

exports.Handler = Handler;