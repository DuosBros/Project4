

var Q = require('q');

var handler;
var bankBaseUri;

var rp = require('request-promise');

const NodeCache = require( "node-cache" );
const myCache = new NodeCache();

Handler = function(app) {
    handler = this;
    bankBaseUri = app.get('bank-base-uri');
};


Handler.prototype.getAllTransactions = function(from) {
    var deferred = Q.defer();

    if (!from) {
        var oneYearOld = new Date();
        oneYearOld.setFullYear(oneYearOld.getFullYear() - 1);
        var isodate = oneYearOld.toISOString()
        from = isodate.split('T')[0];
    }

    var cachedTransactions = myCache.get('bank');

    if (cachedTransactions) {
        deferred.resolve(cachedTransactions)
    } else {
        var options = {
            uri: bankBaseUri + from + '/2020-12-31/transactions.json',
            json: true,
        };

        rp(options)
        .then(function(response) {
            myCache.set('bank', response, 15);
            deferred.resolve(response);
        })
        .catch(function(err) {
            console.log('error fetching all transactions > ' + err.message);
            deferred.reject(err.message);
        })
    }

    return deferred.promise;
}

exports.Handler = Handler;