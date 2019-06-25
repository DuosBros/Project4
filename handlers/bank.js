

var Q = require('q');

var handler;
var bankBaseUri;

var rp = require('request-promise');

var fs = require('fs');
var path = require('path');
var templatePath = path.join(__dirname, '/../domestic_transaction_template.xml');
var actualFilePath = path.join(__dirname, '/../domestic_transaction.xml');

const NodeCache = require( "node-cache" );
const myCache = new NodeCache();

const CURRENCY = 'CZK';
const ACCOUNT_FROM = 2401089228;
const MESSAGE_FOR_RECIPIENT = 'TranMedGroup s.r.o.';
const PAYMENT_TYPE = 431001;

Handler = function(app) {
    handler = this;
    bankBaseUri = app.get('bank-transactions-uri');
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

Handler.prototype.createDomesticTransaction = function(amount, accountTo, bankCode, comment, vs) {
    var deferred = Q.defer();

    var date = new Date().toISOString().split('T')[0];

    createFile(amount, accountTo, bankCode, comment, vs, date)
    .then(function() {
        deferred.resolve();
    })
    .fail(function(err) {
        deferred.reject(err);
    })

    deferred.resolve();

    return deferred.promise;
}

function createFile(amount, accountTo, bankCode, comment, vs, date) {
    var deferred = Q.defer();

    fs.readFile(templatePath, {encoding: 'utf-8'}, function(err,data) {
        if (!err) {
            console.log('received data: ' + data);
            var withAmount = data.replace('{amount}', amount);
            var withAccountTo = withAmount.replace('{accountTo}', accountTo);
            var withBankCode = withAccountTo.replace('{bankCode}', bankCode);
            var withComment = withBankCode.replace('{comment}', comment);
            var withVs = withComment.replace('{vs}', vs);
            var withDate = withVs.replace('{date}', date);

            fs.writeFile(actualFilePath, withDate, function(err) {
                if (err) {
                    console.log(err)
                    deferred.reject(err);
                }
                deferred.resolve();
            });
        } else {
            console.log(err);
            deferred.reject(err);
        }
    });


    return deferred.promise;
}

exports.Handler = Handler;
