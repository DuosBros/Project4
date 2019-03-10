module.exports = function(app) {

    var Handler = require('../handlers/zaslat-api.js').Handler;
    var handler = new Handler(app);

    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);

    var tools = require('../tools/tools.js');

    app.get('/rest/zaslat/shipments/list', function(req, res) {
        var token = tools.extractToken(req);
        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getAllShipments();
            })
            .then(function(shipments) {
                res.json(shipments);
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
            .done();
        } else {
            res.status(403).send({message: 'No authentication token!'});
        }
    });

    app.get('/rest/zaslat/pickups/list', function(req, res) {
        var token = tools.extractToken(req);
        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getAllPickups();
            })
            .then(function(pickups) {
                res.json(pickups);
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
            .done();
        } else {
            res.status(403).send({message: 'No authentication token!'});
        }
    });

    app.post('/rest/zaslat/shipments/tracking', function(req, res) {
        var token = tools.extractToken(req);
        var shipments = req.body;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getTrackingInfo(shipments);
            })
            .then(function(trackingInfo) {
                res.json(trackingInfo);
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
            .done();
        } else {
            res.status(403).send({message: 'No authentication token!'});
        }
    });

    app.get('/rest/zaslat/addressId', function(req, res) {
        res.json(app.get('zaslat-address-id'));
        res.end();
    })

    app.get('/rest/zaslat/orders/list', function(req, res) {
        var token = tools.extractToken(req);
        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getAllZaslatOrders();
            })
            .then(function(orders) {
                res.json(orders);
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
            .done();
        } else {
            res.status(403).send({message: 'No authentication token!'});
        }
    });

    app.post('/rest/zaslat/shipments/create', function(req, res) {
        var token = tools.extractToken(req);
        var createShipmentData = req.body;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.createShipment(createShipmentData.shipment, createShipmentData.orderId,
                    createShipmentData.shipmentType, createShipmentData.note);
            })
            .then(function(response) {
                res.json(response);
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
            .done();
        } else {
            res.status(403).send({message: 'No authentication token!'});
        }
    });

    app.post('/rest/zaslat/rates', function(req, res) {
        var token = tools.extractToken(req);
        var ratesBody = req.body;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getRates(ratesBody);
            })
            .then(function(response) {
                res.json(response);
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
            .done();
        } else {
            res.status(403).send({message: 'No authentication token!'});
        }
    });

    app.post('/rest/zaslat/shipments/label', function(req, res) {
        var token = tools.extractToken(req);
        var shipments = req.body;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.printLabels(shipments);
            })
            .then(function(response) {
                res.json(response);
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
            .done();
        } else {
            res.status(403).send({message: 'No authentication token!'});
        }
    });

    app.post('/rest/zaslat/pickup/create', function(req, res) {
        var token = tools.extractToken(req);
        var pickupObj = req.body;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.createPickup(pickupObj);
            })
            .then(function(response) {
                res.json(response);
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
            .done();
        } else {
            res.status(403).send({message: 'No authentication token!'});
        }
    });

    app.post('/rest/zaslat/queue/delete', function(req, res) {
        var token = tools.extractToken(req);
        var orderIds = req.body;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.deleteFromQueue(orderIds);
            })
            .then(function(response) {
                res.json(response);
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
            .done();
        } else {
            res.status(403).send({message: 'No authentication token!'});
        }
    });
}