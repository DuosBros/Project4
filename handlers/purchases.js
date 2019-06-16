

var Q = require('q');

var handler;
var mongo;


Handler = function(app) {
    handler = this;

    mongo = app.get('mongodb');
};


Handler.prototype.getAllPurchases = function() {
    var deferred = Q.defer();

    var purchases = mongo.collection('purchases');

    purchases.find({}, {}, {"sort": {'date': -1}})
    .toArray(function(err, purchases) {
        if(err) {
            console.log('ERROR while getting all purchases> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(purchases);
        }
    });

    return deferred.promise;
}

Handler.prototype.updatePurchase = function(id, purchase) {
    var deferred = Q.defer();
    var purchases = mongo.collection('purchases');

    delete purchase._id;

    if (!purchase.id) {
        purchase.id = id;
    }

    purchases.replaceOne({'id' : id}, purchase, function(err, res) {
            if (err) {
                console.log('ERROR while updating purchase with ID: ' + id + '> ' + err);
                deferred.reject(err);
            } else {
                deferred.resolve(purchase);
            }
    });

    return deferred.promise;
}

Handler.prototype.deletePurchase = function(id) {
    var deferred = Q.defer();

    var purchases = mongo.collection('purchases');

    purchases.removeOne({'id': parseInt(id)}, function(err, result) {
        if (result.result.n == 1) {
            deferred.resolve(result);
        } else if (result.result.n == 0) {
            var error = new Error('error while removing purchase, not found: ' + id);
            console.log(error + '> ' + err);
            error.status = 404;
            deferred.reject(error);
        } else {
            var error = new Error('error while removing purchase ' + id);
            console.log(error + '> ' + err);
            error.status = 400;
            deferred.reject(error);
        }
    });

    return deferred.promise;
}

Handler.prototype.addPurchase = function(purchase) {
    var deferred = Q.defer();

    var purchases = mongo.collection('purchases');
    var id;
    var parsedPurchase = purchase;
    if(!purchase.date) {
        parsedPurchase.date = new Date();
    }

    for (var i = 0; i < parsedPurchase.products.length; i++) {
        var prod = parsedPurchase.products[i];
        if (!prod.productName || prod.productName.length == 0 || !prod.count || prod.count == 0) {
            parsedPurchase.products.splice(i, 1);
        }
    }

    purchases.findOne(
            {},
            { sort: {'id' : -1} },
            function(err, lastPurchase) {
                if (err) {
                    console.log('ERROR while adding new purchase(getting new ID)> ' + err);
                    deferred.reject(err);
                } else if(!lastPurchase) {
                    id = 0;
                } else {
                    id = lastPurchase.id + 1;
                }
                parsedPurchase.id = id;
                purchases.insertOne(parsedPurchase, function(err, doc) {
                    if(err) {
                        console.log('ERROR while adding new purchase(insert)> ' + err);
                        deferred.reject(err);
                    } else {
                        deferred.resolve(parsedPurchase);
                    }
                });
    });

    return deferred.promise;
}

exports.Handler = Handler;