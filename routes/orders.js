module.exports = function(app) {

    var Handler = require('../handlers/orders.js').Handler;
    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var handler = new Handler(app);
    var authenticationHandler = new AuthenticationHandler(app);
    var tools = require('../tools/tools.js');

    app.get('/rest/orders', function(req, res) {
        var token = tools.extractToken(req);
        var from = req.query.from;
        var to = req.query.to;

        var limit;
        var sinceId;

        if (req.query.limit) {
            limit = parseInt(req.query.limit);
        }
        if (req.query.sinceId) {
            sinceId = parseInt(req.query.sinceId);
        }

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getAllOrders(from, to, limit, sinceId);
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

    app.get('/rest/orders/turnover', function(req, res) {
        var token = tools.extractToken(req);
        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getTotalTurnover()
            })
            .then(function(turnover) {
                res.json(turnover);
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

    app.get('/rest/orders/paid/filter/month', function(req, res) {
        var token = tools.extractToken(req);
        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getAllPaidOrdersMonthly()
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

    app.get('/rest/orders/ordered/filter/month', function(req, res) {
        var token = tools.extractToken(req);
        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getAllOrderedOrdersMonthly();
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

    app.get('/rest/orders/vs/next', function(req, res) {
        var token = tools.extractToken(req);
        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getNextHighestVS()
            })
            .then(function(vs) {
                res.json(vs);
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

    app.get('/rest/orders/vs/check/:vs/:orderId', function(req, res) {
        var token = tools.extractToken(req);
        var vs = req.params.vs;
        var orderId = req.params.orderId;
        if(orderId) {
            orderId = parseInt(orderId);
        }
        if(vs == undefined) {
            res.json();
            res.end();
        } else {
            if(token) {
                authenticationHandler.validateToken(token)
                .then(function() {
                    return handler.isValidVS(parseInt(vs), orderId);
                })
                .then(function(vs) {
                    res.json(vs);
                    res.end();
                })
                .fail(function(err) {
                    tools.replyError(err, res);
                })
                .done();
            } else {
                res.status(403).send({message: 'No authentication token!'});
            }
        }
    });

    app.get('/rest/orders/filter/day', function(req, res) {
        var token = tools.extractToken(req);
        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getAllOrdersDaily()
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

    app.get('/rest/orders/:orderId', function(req, res) {
        var token = tools.extractToken(req);
        var orderId = req.params.orderId;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getOrder(orderId)
            })
            .then(function(order) {
                res.json(order);
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

    app.get('/rest/orders/find/vs/:vs', function(req, res) {
        var token = tools.extractToken(req);
        var vs = req.params.vs;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getOrderByVS(vs)
            })
            .then(function(order) {
                res.json(order);
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

    app.get('/rest/orders/:orderId/lock', function(req, res) {
        var token = tools.extractToken(req);
        var orderId = req.params.orderId;
        var username = req.query.username;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.verifyLock(orderId, username)
            })
            .then(function(lock) {
                res.json(lock);
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

    app.post('/rest/orders', function(req, res) {
        var token = tools.extractToken(req);
        var order = req.body;
        var username = req.query.username;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.addOrder(order, username)
            })
            .then(function(insertedOrder) {
                res.json(insertedOrder);
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

    app.put('/rest/orders/:orderId', function(req, res) {
        var token = tools.extractToken(req);
        var order = req.body;
        var orderId = req.params.orderId;
        var username = req.query.username;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.saveOrder(orderId, order, username)
            })
            .then(function(editedOrder) {
                res.json(editedOrder);
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

    app.put('/rest/orders/:orderId/lock', function(req, res) {
        var token = tools.extractToken(req);
        var orderId = req.params.orderId;
        var username = req.query.username;
        var seconds = req.query.seconds;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.setOrderLock(orderId, username, seconds)
            })
            .then(function(editedOrder) {
                res.json(editedOrder);
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

    app.put('/rest/orders/:orderId/unlock', function(req, res) {
        var token = tools.extractToken(req);
        var orderId = req.params.orderId;
        var username = req.query.username;

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.setOrderLock(orderId, username, -1000)
            })
            .then(function(editedOrder) {
                res.json(editedOrder);
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


    app.delete('/rest/orders/:orderId', function(req, res) {
        var token = tools.extractToken(req);
        var orderId = req.params.orderId;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.deleteOrder(orderId)
            })
            .then(function(status) {
                res.json(status);
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