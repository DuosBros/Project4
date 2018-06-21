

var Q = require('q');
var AuthenticationHandler = require('../handlers/others.js').Handler;
var authenticationHandler;
var mongo;

var DELETED_ORDERS_STATE;
var ACTIVE_ORDERS_STATE;
var ARCHIVED_ORDERS_STATE;
var socketIoListener;
var ordersHandler;

Handler = function(app) {
    mongo = app.get('mongodb');
    authenticationHandler = new AuthenticationHandler(app);
    DELETED_ORDERS_STATE = app.get('DELETED_ORDERS_STATE');
    ACTIVE_ORDERS_STATE = app.get('ACTIVE_ORDERS_STATE');
    ARCHIVED_ORDERS_STATE = app.get('ARCHIVED_ORDERS_STATE');
    socketIoListener = app.get('socket.io.listener');
    ordersHandler = this;

    socketIoListener.on('connection', function(socket) {
        socket.on('refresh_orders_2016', function(data) {
            authenticationHandler.validateToken(data.token)
            .then(function() {
                return ordersHandler.getAllOrders(undefined, 'December 31, 2016 23:59:59');
            })
            .then(function(allData) {
                socketIoListener.emit('orders', {'allOrders': allData});
            })
            .fail(function(err) {
                console.log(err);
            })
            .done();
        });

        socket.on('refresh_orders_2017', function(data) {
            authenticationHandler.validateToken(data.token)
            .then(function() {
                return ordersHandler.getOrder(data.orderId)
            })
            .then(function(order) {
                socketIoListener.emit('orders', {'order': order, 'id': data.orderId});
            })
            .fail(function(err) {
                console.log(err);
            })
            .done();
        });
    });
};

