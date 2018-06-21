

var Q = require('q');

var handler;
var bankBaseUri;

var rp = require('request-promise');

Handler = function(app) {
    handler = this;
    bankBaseUri = app.get('bank-base-uri');
};


Handler.prototype.getAllTransactions = function() {
    var deferred = Q.defer();

    var options = {
        uri: bankBaseUri + '2018-01-01/2020-12-31/transactions.json',
        json: true
    };

    rp(options)
    .then(function(response) {
        deferred.resolve(response);
    })
    .catch(function(err) {
        console.log('error fetching all transactions > ' + err.message);
        deferred.reject(err.message);
    })

    return deferred.promise;
}

exports.Handler = Handler;