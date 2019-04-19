

var Q = require('q');
var json2xls = require('json2xls');
const fs = require('fs');
var passwordHash = require('password-hash');
var owasp = require('owasp-password-strength-test');
var ObjectID = require('mongodb').ObjectID;
var cron = require('node-cron');
const shell = require('shelljs');
var archiver = require('archiver');
var archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

var OthersHandler = require('../handlers/others.js').Handler;
var othersHandler;

var handler;
var mongo;

var pdfGeneration;

var rp = require('request-promise');

var PdfHandler = require('../handlers/pdfGeneration.js').Handler;

var ProdHandler = require('../handlers/products.js').Handler;
var prodHandler;

require('isomorphic-fetch')
var Dropbox = require('dropbox').Dropbox;
var dbx;
dbx = new Dropbox({ accessToken: 'iNhg1bcaxL8AAAAAAABAS-Nu_J1oDWWOrMvcFXGvmwnHc8iDr2sKNIMaYdafoWN-' });

Handler = function(app) {
    handler = this;
    mongo = app.get('mongodb');
    pdfGeneration = new PdfHandler(app);
    othersHandler = new OthersHandler(app);
    prodHandler = new ProdHandler(app);

    // cron.schedule('0 1 * * *', function() {
    //     shell.exec('sh scripts/dumpDatabase.sh');

    //     var today = new Date().toDateString();
    //     moveDumpToDropbox('orders.bson', today);
    //     moveDumpToDropbox('orders.metadata.json', today);

    //     moveDumpToDropbox('costs.bson', today);
    //     moveDumpToDropbox('costs.metadata.json', today);

    //     moveDumpToDropbox('products.bson', today);
    //     moveDumpToDropbox('products.metadata.json', today);

    //     moveDumpToDropbox('senders.bson', today);
    //     moveDumpToDropbox('senders.metadata.json', today);

    //     moveDumpToDropbox('users.bson', today);
    //     moveDumpToDropbox('users.metadata.json', today);

    //     moveDumpToDropbox('warehouse.bson', today);
    //     moveDumpToDropbox('warehouse.metadata.json', today);
    // });
};

function moveDumpToDropbox(filename, today) {
    var timeout = Math.floor(Math.random() * 50) + 1;
    console.log(timeout * 1000);
    setTimeout(function() {
        fs.readFile('exports/heroku_gvlqrgxg/' + filename, function read(err, data) {
            if (err) {
                throw err;
            }

            dbx.filesUpload({path:'/medpharma/DB backup/' + today + "/" + filename, contents: data, mode: 'overwrite'})
            .then(function() {
                console.log(filename + ' successfully backedup');
            })
            .catch(function(error) {
                console.log('error while uploading document to dropbox: ' + JSON.stringify(error));
            });
        });
    }, timeout * 1000)
}

Handler.prototype.expireOrders = function(variableSymbols) {
    var deferred = Q.defer();

    var orders = mongo.collection('orders');

    var query = {state: 'active', 'payment.vs': {'$in': variableSymbols}};
    console.log(variableSymbols);
    orders.update(query, {$set: {state: 'expired'}}, {multi: true},
    function(err, result) {
        if (err) {
            var error = new Error('error while expiring order');
            console.log(error + '> ' + err);
            error.status = 500;
            deferred.reject(error);
        } else {
            console.log("successfully expired orders: " + variableSymbols);
            deferred.resolve(result);
        }
    });

    return deferred.promise;
}

Handler.prototype.export = function(fromDay, fromMonth, fromYear, toDay, toMonth, toYear) {
    var deferred = Q.defer();

    var dateFrom = new Date(fromYear, fromMonth, fromDay);
    var dateTo = new Date(toYear, toMonth, toDay);

    var dateFromString = dateFrom.getDate() + '.' + (dateFrom.getMonth() + 1) + '.' + dateFrom.getFullYear();
    var dateToString = dateTo.getDate() + '.' + (dateTo.getMonth() + 1) + '.' + dateTo.getFullYear();
    var joinedDatesString = dateFromString + '-' + dateToString;

    var path = '/medpharma/data exports/' + joinedDatesString;

    console.log('Exporting orders..');
    console.log('From: ' + dateFrom);
    console.log('To: ' + dateTo);

    var promises = [];
    promises.push(exportCosts(joinedDatesString, dateFrom, dateTo, path));
    promises.push(exportOrders(joinedDatesString, dateFrom, dateTo, path));

    Q.all(promises)
    .then(function() {
        deferred.resolve();
    })
    .catch(function(err) {
        deferred.reject(err);
    })

    return deferred.promise;
}

