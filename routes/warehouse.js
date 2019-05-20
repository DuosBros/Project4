module.exports = function(app) {

    var Handler = require('../handlers/warehouse').Handler;
    var handler = new Handler(app);

    var AuthenticationHandler = require('../handlers/others.js').Handler;
    var authenticationHandler = new AuthenticationHandler(app);

    var tools = require('../tools/tools.js');

    app.put('/rest/warehouse/products/:filterBy', function(req, res) {
        var token = tools.extractToken(req);
        var filterBy = req.params.filterBy;
        var calculationDate = req.body.calculationDate;
        var difference = req.body.difference;
        var user = req.body.user;
        var notificationThreshold = req.body.notificationThreshold;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.saveProductAmount(filterBy, calculationDate, difference, user, notificationThreshold);
            })
            .then(function() {
                res.json();
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

    app.get('/rest/warehouse/products', function(req, res) {
        var token = tools.extractToken(req);

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getProductsData();
            })
            .then(function(productsData) {
                res.json(productsData);
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

    app.get('/rest/warehouse/products/:productName', function(req, res) {
        var token = tools.extractToken(req);
        var productName = req.params.productName;

        if(token) {
            authenticationHandler.validateToken(token)
            .then(function() {
                return handler.getSingleProductData(productName);
            })
            .then(function(productData) {
                res.json(productData);
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

    app.get('/rest/warehouse/products/:productName/sales', function(req, res) {
        var productName = req.params.productName;
        var token = tools.extractToken(req);
        //if(token) {
            // authenticationHandler.validateToken(token)
            // .then(function() {
            //     return handler.getProductsInOrders();
            // })
            handler.getProductsInOrders(productName)
            .then(function(productsData) {
                res.json(productsData);
                res.end();
            })
            .fail(function(err) {
                tools.replyError(err, res);
            })
            .done();
        //
    });


    app.get('/rest/warehouse/v2', function(req, res) {
        var year = parseInt(req.query.year);
        var month = parseInt(req.query.month);
        month -= 1;

        var currentDate = new Date();
        if (!year) {
            year = currentDate.getFullYear();
        }

        if (!month) {
            month = currentDate.getMonth();
        }

        handler.getWarehouseV2(year, month)
        .then(function(productsData) {
            res.json(productsData);
            res.end();
        })
        .fail(function(err) {
            tools.replyError(err, res);
        })
        .done();
    });
}