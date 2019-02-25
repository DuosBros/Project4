module.exports = function(app) {

    var Handler = require('../handlers/costs.js').Handler;
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
}