Handler.prototype.getAllOrdersInQueue = function(from, to) {
    var deferred = Q.defer();
    var orders = mongo.collection('orders');

    if(from) {
        query = {'payment.orderDate': {'$gt': new Date(from)}}
    } else if(to) {
        query = {'payment.orderDate': {'$lt': new Date(to)}}
    } else {
        query = {};
    }
    query.state = ACTIVE_ORDERS_STATE;
    query.inQueue = true;

    orders.find(query)
    .toArray(function(err, orders) {
        if(err) {
            console.log('ERROR while getting all orders> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(orders);
        }
    });
    return deferred.promise;
}

Handler.prototype.getAllOrders = function(from, to) {
    var deferred = Q.defer();
    var orders = mongo.collection('orders');

    if (from && to) {
        query = {'payment.orderDate': {'$gt': new Date(from), '$lt': new Date(to)}};
    } else if(from) {
        query = {'payment.orderDate': {'$gt': new Date(from)}}
    } else if(to) {
        query = {'payment.orderDate': {'$lt': new Date(to)}}
    } else {
        query = {};
    }
    query.state = ACTIVE_ORDERS_STATE;

    orders.find(query, { 'sort': [['id', 'desc']]} )
    .toArray(function(err, orders) {
        if(err) {
            console.log('ERROR while getting all orders> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(orders);
        }
    });
    return deferred.promise;
}

Handler.prototype.getTotalTurnover = function() {
    var deferred = Q.defer();
    var orders = mongo.collection('orders');


    var filter = {$match:
                    {
                        'payment.paymentDate': {$exists: true}, 'state': ACTIVE_ORDERS_STATE
                    }
                 };
    var group = { $group: {_id:
                            {
                              turnover : {$sum: '$totalPrice'}
                            },
                        }
                };
    orders.aggregate([filter, group])
    .toArray(function(err, orders) {
        if(err) {
            console.log('ERROR while getting all orders> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(orders);
        }
    });
    return deferred.promise;
}

Handler.prototype.getNextHighestVS = function() {
    var deferred= Q.defer();
    var orders = mongo.collection('orders');

    var options = {
        "sort": ["payment.vs", 'ascending']
    };

    orders.find({'state': ACTIVE_ORDERS_STATE}, options).toArray(function(err, order) {
        if(err) {
            console.log('ERROR while getting next VS> ' + err);
            deferred.reject(err);
        } else {
            if(!order || order.length == 0) {
                deferred.resolve(1);
            } else {
                var newVS = parseInt(order[order.length - 1].payment.vs) + 1;
                deferred.resolve(newVS);
            }
        }
    });

    return deferred.promise;
}

Handler.prototype.isValidVS = function(vs, orderId) {
    var deferred= Q.defer();
    var orders = mongo.collection('orders');

    var match = {'payment.vs': vs, state: ACTIVE_ORDERS_STATE};
    if(orderId || orderId == 0) {
        match.id = {$ne: orderId};
    }

    orders.find(match).toArray(function(err, order) {
        if(err) {
            console.log('ERROR while getting next VS> ' + err);
            deferred.reject(err);
        } else {
            if(!order || order.length == 0) {
                deferred.resolve(true);
            } else {
                deferred.reject(false);
            }
        }
    });

    return deferred.promise;
}

Handler.prototype.getAllOrdersMonthly = function() {
    var deferred = Q.defer();
    var orders = mongo.collection('orders');
    var filter = {$match:
                    {
                        'payment.paymentDate': {$exists: true}, 'state': ACTIVE_ORDERS_STATE
                    }
                 };
    var group = { $group: {
                              _id: {
                                  month: { $month: "$payment.paymentDate" },
                                  year: { $year: "$payment.paymentDate" }
                              },
                              turnover: { $sum: '$totalPrice' },
                              totalDeliveryCosts: { $sum: "$payment.price" },
                              cashOrders: { $addToSet: { $cond : [ {$eq: ['$deliveryType', 'Cash']}, '$id', undefined] } },
                              vsOrders: { $addToSet: { $cond : [ {$eq: ['$deliveryType', 'VS']}, '$id', undefined] } }
                          },
                };

    orders.aggregate([filter, group])
    .toArray(function(err, orders) {
        if(err) {
            console.log('ERROR while getting all orders grouped by month> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(orders);
        }
    });

    return deferred.promise;
}

Handler.prototype.getAllOrdersDaily = function() {
    var deferred = Q.defer();
    var orders = mongo.collection('orders');
    var filter = {$match: {'payment.paymentDate': {$exists: true}, 'state': ACTIVE_ORDERS_STATE}};

    var group = { $group: {_id:
                            { month: { $month: "$payment.paymentDate" },
                              day: { $dayOfMonth: "$payment.paymentDate" },
                              year: { $year: "$payment.paymentDate" } },
                              total : {$sum: '$totalPrice'}
                          },
                };

    orders.aggregate([group])
    .toArray(function(err, orders) {
        if(err) {
            console.log('ERROR while getting all orders grouped by day> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(orders);
        }
    });

    return deferred.promise;
}

Handler.prototype.getOrder = function(orderId) {
    var deferred = Q.defer();

    var orders = mongo.collection('orders');
    var id = parseInt(orderId);

    orders.findOne({id: id, state: ACTIVE_ORDERS_STATE}, {},
            function(err, order) {
                if(err) {
                    console.log('ERROR while getting order with ID: ' + orderId + '> ' + err);
                    deferred.reject(err);
                } else {
                    deferred.resolve(order);
                }
            });
    return deferred.promise;
}

Handler.prototype.getOrderByVS = function(vs) {
    var deferred = Q.defer();

    var orders = mongo.collection('orders');
    var vs = parseInt(vs);

    orders.findOne({'payment.vs': vs, state: ACTIVE_ORDERS_STATE}, {},
            function(err, order) {
                if(err) {
                    console.log('ERROR while getting order with VS: ' + VS + '> ' + err);
                    deferred.reject(err);
                } else {
                    deferred.resolve(order);
                }
            });
    return deferred.promise;
}

Handler.prototype.verifyLock = function(orderId, username) {
    var deferred = Q.defer();

    var orders = mongo.collection('orders');
    var id = parseInt(orderId);

    orders.findOne({id: id}, {},
            function(err, order) {
                if(err) {
                    console.log('ERROR while getting order with ID: ' + orderId + '> ' + err);
                    deferred.reject(err);
                } else {
                    if(new Date() > order.lock.timestamp || username == order.lock.username) {
                        deferred.resolve(false);
                    } else {
                        deferred.reject({lockedBy: order.lock.username});
                    }
                }
            });
    return deferred.promise;
}

Handler.prototype.setOrderLock = function(orderId, username, seconds) {
    var deferred = Q.defer();

    var orders = mongo.collection('orders');
    var id = parseInt(orderId);
    var seconds = parseInt(seconds);

    var newLockTimestamp = new Date();
    newLockTimestamp.setSeconds(newLockTimestamp.getSeconds() + seconds);

    orders.update({'id': id}, {$set: {'lock.username': username, 'lock.timestamp': newLockTimestamp}}, function(err, result) {
        if(result.result.n == 1) {
            deferred.resolve(result);
        } else if (result.result.n == 0) {
            var error = new Error('error while removing order, not found: ' + orderId);
            console.log(error + '> ' + err);
            error.status = 404;
            deferred.reject(error);
        } else {
            var error = new Error('error while removing order ' + orderId);
            console.log(error + '> ' + err);
            error.status = 400;
            deferred.reject(error);
        }
    })

    return deferred.promise;
}

Handler.prototype.setZaslatData = function(orderId, shipmentId, shipmentType, note) {
    var deferred = Q.defer();

    var orders = mongo.collection('orders');

    var setObject = {
        'zaslatDate': new Date(),
        'zaslatShipmentId': shipmentId,
        'note': note
    }
    if(shipmentType == 'OCCASIONAL') {
        setObject.inQueue = true;
    }

    orders.update({'id': orderId}, {$set: setObject}, function(err, result) {
        if(result.result.n == 1) {
            deferred.resolve(result);
        } else if (result.result.n == 0) {
            var error = new Error('error while updating order with zaslat date, not found: ' + orderId);
            console.log(error + '> ' + err);
            error.status = 404;
            deferred.reject(error);
        } else {
            var error = new Error('error while updating order with zaslat date ' + orderId);
            console.log(error + '> ' + err);
            error.status = 400;
            deferred.reject(error);
        }
    })

    return deferred.promise;
}

Handler.prototype.saveOrder = function(orderId, order, username) {
    var deferred = Q.defer();
    var orders = mongo.collection('orders');

    var id = parseInt(orderId);
    delete order._id;

    var parsedOrder = order;
    parsedOrder.payment.orderDate = new Date(order.payment.orderDate);
    if(order.payment.paymentDate) {
        parsedOrder.payment.paymentDate = new Date(order.payment.paymentDate);
    }

    parsedOrder.lock.username = username;
    parsedOrder.lock.timestamp = new Date();

    orders.replaceOne({'id' : id}, parsedOrder, function(err, res) {
        if(err) {
            console.log('ERROR while updating order with ID: ' + orderId + '> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(res);
        }
    });

    return deferred.promise;
}

Handler.prototype.addOrder = function(order, username) {
    var deferred = Q.defer();
    var orders = mongo.collection('orders');
    var id;
    var parsedOrder = order;
    parsedOrder.payment.orderDate = new Date(order.payment.orderDate);
    if(order.payment.paymentDate) {
        parsedOrder.payment.paymentDate = new Date(order.payment.paymentDate);
    }
    parsedOrder.lock = {};
    parsedOrder.lock.username = username;
    parsedOrder.lock.timestamp = new Date();

    orders.findOne(
        {},
        { sort: {'id' : -1} },
        function(err, lastOrder) {
            if (err) {
                console.log('ERROR while creating new order (getting new ID)> ' + err);
                deferred.reject(err);
            } else if(!lastOrder) {
                id = 0;
            } else {
                id = lastOrder.id + 1;
            }
            parsedOrder.id = id;
            orders.insertOne(parsedOrder, function(err, doc) {
                if(err) {
                    console.log('ERROR while creating new order (adding to DB)> ' + err);
                    deferred.reject(err);
                } else {
                    deferred.resolve(doc);
                }
            });
    });
    return deferred.promise;
}

Handler.prototype.deleteOrder = function(orderId) {
    var deferred = Q.defer();

    var orders = mongo.collection('orders');
    orders.update({'id': parseInt(orderId)}, {$set: {'state': DELETED_ORDERS_STATE}}, function(err, result) {
        if(result.result.n == 1) {
            deferred.resolve(result);
        } else if (result.result.n == 0) {
            var error = new Error('error while removing order, not found: ' + orderId);
            console.log(error + '> ' + err);
            error.status = 404;
            deferred.reject(error);
        } else {
            var error = new Error('error while removing order ' + orderId);
            console.log(error + '> ' + err);
            error.status = 400;
            deferred.reject(error);
        }
    })
    return deferred.promise;
}

exports.Handler = Handler;