

var Q = require('q');
const fs = require('fs');
const path = require('path');
var passwordHash = require('password-hash');
var jwt = require('jsonwebtoken');
var rp = require('request-promise');
var mongo;
var salt;
var tokenExpiracy;

var WarehouseHandler = require('../handlers/warehouse.js').Handler;
var warehouseHandler;

var othersHandler;

Handler = function(app) {
    mongo = app.get('mongodb');
    salt = app.get('salt');
    tokenExpiracy = app.get('tokenExpiracy');

    warehouseHandler = new WarehouseHandler(app);
    othersHandler = this;
};

Handler.prototype.authenticate = function(username, password) {

    var deferred = Q.defer();
    var users = mongo.collection('users');

    users.findOne(
            {username: username},
            function(err, user) {
                if (err) {
                    var errMsg = 'ERROR while finding user for authentication';
                    var error = new Error(errMsg);
                    console.log(errMsg + ' ' + err);
                    deferred.reject(err);
                } else if(!user) {
                    var errMsg = 'Authentication UNSUCCESSFULL for user "' + username + '"';
                    var error = new Error(errMsg);
                    console.log(errMsg + ' ' + username + '"');
                    deferred.reject('Invalid Credentials!');
                } else {
                    if(passwordHash.verify(password, user.password)) {
                        console.log('Authentication successfull for user "' + username + '"');
                        var token = jwt.sign(user, salt, {
                            expiresIn: tokenExpiracy
                        });
                        var tokenExpiracyDate = new Date();
                        tokenExpiracyDate.setSeconds(tokenExpiracyDate.getSeconds() + tokenExpiracy);
                        deferred.resolve({username: username, token: token, expiracyDate: tokenExpiracyDate});
                    } else {
                        var errMsg = 'Authentication UNSUCCESSFULL for user "' + username + '", password mismatch';
                        var error = new Error(errMsg);
                        console.log(errMsg + ' ' + username + '"');
                        deferred.reject('Invalid Credentials!');
                    }
                }
    });
    return deferred.promise;
}

Handler.prototype.validateToken = function(token) {

    var deferred = Q.defer();
    jwt.verify(token, salt, function(err, decoded) {
        if (err) {
            var error = new Error('Failed to authenticate token');
            error.code = 403;
            error.type = 'token_validation';
            console.log('FAILED to authenticate token');
            deferred.reject(err);
        } else {
            deferred.resolve(decoded);
        }
    });
    return deferred.promise;
}

Handler.prototype.getAllProductsJson = function() {
    var deferred = Q.defer();

    var products = mongo.collection('products');

    products.find()
    .toArray(function(err, allProducts) {
        var productsObject = {};

        allProducts.forEach(function(product) {
            productsObject[product.name] = {
                price: product.price,
                weight: product.weight,
                tax: product.tax,
                category: product.category,
                invoiceDisplayName: product.invoiceDisplayName,
                displayName: product.displayName,
                id: product.id
            }
        });

        if(err) {
            console.log('ERROR while getting all products> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(productsObject);
        }
    });

    return deferred.promise;
}

Handler.prototype.addProduct = function(product) {
    var deferred = Q.defer();

    var products = mongo.collection('products');

    products.insertOne(product, function(err, doc) {
        if (err) {
            deferred.reject(err);
        } else {
            var calcDate = new Date();
            warehouseHandler.saveProductAmount(product.name, 0, calcDate, 0)
            .then(function(res) {
                deferred.resolve(doc);
            })
            .fail(function(err) {
                deferred.reject(err);
            })
            .done()
        }
    });

    return deferred.promise;
}

Handler.prototype.editProduct = function(oldProductName, newProduct) {
    var deferred = Q.defer();

    this.updateProductsCollections(oldProductName, newProduct)
    .then(function(result) {
        return othersHandler.updateProductsInOrders(oldProductName, newProduct.name);
    })
    .then(function(result) {
        return othersHandler.updateProductInWarehouse(oldProductName, newProduct.name);
    })
    .then(function(result) {
        deferred.resolve(result);
    })
    .catch(function(err) {
        deferred.reject(err);
    })

    return deferred.promise;
}

Handler.prototype.updateProductsCollections = function(oldProductName, newProduct) {
    var deferred = Q.defer();

    var products = mongo.collection('products');

    products.update({'name': oldProductName},
        {$set: {
            name: newProduct.name,
            price: newProduct.price,
            weight: newProduct.weight,
            tax: newProduct.tax,
            category: newProduct.category,
            invoiceDisplayName: newProduct.invoiceDisplayName,
            displayName: newProduct.displayName,
            id: newProduct.id
        }},
        function(err, result) {
            if(result.result.n == 1) {
                deferred.resolve(result);
            } else if (result.result.n == 0) {
                var error = new Error('error while updating product, not found: ' + oldProductName);
                console.log(error + '> ' + err);
                error.status = 404;
                deferred.reject(error);
            } else {
                var error = new Error('error while updating product ' + oldProductName);
                console.log(error + '> ' + err);
                error.status = 400;
                deferred.reject(error);
            }
        }
    );

    return deferred.promise;
}

Handler.prototype.updateProductsInOrders = function(oldProductName, newProductName) {
    var deferred = Q.defer();

    var orders = mongo.collection('orders');

    orders.update({'products.productName': oldProductName}, {$set: {'products.$.productName': newProductName}}, {multi: true},
        function(err, result) {
            if (err) {
                var error = new Error('error while updating product ' + oldProductName);
                console.log(error + '> ' + err);
                error.status = 400;
                deferred.reject(error);
            } else {
                deferred.resolve(result);
            }
        }
    );

    return deferred.promise;
}

Handler.prototype.updateProductInWarehouse = function(oldProductName, newProductName) {
    var deferred = Q.defer();

    var warehouse = mongo.collection('warehouse');

    warehouse.update({'productName': oldProductName}, {$set: {'productName': newProductName}}, {multi: true},
        function(err, result) {
            if (err) {
                var error = new Error('error while updating product ' + oldProductName);
                console.log(error + '> ' + err);
                error.status = 400;
                deferred.reject(error);
            } else {
                deferred.resolve(result);
            }
        }
    );

    return deferred.promise;
}

Handler.prototype.removeProduct = function(product) {
    var deferred = Q.defer();

    var products = mongo.collection('products');
    var warehouse = mongo.collection('warehouse');

    products.removeOne({'name':product}, function(err, doc) {
        if (err) {
            deferred.reject(err);
        } else {
            warehouse.removeOne({'productName':product}, function(err, doc) {
                if(err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(doc);
                }
            })
        }
    });

    return deferred.promise;
}

Handler.prototype.getAllSenders = function() {
    var deferred = Q.defer();
    var senders = mongo.collection('senders');

    senders.find()
    .toArray(function(err, senders) {
        if(err) {
            console.log('ERROR while getting all senders> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(senders);
        }
    });
    return deferred.promise;
}

Handler.prototype.smartform = function(body) {
    var deferred = Q.defer();

    var options = {
        method: 'POST',
        uri: 'https://secure.smartform.cz/smartform-ws/oracle/v4',
        body: body,
        headers: {
            'Content-type': 'application/json',
            'Accept': 'application/json'
        },
        json: true
    };

    rp(options)
    .then(function(response) {
        console.log(response);
        deferred.resolve(response);
    })
    .catch(function(err) {
        console.log('error fetching from smartform > ' + err.message);
        deferred.reject(err.message);
    });

    return deferred.promise;
}

exports.Handler = Handler;