Handler.prototype.exportNoVs = function(fromDay, fromMonth, fromYear, toDay, toMonth, toYear, firstName, lastName, street, city, zip, streetNumber, phone) {
    var deferred = Q.defer();

    var dateFrom = new Date(fromYear, fromMonth, fromDay);
    var dateTo = new Date(toYear, toMonth, toDay);

    var dateFromString = dateFrom.getDate() + '.' + (dateFrom.getMonth() + 1) + '.' + dateFrom.getFullYear();
    var dateToString = dateTo.getDate() + '.' + (dateTo.getMonth() + 1) + '.' + dateTo.getFullYear();
    var joinedDatesString = 'VSLess_' + dateFromString + '-' + dateToString;
    var path = '/medpharma/data exports/' + joinedDatesString;

    exportNoVsOrders(dateFrom, dateTo, firstName, lastName, street, city, zip, streetNumber, phone)
    .then(function(formattedOrders) {
        return saveAndUploadFile(formattedOrders, path, joinedDatesString);
    })
    .then(function() {
        deferred.resolve();
    })
    .catch(function(err) {
        deferred.reject(err);
    })
    .done();

    return deferred.promise;
}

function verifyPassword(password) {
    var deferred = Q.defer();

    var passwordTestResult = owasp.test(password);
    if (passwordTestResult.errors && passwordTestResult.errors.length > 0) {
        deferred.reject(passwordTestResult.errors);
    } else {
        deferred.resolve();
    }

    return deferred.promise;
}

Handler.prototype.addUser = function(username, password) {
    var deferred = Q.defer();

    verifyPassword(password)
    .then(function() {
        var userToBeInserted = {username: username, password: passwordHash.generate(password, {algorithm: 'sha256', iterations: 2})};

        var users = mongo.collection('users');
        users.ensureIndex({ username: 1}, {unique: true}, function(err, success) {
            if(err) {
                console.log('ERROR, index for users was NOT ensured> ' + err);
                deferred.reject(err);
            } else {
                users.insertOne(userToBeInserted, function(err, doc) {
                    if(err) {
                        console.log('ERROR while creating new order (adding to DB)> ' + err);
                        deferred.reject(err);
                    } else {
                        console.log('User with username "' + username + '" was successfully added');
                        deferred.resolve();
                    }
                });
            }
        });
    })
    .catch(function(err) {
        deferred.reject(err);
    });

    return deferred.promise;
}

Handler.prototype.addSender = function(firstname, lastname, company, phone_number, street, street_number, city, zip, country, label) {
    var deferred = Q.defer();

    var id = new ObjectID();
    var senderToInsert = {
        id: id,
        firstname: firstname,
        lastname: lastname,
        company: company,
        phone_number: phone_number,
        street: street,
        street_number: street_number,
        city: city,
        zip: zip,
        country: country,
        label: label
    };

    var senders = mongo.collection('senders');
    senders.ensureIndex({ label: 1}, {unique: true}, function(err, success) {
        if(err) {
            console.log('ERROR, index  for senders was NOT ensured> ' + err);
            deferred.reject();
        } else {
            senders.insertOne(senderToInsert, function(err, doc) {
                if(err) {
                    console.log('ERROR while adding new sender (adding to DB)> ' + err);
                    deferred.reject(err);
                } else {
                    console.log('Sender with company name "' + company + '" was successfully added');
                    deferred.resolve();
                }
            });
        }
    });

    return deferred.promise;
}

function saveAndUploadFile(formattedOrders, path, joinedDatesString) {
    var deferred = Q.defer();

    var xls = json2xls(formattedOrders);
    fs.writeFileSync('exports/' + joinedDatesString + '-orders.xlsx', xls, 'binary');

    fs.readFile('exports/' + joinedDatesString + '-orders.xlsx', function read(err, data) {
        if (err) {
            throw err;
        }
        var orders = data;

        var xls = json2xls(formattedOrders);
        fs.writeFileSync('exports/' + joinedDatesString + '-orders.xlsx', xls, 'binary');

        dbx.filesUpload({path: path + '/orders.xlsx', contents: orders, mode: 'overwrite'})
        .then(function() {
            console.log()
            console.log('VSless orders exported to Dropbox');
            deferred.resolve();
        })
        .catch(function(error) {
            console.log('error while uploading document to dropbox: ' + error);
            deferred.reject(error);
        });
    });

    return deferred.promise;
}

