

var Q = require('q');
var mongo;

Handler = function(app) {
    mongo = app.get('mongodb');
};

Handler.prototype.getAllCosts = function() {
    var deferred = Q.defer();
    var costs = mongo.collection('costs');

    console.log('');
    costs.find({}, {}, {"sort": {'date': -1}})
    .toArray(function(err, costs) {
        if(err) {
            console.log('ERROR while getting all costs> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(costs);
        }
    });

    return deferred.promise;
}

Handler.prototype.getAllCostsMonthly = function() {
    var deferred = Q.defer();
    var costs = mongo.collection('costs');

    var group = { $group: {_id:
                            { month: { $month: "$date" },
                              year: { $year: "$date" } },
                              costs : {$sum: "$cost"}
                          },
                };

    costs.aggregate([group])
    .toArray(function(err, costs) {
        if(err) {
            console.log('ERROR while getting all costs grouped by month> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(costs);
        }
    });

    return deferred.promise;
}

Handler.prototype.getCost = function(costId) {
    var deferred = Q.defer();

    var costs = mongo.collection('costs');
    var id = parseInt(costId);

    costs.findOne({id: id}, {},
            function(err, cost) {
                if(err) {
                    console.log('ERROR while getting cost with ID: ' + costId + '> ' + err);
                    deferred.reject(err);
                } else {
                    deferred.resolve(cost);
                }
            });
    return deferred.promise;
}

Handler.prototype.saveCost = function(costId, cost) {
    var deferred = Q.defer();
    var costs = mongo.collection('costs');

    var id = parseInt(costId);
    delete cost._id;

    var parsedCost = cost;
    parsedCost.date = new Date(cost.date);
    costs.replaceOne({'id' : id}, parsedCost, function(err, res) {
            if(err) {
                console.log('ERROR while saving cost with ID: ' + costId + '> ' + err);
                deferred.reject(err);
            } else {
                deferred.resolve(res);
            }
    });

    return deferred.promise;
}

Handler.prototype.addCost = function(cost) {
    var deferred = Q.defer();
    var costs = mongo.collection('costs');
    var id;
    var parsedCost = cost;
    parsedCost.date = new Date(cost.date);
    costs.findOne(
            {},
            { sort: {'id' : -1} },
            function(err, lastCost) {
                if (err) {
                    console.log('ERROR while adding new cost(getting new ID)> ' + err);
                    deferred.reject(err);
                } else if(!lastCost) {
                    id = 0;
                } else {
                    id = lastCost.id + 1;
                }
                parsedCost.id = id;
                costs.insertOne(parsedCost, function(err, doc) {
                    if(err) {
                        console.log('ERROR while adding new cost(insert)> ' + err);
                        deferred.reject(err);
                    } else {
                        deferred.resolve(parsedCost);
                    }
                });
    });
    return deferred.promise;
}


Handler.prototype.deleteCost = function(costId) {
    var deferred = Q.defer();

    var costs = mongo.collection('costs');
    costs.removeOne({'id': parseInt(costId)}, function(err, result) {
        if(result.result.n == 1) {
            deferred.resolve(result);
        } else if (result.result.n == 0) {
            var error = new Error('error while removing cost, not found: ' + costId);
            console.log(error + '> ' + err);
            error.status = 404;
            deferred.reject(error);
        } else {
            var error = new Error('error while removing cost ' + costId);
            console.log(error + '> ' + err);
            error.status = 400;
            deferred.reject(error);
        }
    });
    return deferred.promise;
}

exports.Handler = Handler;