var Q = require('q');
var rp = require('request-promise');
var fs = require('fs');
var path = require('path');
const NodeCache = require( "node-cache" );
const curl = new (require( 'curl-request' ))();

const myCache = new NodeCache();
var mongo;
var bankTransactionUri;
var bankCreateUri;
var bankToken;

var templatePath = path.join(__dirname, '/../domestic_transaction_template.xml');
var actualFilePath = path.join(__dirname, '/../domestic_transaction_{timestamp}.xml');


Handler = function(app) {
    handler = this;
    bankTransactionUri = app.get('bank-transactions-uri');
    bankCreateUri = app.get('bank-create-uri');
    bankToken = app.get('bank-token');

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
            uri: bankTransactionUri + bankToken + '/' + from + '/2020-12-31/transactions.json',
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
    .then(function(result) {
        filenameToDelete = result.filename;
        response = result;

        return createTransaction(filenameToDelete, bankToken);
    })
    .then(function(createTransactionResult) {
        response.result = createTransactionResult;
        return writeTransactionToDb(response);
    })
    .then(function() {

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

function createTransaction(pathToFile, token) {
    var deferred = Q.defer();

    console.log('creating....')
    console.log('file: ' + pathToFile);

    curl
    .setHeaders([
        'Content-Type: multipart/form-data'
    ])
    .setMultipartBody([{
        token: token,
        file: pathToFile,
        type: 'xml',
    }])
    .post(bankCreateUri)
    .then(({statusCode, body, headers}) => {
        console.log(statusCode, body, headers);
        deferred.resolve({statusCode, body, headers});
    })
    .catch((e) => {
        console.log('Error creating transaction: ' + e);
        deferred.reject(e);
    });

    return deferred.promise;
}

function writeTransactionToDb(data) {
    var deferred = Q.defer();

    var mappedData = Object.assign({}, data, {
        date: new Date(),
    });

    var transactions = mongo.collection('transactions');

    transactions.insertOne(mappedData, function(err) {
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