function exportNoVsOrders(dateFrom, dateTo, firstName, lastName, street, city, zip, streetNumber, phone) {
    var deferred = Q.defer();

    var queryOrders = {
        'payment.orderDate': {'$gt': dateFrom, '$lt': dateTo},
        'payment.paymentDate': { $ne: undefined},
        'state': 'active',
        'payment.vs': undefined
    }

    console.log('Exporting No VS orders..');
    console.log('From: ' + dateFrom);
    console.log('To: ' + dateTo);
    console.log();

    var orders = mongo.collection('orders');

    var options = {
        "sort": ["payment.vs", 'ascending']
    };

    var newVS = 0;
    orders.find({'state': 'active'}, options).toArray(function(err, order) {
        if(err) {
            console.log('ERROR while getting next VS> ' + err);
            deferred.reject(err);
        } else {
            newVS = parseInt(order[order.length - 1].payment.vs) + 1;

            orders.find(queryOrders)
            .toArray(function(err, result) {
                if(err) {
                    console.log('ERROR while exporting orders> ' + err);
                    deferred.reject(err);
                } else {
                    console.log('Number of exported Orders: ' + result.length);
                    console.log('New VS: ' + newVS);
                    var maxProductCount = 0;
                    for(var i = 0; i < result.length; i++) {
                        if(maxProductCount < result[i].products.length) {
                            maxProductCount = result[i].products.length;
                        }
                    }

                    var formattedOrders = [];

                    var count = result.length;
                    for(var i = 0; i < result.length; i++) {
                        (function(i) {
                            var formattedOrder = {};
                            formattedOrder.firstName = result[i].address.firstName;
                            formattedOrder.lastName = result[i].address.lastName;
                            formattedOrder.phone = result[i].address.phone;
                            formattedOrder.company = result[i].address.company;
                            formattedOrder.totalPrice = result[i].totalPrice;
                            formattedOrder.orderDate = result[i].payment.orderDate.getDate() + '.' + (result[i].payment.orderDate.getMonth() + 1) + '.' + result[i].payment.orderDate.getFullYear();
                            formattedOrder.paymentDate = result[i].payment.paymentDate.getDate() + '.' + (result[i].payment.paymentDate.getMonth() + 1) + '.' + result[i].payment.paymentDate.getFullYear();

                            for(var j = 0; j < maxProductCount; j++) {
                                formattedOrder['product' + (j + 1)] = '';
                                formattedOrder['product' + (j + 1) + ' count'] = '';
                            }
                            for(var j = 0; j < result[i].products.length; j++) {
                                formattedOrder['product' + (j + 1)] = result[i].products[j].productName;
                                formattedOrder['product' + (j + 1) + ' count'] = result[i].products[j].count;
                            }
                            formattedOrders.push(formattedOrder);

                            console.log('trying to update order with ID: ' + result[i].id);
                            orders.update({'id': result[i].id},
                                {
                                    $set:
                                    {
                                        'address.firstName': firstName,
                                        'address.lastName': lastName,
                                        'address.phone': phone,
                                        'address.street': street,
                                        'address.city': city,
                                        'address.streetNumber': streetNumber,
                                        'address.psc': zip,
                                        'address.company': '',
                                        'payment.vs': newVS,
                                        'deliveryType': 'VS'
                                    }
                                },
                                function() {
                                    console.log('updated order with ID: ' + result[i].id);
                                    --count;

                                    if (count == 0) {
                                        deferred.resolve(formattedOrders);
                                    }
                                }
                            )
                        })(i)
                    }
                    if (count == 0) {
                        deferred.resolve([]);
                    }
                }
            });
        }
    });

    return deferred.promise;
}


