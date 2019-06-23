module.exports = function(app) {

    var Handler = require('../handlers/costs.js').Handler;
    var handler = new Handler(app);
    var tools = require('../tools/tools.js');
    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);

    app.get('/rest/costs', function(req, res) {
        var token = tools.extractToken(req);

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getAllCosts()
            })
            .then(function(costs) {
                res.json(costs);
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

    app.get('/rest/costs/filter/month', function(req, res) {
        var token = tools.extractToken(req);

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getAllCostsMonthly()
            })
            .then(function(costs) {
                res.json(costs);
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

    app.post('/rest/costs', function(req, res) {
        var token = tools.extractToken(req);
        var cost = req.body;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.addCost(cost)
            })
            .then(function(insertedCost) {
                res.json(insertedCost);
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

    app.put('/rest/costs/:costId', function(req, res) {
        var token = tools.extractToken(req);
        var cost = req.body;
        var costId = req.params.costId;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.saveCost(costId, cost)
            })
            .then(function(editedCost) {
                res.json(editedCost);
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

    app.delete('/rest/costs/:costId', function(req, res) {
        var token = tools.extractToken(req);
        var costId = req.params.costId;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.deleteCost(costId)
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
