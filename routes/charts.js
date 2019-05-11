module.exports = function (app) {

    var Handler = require('../handlers/charts.js').Handler;
    var handler = new Handler(app);
    var tools = require('../tools/tools.js');
    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);

    app.get('/rest/charts/products/daily', (req, res) => {
        var token = tools.extractToken(req);

        var from = req.query.from;
        var to = req.query.to;

        if (token) {
            authenticationHandler.validateToken(token)
                .then(function () {
                    return handler.getProductsDaily(from, to);
                })
                .then(function (orders) {
                    res.json(orders);
                    res.end();
                })
                .fail(function (err) {
                    tools.replyError(err, res);
                })
                .done();
        } else {
            res.status(403).send({ message: 'No authentication token!' });
        }
    })

    app.get('/rest/charts/products/monthly', (req, res) => {
        var token = tools.extractToken(req);

        if (token) {
            authenticationHandler.validateToken(token)
                .then(function () {
                    return handler.getProductsMonthly();
                })
                .then(function (orders) {
                    res.json(orders);
                    res.end();
                })
                .fail(function (err) {
                    tools.replyError(err, res);
                })
                .done();
        } else {
            res.status(403).send({ message: 'No authentication token!' });
        }
    })

    app.get('/rest/charts/products', function (req, res) {
        var token = tools.extractToken(req);

        var from = req.query.from;
        var to = req.query.to;

        var fromDate;
        var toDate;
        if (from) {
            fromDate = new Date(from);
        }
        if (to) {
            toDate = new Date(to);
        }

        if (token) {
            authenticationHandler.validateToken(token)
                .then(function () {
                    return handler.getAllProductsData(fromDate, toDate);
                })
                .then(function (allProducts) {
                    res.json(allProducts);
                    res.end();
                })
                .fail(function (err) {
                    tools.replyError(err, res);
                })
                .done();
        } else {
            res.status(403).send({ message: 'No authentication token!' });
        }
    });

}