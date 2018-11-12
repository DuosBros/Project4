module.exports = function(app) {

    var Handler = require('../handlers/notifications').Handler;
    var handler = new Handler(app);

    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);

    var tools = require('../tools/tools.js');

    app.post('/rest/mapProductNamesToAmounts', function(req, res) {

        var token = tools.extractToken(req);

        var productNames = req.body.productNames;
        var productData = req.body.productData;

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.mapProductNamesToAmountsPromise(productNames, productData);
            })
            .then(function(mappedProductNamesToAmounts) {
                res.json(mappedProductNamesToAmounts);
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
            .done();
        }
    })

    app.get('/rest/warehouseNotifications', function(req, res) {
        var token = tools.extractToken(req);

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getWarehouseNotifications()
            })
            .then(function(notifications) {
                res.json(notifications);
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

    app.get('/rest/notPaidNotifications', function(req, res) {
        var token = tools.extractToken(req);

        console.log('pica1');

        if (token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                console.log('pica2');
                return handler.getNotPaidNotifications()
            })
            .then(function(notifications) {
                res.json(notifications);
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