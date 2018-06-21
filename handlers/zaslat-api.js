
var OrdersHandler = require('../handlers/orders.js').Handler;

var Q = require('q');

var zaslatApiBaseUri;
var zaslatApiGetAllShipmentsUri;
var zaslatApiGetShipmentsTrackingUri;
var zaslatCreateShipmentUri;
var zaslatLabelUri;
var zaslatPickupUri;
var zaslatGetPickupsUri;
var zaslatRatesUri;
var zaslatToken;
var zaslatHeaders;
var handler;

var ordersHandler;
var ACTIVE_ORDERS_STATE;
var socketIoListener;
var mongo;

var rp = require('request-promise');

Handler = function(app) {
    zaslatApiBaseUri = app.get('zaslat-base-uri');
    zaslatApiGetAllShipmentsUri = app.get('zaslat-get-all-shipments-uri');
    zaslatApiGetShipmentsTrackingUri = app.get('zaslat-get-shipments-tracking-uri');
    zaslatCreateShipmentUri = app.get('zaslat-create-shipment');
    zaslatPickupUri = app.get('zaslat-pickup-uri');
    zaslatGetPickupsUri = app.get('zaslat-get-pickups-uri');
    zaslatLabelUri = app.get('zaslat-label');
    zaslatRatesUri = app.get('zaslat-rates-uri');
    zaslatToken = app.get('zaslat-token');
    ACTIVE_ORDERS_STATE = app.get('ACTIVE_ORDERS_STATE');
    socketIoListener = app.get('socket.io.listener');
    zaslatHeaders = {
        'x-apikey': zaslatToken,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

    ordersHandler = new OrdersHandler(app);
    mongo = app.get('mongodb');
    handler = this;

    // setInterval(function() {
    //     var allShipments;
    //     var allOrdersInQueue;
    //     var orderIdsToRemoveFromQueue = [];
    //     Q.all([handler.getAllShipments(), ordersHandler.getAllOrdersInQueue('December 31, 2016 23:59:59')])
    //     .then(function(results) {
    //         var shipments = results[0];
    //         var orders = results[1];
    //         orders.forEach(function(order) {
    //             if(shipments[order.zaslatShipmentId]) {
    //                 if(shipments[order.zaslatShipmentId].status == 'INTRANSIT') {
    //                     orderIdsToRemoveFromQueue.push(order.id);
    //                 }
    //             }
    //         });
    //         return handler.deleteFromQueue(orderIdsToRemoveFromQueue, true);
    //     })
    //     .then(function(res) {
    //         return ordersHandler.getAllOrders('December 31, 2016 23:59:59')
    //     })
    //     .then(function(allData) {
    //         socketIoListener.emit('orders', {'allOrders': allData});
    //     })
    //     .catch(function(err) {
    //         console.log('ERROR WHILE REMOVING ITEMS FROM QUEUE');
    //         console.log(err);
    //     })
    // }, 1000 * 60);
};

Handler.prototype.getAllPickups = function() {
    var deferred = Q.defer();

    var options = {
        uri: zaslatApiBaseUri + zaslatGetPickupsUri,
        headers: zaslatHeaders,
        json: true
    };

    rp(options)
    .then(function(response) {
        console.log(response.data);
        deferred.resolve(response.data);
    })
    .catch(function(err) {
        console.log('error fetching all pickups > ' + err.message);
        deferred.reject(err.message);
    })

    return deferred.promise;
}

Handler.prototype.getAllShipments = function() {
    var deferred = Q.defer();

    var options = {
        uri: zaslatApiBaseUri + zaslatApiGetAllShipmentsUri,
        headers: zaslatHeaders,
        json: true
    };

    rp(options)
    .then(function(response) {
        deferred.resolve(response.data);
    })
    .catch(function(err) {
        console.log('error fetching all shipments > ' + err.message);
        deferred.reject(err.message);
    })

    return deferred.promise;
}

Handler.prototype.getRates = function(body) {
    var deferred = Q.defer();

    var options = {
        method: 'POST',
        uri: zaslatApiBaseUri + zaslatRatesUri,
        headers: zaslatHeaders,
        body: body,
        json: true
    };

    rp(options)
    .then(function(response) {
        var GLS = {};
        if (response.rates) {
            var rates = response.rates;
            for (var i = 0; i < response.rates.length; i++) {
                if (rates[i].carries = 'GLS') {
                    GLS = rates[i];
                    break;
                }
            }
        }
        deferred.resolve(GLS);
    })
    .catch(function(err) {
        console.log('error fetching rates info > ' + err.message);
        deferred.reject(err.message);
    })

    return deferred.promise;
}

Handler.prototype.getTrackingInfo = function(shipments) {
    var deferred = Q.defer();

    var options = {
        method: 'POST',
        uri: zaslatApiBaseUri + zaslatApiGetShipmentsTrackingUri,
        body: shipments,
        headers: zaslatHeaders,
        json: true
    };

    rp(options)
    .then(function(response) {
        deferred.resolve(response.data);
    })
    .catch(function(err) {
        console.log('error fetching shipment info > ' + err.message);
        deferred.reject(err.message);
    })

    return deferred.promise;
}

Handler.prototype.createShipment = function(shipment, orderId, shipmentType, note) {
    var deferred = Q.defer();
    var zaslatResponse;

    var options = {
        method: 'POST',
        uri: zaslatApiBaseUri + zaslatCreateShipmentUri,
        body: shipment,
        headers: zaslatHeaders,
        json: true
    };
    rp(options)
    .then(function(response) {
        zaslatResponse = response.data;
        return ordersHandler.setZaslatData(orderId, zaslatResponse.shipments[0], shipmentType, note);
    })
    .then(function() {
        deferred.resolve(zaslatResponse);
    })
    .catch(function(err) {
        console.log('error creating shipment > ' + err.message);
        deferred.reject(err.message);
    })

    return deferred.promise;
}

Handler.prototype.createPickup = function(pickupObject) {
    var deferred = Q.defer();
    var zaslatResponse;

    var options = {
        method: 'POST',
        uri: zaslatApiBaseUri + zaslatPickupUri,
        body: pickupObject,
        headers: zaslatHeaders,
        json: true
    };
    rp(options)
    .then(function(response) {
        deferred.resolve(response);
    })
    .catch(function(err) {
        console.log('error creating pickup > ' + err.message);
        deferred.reject(err.error);
    })

    return deferred.promise;
}

Handler.prototype.printLabels = function(shipments) {
    var deferred = Q.defer();
    var zaslatResponse;

    var data = {
        shipments: shipments
    }

    var options = {
        method: 'POST',
        uri: zaslatApiBaseUri + zaslatLabelUri,
        body: data,
        headers: zaslatHeaders,
        json: true
    };
    rp(options)
    .then(function(response) {
        deferred.resolve(response.data);
    })
    .catch(function(err) {
        console.log('error while printing label > ' + err.message);
        deferred.reject(err.error);
    })

    return deferred.promise;
}

Handler.prototype.getAllZaslatOrders = function() {
    var deferred = Q.defer();
    var orders = mongo.collection('orders');

    var filter = {$match:
                    {
                        'zaslatDate': {$exists: true}, 'state': ACTIVE_ORDERS_STATE
                    }
                 };
    var sort = {$sort:
                    {
                        'zaslatDate': -1
                    }
                };
    var limit = {$limit: 150};
    orders.aggregate([filter, sort, limit])
    .toArray(function(err, orders) {
        if(err) {
            console.log('ERROR while getting all zaslat orders> ' + err);
            deferred.reject(err);
        } else {
            deferred.resolve(orders);
        }
    });

    return deferred.promise;
}

Handler.prototype.deleteFromQueue = function(orderIds, autoDelete) {
    console.log(orderIds);
    var deferred = Q.defer();
    var orders = mongo.collection('orders');

    var filter = {
        'inQueue': true, 'state': ACTIVE_ORDERS_STATE, id: {$in: orderIds}
    }

    var unsetObject = {
        'inQueue': ""
    }

    if(!autoDelete) {
        unsetObject.zaslatDate = "",
        unsetObject.zaslatShipmentId = ""
    }

    orders.update(filter, {$unset: unsetObject},
                        {multi: true}, function(err, result) {
        if(err) {
            deferred.reject(err);
        } else {
            deferred.resolve(result);
        }
    });

    return deferred.promise;
}

exports.Handler = Handler;