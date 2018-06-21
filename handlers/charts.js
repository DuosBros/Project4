

var Q = require('q');
var mongo;
var ACTIVE_ORDERS_STATE;

Handler = function(app) {
    mongo = app.get('mongodb');
    ACTIVE_ORDERS_STATE = app.get('ACTIVE_ORDERS_STATE');
};

Handler.prototype.getAllProductsData = function() {
    var deferred = Q.defer();

    var orders = mongo.collection('orders');

    var pipeline = [];
    var match = {$match:
                    {
                        'payment.paymentDate': {$exists: true}, 'state': ACTIVE_ORDERS_STATE
                    }
                 };
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