function exportOrders(joinedDatesString, dateFrom, dateTo, path) {
    var deferred = Q.defer();

    var orders = mongo.collection('orders');

    var queryOrders = {
        'payment.orderDate': {'$gt': dateFrom, '$lt': dateTo},
        'state': 'active'
    }

    var allProducts;

    prodHandler.getAllProductsJson()
    .then(function(allProducts) {
        allProducts = allProducts;

        orders.find(queryOrders)
        .toArray(function(err, result) {
            if(err) {
                console.log('ERROR while exporting orders> ' + err);
                deferred.reject(err);
            } else {
                console.log('Number of exported Orders: ' + result.length);
                var formattedOrders = [];

                result.forEach(function(order) {
                    for(var i = 0; i < order.products.length; i++) {
                        var record = {};

                        record.VS = order.payment.vs;
                        if(i == 0) {
                            record.firstName = order.address.firstName;
                            record.lastName = order.address.lastName;
                            record.phone = order.address.phone;
                            record.street = order.address.street;
                            record.city = order.address.city;
                            record.streetNumber = order.address.streetNumber;
                            record.zip = order.address.psc;
                            record.company = order.address.company;
                            record.orderDate = order.payment.orderDate.getDate() + '.' + (order.payment.orderDate.getMonth() + 1) + '.' + order.payment.orderDate.getFullYear();
                            record.paymentDate = order.payment.paymentDate
                                ? order.payment.paymentDate.getDate() + '.' + (order.payment.paymentDate.getMonth() + 1) + '.' + order.payment.paymentDate.getFullYear()
                                : 'not paid';
                            record.deliveryPrice = order.payment.price;
                            record.deliveryCompany = order.deliveryCompany;
                        }

                        var tax = allProducts[order.products[i].productName].tax;
                        var taxCoeficient;
                        if (tax == 15) {
                            taxCoeficient = 0.8696;
                        } else if (tax == 21) {
                            taxCoeficient = 0.8264;
                        }
                        record.productName = order.products[i].productName;
                        record.productCount = order.products[i].count;
                        record.priceOfOneExclVAT = order.products[i].pricePerOne * taxCoeficient;
                        record.priceOfOneInclVAT = order.products[i].pricePerOne;
                        record.totalPriceExclVAT = order.products[i].totalPricePerProduct * taxCoeficient;
                        record.totalPriceInclVAT = order.products[i].totalPricePerProduct;

                        formattedOrders.push(record);
                    }

                })
                var xls = json2xls(formattedOrders);
                fs.writeFileSync('exports/' + joinedDatesString + '-orders.xlsx', xls, 'binary');
                fs.readFile('exports/' + joinedDatesString + '-orders.xlsx', function read(err, data) {
                    if (err) {
                        throw err;
                    }
                    var orders = data;

                    dbx.filesUpload({path: path + '/orders.xlsx', contents: orders, mode: 'overwrite'})
                    .then(function() {
                        deferred.resolve();
                    })
                    .catch(function(error) {
                        console.log('error while uploading document to dropbox: ' + error);
                        deferred.reject(error);
                    });
                });
            }
        });
    })

    return deferred.promise;
}

function exportCosts(joinedDatesString, dateFrom, dateTo, path) {

    var deferred = Q.defer();

    var queryCosts = {
        'date': {'$gt': dateFrom, '$lt': dateTo}
    };

    var costs = mongo.collection('costs');
    costs.find(queryCosts)
    .toArray(function(err, result) {
        if(err) {
            console.log('ERROR while exporting costs> ' + err);
            deferred.reject(err);
        } else {
            console.log('Number of exported Costs: ' + result.length);
            var formattedCosts = [];
            result.forEach(function(cost) {
                delete cost._id;
                delete cost.id;
                var formattedDate = cost.date.getDate() + '.' + (cost.date.getMonth() + 1) + '.' + cost.date.getFullYear();
                var formattedPrice = cost.cost;
                delete cost.date;
                delete cost.cost;
                cost.cost = formattedPrice;
                cost.date = formattedDate;
                cost.note = cost.note ? cost.note : '-';
                formattedCosts.push(cost);
            })
            var xls = json2xls(formattedCosts);
            fs.writeFileSync('exports/' + joinedDatesString + '-costs.xlsx', xls, 'binary');

            fs.readFile('exports/' + joinedDatesString + '-costs.xlsx', function read(err, data) {
                if (err) {
                    throw err;
                }
                var costs = data;
                dbx.filesUpload({path: path + '/costs.xlsx', contents: costs, mode: 'overwrite'})
                .then(function() {
                    deferred.resolve();
                })
                .catch(function(error) {
                    console.log('error while uploading document to dropbox: ' + error);
                    deferred.reject(error);
                });
            });
        }
    });

    return deferred.promise;
}


Handler.prototype.exportByVS = function(vs) {
    var deferred = Q.defer();

    var orders = mongo.collection('orders');
    var products = mongo.collection('productsV2');

    products.find()
    .toArray(function(err, allProducts) {
        var productsObject = {};

        allProducts.forEach(function(product) {
            productsObject[product.name] = {
                price: product.price,
                weight: product.weight,
                tax: product.tax
            }
        });

        var match = {'state': 'active', 'payment.vs': vs};

        orders.find(match)
        .toArray(function(err, orders) {
            if(err) {
                console.log('ERROR while getting orders by VS> ' + err);
            } else {
                if (orders.length == 0) {
                    deferred.reject('Order not found');
                }
                var promises = [];
                var index = 0;
                orders.forEach(function(order) {
                    console.log('Exported order number ' + order.id);
                    promises.push(pdfGeneration.generatePdf(order, index, productsObject));
                    ++index;
                })

                Q.all(promises)
                .then(function() {
                    deferred.resolve();
                })
                .catch(function(err) {
                    deferred.reject(err);
                });
            }
        });
    });

    return deferred.promise;
}

exports.Handler = Handler;