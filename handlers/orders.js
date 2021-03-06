

var Q = require('q');
var AuthenticationHandler = require('../handlers/others.js').Handler;
var authenticationHandler;
var mongo;

var DELETED_ORDERS_STATE;
var ACTIVE_ORDERS_STATE;
var EXPIRED_ORDERS_STATE;
var DRAFT_ORDERS_STATE;
var socketIoListener;
var ordersHandler;

Handler = function(app) {
    mongo = app.get('mongodb');
    authenticationHandler = new AuthenticationHandler(app);
    DELETED_ORDERS_STATE = app.get('DELETED_ORDERS_STATE');
    ACTIVE_ORDERS_STATE = app.get('ACTIVE_ORDERS_STATE');
    ARCHIVED_ORDERS_STATE = app.get('ARCHIVED_ORDERS_STATE');
    EXPIRED_ORDERS_STATE = app.get('EXPIRED_ORDERS_STATE');
    DRAFT_ORDERS_STATE = app.get('DRAFT_ORDERS_STATE');
    socketIoListener = app.get('socket.io.listener');
    ordersHandler = this;

    socketIoListener.on('connection', function(socket) {
        socket.on('refresh_orders', function(data) {
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

Handler.prototype.getAllNotPaidOrders = function(from, to) {
    var deferred = Q.defer();
    var orders = mongo.collection('orders');

    var pipeline = [];

    if (from && to) {
        query = {'payment.paymentDate': {$exists: false}, 'payment.orderDate': {'$gt': new Date(from), '$lt': new Date(to)}};
    } else if(from) {
        query = {'payment.paymentDate': {$exists: false}, 'payment.orderDate': {'$gt': new Date(from)}}
    } else if(to) {
        query = {'payment.paymentDate': {$exists: false}, 'payment.orderDate': {'$lt': new Date(to)}}
    } else {
        query = {'payment.paymentDate': {$exists: false}};
    }
    query.state = {$eq: ACTIVE_ORDERS_STATE};

    var filter = {
        $match: query
    };

    var sort = {$sort: { 'id': -1}};

    pipeline.push(filter);
    pipeline.push(sort);

    orders.aggregate(pipeline)
    .toArray(function(err, orders) {
        if(err) {
            console.log('ERROR while getting all not paid orders> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(orders);
        }
    });
    return deferred.promise;
}

Handler.prototype.getAllOrders = function(from, to, limit, sinceId) {
    var deferred = Q.defer();
    var orders = mongo.collection('orders');

    var pipeline = [];

    if (from && to) {
        query = {'payment.orderDate': {'$gt': new Date(from), '$lt': new Date(to)}};
    } else if(from) {
        query = {'payment.orderDate': {'$gt': new Date(from)}}
    } else if(to) {
        query = {'payment.orderDate': {'$lt': new Date(to)}}
    } else {
        query = {};
    }
    query.state = {$in: [ACTIVE_ORDERS_STATE, EXPIRED_ORDERS_STATE, DRAFT_ORDERS_STATE]};

    if (sinceId) {
        query.id = {'$lt': sinceId};
    }

    var filter = {
        $match: query
    };

    var sort = {$sort: { 'id': -1}};


    pipeline.push(filter);
    pipeline.push(sort);

    if (limit) {
        var limit = {$limit: limit};
        pipeline.push(limit);
    }

    orders.aggregate(pipeline)
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

    var match = {
        state: {$in: [ACTIVE_ORDERS_STATE, EXPIRED_ORDERS_STATE, DRAFT_ORDERS_STATE, DELETED_ORDERS_STATE]},
        'payment.vs': {$exists: true},
    };

    var pipeline = [];
    var match = {$match: match};
    var sort = {$sort: {'payment.vs': -1}};
    var project = {$project: {payment: 1, state: 1}};
    var limit = {$limit: 20};

    pipeline.push(match);
    pipeline.push(sort);
    pipeline.push(project);
    pipeline.push(limit);

    //fetch 20 latest VS orders, descending
    orders.aggregate(pipeline)
        .toArray(function(err, orders) {
        if (err) {
            console.log('ERROR while getting next VS> ' + err);
            deferred.reject(err);
        } else {
            if (!orders || orders.length == 0) {
                deferred.resolve(1);
            } else {
                var reversedOrders = orders.reverse();
                var currentOrder;
                var currentVS;
                for (var i = 0; i < reversedOrders.length; i++) {
                    currentOrder = reversedOrders[i];
                    currentVS = parseInt(currentOrder.payment.vs);
                    if (isValidNextVs(currentVS, currentOrder, reversedOrders)) {
                        deferred.resolve(currentVS);
                        return;
                    }
                }
                //no available VS on recently deleted orders found, return latest + 1
                deferred.resolve(currentVS + 1)
            }
        }
    });

    return deferred.promise;
}

function isValidNextVs(currentVS, currentOrder, orders) {
    //if order with given VS is NOT DELETED, don't even consider it
    if (currentOrder.state != DELETED_ORDERS_STATE) {
        return false;
    }

    var fromTime = new Date();
    fromTime.setDate(fromTime.getDate() - 2);

    //if order is older than given days, NOT valid
    if (currentOrder.payment.orderDate <= fromTime) {
        return false;
    }

    for (var i = 0; i < orders.length; i++) {
        var order = orders[i];
        //if there is any NOT deleted order with given VS, NOT valid
        if (parseInt(orders[i].payment.vs) == currentVS && order.state != DELETED_ORDERS_STATE) {
            return false;
        }
    }

    return true;
}

Handler.prototype.getAllPaidOrdersMonthly = function() {
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

Handler.prototype.getAllOrderedOrdersMonthly = function() {
    var deferred = Q.defer();
    var orders = mongo.collection('orders');
    var filter = {$match:
                    {
                        'state': ACTIVE_ORDERS_STATE
                    }
                 };
    var group = { $group: {
                              _id: {
                                  month: { $month: "$payment.orderDate" },
                                  year: { $year: "$payment.orderDate" }
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

Handler.prototype.getAllOrderedOrdersDaily = function(from, to) {
    var deferred = Q.defer();
    var orders = mongo.collection('orders');
    var filter = {$match:
                    {
                        'state': ACTIVE_ORDERS_STATE,
                        'payment.orderDate': {'$gt': new Date(from), '$lt': new Date(to)},
                    }
                 };
    var group = { $group: {
                              _id: {
                                  day: { $dayOfMonth: "$payment.orderDate" },
                                  month: { $month: "$payment.orderDate" },
                                  year: { $year: "$payment.orderDate" }
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

Handler.prototype.getOrder = function(orderId) {
    var deferred = Q.defer();

    var orders = mongo.collection('orders');
    var id = parseInt(orderId);

    orders.findOne({id: id, state: {$in: [ACTIVE_ORDERS_STATE, EXPIRED_ORDERS_STATE, DRAFT_ORDERS_STATE]}}, {},
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

    orders.findOne({'payment.vs': vs, state: {$in: [ACTIVE_ORDERS_STATE, EXPIRED_ORDERS_STATE, DRAFT_ORDERS_STATE]}}, {},
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
                if (err) {
                    console.log('ERROR while getting order with ID: ' + orderId + '> ' + err);
                    deferred.reject(err);
                } else {
                    if (new Date() > order.lock.timestamp || username == order.lock.username) {
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

Handler.prototype.setZaslatData = function(orderId, shipmentId, shipmentType) {
    var deferred = Q.defer();

    var orders = mongo.collection('orders');

    var setObject = {
        'zaslatDate': new Date(),
        'zaslatShipmentId': shipmentId,
        'state': 'active'
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

Handler.prototype.saveOrder = function(orderId, order, username, isCommit) {
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

    if (isCommit) {
        parsedOrder.state = ACTIVE_ORDERS_STATE;
    }

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

Handler.prototype.addOrder = function(order, username, isDraft) {
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

    if (isDraft) {
        parsedOrder.state = DRAFT_ORDERS_STATE;
    }

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
                    deferred.resolve(parsedOrder);
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
