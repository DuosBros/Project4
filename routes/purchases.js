module.exports = function(app) {

    var Handler = require('../handlers/purchases.js').Handler;
    var handler = new Handler(app);
    var tools = require('../tools/tools.js');
    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);

    app.get('/rest/purchases', function(req, res) {
        var token = tools.extractToken(req);

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getAllPurchases()
            })
            .then(function(purchases) {
                res.json(purchases);
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

    app.post('/rest/purchases', function(req, res) {
        var token = tools.extractToken(req);
        var purchase = req.body;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.addPurchase(purchase)
            })
            .then(function(addedPurchase) {
                res.json(addedPurchase);
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

    app.put('/rest/purchases/:id', function(req, res) {
        var token = tools.extractToken(req);
        var purchase = req.body;
        var id = parseInt(req.params.id);

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.updatePurchase(id, purchase)
            })
            .then(function(editedPurchase) {
                res.json(editedPurchase);
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

    app.delete('/rest/purchases/:id', function(req, res) {
        var token = tools.extractToken(req);

        var id = req.params.id;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.deletePurchase(id)
            })
            .then(function(result) {
                res.json(result);
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
