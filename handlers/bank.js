var Q = require('q');
var rp = require('request-promise');
var fs = require('fs');
var path = require('path');
const NodeCache = require( "node-cache" );

const myCache = new NodeCache();
var mongo;
var bankBaseUri;

var templatePath = path.join(__dirname, '/../domestic_transaction_template.xml');
var actualFilePath = path.join(__dirname, '/../domestic_transaction_{timestamp}.xml');


Handler = function(app) {
    handler = this;
    bankBaseUri = app.get('bank-transactions-uri');
    mongo = app.get('mongodb');
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

    var filenameToDelete;
    var response;
    createFile(amount, accountTo, bankCode, comment, vs, date)
    .then(function(result) {//TODO DON'T FORGET TOKEN!
        filenameToDelete = result.filename;

        return writeTransactionToDb(result);
    })
    .then(function(transaction) {
        response = transaction;

        return deleteFile(filenameToDelete);
    })
    .then(function() {
        deferred.resolve(response);
    })
    .fail(function(err) {
        deferred.reject(err);
    })

    return deferred.promise;
}

function writeTransactionToDb(data) {
    var deferred = Q.defer();

    data.date = new Date();

    var transactions = mongo.collection('transactions');

    transactions.insertOne(data, function(err) {
        if(err) {
            console.log('ERROR while creating transaction in database> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(data);
        }
    });

    return deferred.promise;
}

function deleteFile(filename) {
    var deferred = Q.defer();

    fs.unlink(filename, function(err) {
        if (err) {
            console.log('Error deleting file: ' + filename + ' Err: ' + err);
            deferred.reject(err);
        }
        deferred.resolve()
    });

    return deferred.promise;
}

function createFile(amount, accountTo, bankCode, comment, vs, date) {
    var deferred = Q.defer();

    var result = {};

    fs.readFile(templatePath, {encoding: 'utf-8'}, function(err, data) {
        if (!err) {
            var withAmount = data.replace('{amount}', amount);
            var withAccountTo = withAmount.replace('{accountTo}', accountTo);
            var withBankCode = withAccountTo.replace('{bankCode}', bankCode);
            var withComment = withBankCode.replace('{comment}', comment);
            var withVs = withComment.replace('{vs}', vs);
            var withDate = withVs.replace('{date}', date);

            var actualFilePathWithTimestamp = actualFilePath.replace('{timestamp}', new Date().getTime());
            fs.writeFile(actualFilePathWithTimestamp, withDate, function(err) {
                if (err) {
                    console.log(err)
                    deferred.reject(err);
                }

                result.transaction = withDate;
                result.filename = actualFilePathWithTimestamp;

                deferred.resolve(result);
            });
        } else {
            console.log(err);
            deferred.reject(err);
        }
    });


    return deferred.promise;
}

exports.Handler = Handler;
