var Q = require('q');
var mongo;

var ProdHandler = require('../handlers/products.js').Handler;
var prodHandler;

var cron = require('node-cron');


Handler = function (app) {
    mongo = app.get('mongodb');
    prodHandler = new ProdHandler(app);

    // cron.schedule('* * * * *', function() {
    //     createWhSnapshot();
    // });

    cron.schedule('0 0 1 * *', function() {
        createWhSnapshot();
    });
};

function createWhSnapshot() {
    var deferred = Q.defer();

    var whSnapshots = mongo.collection('warehouseSnapshots');

    var now = new Date();

    var snapshotData = {};
    prodHandler.getAllProductsJson()
    .then(function (products) {
        Object.keys(products).forEach(function (key) {
            var wh = products[key].warehouse;
            snapshotData[key] = wh.amount;
        });

        var snapshot = {
            timeSpan: {
                month: now.getMonth(),
                year: now.getFullYear(),
            },
            data: snapshotData,
        };

        whSnapshots.insertOne(snapshot, function(err, doc) {
            if(err) {
                console.log('ERROR while inserting wh snapshot> ' + err);
                deferred.reject(err);
            } else {
                deferred.resolve(doc);
            }
        });

        deferred.resolve(snapshot);
    });

    return deferred.promise;
}


exports.Handler = Handler;
